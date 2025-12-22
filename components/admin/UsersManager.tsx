import React, { useState, useEffect } from 'react';
import { ClassRoom, UserProfile, Campaign } from '../../types';
import { UsersIcon, UploadIcon, RefreshIcon, CrownIcon, EditIcon, CheckIcon, XIcon, SettingsIcon, UserIcon } from '../ui/Icons';
import { DeleteButton } from '../ui/DeleteButton';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { supabase, createTempClient } from '../../supabaseClient';
import { isSuperUser } from '../../config';
import { parseExcelFile } from '../../utils/excelUtils';
import { useLanguage } from '../../hooks/useLanguage';
import { useToast } from '../../hooks/useToast';
import { useConfirmation } from '../../hooks/useConfirmation';
import { cleanEmail } from '../../utils/stringUtils';
import { useErrorFormatter } from '../../utils/errorUtils';
import { useUsersManager } from '../../../hooks/useUsersManager';
import { UserTableRow } from './users/UserTableRow';

interface UsersManagerProps {
    classes: ClassRoom[];
    currentCampaign?: Campaign | null;
    currentUser?: UserProfile;
    onRefresh?: () => Promise<void>;
}


export const UsersManager: React.FC<UsersManagerProps> = ({ classes, currentCampaign, currentUser, onRefresh }) => {
    const { t } = useLanguage();
    const [usersList, setUsersList] = useState<UserProfile[]>([]);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<UserProfile>>({});

    const [newUserFullName, setNewUserFullName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState<'admin' | 'teacher'>('teacher');
    const [newUserClassId, setNewUserClassId] = useState<string>('');
    const [userCreationStatus, setUserCreationStatus] = useState<string>('');
    const [isBulkImporting, setIsBulkImporting] = useState(false);

    const { showToast } = useToast();
    const { modalConfig, openConfirmation, closeConfirmation } = useConfirmation();
    const { getErrorMessage } = useErrorFormatter();

    const alphabeticalClasses = [...classes].sort((a, b) => a.name.localeCompare(b.name, 'he'));

    useEffect(() => {
        if (currentCampaign) fetchUsers();
    }, [currentCampaign]);

    const fetchUsers = async () => {
        if (!currentCampaign) return;

        const { data, error } = await supabase
            .from('campaign_users')
            .select(`
            user_id,
            role,
            profiles:user_id (id, email, full_name, class_id, role)
        `)
            .eq('campaign_id', currentCampaign.id);

        if (error) {
            console.error("Error fetching campaign users:", error);
            return;
        }

        const mappedUsers: UserProfile[] = data.map((item: any) => ({
            id: item.user_id,
            email: item.profiles?.email || t('sync_pending'),
            full_name: item.profiles?.full_name || (item.user_id === currentUser?.id ? currentUser.full_name : t('new_user_label')),
            class_id: item.profiles?.class_id,
            // Critical: In Team Management, 'role' usually refers to campaign role, 
            // but for superusers we prioritize their global role.
            role: item.profiles?.role === 'superuser' ? 'superuser' : item.role
        }));

        mappedUsers.sort((a, b) => {
            if (a.role === 'superuser') return -1;
            if (b.role === 'superuser') return 1;
            return (a.role === 'admin' ? -1 : 1);
        });
        setUsersList(mappedUsers);
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentCampaign) return;

        setUserCreationStatus(t('creating_user'));
        const normalizedEmail = cleanEmail(newUserEmail);
        let createdUserId: string | null = null;

        try {
            const tempClient = createTempClient();

            const { data: authData, error: authError } = await tempClient.auth.signUp({
                email: normalizedEmail,
                password: newUserPassword,
                options: { data: { full_name: newUserFullName } }
            });

            if (authError) {
                if (authError.message.includes("already registered") || authError.message.includes("unique constraint")) {
                    setUserCreationStatus(t('user_exists_connecting'));
                    const { data: rpcData, error: rpcError } = await supabase.rpc('add_existing_user_to_campaign', {
                        target_email: normalizedEmail,
                        target_campaign_id: currentCampaign.id,
                        target_role: newUserRole,
                        target_full_name: newUserFullName
                    });
                    if (rpcError) throw rpcError;
                    if (rpcData === 'User not found') throw new Error(t('user_not_found'));

                    const { data: existingProfile } = await supabase.from('profiles').select('id').eq('email', normalizedEmail).single();
                    if (existingProfile) createdUserId = existingProfile.id;

                    setUserCreationStatus(t('user_exists_joined_success'));
                } else {
                    throw authError;
                }
            } else if (authData.user) {
                createdUserId = authData.user.id;

                const { error: linkError } = await supabase
                    .from('campaign_users')
                    .upsert({
                        user_id: createdUserId,
                        campaign_id: currentCampaign.id,
                        role: newUserRole
                    }, { onConflict: 'user_id, campaign_id' });

                if (linkError) throw linkError;
                setUserCreationStatus(t('user_created_joined_success'));
            }

            if (createdUserId && newUserClassId) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({ class_id: newUserClassId })
                    .eq('id', createdUserId);

                if (profileError) console.error("Failed to assign class:", profileError);
            }

            resetCreateForm();

        } catch (err: any) {
            setUserCreationStatus(getErrorMessage(err));
        }
    };

    const resetCreateForm = () => {
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserFullName('');
        setNewUserClassId('');
        fetchUsers();
        if (onRefresh) onRefresh();
    };

    const saveUserChanges = async (id: string) => {
        if (!currentCampaign) return;
        try {
            await supabase.from('profiles').update({
                full_name: editFormData.full_name,
                class_id: editFormData.class_id || null
            }).eq('id', id);

            // Do not update role if the user being edited is a superuser
            if (editFormData.role && editFormData.role !== 'superuser') {
                await supabase.from('campaign_users').update({
                    role: editFormData.role
                }).match({ user_id: id, campaign_id: currentCampaign.id });
            }

            setEditingUserId(null);
            setUserCreationStatus(t('user_details_updated'));
            fetchUsers();
            showToast(t('user_details_updated'), 'success');
        } catch (err: any) {
            showToast(getErrorMessage(err, 'update_error_msg'), 'error');
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (!currentCampaign) return;
        try {
            await supabase.from('campaign_users').delete().match({ user_id: id, campaign_id: currentCampaign.id });
            showToast(t('user_deleted_success'), 'success');
            fetchUsers();
        } catch (err: any) {
            showToast(getErrorMessage(err), 'error');
        }
    };

    const processBulkImport = async (file: File) => {
        if (!currentCampaign) return;
        setIsBulkImporting(true);
        try {
            const data = await parseExcelFile(file);
            const tempClient = createTempClient();
            for (let i = 1; i < data.length; i++) {
                const row = data[i]; if (!row[0] || !row[1]) continue;
                const email = cleanEmail(row[0]);
                const { data: authData, error: authError } = await tempClient.auth.signUp({ email, password: String(row[1]) });
                if (authError && authError.message.includes("already registered")) {
                    await supabase.rpc('add_existing_user_to_campaign', { target_email: email, target_campaign_id: currentCampaign.id, target_role: 'teacher' });
                    continue;
                }
                if (authData.user) {
                    await supabase.from('campaign_users').upsert({ user_id: authData.user.id, campaign_id: currentCampaign.id, role: 'teacher' });
                }
            }
            showToast(t('save_success'), 'success');
            fetchUsers();
        } catch (e: any) {
            showToast(getErrorMessage(e), 'error');
        } finally {
            setIsBulkImporting(false);
        }
    };

    return (
        <>
            <ConfirmationModal
                isOpen={modalConfig.isOpen}
                title={modalConfig.title}
                message={modalConfig.message}
                isDanger={modalConfig.isDanger}
                showCancel={modalConfig.showCancel}
                onConfirm={modalConfig.onConfirm}
                onCancel={modalConfig.onCancel}
            />

            <div className="max-w-5xl mx-auto space-y-8 px-4">
                <h2 className="text-3xl font-black text-white flex items-center gap-3">
                    <UsersIcon className="w-8 h-8 text-blue-400" />
                    {t('team_mgmt_title', { campaign: currentCampaign?.name || '' })}
                </h2>

                <div className="bg-white/5 p-6 rounded-[var(--radius-main)] border border-white/10 shadow-xl">
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                        <h3 className="text-xl font-bold text-white">{t('add_staff_member')}</h3>
                        <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 bg-green-600/20 hover:bg-green-600/40 text-green-300 px-3 py-1.5 rounded-[var(--radius-main)] border border-green-500/30 cursor-pointer transition-all">
                                {isBulkImporting ? <RefreshIcon className="w-4 h-4 animate-spin" /> : <UploadIcon className="w-4 h-4" />}
                                <span className="text-sm font-bold">{t('import_from_excel')}</span>
                                <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        openConfirmation({
                                            title: t('import_users_title'),
                                            message: t('import_users_warning'),
                                            isDanger: false,
                                            onConfirm: () => processBulkImport(file)
                                        });
                                    }
                                }} />
                            </label>
                        </div>
                    </div>

                    <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-3">
                            <label className="block text-slate-400 text-xs font-bold mb-1">{t('full_name_label')}</label>
                            <input type="text" value={newUserFullName} onChange={e => setNewUserFullName(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-[var(--radius-main)] px-3 py-2 text-white text-sm outline-none focus:border-blue-500" required />
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-slate-400 text-xs font-bold mb-1">{t('email_label')}</label>
                            <input type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-[var(--radius-main)] px-3 py-2 text-white text-sm outline-none focus:border-blue-500" required />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-slate-400 text-xs font-bold mb-1">{t('password_label')}</label>
                            <input type="password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-[var(--radius-main)] px-3 py-2 text-white text-sm outline-none focus:border-blue-500" required minLength={6} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-slate-400 text-xs font-bold mb-1">{t('role_label')}</label>
                            <select value={newUserRole} onChange={e => setNewUserRole(e.target.value as 'admin' | 'teacher')} className="w-full bg-slate-800 border border-slate-600 rounded-[var(--radius-main)] px-3 py-2 text-white text-sm outline-none focus:border-blue-500">
                                <option value="teacher" className="bg-slate-900">{t('role_teacher_short')}</option>
                                <option value="admin" className="bg-slate-900">{t('role_admin_short')}</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-slate-400 text-xs font-bold mb-1">{t('group_assignment_label')}</label>
                            <select
                                value={newUserClassId}
                                onChange={e => setNewUserClassId(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-600 rounded-[var(--radius-main)] px-3 py-2 text-white text-sm outline-none focus:border-blue-500"
                            >
                                <option value="" className="bg-slate-900">{t('no_assignment')}</option>
                                {alphabeticalClasses.map(c => <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-12 mt-2">
                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-[var(--radius-main)] font-bold text-sm transition-colors shadow-lg">
                                {t('add_join_user_button')}
                            </button>
                        </div>
                    </form>
                    {userCreationStatus && <div className="mt-2 text-sm font-bold p-2 rounded bg-white/5 text-blue-300 border border-blue-500/20">{userCreationStatus}</div>}
                </div>

                <div className="bg-white/5 rounded-[var(--radius-main)] border border-white/10 overflow-hidden shadow-xl">
                    <table className="w-full rtl:text-right ltr:text-left">
                        <thead className="bg-white/5 text-slate-400 text-xs font-bold">
                            <tr>
                                <th className="p-4">{t('name_email_header')}</th>
                                <th className="p-4">{t('role_header')}</th>
                                <th className="p-4">{t('group_header')}</th>
                                <th className="p-4">{t('actions_header')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm text-slate-200">
                            {usersList.map(u => (
                                <tr key={u.id} className={`hover:bg-white/5 transition-colors ${u.id === currentUser?.id ? 'bg-blue-500/5' : ''}`}>
                                    <td className="p-4">
                                        {editingUserId === u.id ? (
                                            <input className="bg-slate-900 border border-slate-600 rounded px-2 py-1 w-full text-white outline-none focus:border-blue-500" value={editFormData.full_name || ''} onChange={e => setEditFormData({ ...editFormData, full_name: e.target.value })} />
                                        ) : (
                                            <div>
                                                <div className="font-bold flex items-center gap-2 text-white">
                                                    {u.full_name}
                                                    {isSuperUser(u.role) && <CrownIcon className="w-3.5 h-3.5 text-amber-400 animate-pulse" />}
                                                    {u.id === currentUser?.id && <span className="text-sm bg-blue-500/30 px-2 py-1 rounded text-blue-200">{t('me')}</span>}
                                                </div>
                                                <div className="text-xs opacity-60 tabular-nums">{u.email}</div>
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {editingUserId === u.id && u.role !== 'superuser' ? (
                                            <select className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white outline-none" value={editFormData.role} onChange={e => setEditFormData({ ...editFormData, role: e.target.value as any })}>
                                                <option value="admin" className="bg-slate-900">{t('role_admin_short')}</option>
                                                <option value="teacher" className="bg-slate-900">{t('role_teacher_short')}</option>
                                            </select>
                                        ) : (
                                            <span className={`px-2 py-1 rounded text-sm font-bold flex items-center gap-1 ${u.role === 'superuser' ? 'bg-amber-500/20 text-amber-300' :
                                                u.role === 'admin' ? 'bg-purple-500/20 text-purple-300' :
                                                    'bg-blue-500/20 text-blue-300'
                                                }`}>
                                                {u.role === 'superuser' && <CrownIcon className="w-3 h-3" />}
                                                {u.role === 'admin' && <SettingsIcon className="w-3 h-3" />}
                                                {u.role === 'teacher' && <UserIcon className="w-3 h-3" />}
                                                {u.role === 'superuser' ? t('role_superuser_short') : u.role === 'admin' ? t('role_admin_short') : t('role_teacher_short')}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {editingUserId === u.id ? (
                                            <select className="bg-slate-900 border border-slate-600 rounded px-2 py-1 w-full text-white outline-none" value={editFormData.class_id || ''} onChange={e => setEditFormData({ ...editFormData, class_id: e.target.value })}>
                                                <option value="" className="bg-slate-900">{t('no_assignment')}</option>
                                                {alphabeticalClasses.map(c => <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>)}
                                            </select>
                                        ) : (u.class_id ? classes.find(c => c.id === u.class_id)?.name : '-')}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-4">
                                            {editingUserId === u.id ? (
                                                <>
                                                    <button onClick={() => saveUserChanges(u.id)} className="p-1.5 bg-green-600/20 text-green-400 hover:bg-green-600/30 rounded transition-colors" title={t('save')}><CheckIcon className="w-4 h-4" /></button>
                                                    <button onClick={() => setEditingUserId(null)} className="p-1.5 bg-slate-600/20 text-slate-400 hover:bg-slate-600/30 rounded transition-colors" title={t('cancel')}><XIcon className="w-4 h-4" /></button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => { setEditingUserId(u.id); setEditFormData(u); }} className="p-1.5 hover:bg-white/10 rounded text-blue-300 transition-colors" title={t('edit_action')}><EditIcon className="w-4 h-4" /></button>
                                                    {u.id !== currentUser?.id && !isSuperUser(u.role) && <DeleteButton onClick={() => handleDeleteUser(u.id)} />}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};
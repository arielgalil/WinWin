import React, { useState, useEffect, useRef } from 'react';
import { ClassRoom, UserProfile, Campaign } from '../../types';
import { UsersIcon, UploadIcon, RefreshIcon, CrownIcon, SettingsIcon, UserIcon, PlusIcon, CheckIcon, XIcon } from '../ui/Icons';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { AdminTable } from '../ui/AdminTable';
import { AdminRowActions } from '../ui/AdminRowActions';
import { AdminSectionCard } from '../ui/AdminSectionCard';
import { AdminButton } from '../ui/AdminButton';
import { supabase, createTempClient } from '../../supabaseClient';
import { isSuperUser } from '../../config';
import { parseExcelFile } from '../../utils/excelUtils';
import { useLanguage } from '../../hooks/useLanguage';
import { useToast } from '../../hooks/useToast';
import { useConfirmation } from '../../hooks/useConfirmation';
import { cleanEmail } from '../../utils/stringUtils';
import { useErrorFormatter } from '../../utils/errorUtils';
import { useSaveNotification } from '../../contexts/SaveNotificationContext';
import { EditModal } from '../ui/EditModal';

interface UsersManagerProps {
    users?: UserProfile[];
    classes: ClassRoom[];
    currentCampaign?: Campaign | null;
    currentUser?: UserProfile;
    onRefresh?: () => Promise<void>;
    onSave?: () => Promise<void>;
}


export const UsersManager: React.FC<UsersManagerProps> = ({ users, classes, currentCampaign, currentUser, onRefresh, onSave }) => {
    const { t } = useLanguage();
    const { triggerSave } = useSaveNotification();

    const [usersList, setUsersList] = useState<UserProfile[]>([]);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<UserProfile>>({});

    const [newUserFullName, setNewUserFullName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState<'admin' | 'teacher'>('teacher');
    const [newUserClassId, setNewUserClassId] = useState<string>('');
    const [userCreationStatus, setUserCreationStatus] = useState<string>('');
    const [isBulkImporting, setIsBulkImporting] = useState(false);

    const { showToast } = useToast();
    const { modalConfig, openConfirmation } = useConfirmation();
    const { getErrorMessage } = useErrorFormatter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const alphabeticalClasses = [...classes].sort((a, b) => a.name.localeCompare(b.name, 'he'));

    useEffect(() => {
        if (users) {
            setUsersList(users);
        } else if (currentCampaign) {
            fetchUsers();
        }
    }, [currentCampaign, users]);

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
            full_name: item.profiles?.full_name || (item.user_id === currentUser?.id ? currentUser?.full_name : t('new_user_label')),
            class_id: item.profiles?.class_id,
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

            triggerSave('data-management');
            if (onSave) await onSave();
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

    const saveUserChanges = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentCampaign || !editingUser) return;
        try {
            await supabase.from('profiles').update({
                full_name: editFormData.full_name,
                class_id: editFormData.class_id || null
            }).eq('id', editingUser.id);

            if (editFormData.role && editFormData.role !== 'superuser') {
                await supabase.from('campaign_users').update({
                    role: editFormData.role
                }).match({ user_id: editingUser.id, campaign_id: currentCampaign.id });
            }

            setEditingUser(null);
            setEditFormData({});
            setUserCreationStatus(t('user_details_updated'));
            fetchUsers();
            showToast(t('user_details_updated'), 'success');
            triggerSave('data-management');
            if (onSave) await onSave();
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
            triggerSave('data-management');
            if (onSave) await onSave();
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
            triggerSave('data-management');
            if (onSave) await onSave();
        } catch (e: any) {
            showToast(getErrorMessage(e), 'error');
        } finally {
            setIsBulkImporting(false);
        }
    };

    return (
        <div className="space-y-[var(--admin-section-gap)] w-full">
            <ConfirmationModal {...modalConfig} />
            <AdminSectionCard 
                title={t('users_management_title')} 
                description={t('users_management_desc')} 
                icon={<UsersIcon className="w-6 h-6" />}
                rightAction={
                    <div className="flex gap-2">
                        <AdminButton variant="secondary" size="md" onClick={() => fileInputRef.current?.click()} isLoading={isBulkImporting} icon={<UploadIcon className="w-4 h-4" />}>
                            {t('bulk_import')}
                        </AdminButton>
                    </div>
                }
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            openConfirmation({
                                title: t('import_users_title'),
                                message: t('import_users_warning'),
                                isDanger: false,
                                onConfirm: () => processBulkImport(file)
                            });
                            e.target.value = ''; // Reset for same file re-import
                        }
                    }}
                />

                <div className="mb-10">
                    <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-[var(--bg-surface)] p-6 rounded-[var(--radius-main)] border border-[var(--border-main)] shadow-sm">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{t('full_name_label')}</label>
                            <input
                                required
                                value={newUserFullName}
                                onChange={e => setNewUserFullName(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-input)] text-sm text-[var(--text-main)] outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium placeholder:text-[var(--text-muted)] opacity-80 shadow-sm"
                                placeholder={t('full_name_placeholder')}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{t('email_label')}</label>
                            <input
                                required
                                type="email"
                                value={newUserEmail}
                                onChange={e => setNewUserEmail(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-input)] text-sm text-[var(--text-main)] outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium placeholder:text-[var(--text-muted)] opacity-80 shadow-sm"
                                placeholder={t('email_placeholder')}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{t('password_label')}</label>
                            <input
                                required
                                type="password"
                                value={newUserPassword}
                                onChange={e => setNewUserPassword(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-input)] text-sm text-[var(--text-main)] outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium placeholder:text-[var(--text-muted)] opacity-80 shadow-sm"
                                placeholder={t('password_placeholder')}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{t('role_label')}</label>
                            <select
                                value={newUserRole}
                                onChange={e => setNewUserRole(e.target.value as any)}
                                className="w-full px-4 py-2.5 rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-input)] text-sm text-[var(--text-main)] outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold shadow-sm"
                            >
                                <option value="admin" className="bg-[var(--bg-card)]">{t('role_admin_short')}</option>
                                <option value="teacher" className="bg-[var(--bg-card)]">{t('role_teacher_short')}</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <AdminButton
                                type="submit"
                                variant="primary"
                                size="md"
                                isLoading={!!userCreationStatus}
                                icon={<PlusIcon className="w-4 h-4" />}
                                className="w-full h-[42px]"
                            >
                                {t('add_join_user_button')}
                            </AdminButton>
                        </div>
                    </form>
                    {userCreationStatus && (
                        <div className="mt-3 text-[10px] font-bold text-blue-900 dark:text-blue-400 animate-pulse bg-[var(--bg-surface)] py-2 px-4 rounded-[var(--radius-main)] inline-flex items-center gap-2 border border-[var(--border-main)]">
                            <RefreshIcon className="w-3 h-3 animate-spin" />
                            {userCreationStatus}
                        </div>
                    )}
                </div>

                <AdminTable
                    keyField="id"
                    data={usersList}
                    columns={[
                        {
                            key: 'full_name',
                            header: t('name_email_header'),
                            render: (u) => (
                                <div>
                                    <div className="font-bold flex items-center gap-2 text-[var(--text-main)] text-sm">
                                        {u.full_name}
                                        {isSuperUser(u.role) && <CrownIcon className="w-3.5 h-3.5 text-amber-600" />}
                                        {currentUser && u.id === currentUser.id && <span className="text-[10px] bg-indigo-100 dark:bg-indigo-500/20 px-1.5 py-0.5 rounded text-indigo-900 dark:text-indigo-300 font-bold border border-indigo-200">{t('me')}</span>}
                                    </div>
                                    <div className="text-[11px] text-[var(--text-muted)] tabular-nums font-mono mt-0.5 font-bold">{u.email}</div>
                                </div>
                            )
                        },
                        {
                            key: 'role',
                            header: t('role_header'),
                            render: (u) => (
                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center w-fit gap-1.5 shadow-sm border ${u.role === 'superuser' ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-900 dark:text-amber-400 border-amber-300' :
                                    u.role === 'admin' ? 'bg-purple-100 dark:bg-purple-500/10 text-purple-900 dark:text-purple-400 border-purple-300' :
                                        'bg-blue-100 dark:bg-blue-500/10 text-blue-900 dark:text-blue-400 border border-blue-300'
                                    }`}>
                                    {u.role === 'superuser' && <CrownIcon className="w-3 h-3" />}
                                    {u.role === 'admin' && <SettingsIcon className="w-3 h-3" />}
                                    {u.role === 'teacher' && <UserIcon className="w-3 h-3" />}
                                    {u.role === 'superuser' ? t('role_superuser_short') : u.role === 'admin' ? t('role_admin_short') : t('role_teacher_short')}
                                </span>
                            )
                        },
                        {
                            key: 'class_id',
                            header: t('group_header'),
                            render: (u) => (
                                <span className="font-bold text-[var(--text-main)] opacity-80">
                                    {u.class_id ? classes.find(c => c.id === u.class_id)?.name : '-'}
                                </span>
                            )
                        }
                    ]}
                    actions={(u) => (
                        (!isSuperUser(u.role) || isSuperUser(currentUser?.role)) ? (
                            <AdminRowActions
                                onEdit={() => { setEditingUser(u); setEditFormData(u); }}
                                onDelete={currentUser && u.id !== currentUser.id && !isSuperUser(u.role) ? () => {
                                    openConfirmation({
                                        title: t('delete_user'),
                                        message: t('confirm_delete_user'),
                                        confirmText: t('delete_user'),
                                        isDanger: true,
                                        onConfirm: () => handleDeleteUser(u.id)
                                    });
                                } : undefined}
                                editTitle={t('edit_action')}
                                deleteTitle={t('delete')}
                            />
                        ) : null
                    )}
                />
            </AdminSectionCard>

            {/* User Edit Modal */}
            <EditModal 
                isOpen={!!editingUser} 
                onClose={() => { setEditingUser(null); setEditFormData({}); }} 
                title={t('edit_user_details')}
            >
                <form onSubmit={saveUserChanges} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[var(--fs-xs)] font-[var(--fw-bold)] text-[var(--text-muted)] uppercase tracking-wider">{t('full_name_label')}</label>
                            <input 
                                value={editFormData.full_name || ''} 
                                onChange={e => setEditFormData({ ...editFormData, full_name: e.target.value })} 
                                className="w-full px-4 py-3 rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-input)] text-[var(--fs-base)] text-[var(--text-main)] font-[var(--fw-medium)] outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm" 
                                autoFocus 
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[var(--fs-xs)] font-[var(--fw-bold)] text-[var(--text-muted)] uppercase tracking-wider">{t('role_label')}</label>
                                <select 
                                    className="w-full px-4 py-3 rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-input)] text-[var(--fs-base)] text-[var(--text-main)] font-[var(--fw-bold)] outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm" 
                                    value={editFormData.role} 
                                    onChange={e => setEditFormData({ ...editFormData, role: e.target.value as any })}
                                    disabled={editingUser?.role === 'superuser'}
                                >
                                    <option value="admin" className="bg-[var(--bg-card)]">{t('role_admin_short')}</option>
                                    <option value="teacher" className="bg-[var(--bg-card)]">{t('role_teacher_short')}</option>
                                    {editingUser?.role === 'superuser' && <option value="superuser">{t('role_superuser_short')}</option>}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[var(--fs-xs)] font-[var(--fw-bold)] text-[var(--text-muted)] uppercase tracking-wider">{t('group_header')}</label>
                                <select 
                                    className="w-full px-4 py-3 rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-input)] text-[var(--fs-base)] text-[var(--text-main)] font-[var(--fw-bold)] outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm" 
                                    value={editFormData.class_id || ''} 
                                    onChange={e => setEditFormData({ ...editFormData, class_id: e.target.value })}
                                >
                                    <option value="" className="bg-[var(--bg-card)]">{t('no_assignment')}</option>
                                    {alphabeticalClasses.map(c => <option key={c.id} value={c.id} className="bg-[var(--bg-card)]">{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex gap-3 pt-4 border-t border-[var(--border-subtle)]">
                        <AdminButton type="submit" variant="success" size="md" className="flex-1">
                            {t('save')}
                        </AdminButton>
                        <AdminButton type="button" variant="secondary" size="md" onClick={() => { setEditingUser(null); setEditFormData({}); }} className="flex-1">
                            {t('cancel')}
                        </AdminButton>
                    </div>
                </form>
            </EditModal>
        </div>
    );
};

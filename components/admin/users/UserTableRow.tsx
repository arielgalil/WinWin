import React from 'react';
import { UserProfile, ClassRoom } from '../../../types';
import { CheckIcon, XIcon, EditIcon, CrownIcon, SettingsIcon, UserIcon } from '../../ui/Icons';
import { DeleteButton } from '../../ui/DeleteButton';
import { useLanguage } from '../../../hooks/useLanguage';

interface UserTableRowProps {
    user: UserProfile;
    classes: ClassRoom[];
    isEditing: boolean;
    editFormData: Partial<UserProfile>;
    alphabeticalClasses: ClassRoom[];
    currentUser?: UserProfile;
    onEdit: (user: UserProfile) => void;
    onSave: (userId: string) => void;
    onCancel: () => void;
    onDelete: (user: UserProfile) => void;
    onEditFormChange: (data: Partial<UserProfile>) => void;
}

export const UserTableRow: React.FC<UserTableRowProps> = ({
    user,
    classes,
    isEditing,
    editFormData,
    alphabeticalClasses,
    currentUser,
    onEdit,
    onSave,
    onCancel,
    onDelete,
    onEditFormChange
}) => {
    const { t } = useLanguage();

    return (
        <tr className="border-b border-white/10 hover:bg-white/5 transition-colors">
            <td className="p-4">
                {isEditing ? (
                    <input
                        type="text"
                        className="bg-slate-900 border border-slate-600 rounded px-2 py-1 w-full text-white outline-none"
                        value={editFormData.full_name || ''}
                        onChange={e => onEditFormChange({ ...editFormData, full_name: e.target.value })}
                    />
                ) : (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-white font-bold text-sm">
                            {user.full_name?.charAt(0)?.toUpperCase()}
                        </div>
                        <span className="text-white font-medium">{user.full_name}</span>
                    </div>
                )}
            </td>
            <td className="p-4">
                {isEditing ? (
                    <input
                        type="email"
                        className="bg-slate-900 border border-slate-600 rounded px-2 py-1 w-full text-white outline-none"
                        value={editFormData.email || ''}
                        onChange={e => onEditFormChange({ ...editFormData, email: e.target.value })}
                    />
                ) : (
                    <span className="text-white/80">{user.email}</span>
                )}
            </td>
            <td className="p-4">
                {isEditing ? (
                    <select className="bg-slate-900 border border-slate-600 rounded px-2 py-1 w-full text-white outline-none" 
                            value={editFormData.role || ''} 
                            onChange={e => onEditFormChange({ ...editFormData, role: e.target.value as 'admin' | 'teacher' | 'superuser' })}>
                        <option value="teacher" className="bg-slate-900">{t('role_teacher_short')}</option>
                        <option value="admin" className="bg-slate-900">{t('role_admin_short')}</option>
                    </select>
                ) : (
                    <span className={`px-2 py-1 rounded text-sm font-bold flex items-center gap-1 ${
                        user.role === 'superuser' ? 'bg-amber-500/20 text-amber-300' :
                        user.role === 'admin' ? 'bg-purple-500/20 text-purple-300' :
                        'bg-blue-500/20 text-blue-300'
                    }`}>
                        {user.role === 'superuser' && <CrownIcon className="w-3 h-3" />}
                        {user.role === 'admin' && <SettingsIcon className="w-3 h-3" />}
                        {user.role === 'teacher' && <UserIcon className="w-3 h-3" />}
                        {user.role === 'superuser' ? t('role_superuser_short') : 
                         user.role === 'admin' ? t('role_admin_short') : 
                         t('role_teacher_short')}
                    </span>
                )}
            </td>
            <td className="p-4">
                {isEditing ? (
                    <select className="bg-slate-900 border border-slate-600 rounded px-2 py-1 w-full text-white outline-none" 
                            value={editFormData.class_id || ''} 
                            onChange={e => onEditFormChange({ ...editFormData, class_id: e.target.value })}>
                        <option value="" className="bg-slate-900">{t('no_assignment')}</option>
                        {alphabeticalClasses.map(c => 
                            <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>
                        )}
                    </select>
                ) : (
                    user.class_id ? classes.find(c => c.id === user.class_id)?.name : '-'
                )}
            </td>
            <td className="p-4">
                <div className="flex gap-4">
                    {isEditing ? (
                        <>
                            <button 
                                onClick={() => onSave(user.id)} 
                                className="p-3 min-w-[44px] min-h-[44px] bg-green-600/20 text-green-400 hover:bg-green-600/30 rounded-lg transition-colors active:scale-95" 
                                title={t('save')}
                            >
                                <CheckIcon className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={onCancel} 
                                className="p-3 min-w-[44px] min-h-[44px] bg-slate-600/20 text-slate-400 hover:bg-slate-600/30 rounded-lg transition-colors active:scale-95" 
                                title={t('cancel')}
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                        </>
                    ) : (
                        <>
                            {user.id !== currentUser?.id && (
                                <DeleteButton onClick={() => onDelete(user)} />
                            )}
                            <button 
                                onClick={() => { onEdit(user); onEditFormChange(user); }} 
                                className="p-3 min-w-[44px] min-h-[44px] bg-amber-600/20 hover:bg-amber-600 text-amber-400 hover:text-white rounded-lg transition-colors border border-amber-500/30 active:scale-95" 
                                title={t('edit_action')}
                            >
                                <EditIcon className="w-5 h-5" />
                            </button>
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
};
import React, { useState, useMemo } from 'react';
import { ClassRoom, UserProfile } from '../../types';
import { PlusIcon, UsersIcon, XIcon, RefreshIcon, SearchIcon, UploadIcon } from '../ui/Icons';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { AdminTable } from '../ui/AdminTable';
import { AdminRowActions } from '../ui/AdminRowActions';
import { AdminSectionCard } from '../ui/AdminSectionCard';
import { supabase } from '../../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { parseExcelFile } from '../../utils/excelUtils';
import { useLanguage } from '../../hooks/useLanguage';
import { useToast } from '../../hooks/useToast';
import { useConfirmation } from '../../hooks/useConfirmation';
import { normalizeString } from '../../utils/stringUtils';
import { useErrorFormatter } from '../../utils/errorUtils';
import { useSaveNotification } from '../../contexts/SaveNotificationContext';

const MotionDiv = motion.div as any;

interface ClassesManagerProps {
    classes: ClassRoom[];
    settings: any;
    user: UserProfile;
    onRefresh: () => Promise<void>;
    onSave?: () => Promise<void>;
}

const AVAILABLE_COLORS = [
    'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-rose-500',
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500', 'bg-lime-500',
    'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500'
];

export const ClassesManager: React.FC<ClassesManagerProps> = ({ classes, settings, onRefresh, onSave }) => {
    const { t } = useLanguage();
    const { triggerSave } = useSaveNotification();

    const [view, setView] = useState<'list' | 'students'>('list');
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [hiddenClassIds, setHiddenClassIds] = useState<Set<string>>(new Set());

    const { showToast } = useToast();
    const { modalConfig, openConfirmation, closeConfirmation } = useConfirmation();
    const { getErrorMessage } = useErrorFormatter();

    const showErrorModal = (message: string) => {
        openConfirmation({
            title: t('error'),
            message,
            showCancel: false,
            onConfirm: closeConfirmation
        });
    };

    const [isAddingClass, setIsAddingClass] = useState(false);
    const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);
    const [newClassName, setNewClassName] = useState('');
    const [newClassColor, setNewClassColor] = useState('bg-blue-500');

    const [newStudentName, setNewStudentName] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [importStatus, setImportStatus] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');

    const selectedClass = classes.find(c => c.id === selectedClassId);

    const visibleClasses = useMemo(() => {
        return classes
            .filter(c => !hiddenClassIds.has(c.id))
            .sort((a, b) => a.name.localeCompare(b.name, 'he'));
    }, [classes, hiddenClassIds]);

    const handleAddClass = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanName = normalizeString(newClassName);
        if (!cleanName || !settings.campaign_id) return;

        try {
            const { error } = await supabase.from('classes').insert({
                name: cleanName,
                color: newClassColor,
                campaign_id: settings.campaign_id,
                score: 0
            });
            if (error) throw error;

            setNewClassName('');
            setIsAddingClass(false);
            showToast(t('group_added_success'), 'success');
            triggerSave('data-management');
            if (onSave) await onSave();
            await onRefresh();
        } catch (err: any) {
            showErrorModal(getErrorMessage(err, 'group_add_error'));
        }
    };

    const handleUpdateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingClass) return;

        const cleanName = normalizeString(newClassName);
        if (!cleanName) return;

        try {
            const { error } = await supabase.from('classes').update({
                name: cleanName,
                color: newClassColor
            }).eq('id', editingClass.id);

            if (error) throw error;

            setNewClassName('');
            setEditingClass(null);
            showToast(t('changes_saved'), 'success');
            triggerSave('data-management');
            if (onSave) await onSave();
            await onRefresh();
        } catch (err: any) {
            showErrorModal(getErrorMessage(err, 'group_update_error'));
        }
    };

    const handleDeleteClass = async (id: string) => {
        setHiddenClassIds(prev => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });

        try {
            const { error } = await supabase.from('classes').delete().eq('id', id);
            if (error) throw error;

            triggerSave('data-management');
            if (onSave) await onSave();
            await onRefresh();
            showToast(t('group_deleted_success'), 'success');
        } catch (err: any) {
            console.error(err);
            setHiddenClassIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
            showErrorModal(t('db_access_error') + '\n' + t('action_cancelled_rollback'));
        }
    };

    const handleAddStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanName = normalizeString(newStudentName);
        if (!cleanName || !selectedClassId || !settings.campaign_id) return;

        try {
            const { error } = await supabase.from('students').insert({
                name: cleanName,
                class_id: selectedClassId,
                campaign_id: settings.campaign_id,
                score: 0
            });
            if (error) throw error;

            setNewStudentName('');
            showToast(t('student_added_success'), 'success');
            triggerSave('data-management');
            if (onSave) await onSave();
            await onRefresh();
        } catch (err: any) {
            showErrorModal(getErrorMessage(err, 'student_add_error'));
        }
    };

    const handleDeleteStudent = async (id: string, studentName: string) => {
        openConfirmation({
            title: t('delete_student'),
            message: t('confirm_delete_student', { studentName }),
            confirmText: t('delete_student'),
            isDanger: true,
            onConfirm: async () => {
                try {
                    await supabase.from('students').delete().eq('id', id);
                    showToast(t('student_deleted_success'), 'success');
                    triggerSave('data-management');
                    if (onSave) await onSave();
                    await onRefresh();
                } catch (err: any) {
                    showToast(getErrorMessage(err, 'student_delete_error'), 'error');
                }
            }
        });
    };

    const handleSmartImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !settings.campaign_id) return;

        setIsImporting(true);
        setImportStatus(t('loading_excel_lib'));

        const process = async () => {
            try {
                const data = await parseExcelFile(file);
                if (!data || data.length < 5) throw new Error(t('invalid_excel_file'));

                let headerRowIndex = -1;
                const requiredCols = ["שם התלמיד", "שכבה"];

                for (let i = 0; i < Math.min(20, data.length); i++) {
                    const rowStr = JSON.stringify(data[i]);
                    if (requiredCols.every(col => rowStr.includes(col))) {
                        headerRowIndex = i;
                        break;
                    }
                }

                if (headerRowIndex === -1) throw new Error(t('header_row_not_found'));

                const headerRow = data[headerRowIndex];
                const colMap: Record<string, number> = {};
                headerRow.forEach((cell: any, idx: number) => {
                    if (typeof cell === 'string') colMap[cell.trim()] = idx;
                });

                if (colMap['שם התלמיד'] === undefined || colMap['שכבה'] === undefined) throw new Error(t('missing_cols_error'));

                setImportStatus(t('header_detected_row', { row: headerRowIndex + 1 }));

                const groupsToCreate = new Map<string, any[]>();
                for (let i = headerRowIndex + 1; i < data.length; i++) {
                    const row = data[i];
                    if (!row || row.length === 0) continue;
                    const name = row[colMap['שם התלמיד']];
                    const grade = row[colMap['שכבה']];
                    const parallel = colMap['מקבילה'] !== undefined ? row[colMap['מקבילה']] : '';
                    if (name && grade) {
                        const groupName = `${grade}${parallel || ''}`.trim();
                        if (!groupsToCreate.has(groupName)) groupsToCreate.set(groupName, []);
                        groupsToCreate.get(groupName)?.push({ name: normalizeString(name), score: 0 });
                    }
                }

                let newGroupsCount = 0;
                let newStudentsCount = 0;
                const { data: existingClasses } = await supabase.from('classes').select('id, name').eq('campaign_id', settings.campaign_id);
                const existingMap = new Map(existingClasses?.map(c => [c.name, c.id]));

                for (const [groupName, students] of groupsToCreate.entries()) {
                    let classId = existingMap.get(groupName);
                    if (!classId) {
                        setImportStatus(t('creating_group_progress', { name: groupName }));
                        const randomColor = AVAILABLE_COLORS[Math.floor(Math.random() * AVAILABLE_COLORS.length)];
                        const { data: newClass, error: clsError } = await supabase.from('classes').insert({ name: groupName, color: randomColor, campaign_id: settings.campaign_id, score: 0 }).select().single();
                        if (clsError) throw clsError;
                        classId = newClass.id;
                        newGroupsCount++;
                    }
                    if (students.length > 0) {
                        const payload = students.map(s => ({ ...s, class_id: classId, campaign_id: settings.campaign_id }));
                        const { error: stuError } = await supabase.from('students').insert(payload);
                        if (stuError) throw stuError;
                        newStudentsCount += students.length;
                    }
                }

                showToast(t('import_completed_summary', { groups: newGroupsCount, students: newStudentsCount }), 'success');
                triggerSave('data-management');
                if (onSave) await onSave();
                await onRefresh();
            } catch (err: any) {
                showErrorModal(getErrorMessage(err));
            } finally {
                setIsImporting(false);
                setImportStatus('');
            }
        };
        process();
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <ConfirmationModal
                isOpen={modalConfig.isOpen}
                title={modalConfig.title}
                message={modalConfig.message}
                onConfirm={modalConfig.onConfirm}
                onCancel={modalConfig.onCancel}
                showCancel={modalConfig.showCancel}
                isDanger={modalConfig.isDanger}
                confirmText={modalConfig.confirmText}
            />

            <AdminSectionCard
                title={t('classes_management_title')}
                description={t('classes_management_desc')}
                icon={<UsersIcon className="w-6 h-6" />}
                rightAction={
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = '.xlsx,.xls';
                                input.onchange = (e: any) => handleSmartImport(e);
                                input.click();
                            }}
                            disabled={isImporting}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] font-[var(--fw-bold)] rounded-[var(--radius-main)] hover:bg-[var(--bg-hover)] transition-all text-[var(--fs-sm)] shadow-sm"
                        >
                            {isImporting ? <RefreshIcon className="w-4 h-4 animate-spin" /> : <UploadIcon className="w-4 h-4" />}
                            {t('smart_import')}
                        </button>

                        <button
                            onClick={() => setIsAddingClass(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-[var(--fw-bold)] rounded-[var(--radius-main)] transition-all shadow-md shadow-indigo-500/20 text-[var(--fs-sm)]"
                        >
                            <PlusIcon className="w-4 h-4" />
                            {t('add_new_group')}
                        </button>
                    </div>
                }
            >
                {importStatus && (
                    <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 p-4 rounded-[var(--radius-main)] flex items-center gap-3 text-blue-600 dark:text-blue-400 font-[var(--fw-bold)] animate-pulse mb-6 text-[var(--fs-sm)]">
                        <RefreshIcon className="w-4 h-4 animate-spin" />
                        {importStatus}
                    </div>
                )}

                <div className="space-y-6">
                    <AnimatePresence>
                        {(isAddingClass || editingClass) && (
                            <MotionDiv initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[var(--bg-surface)] p-6 rounded-[var(--radius-main)] border-2 border-dashed border-[var(--border-main)] flex flex-col gap-4 relative overflow-hidden group">
                                <h3 className="text-[var(--text-main)] font-[var(--fw-bold)] text-[var(--fs-base)] flex items-center gap-2 mb-2">
                                    {editingClass ? t('edit_group') : t('add_new_group')}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-[var(--fs-xs)] font-[var(--fw-bold)] text-[var(--text-muted)] uppercase tracking-wider">{t('group_name_placeholder')}</label>
                                        <input 
                                            value={newClassName} 
                                            onChange={e => setNewClassName(e.target.value)} 
                                            placeholder={t('group_name_placeholder')} 
                                            className="w-full px-3 py-2 rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-input)] text-[var(--fs-sm)] text-[var(--text-main)] font-[var(--fw-medium)] outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm" 
                                            autoFocus 
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[var(--fs-xs)] font-[var(--fw-bold)] text-[var(--text-muted)] uppercase tracking-wider">{t('group_color_label')}</label>
                                        <div className="flex flex-wrap gap-2 p-3 bg-[var(--bg-card)] rounded-[var(--radius-main)] border border-[var(--border-main)] shadow-sm">
                                            {AVAILABLE_COLORS.map(c => (
                                                <button key={c} onClick={() => setNewClassColor(c)} className={`w-6 h-6 rounded-full ${c} ${newClassColor === c ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-[var(--bg-card)] scale-110' : 'opacity-60 hover:opacity-100 transition-all'}`} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-auto pt-2 justify-end">
                                    <button onClick={() => { setIsAddingClass(false); setEditingClass(null); setNewClassName(''); }} className="px-6 bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-muted)] font-[var(--fw-bold)] py-2.5 rounded-[var(--radius-main)] border border-[var(--border-main)] text-[var(--fs-xs)] transition-all shadow-sm">{t('cancel')}</button>
                                    <button onClick={editingClass ? handleUpdateClass : handleAddClass} className="px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-[var(--fw-bold)] py-2.5 rounded-[var(--radius-main)] text-[var(--fs-xs)] shadow-lg shadow-indigo-500/20 transition-all active:scale-95">{t('save')}</button>
                                </div>
                            </MotionDiv>
                        )}
                    </AnimatePresence>

                    <AdminTable 
                        keyField="id"
                        data={visibleClasses}
                        columns={[
                            {
                                key: 'name',
                                header: t('group_header'),
                                render: (cls) => (
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-[var(--radius-main)] ${cls.color} flex items-center justify-center text-white text-[var(--fs-xs)] shadow-sm`}>
                                            <UsersIcon className="w-4 h-4" />
                                        </div>
                                        <span className="font-[var(--fw-bold)] text-[var(--text-main)] text-[var(--fs-base)]">{cls.name}</span>
                                    </div>
                                )
                            },
                            {
                                key: 'students_count',
                                header: t('students_label'),
                                render: (cls) => (
                                    <div className="flex items-center gap-3">
                                        <span className="text-[var(--text-main)] opacity-80 font-[var(--fw-bold)] text-[var(--fs-sm)]">
                                            {cls.students?.length || 0} {t('students_label')}
                                        </span>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setSelectedClassId(cls.id); setView('students'); }}
                                            className="p-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-full text-indigo-800 dark:text-indigo-400 transition-colors border border-[var(--border-main)] hover:border-indigo-300 dark:hover:border-indigo-500/30 shadow-sm"
                                            title={t('manage_students_button')}
                                        >
                                            <UsersIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                )
                            }
                        ]}
                        actions={(cls) => (
                            <AdminRowActions 
                                onEdit={() => { setEditingClass(cls); setNewClassName(cls.name); setNewClassColor(cls.color || 'bg-blue-500'); setIsAddingClass(true); }}
                                onDelete={() => {
                                    openConfirmation({
                                        title: t('delete_group'),
                                        message: t('confirm_delete_group_warning'),
                                        confirmText: t('delete_group'),
                                        isDanger: true,
                                        onConfirm: () => handleDeleteClass(cls.id)
                                    });
                                }}
                            />
                        )}
                    />
                </div>
            </AdminSectionCard>

            <AnimatePresence>
                {view === 'students' && selectedClass && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                        <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setView('list')} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <MotionDiv initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-4xl bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[var(--radius-container)] shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
                            <div className="p-6 border-b border-[var(--border-subtle)] flex justify-between items-center shrink-0 bg-[var(--bg-surface)]">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-[var(--radius-main)] flex items-center justify-center text-white shadow-sm ${selectedClass.color}`}>
                                        <UsersIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-[var(--fs-lg)] font-[var(--fw-bold)] text-[var(--text-main)] leading-none">{selectedClass.name}</h3>
                                        <p className="text-[var(--text-muted)] text-[var(--fs-xs)] font-[var(--fw-bold)] mt-1 uppercase tracking-wide">{t('manage_students_title')}</p>
                                    </div>
                                </div>
                                <button onClick={() => setView('list')} className="p-2 hover:bg-[var(--bg-hover)] rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all"><XIcon className="w-5 h-5" /></button>
                            </div>

                            <div className="p-6 flex flex-col gap-6 overflow-hidden bg-[var(--bg-card)]">
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="relative flex-[2]">
                                        <label className="block text-[var(--fs-xs)] font-[var(--fw-bold)] text-[var(--text-muted)] uppercase tracking-wider mb-2">{t('search_student_placeholder')}</label>
                                        <div className="relative">
                                            <SearchIcon className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                                            <input 
                                                value={searchTerm} 
                                                onChange={e => setSearchTerm(e.target.value)} 
                                                placeholder={t('search_student_placeholder')} 
                                                className="w-full px-4 py-2.5 rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--fs-sm)] text-[var(--text-main)] font-[var(--fw-bold)] outline-none focus:ring-2 focus:ring-indigo-500 ltr:pl-10 rtl:pr-10 placeholder:text-[var(--text-muted)] opacity-60 shadow-inner" 
                                            />
                                        </div>
                                    </div>
                                    <form onSubmit={handleAddStudent} className="flex-[3] flex flex-col gap-2">
                                        <label className="block text-[var(--fs-xs)] font-[var(--fw-bold)] text-[var(--text-muted)] uppercase tracking-wider">{t('new_student_placeholder')}</label>
                                        <div className="flex gap-3">
                                            <input 
                                                value={newStudentName} 
                                                onChange={e => setNewStudentName(e.target.value)} 
                                                placeholder={t('new_student_placeholder')} 
                                                className="flex-1 px-4 py-2.5 rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--fs-sm)] text-[var(--text-main)] font-[var(--fw-bold)] outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-[var(--text-muted)] opacity-60 shadow-inner" 
                                            />
                                            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-[var(--fw-bold)] px-6 py-2.5 rounded-[var(--radius-main)] shadow-md transition-all text-[var(--fs-sm)]">{t('add')}</button>
                                        </div>
                                    </form>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2">
                                    <AdminTable
                                        keyField="id"
                                        data={selectedClass.students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))}
                                        columns={[
                                            {
                                                key: 'name',
                                                header: t('student_name_label'),
                                                render: (s) => <span className="text-[var(--text-main)] font-[var(--fw-bold)] text-[var(--fs-base)]">{s.name}</span>
                                            }
                                        ]}
                                        actions={(s) => (
                                            <AdminRowActions
                                                onDelete={() => handleDeleteStudent(s.id, s.name)}
                                                deleteTitle={t('delete')}
                                            />
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="p-4 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] flex justify-end shrink-0">
                                <button 
                                    onClick={() => setView('list')} 
                                    className="px-6 py-2 bg-[var(--bg-card)] border border-[var(--border-main)] text-[var(--text-main)] font-[var(--fw-bold)] rounded-[var(--radius-main)] hover:bg-[var(--bg-hover)] transition-all text-[var(--fs-sm)] shadow-sm"
                                >
                                    {t('close_window')}
                                </button>
                            </div>
                        </MotionDiv>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
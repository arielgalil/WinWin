import React, { useState, useMemo } from 'react';
import { ClassRoom, UserProfile } from '../../types';
import { ListIcon, PlusIcon, TrashIcon, EditIcon, UsersIcon, XIcon, RefreshIcon, SearchIcon, UploadIcon } from '../ui/Icons';
import { DeleteButton } from '../ui/DeleteButton';
import { ConfirmationModal } from '../ui/ConfirmationModal';
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
            title: t('delete_student_title'), 
            message: t('confirm_delete_student', { studentName }), 
            isDanger: true, 
            onConfirm: async () => {
                closeConfirmation();
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
        <div className="max-w-5xl mx-auto space-y-6">
            <ConfirmationModal isOpen={modalConfig.isOpen} title={modalConfig.title} message={modalConfig.message} onConfirm={modalConfig.onConfirm} onCancel={modalConfig.onCancel} showCancel={modalConfig.showCancel} />

            <div className="bg-white/5 p-6 rounded-[var(--radius-main)] border border-white/10 shadow-xl backdrop-blur-md space-y-6">
                <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3">
                        <ListIcon className="w-6 h-6 text-purple-400" />
                        <h3 className="text-xl font-bold text-white">{t('classes_management_title')}</h3>
                    </div>
                </div>

                <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
                    <p className="text-slate-400 font-medium text-sm">{t('classes_management_desc')}</p>
                    <div className="flex gap-3">
                        <label className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all text-sm">
                            {isImporting ? <RefreshIcon className="w-4 h-4 animate-spin" /> : <UploadIcon className="w-4 h-4" />}
                            <span>{isImporting ? t('processing') : t('smart_import')}</span>
                            <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleSmartImport} disabled={isImporting} />
                        </label>
                        <button onClick={() => setIsAddingClass(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all text-sm">
                            <PlusIcon className="w-4 h-4" />
                            {t('add_group_button')}
                        </button>
                    </div>
                </div>

                {importStatus && (
                    <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl flex items-center gap-3 text-blue-300 font-bold animate-pulse mb-6 text-sm">
                        <RefreshIcon className="w-4 h-4 animate-spin" />
                        {importStatus}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {(isAddingClass || editingClass) && (
                            <MotionDiv initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-black/40 border border-indigo-500/30 p-6 rounded-2xl flex flex-col gap-4 shadow-2xl backdrop-blur-xl">
                                <h3 className="text-white font-black text-lg">{editingClass ? t('edit_group') : t('add_new_group')}</h3>
                                <input value={newClassName} onChange={e => setNewClassName(e.target.value)} placeholder={t('group_name_placeholder')} className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-indigo-500 transition-all shadow-inner" autoFocus />
                                <div className="flex flex-wrap gap-2">
                                    {AVAILABLE_COLORS.map(c => (
                                        <button key={c} onClick={() => setNewClassColor(c)} className={`w-6 h-6 rounded-full ${c} ${newClassColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'opacity-50 hover:opacity-100 transition-opacity'}`} />
                                    ))}
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <button onClick={editingClass ? handleUpdateClass : handleAddClass} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-2.5 rounded-xl transition-all shadow-lg active:scale-95">{t('save')}</button>
                                    <button onClick={() => { setIsAddingClass(false); setEditingClass(null); setNewClassName(''); }} className="px-4 py-2.5 text-slate-400 font-bold hover:text-white transition-colors">{t('cancel')}</button>
                                </div>
                            </MotionDiv>
                        )}
                    </AnimatePresence>

                    {visibleClasses.map(cls => (
                        <div key={cls.id} className="bg-black/20 border border-white/5 p-6 rounded-2xl flex flex-col gap-4 group hover:bg-white/5 hover:border-white/10 transition-all shadow-lg">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-full ${cls.color} shadow-[0_0_10px_currentColor]`} />
                                    <div>
                                        <h3 className="text-lg font-black text-white">{cls.name}</h3>
                                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{t('students_count', { count: cls.students.length })}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 opacity-100 transition-all">
                                    <button onClick={() => { setSelectedClassId(cls.id); setView('students'); }} className="p-3 min-w-[44px] min-h-[44px] bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg transition-all active:scale-95" title={t('manage_students_tooltip')}><UsersIcon className="w-5 h-5" /></button>
                                    <DeleteButton onClick={() => handleDeleteClass(cls.id)} />
                                    <button onClick={() => { setEditingClass(cls); setNewClassName(cls.name); setNewClassColor(cls.color); setIsAddingClass(false); }} className="p-3 min-w-[44px] min-h-[44px] bg-amber-600/10 hover:bg-amber-600 text-amber-400 hover:text-white rounded-lg transition-all active:scale-95" title={t('edit_group_tooltip')}><EditIcon className="w-5 h-5" /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <AnimatePresence>
                {view === 'students' && selectedClass && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                        <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setView('list')} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
                        <MotionDiv initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-4xl bg-slate-900 border border-white/20 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
                            <div className="p-6 border-b border-white/10 flex justify-between items-center shrink-0 bg-black/20">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${selectedClass.color}`}>
                                        <UsersIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white">{selectedClass.name}</h3>
                                        <p className="text-slate-400 text-sm font-bold">{t('manage_students_title')}</p>
                                    </div>
                                </div>
                                <button onClick={() => setView('list')} className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all"><XIcon className="w-6 h-6" /></button>
                            </div>

                            <div className="p-6 flex flex-col gap-6 overflow-hidden">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="relative flex-1">
                                        <SearchIcon className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                        <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder={t('search_student_placeholder')} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 ltr:pl-12 rtl:pr-12 text-white outline-none focus:border-blue-500 shadow-inner" />
                                    </div>
                                    <form onSubmit={handleAddStudent} className="flex-1 flex gap-2">
                                        <input value={newStudentName} onChange={e => setNewStudentName(e.target.value)} placeholder={t('new_student_placeholder')} className="flex-1 bg-black/40 border border-white/10 rounded-xl px-5 text-white outline-none focus:border-blue-500 shadow-inner" />
                                        <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-6 rounded-xl font-black shadow-lg transition-all active:scale-95">{t('add')}</button>
                                    </form>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                        {selectedClass.students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map(student => (
                                            <div key={student.id} className="bg-white/5 border border-white/5 p-4 rounded-xl flex justify-between items-center group/item hover:bg-white/10 transition-all">
                                                <span className="text-white font-bold">{student.name}</span>
                                                <button onClick={() => handleDeleteStudent(student.id, student.name)} className="opacity-100 p-3 min-w-[44px] min-h-[44px] text-slate-500 hover:text-red-400 transition-all rounded-lg hover:bg-red-500/10 active:scale-95"><TrashIcon className="w-5 h-5" /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-black/40 border-t border-white/10 flex justify-center shrink-0">
                                <button onClick={() => setView('list')} className="px-10 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white font-black transition-all border border-white/10">{t('close_window')}</button>
                            </div>
                        </MotionDiv>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

import { useCallback, useMemo, useState } from 'react';
import { triggerHaptic } from '@/utils/haptics';
import { useLanguage } from '@/hooks/useLanguage';
import { useDemoContext } from './DemoContext';

const CLASS_ENTITY_ID = 'CLASS_ENTITY';

export const useDemoScoreEntry = (initialClassId: string | null) => {
    const { t } = useLanguage();
    const { classes, settings, addPoints } = useDemoContext();

    const [selectedClassId, setSelectedClassId] = useState<string | null>(
        initialClassId || (classes.length > 0 ? classes[0].id : null),
    );
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    const currentClass = useMemo(
        () => classes.find(c => c.id === selectedClassId) || null,
        [classes, selectedClassId],
    );

    const filteredStudents = useMemo(() => {
        if (!currentClass) return [];
        return currentClass.students
            .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => a.name.localeCompare(b.name, 'he'));
    }, [currentClass, searchTerm]);

    const selectionLabel = useMemo(() => {
        const count = selectedStudentIds.size;
        if (count === 0) return '';
        if (selectedStudentIds.has(CLASS_ENTITY_ID)) return currentClass?.name || t('group_label');
        if (count === 1) {
            const studentId = Array.from(selectedStudentIds)[0];
            const student = currentClass?.students.find(s => s.id === studentId);
            return student ? student.name : t('selected_student');
        }
        return t('students_selected', { count });
    }, [selectedStudentIds, currentClass, t]);

    const toggleSelection = useCallback((id: string) => {
        triggerHaptic('selection');
        setSelectedStudentIds(prev => {
            const next = new Set(prev);
            if (id === CLASS_ENTITY_ID) {
                return next.has(CLASS_ENTITY_ID) ? new Set() : new Set([CLASS_ENTITY_ID]);
            }
            if (next.has(CLASS_ENTITY_ID)) next.delete(CLASS_ENTITY_ID);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const clearSelection = useCallback(() => setSelectedStudentIds(new Set()), []);

    const selectAllFiltered = useCallback(() => {
        triggerHaptic('selection');
        if (selectedStudentIds.size > 0) clearSelection();
        else setSelectedStudentIds(new Set(filteredStudents.map(s => s.id)));
    }, [filteredStudents, selectedStudentIds.size, clearSelection]);

    const showToastMsg = (msg: string, type: 'success' | 'error') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const submitPoints = async (points: number, _teacherFullName: string, _note?: string) => {
        if (!selectedClassId || selectedStudentIds.size === 0) return;
        setIsProcessing(true);
        const isGroupScore = selectedStudentIds.has(CLASS_ENTITY_ID);
        const idsToProcess = Array.from(selectedStudentIds);
        setSelectedStudentIds(new Set());

        try {
            if (isGroupScore) {
                addPoints(selectedClassId, points);
                showToastMsg(t('group_score_added', { className: currentClass?.name }), 'success');
            } else {
                idsToProcess.forEach(studentId => addPoints(selectedClassId, points, studentId));
                showToastMsg(t('students_score_added', { count: idsToProcess.length }), 'success');
            }
            triggerHaptic('success');
        } catch {
            showToastMsg(t('points_update_error', { error: t('server_error') }), 'error');
            triggerHaptic('error');
        } finally {
            setIsProcessing(false);
        }
    };

    // No-op stub matching useScoreEntry's shape
    const updateClassTarget = async () => {};

    return {
        selectedClassId,
        setSelectedClassId,
        selectedStudentIds,
        currentClass,
        filteredStudents,
        selectionLabel,
        searchTerm,
        setSearchTerm,
        isProcessing,
        toast,
        toggleSelection,
        clearSelection,
        selectAllFiltered,
        submitPoints,
        updateClassTarget,
        CLASS_ENTITY_ID,
        classes,
        settings,
    };
};

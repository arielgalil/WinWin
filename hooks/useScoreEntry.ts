import { useState, useMemo, useCallback, useEffect } from 'react';
import { useCompetitionData } from './useCompetitionData';
import { triggerHaptic } from '../utils/haptics';
import { useAuth } from './useAuth';
import { isAdmin as checkIsAdmin } from '../config';
import { useLanguage } from './useLanguage';

const CLASS_ENTITY_ID = 'CLASS_ENTITY';

export const useScoreEntry = (initialClassId: string | null) => {
  const { t } = useLanguage();
  const { classes, settings, addPoints, updateClassTarget, campaignRole } = useCompetitionData();
  const { user } = useAuth();
  
  const isAdmin = checkIsAdmin(user?.role, campaignRole);
  
  const [selectedClassId, setSelectedClassId] = useState<string | null>(initialClassId || (isAdmin && classes.length > 0 ? classes[0].id : null));
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);

  // Sync with initialClassId if it changes (e.g. after profile/role loads)
  useEffect(() => {
    if (initialClassId && !selectedClassId) {
      setSelectedClassId(initialClassId);
    }
  }, [initialClassId, selectedClassId]);

  // Sync for admins if they don't have a selection yet
  useEffect(() => {
    if (isAdmin && classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [isAdmin, classes, selectedClassId]);

  const currentClass = useMemo(() => 
    classes.find(c => c.id === selectedClassId) || null
  , [classes, selectedClassId]);

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
      if (id === CLASS_ENTITY_ID) return next.has(CLASS_ENTITY_ID) ? new Set() : new Set([CLASS_ENTITY_ID]);
      if (next.has(CLASS_ENTITY_ID)) next.delete(CLASS_ENTITY_ID);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
      setSelectedStudentIds(new Set());
  }, []);

  const selectAllFiltered = useCallback(() => {
      triggerHaptic('selection');
      if (selectedStudentIds.size > 0) clearSelection();
      else setSelectedStudentIds(new Set(filteredStudents.map(s => s.id)));
  }, [filteredStudents, selectedStudentIds.size, clearSelection]);

  const showToast = (msg: string, type: 'success'|'error') => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 3000);
  };

  const submitPoints = async (points: number, teacherFullName: string, note?: string) => {
    if (!selectedClassId || selectedStudentIds.size === 0) return;
    setIsProcessing(true);
    const isGroupScore = selectedStudentIds.has(CLASS_ENTITY_ID);
    const idsToProcess = Array.from(selectedStudentIds);
    
    // Backup for rollback if needed
    const previousSelection = new Set(selectedStudentIds);
    
    // Clear selection optimistically
    setSelectedStudentIds(new Set());

    try {
      if (isGroupScore) {
          await addPoints({ 
            classId: selectedClassId, 
            studentId: undefined, 
            points, 
            teacherName: teacherFullName,
            note
          });
          showToast(t('group_score_added', { className: currentClass?.name }), 'success');
      } else {
          await Promise.all(idsToProcess.map(studentId => 
            addPoints({ 
              classId: selectedClassId, 
              studentId, 
              points, 
              teacherName: teacherFullName,
              note
            })
          ));
          showToast(t('students_score_added', { count: idsToProcess.length }), 'success');
      }
      triggerHaptic('success');
    } catch (err: any) {
      // CRITICAL FIX: Log the error so it appears in the mobile debug console
      console.error("FAILED TO UPDATE POINTS:", err);
      
      // Rollback UI state
      setSelectedStudentIds(previousSelection);
      
      showToast(t('points_update_error', { error: err.message || t('server_error') }), 'error');
      triggerHaptic('error');
    } finally {
      setIsProcessing(false);
    }
  };

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
      settings
  };
};

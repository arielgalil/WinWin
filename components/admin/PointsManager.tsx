import React from 'react';
import { UserProfile } from '../../types';
import { SearchIcon, AlertIcon, CheckIcon } from '../ui/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { LiteStudentCard } from '../lite/LiteStudentCard';
import { LiteActionDock } from '../lite/LiteActionDock';
import { useScoreEntry } from '../../hooks/useScoreEntry';
import { useLanguage } from '../../hooks/useLanguage';
import { isAdmin as checkIsAdmin } from '../../config';
import { useSaveNotification } from '../../contexts/SaveNotificationContext';

const MotionDiv = motion.div as any;

interface PointsManagerProps {
  user: UserProfile;
  campaignRole?: 'admin' | 'teacher' | 'superuser' | null;
  onSave?: () => Promise<void>;
}

export const PointsManager: React.FC<PointsManagerProps> = ({ user, campaignRole, onSave }) => {
  const { t } = useLanguage();
  const { triggerSave } = useSaveNotification();

  const isAdmin = checkIsAdmin(user.role, campaignRole);

  const {
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
    submitPoints,
    CLASS_ENTITY_ID,
    classes,
    settings
  } = useScoreEntry(user.class_id && !isAdmin ? user.class_id : null);

  const teacherClasses = isAdmin ? [...classes].sort((a, b) => a.name.localeCompare(b.name, 'he')) : classes.filter(c => c.id === user.class_id);

  // Trigger notification on successful save
  React.useEffect(() => {
    if (toast?.type === 'success') {
      triggerSave('points');
      if (onSave) onSave();
    }
  }, [toast, triggerSave, onSave]);

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col gap-6">
      <div className="bg-white/5 p-4 rounded-[var(--radius-main)] border border-white/10 backdrop-blur-md">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 md:w-48">
            <select
              value={selectedClassId || ''}
              onChange={(e) => { setSelectedClassId(e.target.value); clearSelection(); }}
              className="w-full bg-slate-900/50 text-white font-black py-3 px-4 rtl:pr-9 ltr:pl-9 rounded-[var(--radius-main)] border border-white/10 outline-none focus:border-blue-500/50 shadow-inner appearance-none transition-all"
            >
              {!selectedClassId && <option value="">{t('select_group_placeholder')}</option>}
              {teacherClasses.map(c => <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>)}
            </select>
            <div className="absolute rtl:left-3 ltr:right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">▼</div>
          </div>
          <div className="relative flex-1 md:w-64">
            <input 
                type="text" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                placeholder={t('search_student_placeholder')} 
                className="w-full bg-slate-900/50 border border-white/10 rounded-[var(--radius-main)] py-3 rtl:pr-10 ltr:pl-10 text-white font-bold focus:border-blue-500 outline-none transition-all shadow-inner" 
            />
            <SearchIcon className="absolute rtl:right-3 ltr:left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          </div>
        </div>
      </div>

      <div className="bg-white/5 p-6 rounded-[var(--radius-main)] border border-white/10 shadow-2xl flex-1 min-h-[400px] overflow-y-auto custom-scrollbar backdrop-blur-md">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {!searchTerm && currentClass && (
            <LiteStudentCard id={CLASS_ENTITY_ID} name={currentClass.name} score={currentClass.score} isSelected={selectedStudentIds.has(CLASS_ENTITY_ID)} onToggle={toggleSelection} isClassEntity={true} />
          )}
          {filteredStudents.map(student => (
            <LiteStudentCard key={student.id} id={student.id} name={student.name} score={student.score} isSelected={selectedStudentIds.has(student.id)} onToggle={toggleSelection} />
          ))}
        </div>
        {filteredStudents.length === 0 && selectedClassId && (
          <div className="text-center py-20 text-slate-500 font-black text-xl opacity-50 flex flex-col items-center gap-4">
            <SearchIcon className="w-12 h-12" />
            <span>{t('no_students_found')}</span>
          </div>
        )}
        {!selectedClassId && (
          <div className="text-center py-20 text-slate-500 font-black text-xl opacity-50">
            {t('select_group_to_start')}
          </div>
        )}
      </div>

      <div className="relative mt-auto">
        <LiteActionDock
          selectedCount={selectedStudentIds.size}
          selectionLabel={selectionLabel}
          presets={settings.score_presets || []}
          onAction={(pts, note) => submitPoints(pts, user.full_name, note)}
          onClear={clearSelection}
          isProcessing={isProcessing}
        />
      </div>

      <AnimatePresence>
        {toast && (
          <MotionDiv initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 20 }} exit={{ opacity: 0 }} className="fixed top-12 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl font-black bg-slate-800 border border-white/20 text-white flex items-center gap-3 backdrop-blur-xl">
            {toast.type === 'success' ? <CheckIcon className="w-6 h-6 text-green-400" /> : <AlertIcon className="w-6 h-6 text-red-400" />}
            {toast.msg}
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
};

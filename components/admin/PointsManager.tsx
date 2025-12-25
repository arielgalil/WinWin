import React from 'react';
import { UserProfile } from '../../types';
import { SearchIcon, AlertIcon, CheckIcon, XIcon } from '../ui/Icons';
import { AdminActionButton } from '../ui/AdminActionButton';
import { motion, AnimatePresence } from 'framer-motion';
import { LiteStudentCard } from '../lite/LiteStudentCard';
import { LiteActionDock } from '../lite/LiteActionDock';
import { AdminSectionCard } from '../ui/AdminSectionCard';
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
    <div className="max-w-6xl mx-auto h-full flex flex-col gap-6">
      {/* Search and Filter Bar */}
      <AdminSectionCard
        title={t('tab_points')}
        icon={<SearchIcon className="w-6 h-6" />}
        className="!p-6"
      >
        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative flex-1">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t('group_label')}</label>
            <div className="relative">
              <select
                value={selectedClassId || ''}
                onChange={(e) => { setSelectedClassId(e.target.value); clearSelection(); }}
                className="w-full px-4 py-3 rounded-[var(--radius-main)] border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-sm appearance-none font-medium"
              >
                {!selectedClassId && <option value="">{t('select_group_placeholder')}</option>}
                {teacherClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="absolute rtl:left-4 ltr:right-4 top-10 pointer-events-none text-gray-400 text-[10px]">▼</div>
            </div>
          </div>
          <div className="relative flex-1">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t('search_student_placeholder')}</label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={t('search_student_placeholder')}
                className="w-full px-4 py-3 rounded-[var(--radius-main)] border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-sm font-medium rtl:pr-11 ltr:pl-11"
              />
              <SearchIcon className="absolute rtl:right-4 ltr:left-4 top-[38px] w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>
      </AdminSectionCard>

      {/* Grid Area */}
      <AdminSectionCard
        title={selectionLabel || t('students_label')}
        className="flex-1 min-h-[400px] !p-6"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {!searchTerm && currentClass && (
            <LiteStudentCard id={CLASS_ENTITY_ID} name={currentClass.name} score={currentClass.score} isSelected={selectedStudentIds.has(CLASS_ENTITY_ID)} onToggle={toggleSelection} isClassEntity={true} />
          )}
          {filteredStudents.map(student => (
            <LiteStudentCard key={student.id} id={student.id} name={student.name} score={student.score} isSelected={selectedStudentIds.has(student.id)} onToggle={toggleSelection} />
          ))}
        </div>
        {filteredStudents.length === 0 && selectedClassId && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4 opacity-60">
            <SearchIcon className="w-16 h-16" />
            <span className="font-bold text-lg">{t('no_students_found')}</span>
          </div>
        )}
        {!selectedClassId && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4 opacity-60">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
              <span className="text-2xl">?</span>
            </div>
            <span className="font-bold text-lg">{t('select_group_to_start')}</span>
          </div>
        )}
      </AdminSectionCard>

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
          <MotionDiv initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 20 }} exit={{ opacity: 0 }} className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl font-bold bg-white dark:bg-[#25262b] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white flex items-center gap-3 backdrop-blur-xl">
            {toast.type === 'success' ? <CheckIcon className="w-5 h-5 text-green-500" /> : <AlertIcon className="w-5 h-5 text-red-500" />}
            {toast.msg}
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
};

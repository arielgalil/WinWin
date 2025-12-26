
import React, { useEffect, useRef, useState } from 'react';
import { UserProfile } from '../../types';
import { LiteStudentCard } from './LiteStudentCard';
import { LiteActionDock } from './LiteActionDock';
import { LogoutIcon, SearchIcon, CheckIcon, AlertIcon, TargetIcon, EditIcon, RefreshIcon } from '../ui/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { GradientBackground } from '../ui/GradientBackground';
import { useScoreEntry } from '../../hooks/useScoreEntry';
import { Logo } from '../ui/Logo';
import { useLanguage } from '../../hooks/useLanguage';
import { isAdmin as checkIsAdmin } from '../../config';
import { VersionFooter } from '../ui/VersionFooter';

const MotionDiv = motion.div as any;

interface LiteTeacherViewProps {
  user: UserProfile;
  userRole?: 'admin' | 'teacher' | 'superuser' | null;
  onLogout: () => void;
}

export const LiteTeacherView: React.FC<LiteTeacherViewProps> = ({
  user, userRole, onLogout
}) => {
  const { t } = useLanguage();
  const isAdmin = checkIsAdmin(user.role, userRole);

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
    selectAllFiltered,
    submitPoints,
    updateClassTarget,
    CLASS_ENTITY_ID,
    classes,
    settings
  } = useScoreEntry(user.class_id);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [targetInputValue, setTargetInputValue] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentClass) setTargetInputValue(String(currentClass.target_score || ''));
  }, [currentClass?.id, currentClass?.target_score]);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [isSearchOpen]);

  const handleSaveTarget = async () => {
    if (!currentClass) return;
    const val = parseInt(targetInputValue);
    if (isNaN(val)) return;
    await updateClassTarget(currentClass.id, val);
    setIsEditingTarget(false);
  };

  if (classes.length === 0) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[var(--bg-page)] text-[var(--text-main)] gap-4">
        <RefreshIcon className="animate-spin w-10 h-10 text-indigo-500" />
        <span className="font-bold animate-pulse">{t('loading_data')}</span>
      </div>
    );
  }

  const glassCardStyle = "bg-[var(--bg-card)]/80 backdrop-blur-xl border border-[var(--border-main)] shadow-2xl";
  const progressPct = (currentClass?.target_score || 0) > 0 ? Math.min(100, ((currentClass?.score || 0) / currentClass!.target_score!) * 100) : 0;

  // Filter classes shown in dropdown - if admin see all, else only own
  const availableClasses = isAdmin ? [...classes].sort((a, b) => a.name.localeCompare(b.name, 'he')) : classes.filter(c => c.id === user.class_id);

  return (
    <GradientBackground primaryColor={settings.primary_color} secondaryColor={settings.secondary_color} brightness={settings.background_brightness}>
      <div className="relative h-full w-full flex flex-col overflow-hidden min-h-0 admin-view">
        <AnimatePresence>
          {toast && (
            <MotionDiv initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 20 }} exit={{ opacity: 0 }} className={`fixed top-4 left-0 right-0 mx-auto w-fit z-[100] px-6 py-3 rounded-[var(--radius-main)] shadow-2xl font-black flex items-center gap-3 backdrop-blur-xl border border-white/20 ${toast.type === 'success' ? 'bg-[var(--status-success-bg)] text-[var(--status-success-text)]' : 'bg-[var(--status-error-bg)] text-[var(--status-error-text)]'}`}>
              {toast.type === 'success' ? <CheckIcon className="w-6 h-6" /> : <AlertIcon className="w-6 h-6" />}
              {toast.msg}
            </MotionDiv>
          )}
        </AnimatePresence>

        <header className="shrink-0 p-4 pb-2">
          <div className={`${glassCardStyle} rounded-[var(--radius-main)] p-4`}>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-4 overflow-hidden">
                <Logo
                  src={settings.logo_url}
                  className="w-10 h-10 shadow-lg"
                  fallbackIcon="school"
                  padding="p-1"
                />
                <div className="min-w-0">
                  <h1 className="font-black text-lg text-[var(--text-main)] truncate">{settings.school_name}</h1>
                  <p className="text-[var(--text-muted)] text-xs truncate">{user.full_name}</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={onLogout} className="p-2.5 bg-[var(--bg-surface)] text-[var(--text-muted)] rounded-[var(--radius-main)] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)] transition-all"><LogoutIcon className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="bg-[var(--bg-surface)] p-2 rounded-[var(--radius-main)] flex gap-2 border border-[var(--border-subtle)]">
              <select value={selectedClassId || ''} onChange={(e) => { setSelectedClassId(e.target.value); clearSelection(); }} className="flex-1 bg-[var(--bg-input)] text-[var(--text-main)] font-bold text-sm py-2 px-4 rounded-[var(--radius-main)] outline-none border border-[var(--border-main)] rtl:text-right ltr:text-left">
                {availableClasses.map(c => <option key={c.id} value={c.id} className="bg-[var(--bg-card)]">{c.name}</option>)}
                {availableClasses.length === 0 && <option value="" className="bg-[var(--bg-card)]">{t('no_groups_assigned')}</option>}
              </select>
              <button onClick={selectAllFiltered} className={`px-4 py-2 rounded-[var(--radius-main)] font-bold text-xs border transition-all ${selectedStudentIds.size > 0 ? 'bg-rose-500/10 text-rose-600 border-rose-500/20 active:bg-rose-500/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 active:bg-emerald-500/20'}`}>
                {selectedStudentIds.size > 0 ? t('clear_selection') : t('select_all')}
              </button>
              <button onClick={() => setIsSearchOpen(!isSearchOpen)} className={`p-2 rounded-[var(--radius-main)] border transition-all ${isSearchOpen || searchTerm ? 'bg-indigo-600 text-white border-indigo-500 shadow-md' : 'bg-[var(--bg-surface)] border-[var(--border-main)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'}`}><SearchIcon className="w-5 h-5" /></button>
            </div>

            <AnimatePresence>
              {isSearchOpen && (
                <MotionDiv initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1, marginTop: 12 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="relative">
                    <SearchIcon className="w-4 h-4 absolute top-1/2 -translate-y-1/2 opacity-40 rtl:left-4 ltr:right-4 text-[var(--text-muted)]" />
                    <input ref={searchInputRef} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder={t('search_student_placeholder')} className="w-full bg-[var(--bg-input)] border border-[var(--border-main)] rounded-[var(--radius-main)] py-2 px-4 rtl:pl-10 ltr:pr-10 text-[var(--text-main)] focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-[var(--text-muted)] opacity-60" />
                  </div>
                </MotionDiv>
              )}
            </AnimatePresence>
          </div>
        </header>

        {currentClass && (
          <div className="px-4 mb-2 shrink-0">
            <div className={`${glassCardStyle} rounded-[var(--radius-main)] p-3 shadow-xl`}>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2"><TargetIcon className="w-4 h-4 text-indigo-500 dark:text-blue-300" /><span className="text-sm font-bold text-[var(--text-main)]">{t('class_target_title')}</span></div>
                <button onClick={() => setIsEditingTarget(!isEditingTarget)} className="text-[10px] bg-[var(--bg-surface)] px-4 py-2.5 min-h-[44px] rounded-[calc(var(--radius-main)*0.5)] text-[var(--text-muted)] border border-[var(--border-main)] flex items-center gap-2 hover:bg-[var(--bg-hover)] transition-colors uppercase font-black active:scale-95"><EditIcon className="w-4 h-4" /> {isEditingTarget ? t('cancel') : t('edit_action')}</button>
              </div>
              {isEditingTarget ? (
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={targetInputValue}
                    onChange={e => setTargetInputValue(e.target.value)}
                    aria-label="Set target score"
                    className="flex-1 bg-[var(--bg-input)] border border-indigo-500 rounded-[var(--radius-main)] px-3 py-2 text-[var(--text-main)] font-bold text-center outline-none ring-2 ring-indigo-500/20 focus:ring-4 focus:ring-indigo-500/40"
                    autoFocus
                  />
                  <button onClick={handleSaveTarget} className="bg-green-600 text-white px-5 rounded-[var(--radius-main)] font-bold active:scale-95 transition-all shadow-lg">{t('save')}</button>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between text-[10px] font-black text-[var(--text-muted)] mb-1 uppercase tracking-wider">
                    <span>{t('progress_label')}: {currentClass.score}</span>
                    <span>{t('target_label')}: {currentClass.target_score || t('not_defined')}</span>
                  </div>
                  <div className="h-2 w-full bg-[var(--bg-surface)] rounded-full overflow-hidden border border-[var(--border-subtle)] shadow-inner">
                    <MotionDiv className="h-full bg-gradient-to-r from-indigo-600 to-blue-400" initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <main className="px-4 pb-2 flex-1 overflow-y-auto custom-scrollbar">
          <div className={`${glassCardStyle} p-3 rounded-[var(--radius-main)] grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 min-h-[140px] items-start`}>
            {!searchTerm && currentClass && <LiteStudentCard id={CLASS_ENTITY_ID} name={currentClass.name} score={currentClass.score} isSelected={selectedStudentIds.has(CLASS_ENTITY_ID)} onToggle={toggleSelection} isClassEntity={true} />}
            {filteredStudents.map(student => <LiteStudentCard key={student.id} id={student.id} name={student.name} score={student.score} isSelected={selectedStudentIds.has(student.id)} onToggle={toggleSelection} />)}
            {filteredStudents.length === 0 && !currentClass && (
              <div className="col-span-full py-12 text-center text-[var(--text-muted)] font-bold">{t('no_students_found')}</div>
            )}
          </div>
        </main>


        <LiteActionDock selectedCount={selectedStudentIds.size} selectionLabel={selectionLabel} presets={settings.score_presets || []} onAction={(pts, note) => submitPoints(pts, user.full_name, note)} onClear={clearSelection} isProcessing={isProcessing} />
        <VersionFooter />
      </div>
    </GradientBackground>
  );
};

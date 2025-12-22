import React, { useState } from 'react';
import { AppSettings, ClassRoom, CompetitionGoal } from '../../types';
import { SaveIcon, CheckIcon, RefreshIcon, AlertIcon, TrophyIcon, UsersIcon } from '../ui/Icons';
import { GoalsManager as SharedGoalsManager } from './settings/GoalsManager';
import { formatNumberWithCommas, parseFormattedNumber } from '../../utils/stringUtils';
import { FormattedNumber } from '../ui/FormattedNumber';
import { motion } from 'framer-motion';
import { useLanguage } from '../../hooks/useLanguage';
import { useSaveNotification } from '../../contexts/SaveNotificationContext';

const MotionDiv = motion.div as any;

interface GoalsManagementProps {
    settings: AppSettings;
    classes: ClassRoom[];
    totalInstitutionScore: number;
    onUpdateSettings: (newGoals: CompetitionGoal[], newGridSize: number) => Promise<void>;
    onUpdateClassTarget: (classId: string, targetScore: number) => Promise<void>;
}

export const GoalsManagement: React.FC<GoalsManagementProps> = ({
    settings,
    classes,
    totalInstitutionScore,
    onUpdateSettings,
    onUpdateClassTarget
}) => {
    const { t } = useLanguage();
    const { triggerSave } = useSaveNotification();
    
    const sortedClasses = [...classes].sort((a, b) => a.name.localeCompare(b.name, 'he'));

    const handleUpdateSettings = async (newGoals: CompetitionGoal[], newGridSize: number) => {
        await onUpdateSettings(newGoals, newGridSize);
        triggerSave('goals');
    };

    const handleUpdateClassTarget = async (classId: string, targetScore: number) => {
        await onUpdateClassTarget(classId, targetScore);
        triggerSave('goals');
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
            <section className="bg-white/5 p-6 rounded-[var(--radius-main)] border border-white/10 shadow-xl backdrop-blur-md space-y-6">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <TrophyIcon className="w-6 h-6 text-orange-400" />
                    <div>
                        <h3 className="text-xl font-bold text-white leading-none">{t('institutional_goals_title')}</h3>
                        <p className="text-slate-400 text-xs mt-1">{t('institutional_goals_desc')}</p>
                    </div>
                </div>

                <SharedGoalsManager
                    settings={settings}
                    onUpdateSettings={handleUpdateSettings}
                    totalScore={totalInstitutionScore}
                />
            </section>

            <section className="bg-white/5 p-6 rounded-[var(--radius-main)] border border-white/10 shadow-xl backdrop-blur-md space-y-6">
                <div className="flex flex-col gap-2 border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3">
                        <UsersIcon className="w-6 h-6 text-blue-400" />
                        <h3 className="text-xl font-bold text-white">{t('group_goals_title')}</h3>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl flex items-center gap-3">
                        <AlertIcon className="w-4 h-4 text-blue-300 shrink-0" />
                        <p className="text-blue-200 text-xs font-bold leading-tight">
                            {t('teacher_can_update_warning')}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedClasses.map(cls => (
                        <ClassTargetCard
                            key={cls.id}
                            cls={cls}
                            onSave={handleUpdateClassTarget}
                        />
                    ))}
                </div>
            </section>
        </div>
    );
};

const ClassTargetCard = React.memo(({ cls, onSave }: { cls: ClassRoom, onSave: (id: string, val: number) => Promise<void> }) => {
    const { t } = useLanguage();
    const [target, setTarget] = useState<string>(cls.target_score ? String(cls.target_score) : '');
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const currentScore = cls.score || 0;
    const targetNum = Number(target) || 0;
    const hasTarget = targetNum > 0;
    const progress = hasTarget ? Math.min(100, (currentScore / targetNum) * 100) : 0;
    const isCompleted = hasTarget && currentScore >= targetNum;
    const missingPoints = hasTarget ? Math.max(0, targetNum - currentScore) : 0;

    const handleSave = async () => {
        const val = parseInt(target);
        if (isNaN(val)) return;
        setIsSaving(true);
        await onSave(cls.id, val);
        setIsSaving(false);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <div className={`relative p-5 rounded-2xl border transition-all overflow-hidden flex flex-col gap-4 ${isCompleted ? 'bg-yellow-900/20 border-yellow-500/30 shadow-lg shadow-yellow-900/10' : 'bg-slate-900/40 border-white/5'}`}>
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <h4 className="text-base font-black text-white leading-tight">{cls.name}</h4>
                    <span className="text-[10px] text-slate-400 font-bold">{t('current_label')}: <FormattedNumber value={currentScore} /></span>
                </div>
                <div className={`w-2 h-2 rounded-full ${cls.color} shadow-[0_0_10px_currentColor]`}></div>
            </div>
            <div className="relative z-10 flex-1 flex flex-col justify-center">
                {!hasTarget ? (
                    <div className="text-slate-500 text-[10px] font-bold bg-black/20 py-2 rounded-xl border border-dashed border-white/5 text-center">{t('no_target_set')}</div>
                ) : (
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-black">
                            <span className="text-blue-300">{Math.round(progress)}%</span>
                            <span className="text-slate-400">{t('missing_points_label')}: <FormattedNumber value={missingPoints} /></span>
                        </div>
                        <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                            <MotionDiv className="h-full bg-gradient-to-r from-blue-600 to-cyan-400" initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
                        </div>
                    </div>
                )}
            </div>
            <div className="mt-auto pt-3 border-t border-white/5">
                <div className="flex items-center gap-2 bg-black/20 p-1 rounded-xl border border-white/5">
                    <input type="text" value={formatNumberWithCommas(target)} onChange={(e) => setTarget(parseFormattedNumber(e.target.value).toString())} className="flex-1 bg-transparent border-none text-white font-black text-xs text-center outline-none" placeholder={t('enter_target_placeholder')} />
                    <button onClick={handleSave} disabled={isSaving} className={`w-7 h-7 rounded-lg flex items-center justify-center ${isSaved ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-500'} text-white transition-all active:scale-90`}>
                        {isSaving ? <RefreshIcon className="w-3.5 h-3.5 animate-spin" /> : isSaved ? <CheckIcon className="w-3.5 h-3.5" /> : <SaveIcon className="w-3.5 h-3.5" />}
                    </button>
                </div>
            </div>
        </div>
    );
});

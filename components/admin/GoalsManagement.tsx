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
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            <section className="bg-white dark:bg-[#1e1e2e] p-8 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm space-y-8">
                <div className="flex items-center gap-4 border-b border-gray-100 dark:border-white/5 pb-6">
                    <div className="p-3 bg-orange-50 dark:bg-orange-500/10 rounded-xl border border-orange-100 dark:border-orange-500/20">
                        <TrophyIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white leading-none">{t('institutional_goals_title')}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('institutional_goals_desc')}</p>
                    </div>
                </div>

                <SharedGoalsManager
                    settings={settings}
                    onUpdateSettings={handleUpdateSettings}
                    totalScore={totalInstitutionScore}
                />
            </section>

            <section className="bg-white dark:bg-[#1e1e2e] p-8 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm space-y-8">
                <div className="flex flex-col gap-4 border-b border-gray-100 dark:border-white/5 pb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-500/20">
                            <UsersIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{t('group_goals_title')}</h3>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 p-4 rounded-xl flex items-center gap-3">
                        <AlertIcon className="w-5 h-5 text-blue-500 dark:text-blue-400 shrink-0" />
                        <p className="text-blue-700 dark:text-blue-300 text-xs font-bold leading-relaxed">
                            {t('teacher_can_update_warning')}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        <div className={`relative p-6 rounded-xl border transition-all overflow-hidden flex flex-col gap-5 ${isCompleted ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-500/20 shadow-sm' : 'bg-gray-50 dark:bg-black/20 border-gray-200 dark:border-white/10 hover:border-indigo-200 dark:hover:border-indigo-500/30'}`}>
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{cls.name}</h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-bold mt-1 block">{t('current_label')}: <FormattedNumber value={currentScore} /></span>
                </div>
                <div className={`w-3 h-3 rounded-full ${cls.color} shadow-sm ring-2 ring-white dark:ring-[#1e1e2e]`}></div>
            </div>
            <div className="relative z-10 flex-1 flex flex-col justify-center">
                {!hasTarget ? (
                    <div className="text-gray-400 dark:text-gray-500 text-xs font-bold bg-white dark:bg-white/5 py-3 rounded-lg border border-dashed border-gray-200 dark:border-white/10 text-center">{t('no_target_set')}</div>
                ) : (
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                            <span className="text-indigo-600 dark:text-indigo-400">{Math.round(progress)}%</span>
                            <span className="text-gray-500 dark:text-gray-400">{t('missing_points_label')}: <FormattedNumber value={missingPoints} /></span>
                        </div>
                        <div className="h-2 w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                            <MotionDiv className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
                        </div>
                    </div>
                )}
            </div>
            <div className="mt-auto pt-4 border-t border-gray-200 dark:border-white/10">
                <div className="flex items-center gap-3">
                    <input 
                        type="text" 
                        value={formatNumberWithCommas(target)} 
                        onChange={(e) => setTarget(parseFormattedNumber(e.target.value).toString())} 
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm text-center font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                        placeholder={t('enter_target_placeholder')} 
                    />
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving} 
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all active:scale-95 ${isSaved ? 'bg-green-600 hover:bg-green-500 text-white shadow-md' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20'}`}
                    >
                        {isSaving ? <RefreshIcon className="w-4 h-4 animate-spin" /> : isSaved ? <CheckIcon className="w-4 h-4" /> : <SaveIcon className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
});

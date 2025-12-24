import React, { useState } from 'react';
import { AppSettings, ClassRoom, CompetitionGoal } from '../../types';
import { SaveIcon, CheckIcon, RefreshIcon, AlertIcon, TrophyIcon, UsersIcon } from '../ui/Icons';
import { GoalsManager as SharedGoalsManager } from './settings/GoalsManager';
import { AdminTable } from '../ui/AdminTable';
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

                <AdminTable
                    keyField="id"
                    data={sortedClasses}
                    columns={[
                        {
                            key: 'name',
                            header: t('group_header'),
                            render: (cls) => (
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${cls.color} shadow-sm ring-2 ring-white dark:ring-[#1e1e2e]`}></div>
                                    <span className="font-bold text-gray-900 dark:text-white">{cls.name}</span>
                                </div>
                            )
                        },
                        {
                            key: 'progress',
                            header: t('progress_label'),
                            render: (cls) => {
                                const currentScore = cls.score || 0;
                                const targetNum = cls.target_score || 0;
                                const hasTarget = targetNum > 0;
                                const progress = hasTarget ? Math.min(100, (currentScore / targetNum) * 100) : 0;
                                
                                return (
                                    <div className="flex flex-col gap-1.5 min-w-[120px]">
                                        <div className="flex justify-between text-[10px] font-bold">
                                            <span className="text-indigo-600 dark:text-indigo-400">{Math.round(progress)}%</span>
                                            <span className="text-gray-400 font-normal"><FormattedNumber value={currentScore} /> / <FormattedNumber value={targetNum} /></span>
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                            <MotionDiv className="h-full bg-indigo-500" initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
                                        </div>
                                    </div>
                                );
                            }
                        },
                        {
                            key: 'target_input',
                            header: t('target_score_header'),
                            render: (cls) => <ClassTargetInput cls={cls} onSave={handleUpdateClassTarget} />
                        }
                    ]}
                />
            </section>
        </div>
    );
};

const ClassTargetInput = React.memo(({ cls, onSave }: { cls: ClassRoom, onSave: (id: string, val: number) => Promise<void> }) => {
    const { t } = useLanguage();
    const [target, setTarget] = useState<string>(cls.target_score ? String(cls.target_score) : '');
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

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
        <div className="flex items-center gap-2 max-w-[180px]">
            <input 
                type="text" 
                value={formatNumberWithCommas(target)} 
                onChange={(e) => setTarget(parseFormattedNumber(e.target.value).toString())} 
                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 text-xs text-center font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                placeholder="0" 
            />
            <button 
                onClick={handleSave} 
                disabled={isSaving} 
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all active:scale-95 ${isSaved ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-indigo-500'}`}
            >
                {isSaving ? <RefreshIcon className="w-3 h-3 animate-spin" /> : isSaved ? <CheckIcon className="w-3 h-3" /> : <SaveIcon className="w-3 h-3" />}
            </button>
        </div>
    );
});

import React, { useState } from 'react';
import { AppSettings, ClassRoom, CompetitionGoal } from '../../types';
import { SaveIcon, CheckIcon, RefreshIcon, AlertIcon, TrophyIcon, UsersIcon } from '../ui/Icons';
import { GoalsManager as SharedGoalsManager } from './settings/GoalsManager';
import { AdminTable } from '../ui/AdminTable';
import { AdminSectionCard } from '../ui/AdminSectionCard';
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
        <div className="space-y-[var(--admin-section-gap)] w-full">
            <AdminSectionCard
                title={t('institutional_goals_title')}
                description={t('institutional_goals_desc')}
                icon={<TrophyIcon className="w-6 h-6" />}
            >
                <SharedGoalsManager
                    settings={settings}
                    onUpdateSettings={handleUpdateSettings}
                    totalScore={totalInstitutionScore}
                />
            </AdminSectionCard>

            <AdminSectionCard
                title={t('group_goals_title')}
                icon={<UsersIcon className="w-6 h-6" />}
            >
                <div className="space-y-8">
                    <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 p-4 rounded-xl flex items-center gap-3">
                        <AlertIcon className="w-5 h-5 text-blue-500 dark:text-blue-400 shrink-0" />
                        <p className="text-blue-700 dark:text-blue-300 text-xs font-bold leading-relaxed">
                            {t('teacher_can_update_warning')}
                        </p>
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
                                        <div className={`w-3 h-3 rounded-full ${cls.color} shadow-sm ring-2 ring-[var(--bg-card)]`}></div>
                                        <span className="font-bold text-[var(--text-main)]">{cls.name}</span>
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
                                                {/* dir="ltr" ensures visually we see: [Total] / [Current] as requested */}
                                                <span className="text-[var(--text-muted)] font-normal inline-flex gap-1 items-center" dir="ltr">
                                                    <FormattedNumber value={targetNum} />
                                                    <span>/</span>
                                                    <FormattedNumber value={currentScore} />
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-[var(--bg-surface)] rounded-full overflow-hidden">
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
                </div>
            </AdminSectionCard>
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
                className="w-full px-3 py-1.5 rounded-lg border border-[var(--border-main)] bg-[var(--bg-input)] text-xs text-center font-bold text-[var(--text-main)] outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm" 
                placeholder="0" 
            />
            <button 
                onClick={handleSave} 
                disabled={isSaving} 
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all active:scale-95 ${isSaved ? 'bg-green-600 text-white' : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-indigo-500 border border-[var(--border-main)]'}`}
            >
                {isSaving ? <RefreshIcon className="w-3 h-3 animate-spin" /> : isSaved ? <CheckIcon className="w-3 h-3" /> : <SaveIcon className="w-3 h-3" />}
            </button>
        </div>
    );
});

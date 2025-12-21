import React, { useState } from 'react';
import { AppSettings, ClassRoom, CompetitionGoal } from '../../types';
import { TargetIcon, SaveIcon, CheckIcon, RefreshIcon, TrophyIcon, AlertIcon } from '../ui/Icons';
import { GoalsManager as SharedGoalsManager } from './settings/GoalsManager';
import { FormattedNumber } from '../ui/FormattedNumber';
import { motion } from 'framer-motion';
import { useLanguage } from '../../hooks/useLanguage';

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
    const sortedClasses = [...classes].sort((a, b) => a.name.localeCompare(b.name, 'he'));

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-20 px-4">
            <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-900/20">
                    <TargetIcon className="w-7 h-7 text-white" />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-white">{t('goals_mgmt_title')}</h2>
                    <p className="text-slate-400 font-medium">{t('goals_mgmt_desc')}</p>
                </div>
            </div>

            <section className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-orange-500 rounded-full"></div>
                    <div>
                        <h3 className="text-2xl font-black text-white leading-none">{t('institutional_goals_title')}</h3>
                        <p className="text-slate-400 text-xs mt-1">{t('institutional_goals_desc')}</p>
                    </div>
                </div>

                <SharedGoalsManager
                    settings={settings}
                    onUpdateSettings={onUpdateSettings}
                    totalScore={totalInstitutionScore}
                />
            </section>

            <section className="space-y-6 pt-8 border-t border-white/10">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-blue-500 rounded-full"></div>
                        <h3 className="text-2xl font-black text-white">{t('group_goals_title')}</h3>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-xl flex items-center gap-3 rtl:mr-4 ltr:ml-4">
                        <AlertIcon className="w-5 h-5 text-blue-300 shrink-0" />
                        <p className="text-blue-200 text-sm font-bold">
                            {t('teacher_can_update_warning')}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedClasses.map(cls => (
                        <ClassTargetCard
                            key={cls.id}
                            cls={cls}
                            onSave={onUpdateClassTarget}
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
        <div className={`relative p-5 rounded-2xl border transition-all overflow-hidden flex flex-col gap-4 ${isCompleted ? 'bg-yellow-900/20 border-yellow-500/30' : 'bg-white/5 border-white/10'}`}>
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <h4 className="text-lg font-black text-white leading-tight">{cls.name}</h4>
                    <span className="text-xs text-slate-400 font-bold">{t('current_label')}: <FormattedNumber value={currentScore} /></span>
                </div>
                <div className={`w-3 h-3 rounded-full ${cls.color}`}></div>
            </div>
            <div className="relative z-10 flex-1 flex flex-col justify-center">
                {!hasTarget ? (
                    <div className="text-slate-500 text-[10px] font-bold bg-white/5 py-2 rounded-lg border border-dashed border-white/5 text-center">{t('no_target_set')}</div>
                ) : (
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-black">
                            <span className="text-blue-300">{Math.round(progress)}%</span>
                            <span className="text-slate-400">{t('missing_points_label')}: <FormattedNumber value={missingPoints} /></span>
                        </div>
                        <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                            <MotionDiv className="h-full bg-gradient-to-r from-blue-600 to-cyan-400" initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
                        </div>
                    </div>
                )}
            </div>
            <div className="mt-auto pt-3 border-t border-white/5">
                <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-xl border border-white/5">
                    <input type="number" value={target} onChange={(e) => setTarget(e.target.value)} className="flex-1 bg-transparent border-none text-white font-black text-sm text-center outline-none" placeholder={t('enter_target_placeholder')} />
                    <button onClick={handleSave} disabled={isSaving} className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSaved ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-500'} text-white transition-colors`}>
                        {isSaving ? <RefreshIcon className="w-4 h-4 animate-spin" /> : isSaved ? <CheckIcon className="w-4 h-4" /> : <SaveIcon className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
});

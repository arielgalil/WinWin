
import React, { useState, useMemo } from 'react';
import { CompetitionGoal, AppSettings } from '../../../types';
import { PlusIcon, RefreshIcon, EditIcon, CheckIcon, UploadIcon } from '../../ui/Icons';
import { DeleteButton } from '../../ui/DeleteButton';
import { formatNumberWithCommas, parseFormattedNumber } from '../../../utils/stringUtils';
import { supabase } from '../../../supabaseClient';
import { FormattedNumber } from '../../ui/FormattedNumber';
import { ConfirmationModal } from '../../ui/ConfirmationModal';
import { useLanguage } from '../../../hooks/useLanguage';

interface GoalsManagerProps {
    settings: AppSettings;
    onUpdateSettings: (newGoals: CompetitionGoal[], newGridSize: number) => Promise<void>;
    totalScore: number;
}

const GoalCard: React.FC<{ goal: CompetitionGoal; idx: number; totalScore: number; prevTarget: number; onEdit: () => void; onDelete: () => void; isEditing: boolean; }> = ({
    goal, idx, totalScore, prevTarget, onEdit, onDelete, isEditing
}) => {
    const { t } = useLanguage();
    const stageTotal = goal.target_score - prevTarget;
    const achievedInStage = Math.max(0, Math.min(totalScore, goal.target_score) - prevTarget);
    const percent = stageTotal > 0 ? Math.min(100, Math.max(0, (achievedInStage / stageTotal) * 100)) : 0;
    const isCompleted = totalScore >= goal.target_score;
    const isActive = !isCompleted && totalScore >= prevTarget;

    return (
        <div className={`relative flex flex-col gap-4 p-5 rounded-2xl border transition-all duration-300 group ${isEditing ? 'bg-indigo-600/20 border-indigo-400 ring-2 ring-indigo-400/30' : 'bg-white/5 border-white/10'}`}>
            <div className="flex justify-between items-start">
                <span className="text-[10px] font-black text-slate-400 bg-black/20 px-2 py-1 rounded border border-white/5 uppercase tracking-wider">{t('stage_label', { index: idx + 1 })}</span>
                <div className="flex gap-3 opacity-100 transition-opacity">
                    <DeleteButton onClick={onDelete} />
                    <button onClick={onEdit} className="p-3 min-w-[44px] min-h-[44px] bg-amber-600/20 hover:bg-amber-600 text-amber-400 hover:text-white rounded-lg transition-colors border border-amber-500/30 active:scale-95"><EditIcon className="w-5 h-5" /></button>
                </div>
            </div>
            <div className="flex flex-col items-center text-center gap-5">
                <div className="w-28 h-28 rounded-2xl flex items-center justify-center text-5xl bg-black/30 border border-white/10 shadow-xl overflow-hidden relative">
                    {goal.image_type === 'upload' ? <img src={goal.image_value} className="w-full h-full object-cover" /> : <span>{goal.image_value}</span>}
                    {isCompleted && <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center backdrop-blur-[1px]"><CheckIcon className="w-12 h-12 text-white drop-shadow-md" /></div>}
                </div>
                <div className="flex flex-col items-center">
                    <h4 className="font-black text-white text-xl leading-tight mb-2">{goal.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-indigo-300 font-black bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20" dir="ltr">
                        <FormattedNumber value={goal.target_score} />
                        <span className="opacity-40">←</span>
                        <FormattedNumber value={prevTarget} />
                    </div>
                </div>
            </div>
            <div className="mt-auto space-y-2">
                <div className="w-full bg-black/40 h-4 rounded-full overflow-hidden border border-white/5 shadow-inner">
                    <div className={`h-full transition-all duration-1000 ${isCompleted ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : isActive ? 'bg-yellow-400 shadow-[0_0_8px_#facc15]' : 'bg-slate-700'}`} style={{ width: `${percent}%` }} />
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-400 tracking-wide px-1">
                    <span>{t('stage_progress')}</span>
                    <span className={isActive ? 'text-yellow-400' : isCompleted ? 'text-green-400' : ''}>{Math.round(percent)}%</span>
                </div>
            </div>
        </div>
    );
};

export const GoalsManager: React.FC<GoalsManagerProps> = ({ settings, onUpdateSettings, totalScore }) => {
    const { t } = useLanguage();
    const [goals, setGoals] = useState<CompetitionGoal[]>(settings.goals_config || []);
    const [gridSize] = useState(settings.hex_grid_size || 30);
    const [formState, setFormState] = useState<Partial<CompetitionGoal>>({ name: '', target_score: undefined, image_type: 'emoji', image_value: '🏆' });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isGoalUploading, setIsGoalUploading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; title: string; message: string; isDanger: boolean; onConfirm: () => void; }>({ isOpen: false, title: '', message: '', isDanger: false, onConfirm: () => { } });

    const minScoreAllowed = useMemo(() => {
        if (editingId) {
            const idx = goals.findIndex(g => g.id === editingId);
            return idx > 0 ? goals[idx - 1].target_score : 0;
        }
        return goals.length > 0 ? goals[goals.length - 1].target_score : 0;
    }, [goals, editingId]);

    const handleGoalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !settings.campaign_id) return;
        setIsGoalUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `goal_${settings.campaign_id}_${Date.now()}.${fileExt}`;
            const { error: uploadErr } = await supabase.storage.from('campaign-logos').upload(fileName, file);
            if (uploadErr) throw uploadErr;
            const { data: { publicUrl } } = supabase.storage.from('campaign-logos').getPublicUrl(fileName);
            setFormState(prev => ({ ...prev, image_type: 'upload', image_value: publicUrl }));
        } catch (err) { alert(t('upload_error_label')); } finally { setIsGoalUploading(false); }
    };

    const handleSaveGoal = () => {
        setFormError(null);
        if (!formState.name || !formState.target_score) return;
        if (formState.image_type === 'emoji' && formState.image_value && [...formState.image_value].length > 1) {
            setFormError(t('emoji_only_error'));
            return;
        }
        if (formState.target_score <= minScoreAllowed) {
            setFormError(`היעד חייב להיות גבוה מהניקוד ההתחלתי (${formatNumberWithCommas(minScoreAllowed)})`);
            return;
        }
        let updated = [...goals];
        const newGoal: CompetitionGoal = {
            id: editingId || Math.random().toString(36).substr(2, 9),
            name: formState.name,
            target_score: Number(formState.target_score),
            image_type: formState.image_type || 'emoji',
            image_value: formState.image_value || '🏆'
        };

        if (editingId) updated = updated.map(g => g.id === editingId ? newGoal : g);
        else updated.push(newGoal);

        updated.sort((a, b) => a.target_score - b.target_score);
        setGoals(updated);
        onUpdateSettings(updated, gridSize);
        resetForm(updated);
    };

    const resetForm = (currentGoals = goals) => {
        setEditingId(null); setFormError(null);
        setFormState({ name: '', target_score: undefined, image_type: 'emoji', image_value: '🏆' });
    };

    const pointsNeeded = formState.target_score ? formState.target_score - minScoreAllowed : 0;

    return (
        <div className="space-y-6" dir="rtl">
            <ConfirmationModal isOpen={modalConfig.isOpen} title={modalConfig.title} message={modalConfig.message} onConfirm={modalConfig.onConfirm} onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {goals.map((goal, idx) => <GoalCard key={goal.id} goal={goal} idx={idx} totalScore={totalScore} prevTarget={idx > 0 ? goals[idx - 1].target_score : 0} onEdit={() => { setEditingId(goal.id); setFormState(goal); }} onDelete={() => setModalConfig({ isOpen: true, title: t('delete_stage_title'), message: t('confirm_delete_stage'), isDanger: true, onConfirm: () => { const up = goals.filter(g => g.id !== goal.id); setGoals(up); onUpdateSettings(up, gridSize); setModalConfig(prev => ({ ...prev, isOpen: false })); } })} isEditing={editingId === goal.id} />)}
            </div>

            <div className="bg-slate-900/50 p-8 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-md">
                <div className="grid grid-cols-[1.5fr_0.6fr_1fr_1.8fr] gap-x-6 gap-y-3 items-end">

                    {/* Row 1: Headers */}
                    <div className="text-indigo-400 font-black text-xl mb-1">
                        שלב {editingId ? (goals.findIndex(g => g.id === editingId) + 1) : (goals.length + 1)}:
                    </div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 mb-1">
                        התחלה:
                    </div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 mb-1">
                        ניקוד סיום*:
                    </div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 mb-1 text-center">
                        פרס סיום השלב (תמונה/אמוג'י)
                    </div>

                    {/* Row 2: Input Fields */}

                    {/* Col 1: Stage Name */}
                    <div className="flex flex-col gap-1.5 justify-end">
                        <input
                            type="text"
                            value={formState.name}
                            placeholder="שם השלב (למשל: המשימה הראשונה)*"
                            onChange={e => setFormState(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 transition-all focus:bg-slate-800"
                        />
                    </div>

                    {/* Col 2: Starting Score Display (Narrower, arrow moved outside) */}
                    <div className="flex items-center justify-between gap-4 h-[52px]">
                        <div className="bg-slate-800/40 rounded-xl px-3 py-2 border border-slate-700/50 flex items-center justify-center min-w-[70px]">
                            <span className="text-white/60 font-mono font-bold text-lg">{formatNumberWithCommas(minScoreAllowed)}</span>
                        </div>
                        <span className="text-indigo-400 font-black text-4xl drop-shadow-[0_0_10px_rgba(129,140,248,0.6)] animate-pulse">←</span>
                    </div>

                    {/* Col 3: Ending Score Input (Narrower) */}
                    <div className="relative">
                        <div className="flex items-center bg-slate-800 rounded-2xl px-4 py-2.5 border border-slate-700 focus-within:border-indigo-500 transition-all shadow-inner h-[52px]">
                            <input
                                type="text"
                                value={formState.target_score ? formatNumberWithCommas(formState.target_score) : ''}
                                placeholder="יעד..."
                                onChange={e => {
                                    const val = parseFormattedNumber(e.target.value);
                                    setFormState(prev => ({ ...prev, target_score: isNaN(val) ? undefined : val }));
                                }}
                                className="w-full bg-transparent text-white font-mono font-black text-xl outline-none placeholder:text-slate-600"
                            />
                        </div>

                        {/* Inline Feedback */}
                        <div className="absolute top-full right-0 w-full pt-1 z-10">
                            {formState.target_score && formState.target_score > minScoreAllowed && (
                                <div className="text-[10px] font-black text-indigo-400 whitespace-nowrap bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20 inline-flex gap-1 items-center" dir="rtl">
                                    <span>כלומר:</span>
                                    <span className="font-mono" dir="ltr">+{formatNumberWithCommas(pointsNeeded)}</span>
                                </div>
                            )}
                            {formState.target_score !== undefined && formState.target_score <= minScoreAllowed && (
                                <div className="text-[10px] font-black text-red-400 bg-red-950/30 px-2 py-0.5 rounded border border-red-500/20">
                                    נמוך מדי
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Col 4: Prize Selector (Wider, more space) */}
                    <div className="flex items-center gap-6 bg-white/5 rounded-2xl p-3 border border-white/5 shadow-inner h-[80px] justify-center">
                        <div className="w-16 h-16 bg-black/40 rounded-2xl border-2 border-indigo-500/30 flex items-center justify-center overflow-hidden shrink-0 shadow-2xl group-hover:border-indigo-500 transition-colors">
                            {formState.image_type === 'upload' && formState.image_value ? (
                                <img src={formState.image_value} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-4xl text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{formState.image_value || '🏆'}</span>
                            )}
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="flex bg-slate-800 rounded-xl p-1.5 border border-white/10 shadow-lg">
                                <button
                                    onClick={() => setFormState(prev => ({ ...prev, image_type: 'emoji' }))}
                                    className={`px-3 py-1 rounded-lg transition-all ${formState.image_type === 'emoji' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    <span className="text-sm">😊</span>
                                </button>
                                <label className={`px-3 py-1 rounded-lg cursor-pointer transition-all ${formState.image_type === 'upload' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>
                                    {isGoalUploading ? <RefreshIcon className="w-4 h-4 animate-spin" /> : <UploadIcon className="w-4 h-4" />}
                                    <input type="file" className="hidden" accept="image/*" onChange={handleGoalImageUpload} />
                                </label>
                            </div>
                            {formState.image_type === 'emoji' && (
                                <input
                                    type="text"
                                    value={formState.image_value}
                                    onChange={e => setFormState(prev => ({ ...prev, image_value: e.target.value }))}
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-2 py-1 text-center text-xs text-white outline-none focus:border-indigo-500"
                                    placeholder="אמוג'י..."
                                />
                            )}
                        </div>
                    </div>

                    {/* Row 3: Action Buttons */}
                    <div className="col-span-3" />
                    <div className="pt-6">
                        <button
                            onClick={handleSaveGoal}
                            disabled={!formState.name || !formState.target_score || formState.target_score <= minScoreAllowed}
                            className={`w-full py-4 rounded-2xl font-black text-lg text-white shadow-2xl transition-all active:scale-[0.98] whitespace-nowrap ${(!formState.name || !formState.target_score || formState.target_score <= minScoreAllowed)
                                    ? 'bg-slate-800 text-slate-600 opacity-50 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/40 hover:-translate-y-0.5'
                                }`}
                        >
                            {editingId ? 'עדכן פרטי שלב' : '🚀 הוסף שלב חדש'}
                        </button>
                        {editingId && (
                            <button onClick={() => resetForm()} className="w-full text-slate-500 hover:text-white transition-colors font-bold text-xs py-2 text-center">
                                ביטול עריכה
                            </button>
                        )}
                    </div>

                </div>

                {formError && (
                    <div className="mt-8 text-xs text-red-400 font-bold bg-red-900/20 p-3 rounded-xl border border-red-500/20 animate-in fade-in slide-in-from-top-1">
                        ⚠️ {formError}
                    </div>
                )}
            </div>
        </div>
    );
};

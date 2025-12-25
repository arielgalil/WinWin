import React, { useState, useMemo } from 'react';
import { CompetitionGoal, AppSettings } from '../../../types';
import { RefreshIcon, EditIcon, CheckIcon, UploadIcon, TrashIcon, TargetIcon, SparklesIcon } from '../../ui/Icons';
import { formatNumberWithCommas, parseFormattedNumber } from '../../../utils/stringUtils';
import { supabase } from '../../../supabaseClient';
import { FormattedNumber } from '../../ui/FormattedNumber';
import { ConfirmationModal } from '../../ui/ConfirmationModal';
import { useLanguage } from '../../../hooks/useLanguage';
import { useConfirmation } from '../../../hooks/useConfirmation';

interface GoalsManagerProps {
    settings: AppSettings;
    onUpdateSettings: (newGoals: CompetitionGoal[], newGridSize: number) => Promise<void>;
    totalScore: number;
}

const GoalCard: React.FC<{ goal: CompetitionGoal; idx: number; totalScore: number; prevTarget: number; onEdit: (e: React.MouseEvent) => void; onDelete: (e: React.MouseEvent) => void; isEditing: boolean; }> = ({
    goal, idx, totalScore, prevTarget, onEdit, onDelete, isEditing
}) => {
    const { t } = useLanguage();
    const stageTotal = goal.target_score - prevTarget;
    const achievedInStage = Math.max(0, Math.min(totalScore, goal.target_score) - prevTarget);
    const percent = stageTotal > 0 ? Math.min(100, Math.max(0, (achievedInStage / stageTotal) * 100)) : 0;
    const isCompleted = totalScore >= goal.target_score;
    const isActive = !isCompleted && totalScore >= prevTarget;

    return (
        <div className={`relative flex flex-col gap-3 p-4 rounded-xl border transition-all duration-300 group ${isEditing ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-400 ring-2 ring-indigo-400/30' : 'bg-white dark:bg-[#1e1e2e] border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md'}`}>
            <div className="flex justify-between items-center bg-gray-50 dark:bg-black/20 p-2 rounded-lg border border-gray-100 dark:border-white/5">
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('stage_label', { index: idx + 1 })}</span>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(e); }}
                        className="w-7 h-7 flex items-center justify-center bg-white dark:bg-white/5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-all border border-gray-200 dark:border-white/10"
                        title={t('delete_stage')}
                    >
                        <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(e); }}
                        className="w-7 h-7 flex items-center justify-center bg-white dark:bg-white/5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-md transition-all border border-gray-200 dark:border-white/10"
                        title={t('edit_stage_title')}
                    >
                        <EditIcon className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl bg-gray-100 dark:bg-black/20 border border-gray-200 dark:border-white/10 overflow-hidden relative shrink-0">
                    {goal.image_type === 'upload' ? <img src={goal.image_value} className="w-full h-full object-cover" /> : <span>{goal.image_value}</span>}
                    {isCompleted && <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center backdrop-blur-[1px]"><CheckIcon className="w-6 h-6 text-green-600 dark:text-green-400 drop-shadow-sm" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate leading-tight mb-1">{goal.name}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full w-fit" dir="ltr">
                        <FormattedNumber value={goal.target_score} />
                        <span className="opacity-40">←</span>
                        <FormattedNumber value={prevTarget} />
                    </div>
                </div>
            </div>

            <div className="space-y-1.5 pt-1">
                <div className="w-full bg-gray-100 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-1000 ${isCompleted ? 'bg-green-500' : isActive ? 'bg-amber-400' : 'bg-gray-400 dark:bg-gray-600'} opacity-90`} style={{ width: `${percent}%` }} />
                </div>
                <div className="flex justify-between text-[9px] font-bold text-gray-400 tracking-wide px-1">
                    <span>{t('stage_progress')}</span>
                    <span className={isActive ? 'text-amber-500' : isCompleted ? 'text-green-500' : ''}>{Math.round(percent)}%</span>
                </div>
            </div>
        </div>
    );
};

const quickEmojis = ['🏆', '🥇', '🥈', '🥉', '🎁', '💎', '🌟', '🎈', '🍦', '🍭'];

export const GoalsManager: React.FC<GoalsManagerProps> = ({ settings, onUpdateSettings, totalScore }) => {
    const { t } = useLanguage();
    const [goals, setGoals] = useState<CompetitionGoal[]>(settings.goals_config || []);
    const [gridSize] = useState(settings.hex_grid_size || 30);
    const [formState, setFormState] = useState<Partial<CompetitionGoal>>({ name: '', target_score: undefined, image_type: 'emoji', image_value: '🏆' });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isGoalUploading, setIsGoalUploading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [isEmojiModalOpen, setIsEmojiModalOpen] = useState(false);
    const { modalConfig, openConfirmation } = useConfirmation();

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

        if (formState.image_type === 'emoji' && formState.image_value) {
            const segmenter = typeof Intl !== 'undefined' && (Intl as any).Segmenter
                ? new (Intl as any).Segmenter()
                : null;
            const segments = segmenter ? [...segmenter.segment(formState.image_value)] : [...formState.image_value];
            if (segments.length > 2) {
                setFormError(t('emoji_only_error'));
                return;
            }
        }

        if (formState.target_score <= minScoreAllowed) {
            setFormError(t('goal_score_error', { minScore: formatNumberWithCommas(minScoreAllowed) }));
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

    const resetForm = () => {
        setEditingId(null); setFormError(null);
        setFormState({ name: '', target_score: undefined, image_type: 'emoji', image_value: '🏆' });
    };

    const pointsNeeded = formState.target_score ? formState.target_score - minScoreAllowed : 0;

    return (
        <div className="space-y-8" dir="rtl">
            <ConfirmationModal 
                isOpen={modalConfig.isOpen} 
                title={modalConfig.title} 
                message={modalConfig.message} 
                confirmText={modalConfig.confirmText}
                isDanger={modalConfig.isDanger}
                onConfirm={modalConfig.onConfirm} 
                onCancel={modalConfig.onCancel} 
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {goals.map((goal, idx) => (
                    <GoalCard 
                        key={goal.id} 
                        goal={goal} 
                        idx={idx} 
                        totalScore={totalScore} 
                        prevTarget={idx > 0 ? goals[idx - 1].target_score : 0} 
                        onEdit={() => { setEditingId(goal.id); setFormState(goal); }} 
                        onDelete={() => openConfirmation({ 
                            title: t('delete_stage'), 
                            message: t('confirm_delete_stage'), 
                            confirmText: t('delete_stage'),
                            isDanger: true, 
                            onConfirm: () => { 
                                const up = goals.filter(g => g.id !== goal.id); 
                                setGoals(up); 
                                onUpdateSettings(up, gridSize);
                            } 
                        })} 
                        isEditing={editingId === goal.id} 
                    />
                ))}
            </div>

            <div className="bg-gray-50 dark:bg-black/20 p-6 rounded-xl border border-gray-200 dark:border-white/10">
                <div className="flex items-center justify-between mb-6 border-b border-gray-200 dark:border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 text-indigo-500">
                            <TargetIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {editingId ? t('edit_goal_title') : t('add_goal_title')}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-wider">{t('define_stages_desc')}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-[0.85fr_0.68fr_0.68fr_2.04fr] gap-x-4 gap-y-2 items-start">

                    <label className="text-gray-500 dark:text-gray-400 font-bold text-[10px] uppercase tracking-wider whitespace-nowrap px-1">
                        {t('stage_name_label_with_index', { index: editingId ? (goals.findIndex(g => g.id === editingId) + 1) : (goals.length + 1) })}<span className="text-red-500 mr-0.5">*</span>:
                    </label>

                    <label className="text-gray-500 dark:text-gray-400 font-bold text-[10px] uppercase tracking-wider px-1">
                        {t('start_label')}:
                    </label>

                    <label className="text-gray-500 dark:text-gray-400 font-bold text-[10px] uppercase tracking-wider px-1">
                        {t('end_score_label')}<span className="text-red-500 mr-0.5">*</span>:
                    </label>

                    <label className="text-gray-500 dark:text-gray-400 font-bold text-[10px] uppercase tracking-wider px-1">
                        {t('end_prize_label')}:
                    </label>

                    {/* Row 2: Inputs */}
                    <div className="relative">
                        <input
                            type="text"
                            value={formState.name}
                            maxLength={30}
                            placeholder={t('stage_name_placeholder')}
                            onChange={e => setFormState(prev => ({ ...prev, name: e.target.value }))}
                            className={`w-full px-3 py-2 rounded-lg border bg-white dark:bg-white/5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${!formState.name ? 'border-red-300 dark:border-red-500/30' : 'border-gray-200 dark:border-white/10'}`}
                        />
                        <div className="absolute top-full right-0 left-0 pt-1 flex justify-between items-center px-1">
                            {!formState.name && (
                                <span className="text-[9px] font-bold text-red-400 flex items-center gap-1">
                                    <span>⚠️</span>
                                    <span>{t('required_field')}</span>
                                </span>
                            )}
                            <span className={`text-[9px] font-bold mr-auto ${(formState.name?.length || 0) >= 30 ? 'text-red-400' : 'text-gray-400'}`}>
                                {formState.name?.length || 0}/30
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 h-[38px]">
                        <div className="flex-1 flex items-center justify-center bg-white/50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 h-full overflow-hidden">
                            <span className="text-gray-600 dark:text-gray-300 font-mono font-bold text-sm truncate px-1">{formatNumberWithCommas(minScoreAllowed)}</span>
                        </div>
                        <span className="text-gray-400 font-black text-xl pb-0.5">←</span>
                    </div>

                    <div className="relative">
                        <div className={`flex items-center rounded-lg border transition-all h-[38px] bg-white dark:bg-white/5 ${formState.target_score !== undefined && formState.target_score <= minScoreAllowed ? 'border-red-300 dark:border-red-500/30' : 'border-gray-200 dark:border-white/10 focus-within:ring-2 focus-within:ring-indigo-500'}`}>
                            <input
                                type="text"
                                value={formState.target_score ? formatNumberWithCommas(formState.target_score) : ''}
                                placeholder={t('target_placeholder')}
                                onChange={e => {
                                    const val = parseFormattedNumber(e.target.value);
                                    setFormState(prev => ({ ...prev, target_score: isNaN(val) ? undefined : val }));
                                }}
                                className="flex-1 bg-transparent border-none text-gray-900 dark:text-white font-mono font-bold text-sm outline-none placeholder:text-gray-400 placeholder:text-xs placeholder:font-sans placeholder:font-normal text-center px-2 h-full w-full"
                            />
                        </div>
                        <div className="absolute top-full left-0 right-0 z-10 pt-1 flex flex-col items-start px-1">
                            {formState.target_score !== undefined && formState.target_score <= minScoreAllowed && (
                                <span className="text-[9px] font-bold text-red-400 flex items-center gap-1">
                                    <span>⚠️</span>
                                    <span>{t('score_too_low')}</span>
                                </span>
                            )}
                            {pointsNeeded > 0 && (
                                <div className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 whitespace-nowrap bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-500/20 inline-flex gap-0.5 items-center" dir="ltr">
                                    <span>{formatNumberWithCommas(pointsNeeded)}</span>
                                    <span>+</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-4 bg-white dark:bg-white/5 rounded-xl p-3 border border-gray-200 dark:border-white/10 min-h-[105px] items-stretch">
                        <div className="w-[80px] h-[80px] bg-gray-100 dark:bg-black/40 rounded-lg border border-gray-200 dark:border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative group self-center">
                            {formState.image_type === 'upload' && formState.image_value ? (
                                <img src={formState.image_value} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-4xl text-gray-800 dark:text-white">{formState.image_value || '🏆'}</span>
                            )}
                        </div>

                        <div className="flex flex-col justify-between flex-1 py-1">
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setFormState(prev => ({ ...prev, image_type: 'emoji' }));
                                    }}
                                    className="flex items-center gap-2 group cursor-pointer"
                                >
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${formState.image_type === 'emoji' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20' : 'border-gray-400'}`}>
                                        {formState.image_type === 'emoji' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                                    </div>
                                    <span className={`text-[10px] font-bold tracking-wider transition-colors ${formState.image_type === 'emoji' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`}>{t('emoji')}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setFormState(prev => ({ ...prev, image_type: 'upload' }));
                                    }}
                                    className="flex items-center gap-2 group cursor-pointer"
                                >
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${formState.image_type === 'upload' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20' : 'border-gray-400'}`}>
                                        {formState.image_type === 'upload' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                                    </div>
                                    <span className={`text-[10px] font-bold tracking-wider transition-colors ${formState.image_type === 'upload' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`}>{t('image')}</span>
                                </button>
                            </div>

                            {formState.image_type === 'emoji' ? (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setIsEmojiModalOpen(true);
                                    }}
                                    className="flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 px-3 py-2 rounded-lg text-[10px] font-bold transition-all active:scale-95 w-full mt-2"
                                >
                                    <span>{t('insert_emoji')}</span>
                                    <span className="text-sm">🍦</span>
                                </button>
                            ) : (
                                <label className="flex items-center justify-center gap-2 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer active:scale-95 w-full mt-2">
                                    {isGoalUploading ? <RefreshIcon className="w-3.5 h-3.5 animate-spin" /> : <UploadIcon className="w-3.5 h-3.5" />}
                                    <span>{isGoalUploading ? t('uploading') : t('upload_file')}</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleGoalImageUpload} disabled={isGoalUploading} />
                                </label>
                            )}
                        </div>
                    </div>

                    <div className="col-span-3 h-0" />
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={handleSaveGoal}
                            disabled={!formState.name || !formState.target_score || formState.target_score <= minScoreAllowed}
                            className={`w-full py-2.5 rounded-lg font-bold text-sm text-white transition-all active:scale-[0.98] whitespace-nowrap shadow-md ${(!formState.name || !formState.target_score || formState.target_score <= minScoreAllowed)
                                ? 'bg-gray-400 dark:bg-gray-700 opacity-50 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
                                }`}
                        >
                            {editingId ? t('update_stage_button') : t('add_stage_button')}
                        </button>
                        {editingId && (
                            <button type="button" onClick={() => resetForm()} className="w-full text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors font-bold text-[10px] py-1 text-center">
                                {t('cancel_edit')}
                            </button>
                        )}
                    </div>

                </div>

                {formError && (
                    <div className="mt-4 text-[10px] text-red-500 dark:text-red-400 font-bold bg-red-50 dark:bg-red-500/10 p-2 rounded-lg border border-red-200 dark:border-red-500/20 animate-in fade-in slide-in-from-top-1 text-center">
                        ⚠️ {formError}
                    </div>
                )}
            </div>

            {/* Emoji Selection Modal */}
            {isEmojiModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1e1e2e] border border-gray-200 dark:border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200" dir="rtl">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg">
                                    <SparklesIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                {t('prize_emoji_selection' as any)}
                            </h4>
                            <button type="button" onClick={(e) => { e.preventDefault(); setIsEmojiModalOpen(false); }} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-2xl">&times;</button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1">{t('enter_emoji_manual')}:</label>
                                <input
                                    type="text"
                                    value={formState.image_value}
                                    onChange={e => setFormState(prev => ({ ...prev, image_value: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-3xl text-center outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder={t('insert_emoji')}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1">{t('choose_quick_emoji')}:</label>
                                <div className="grid grid-cols-5 gap-2">
                                    {quickEmojis.map(emoji => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setFormState(prev => ({ ...prev, image_value: emoji }));
                                                setIsEmojiModalOpen(false);
                                            }}
                                            className={`text-2xl p-2 rounded-xl transition-all border ${formState.image_value === emoji ? 'bg-indigo-50 dark:bg-indigo-500/20 border-indigo-400' : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-gray-400 dark:hover:border-gray-500'}`}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsEmojiModalOpen(false);
                                }}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                            >
                                <span>{t('confirm_selection')}</span>
                                <CheckIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
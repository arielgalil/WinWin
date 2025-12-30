import React, { useState, useMemo } from 'react';
import { CompetitionGoal, AppSettings } from '../../../types';
import { RefreshIcon, EditIcon, CheckIcon, UploadIcon, TrashIcon, TargetIcon, SparklesIcon, XIcon } from '../../ui/Icons';
import { formatNumberWithCommas, parseFormattedNumber } from '../../../utils/stringUtils';
import { supabase } from '../../../supabaseClient';
import { FormattedNumber } from '../../ui/FormattedNumber';
import { ConfirmationModal } from '../../ui/ConfirmationModal';
import { useLanguage } from '../../../hooks/useLanguage';
import { useConfirmation } from '../../../hooks/useConfirmation';
import { EditModal } from '../../ui/EditModal';
import { AdminButton } from '../../ui/AdminButton';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { ImagePlaceholder } from '../../ui/ImagePlaceholder';

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
        <div className={`relative flex flex-col gap-3 p-4 rounded-xl border transition-all duration-300 group ${isEditing ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-400 ring-2 ring-indigo-400/30' : 'bg-[var(--bg-card)] border-[var(--border-main)] shadow-sm hover:shadow-md'}`}>
            <div className="flex justify-between items-center bg-[var(--bg-surface)] p-2 rounded-lg border border-[var(--border-subtle)]">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{t('stage_label', { index: idx + 1 })}</span>
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(e); }}
                        className="w-7 h-7 flex items-center justify-center bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-md transition-all border border-red-200 dark:border-red-500/20 shadow-sm"
                        title={t('delete_stage')}
                    >
                        <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(e); }}
                        className="w-7 h-7 flex items-center justify-center bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-500/20 rounded-md transition-all border border-green-200 dark:border-green-500/20 shadow-sm"
                        title={t('edit_stage_title')}
                    >
                        <EditIcon className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl bg-[var(--bg-surface)] border border-[var(--border-main)] overflow-hidden relative shrink-0">
                    {goal.image_type === 'upload' ? (
                        goal.image_value ? (
                            <img src={goal.image_value} className="w-full h-full object-cover" />
                        ) : (
                            <ImagePlaceholder className="scale-[0.4]" />
                        )
                    ) : (
                        <span>{goal.image_value}</span>
                    )}
                    {isCompleted && <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center backdrop-blur-[1px]"><CheckIcon className="w-6 h-6 text-green-600 dark:text-green-400 drop-shadow-sm" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[var(--text-main)] text-sm truncate leading-tight mb-1">{goal.name}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full w-fit" dir="ltr">
                        <FormattedNumber value={goal.target_score} />
                        <span className="opacity-40">←</span>
                        <FormattedNumber value={prevTarget} />
                    </div>
                </div>
            </div>

            <div className="space-y-1.5 pt-1">
                <div className="w-full bg-[var(--bg-surface)] h-3 rounded-full overflow-hidden border border-[var(--border-subtle)]">
                    <div className={`h-full transition-all duration-1000 ${isCompleted ? 'bg-green-500' : isActive ? 'bg-amber-400' : 'bg-gray-400 dark:bg-gray-600'} opacity-90`} style={{ width: `${percent}%` }} />
                </div>
                <div className="flex justify-between text-[9px] font-bold text-[var(--text-muted)] tracking-wide px-1">
                    <span>{t('stage_progress')}</span>
                    <span className={isActive ? 'text-amber-500' : isCompleted ? 'text-green-500' : ''}>{Math.round(percent)}%</span>
                </div>
            </div>
        </div>
    );
};

const quickEmojis = ['🏆', '🥇', '🥈', '🥉', '🎁', '💎', '🌟', '🎈', '🍦', '🍭'];

const EmojiPicker: React.FC<{
    value: string;
    onChange: (val: string) => void;
    trigger: React.ReactNode;
}> = ({ value, onChange, trigger }) => {
    const { t } = useLanguage();
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {trigger}
            </PopoverTrigger>
            <PopoverContent 
                className="w-72 p-4 bg-[var(--bg-card)] border-[var(--border-main)] shadow-2xl rounded-2xl z-[600]" 
                side="top" 
                align="center"
            >
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                        <SparklesIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        {t('prize_emoji_selection')}
                    </h4>
                    <button 
                        type="button" 
                        onClick={() => setOpen(false)} 
                        className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                    >
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-1">{t('enter_emoji_manual')}:</label>
                        <input
                            type="text"
                            value={value}
                            onChange={e => onChange(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-[var(--border-main)] bg-[var(--bg-surface)] text-2xl text-[var(--text-main)] text-center outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                            placeholder={t('insert_emoji')}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-1">{t('choose_quick_emoji')}:</label>
                        <div className="grid grid-cols-5 gap-2">
                            {quickEmojis.map(emoji => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onChange(emoji);
                                        setOpen(false);
                                    }}
                                    className={`text-xl p-1.5 rounded-xl transition-all border ${value === emoji ? 'bg-indigo-50 dark:bg-indigo-500/20 border-indigo-400' : 'bg-[var(--bg-surface)] border-[var(--border-main)] hover:border-gray-400 dark:hover:border-gray-500'}`}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>

                    <AdminButton
                        type="button"
                        onClick={() => setOpen(false)}
                        variant="primary"
                        size="sm"
                        className="w-full"
                    >
                        {t('confirm_selection')}
                    </AdminButton>
                </div>
            </PopoverContent>
        </Popover>
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
        setEditingId(null); 
        setFormError(null);
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
                        onEdit={() => { 
                            setEditingId(goal.id); 
                            setFormState(goal);
                        }} 
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

            <div className="bg-[var(--bg-card)] p-6 rounded-xl border border-[var(--border-main)] shadow-sm">
                <div className="flex items-center justify-between mb-6 border-b border-[var(--border-subtle)] pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-main)] text-indigo-500">
                            <TargetIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-[var(--text-main)]">
                                {t('add_goal_title')}
                            </h3>
                            <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-wider">{t('define_stages_desc')}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[0.85fr_0.68fr_0.68fr_2.04fr] gap-x-4 gap-y-6 items-start">

                    <div className="space-y-2">
                        <label className="text-[var(--text-main)] font-bold text-[10px] uppercase tracking-wider whitespace-nowrap px-1 block">
                            {t('stage_name_label_with_index', { index: goals.length + 1 })}<span className="text-red-500 mr-0.5">*</span>:
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={editingId ? '' : formState.name}
                                maxLength={30}
                                placeholder={t('stage_name_placeholder')}
                                onChange={e => setFormState(prev => ({ ...prev, name: e.target.value }))}
                                className={`w-full px-3 py-2 rounded-lg border bg-[var(--bg-input)] text-[var(--text-main)] text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm ${!formState.name && !editingId ? 'border-red-300 dark:border-red-500/30' : 'border-[var(--border-main)]'}`}
                            />
                            {!editingId && (
                                <div className="absolute top-full right-0 left-0 pt-1 flex justify-between items-center px-1">
                                    {!formState.name && (
                                        <span className="text-[9px] font-bold text-red-500 flex items-center gap-1">
                                            <span>⚠️</span>
                                            <span>{t('required_field')}</span>
                                        </span>
                                    )}
                                    <span className={`text-[9px] font-bold mr-auto ${(formState.name?.length || 0) >= 30 ? 'text-red-500' : 'text-[var(--text-muted)]'}`}>
                                        {formState.name?.length || 0}/30
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[var(--text-main)] font-bold text-[10px] uppercase tracking-wider px-1 block">
                            {t('start_label')}:
                        </label>
                        <div className="flex items-center gap-2 h-[38px]">
                            <div className="flex-1 flex items-center justify-center bg-[var(--bg-surface)] rounded-lg border border-[var(--border-main)] h-full overflow-hidden shadow-inner">
                                <span className="text-[var(--text-main)] font-mono font-bold text-sm truncate px-1">{formatNumberWithCommas(minScoreAllowed)}</span>
                            </div>
                            <span className="text-gray-400 font-black text-xl pb-0.5">←</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[var(--text-main)] font-bold text-[10px] uppercase tracking-wider px-1 block">
                            {t('end_score_label')}<span className="text-red-500 mr-0.5">*</span>:
                        </label>
                        <div className="relative">
                            <div className={`flex items-center rounded-lg border transition-all h-[38px] bg-[var(--bg-input)] shadow-sm ${formState.target_score !== undefined && formState.target_score <= minScoreAllowed ? 'border-red-300 dark:border-red-500/30' : 'border-[var(--border-main)] focus-within:ring-2 focus-within:ring-indigo-500'}`}>
                                <input
                                    type="text"
                                    dir="ltr"
                                    value={!editingId && formState.target_score ? formatNumberWithCommas(formState.target_score) : ''}
                                    placeholder={t('target_placeholder')}
                                    onChange={e => {
                                        const val = parseFormattedNumber(e.target.value);
                                        setFormState(prev => ({ ...prev, target_score: isNaN(val) ? undefined : val }));
                                    }}
                                    className="flex-1 bg-transparent border-none text-[var(--text-main)] font-mono font-bold text-sm outline-none placeholder:text-[var(--text-muted)] placeholder:text-xs placeholder:font-sans placeholder:font-normal text-center px-2 h-full w-full"
                                />
                            </div>
                            <div className="absolute top-full left-0 right-0 z-10 pt-1 flex flex-col items-start px-1">
                                {!editingId && formState.target_score !== undefined && formState.target_score <= minScoreAllowed && (
                                    <span className="text-[9px] font-bold text-red-400 flex items-center gap-1">
                                        <span>⚠️</span>
                                        <span>{t('score_too_low')}</span>
                                    </span>
                                )}
                                {!editingId && pointsNeeded > 0 && (
                                    <div className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 whitespace-nowrap bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-500/20 inline-flex gap-0.5 items-center" dir="ltr">
                                        <span>{formatNumberWithCommas(pointsNeeded)}</span>
                                        <span>+</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[var(--text-main)] font-bold text-[10px] uppercase tracking-wider px-1 block">
                            {t('end_prize_label')}:
                        </label>
                        <div className="flex flex-col sm:flex-row gap-4 bg-[var(--bg-surface)] rounded-xl p-3 border border-[var(--border-main)] min-h-[105px] items-stretch shadow-sm">
                            <div className="w-[80px] h-[80px] bg-[var(--bg-card)] rounded-lg border border-[var(--border-main)] flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative group mx-auto sm:mx-0">
                                {formState.image_type === 'upload' && !editingId ? (
                                    formState.image_value ? (
                                        <img src={formState.image_value} className="w-full h-full object-cover" />
                                    ) : (
                                        <ImagePlaceholder className="scale-75" />
                                    )
                                ) : (
                                    <span className="text-4xl text-[var(--text-main)]">{editingId ? '🏆' : (formState.image_value || '🏆')}</span>
                                )}
                            </div>

                            <div className="flex flex-col justify-between flex-1 py-1">
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        disabled={!!editingId}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setFormState(prev => ({ ...prev, image_type: 'emoji' }));
                                        }}
                                        className="flex items-center gap-2 group cursor-pointer disabled:opacity-50"
                                    >
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${!editingId && formState.image_type === 'emoji' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20' : 'border-[var(--border-main)]'}`}>
                                            {!editingId && formState.image_type === 'emoji' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                                        </div>
                                        <span className={`text-[10px] font-bold tracking-wider transition-colors ${!editingId && formState.image_type === 'emoji' ? 'text-indigo-600 dark:text-indigo-400' : 'text-[var(--text-muted)] group-hover:text-[var(--text-main)]'}`}>{t('emoji')}</span>
                                    </button>
                                    <button
                                        type="button"
                                        disabled={!!editingId}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setFormState(prev => ({ ...prev, image_type: 'upload' }));
                                        }}
                                        className="flex items-center gap-2 group cursor-pointer disabled:opacity-50"
                                    >
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${!editingId && formState.image_type === 'upload' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20' : 'border-[var(--border-main)]'}`}>
                                            {!editingId && formState.image_type === 'upload' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                                        </div>
                                        <span className={`text-[10px] font-bold tracking-wider transition-colors ${!editingId && formState.image_type === 'upload' ? 'text-indigo-600 dark:text-indigo-400' : 'text-[var(--text-muted)] group-hover:text-[var(--text-main)]'}`}>{t('image')}</span>
                                    </button>
                                </div>

                                {!editingId && (
                                    formState.image_type === 'emoji' ? (
                                        <EmojiPicker
                                            value={formState.image_value || ''}
                                            onChange={(val) => setFormState(prev => ({ ...prev, image_value: val }))}
                                            trigger={
                                                <button
                                                    type="button"
                                                    className="flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 px-3 py-2 rounded-lg text-[10px] font-bold transition-all active:scale-95 w-full mt-2"
                                                >
                                                    <span>{t('insert_emoji')}</span>
                                                    <span className="text-sm">✨</span>
                                                </button>
                                            }
                                        />
                                    ) : (
                                        <label className="flex items-center justify-center gap-2 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 px-3 py-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer active:scale-95 w-full mt-2">
                                            {isGoalUploading ? <RefreshIcon className="w-3.5 h-3.5 animate-spin" /> : <UploadIcon className="w-3.5 h-3.5" />}
                                            <span>{isGoalUploading ? t('uploading') : t('upload_file')}</span>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleGoalImageUpload} disabled={isGoalUploading} />
                                        </label>
                                    )
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-3 h-0 hidden md:block" />
                    <div className="flex flex-col gap-2 w-full md:mt-0 mt-4">
                        <AdminButton
                            onClick={handleSaveGoal}
                            disabled={editingId || !formState.name || !formState.target_score || formState.target_score <= minScoreAllowed}
                            variant="primary"
                            size="md"
                            className="w-full py-2.5"
                        >
                            {t('add_stage_button')}
                        </AdminButton>
                    </div>

                </div>

                {formError && !editingId && (
                    <div className="mt-4 text-[10px] text-red-500 dark:text-red-400 font-bold bg-red-50 dark:bg-red-500/10 p-2 rounded-lg border border-red-200 dark:border-red-500/20 animate-in fade-in slide-in-from-top-1 text-center">
                        ⚠️ {formError}
                    </div>
                )}
            </div>

            {/* Goal Edit Modal */}
            <EditModal
                isOpen={!!editingId}
                onClose={resetForm}
                title={t('edit_goal_title')}
            >
                <div className="space-y-6" dir="rtl">
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                            <label className="text-[var(--text-main)] font-bold text-[10px] uppercase tracking-wider px-1 block">
                                {t('stage_name_label')}<span className="text-red-500 mr-0.5">*</span>:
                            </label>
                            <input
                                type="text"
                                value={formState.name}
                                maxLength={30}
                                placeholder={t('stage_name_placeholder')}
                                onChange={e => setFormState(prev => ({ ...prev, name: e.target.value }))}
                                className={`w-full px-4 py-3 rounded-lg border bg-[var(--bg-input)] text-[var(--text-main)] text-base outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm ${!formState.name ? 'border-red-300 dark:border-red-500/30' : 'border-[var(--border-main)]'}`}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[var(--text-main)] font-bold text-[10px] uppercase tracking-wider px-1 block">
                                    {t('start_label')}:
                                </label>
                                <div className="flex items-center justify-center bg-[var(--bg-surface)] rounded-lg border border-[var(--border-main)] h-[46px] shadow-inner">
                                    <span className="text-[var(--text-main)] font-mono font-bold text-base">{formatNumberWithCommas(minScoreAllowed)}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[var(--text-main)] font-bold text-[10px] uppercase tracking-wider px-1 block">
                                    {t('end_score_label')}<span className="text-red-500 mr-0.5">*</span>:
                                </label>
                                <div className={`flex items-center rounded-lg border transition-all h-[46px] bg-[var(--bg-input)] shadow-sm ${formState.target_score !== undefined && formState.target_score <= minScoreAllowed ? 'border-red-300 dark:border-red-500/30' : 'border-[var(--border-main)] focus-within:ring-2 focus-within:ring-indigo-500'}`}>
                                    <input
                                        type="text"
                                        dir="ltr"
                                        value={formState.target_score ? formatNumberWithCommas(formState.target_score) : ''}
                                        placeholder={t('target_placeholder')}
                                        onChange={e => {
                                            const val = parseFormattedNumber(e.target.value);
                                            setFormState(prev => ({ ...prev, target_score: isNaN(val) ? undefined : val }));
                                        }}
                                        className="flex-1 bg-transparent border-none text-[var(--text-main)] font-mono font-bold text-base outline-none text-center px-2 h-full"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[var(--text-main)] font-bold text-[10px] uppercase tracking-wider px-1 block">
                                {t('end_prize_label')}:
                            </label>
                            <div className="flex gap-4 bg-[var(--bg-surface)] rounded-xl p-4 border border-[var(--border-main)] shadow-sm">
                                <div className="w-[100px] h-[100px] bg-[var(--bg-card)] rounded-lg border border-[var(--border-main)] flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative">
                                    {formState.image_type === 'upload' ? (
                                        formState.image_value ? (
                                            <img src={formState.image_value} className="w-full h-full object-cover" />
                                        ) : (
                                            <ImagePlaceholder className="scale-75" />
                                        )
                                    ) : (
                                        <span className="text-5xl">{formState.image_value || '🏆'}</span>
                                    )}
                                </div>

                                <div className="flex flex-col justify-center flex-1 gap-3">
                                    <div className="flex gap-4">
                                        <button type="button" onClick={() => setFormState(prev => ({ ...prev, image_type: 'emoji' }))} className="flex items-center gap-2">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formState.image_type === 'emoji' ? 'border-indigo-500' : 'border-[var(--border-main)]'}`}>
                                                {formState.image_type === 'emoji' && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                                            </div>
                                            <span className="text-xs font-bold">{t('emoji')}</span>
                                        </button>
                                        <button type="button" onClick={() => setFormState(prev => ({ ...prev, image_type: 'upload' }))} className="flex items-center gap-2">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formState.image_type === 'upload' ? 'border-indigo-500' : 'border-[var(--border-main)]'}`}>
                                                {formState.image_type === 'upload' && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                                            </div>
                                            <span className="text-xs font-bold">{t('image')}</span>
                                        </button>
                                    </div>

                                    {formState.image_type === 'emoji' ? (
                                        <EmojiPicker
                                            value={formState.image_value || ''}
                                            onChange={(val) => setFormState(prev => ({ ...prev, image_value: val }))}
                                            trigger={
                                                <button
                                                    type="button"
                                                    className="flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 w-full"
                                                >
                                                    <span>{t('insert_emoji')}</span>
                                                    <span className="text-sm">✨</span>
                                                </button>
                                            }
                                        />
                                    ) : (
                                        <label className="flex items-center justify-center gap-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all active:scale-95">
                                            <UploadIcon className="w-4 h-4" />
                                            <span>{t('upload_file')}</span>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleGoalImageUpload} />
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {formError && (
                        <div className="text-xs text-red-500 font-bold text-center">⚠️ {formError}</div>
                    )}

                    <div className="flex gap-3 pt-4 border-t border-[var(--border-subtle)]">
                        <AdminButton 
                            onClick={handleSaveGoal} 
                            disabled={!formState.name || !formState.target_score || formState.target_score <= minScoreAllowed}
                            variant="success" 
                            size="md" 
                            className="flex-1"
                        >
                            {t('save')}
                        </AdminButton>
                        <AdminButton type="button" variant="secondary" size="md" onClick={resetForm} className="flex-1">
                            {t('cancel')}
                        </AdminButton>
                    </div>
                </div>
            </EditModal>
        </div>
    );
};
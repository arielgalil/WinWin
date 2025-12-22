
import React, { useState, useEffect, useMemo } from 'react';
import { CompetitionGoal, AppSettings } from '../../../types';
import { TrophyIcon, TrashIcon, PlusIcon, RefreshIcon, EditIcon, CheckIcon, XIcon, LockIcon, UploadIcon, AlertIcon } from '../../ui/Icons';
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
                <div className="flex gap-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button onClick={onEdit} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"><EditIcon className="w-4 h-4" /></button>
                    <button onClick={onDelete} className="p-1.5 hover:bg-black/5 rounded-lg text-slate-500/20 hover:text-slate-500 transition-colors"><TrashIcon className="w-4 h-4" /></button>
                </div>
            </div>
            <div className="flex flex-col items-center text-center gap-5">
                <div className="w-28 h-28 rounded-2xl flex items-center justify-center text-5xl bg-black/30 border border-white/10 shadow-xl overflow-hidden relative">
                    {goal.image_type === 'upload' ? <img src={goal.image_value} className="w-full h-full object-cover" /> : <span>{goal.image_value}</span>}
                    {isCompleted && <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center backdrop-blur-[1px]"><CheckIcon className="w-12 h-12 text-white drop-shadow-md" /></div>}
                </div>
                <div className="flex flex-col items-center">
                    <h4 className="font-black text-white text-xl leading-tight mb-2">{goal.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-indigo-300 font-black bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20" dir="rtl">
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
    const [gridSize, setGridSize] = useState(settings.hex_grid_size || 30);
    const [formState, setFormState] = useState<Partial<CompetitionGoal>>({ name: '', target_score: 1000, image_type: 'emoji', image_value: '🏆' });
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
            setFormError(t('score_must_be_higher', { minScore: minScoreAllowed }));
            return;
        }
        let updated = [...goals];
        if (editingId) updated = updated.map(g => g.id === editingId ? { ...g, name: formState.name!, target_score: Number(formState.target_score), image_type: formState.image_type || 'emoji', image_value: formState.image_value || '🏆' } : g);
        else updated.push({ id: Math.random().toString(36).substr(2, 9), name: formState.name!, target_score: Number(formState.target_score), image_type: formState.image_type || 'emoji', image_value: formState.image_value || '🏆' });
        updated.sort((a, b) => a.target_score - b.target_score);
        setGoals(updated);
        onUpdateSettings(updated, gridSize);
        resetForm(updated);
    };

    const resetForm = (currentGoals = goals) => {
        setEditingId(null); setFormError(null);
        const max = currentGoals.length > 0 ? Math.max(...currentGoals.map(g => g.target_score)) : 0;
        setFormState({ name: '', target_score: max + 1000, image_type: 'emoji', image_value: '🏆' });
    };

    return (
        <div className="space-y-6">
            <ConfirmationModal isOpen={modalConfig.isOpen} title={modalConfig.title} message={modalConfig.message} isDanger={modalConfig.isDanger} onConfirm={modalConfig.onConfirm} onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {goals.map((goal, idx) => <GoalCard key={goal.id} goal={goal} idx={idx} totalScore={totalScore} prevTarget={idx > 0 ? goals[idx - 1].target_score : 0} onEdit={() => { setEditingId(goal.id); setFormState(goal); }} onDelete={() => setModalConfig({ isOpen: true, title: t('delete_stage_title'), message: t('confirm_delete_stage'), isDanger: true, onConfirm: () => { const up = goals.filter(g => g.id !== goal.id); setGoals(up); onUpdateSettings(up, gridSize); setModalConfig(prev => ({ ...prev, isOpen: false })); } })} isEditing={editingId === goal.id} />)}
            </div>
            <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/10 relative shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h4 className="font-black text-white flex items-center gap-2 text-lg">{editingId ? <EditIcon className="w-5 h-5 text-indigo-400" /> : <PlusIcon className="w-5 h-5 text-green-400" />} {editingId ? t('edit_stage_title') : t('add_stage_title')}</h4>
                    <div className="bg-indigo-500/10 px-4 py-2 rounded-xl border border-indigo-500/20 text-indigo-200 text-xs font-black shadow-inner">
                        <span className="opacity-60 ml-2 font-bold uppercase tracking-tighter text-sm">{t('current_institution_score')}</span>
                        <FormattedNumber value={totalScore} />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
                    <div className="md:col-span-4 space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{t('stage_name_label')}</label><input value={formState.name} onChange={e => setFormState({ ...formState, name: e.target.value })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 transition-colors shadow-inner" placeholder={t('stage_name_placeholder')} /></div>
                    <div className="md:col-span-3 space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{t('target_score_label')}</label><div className="flex flex-col gap-1"><div className="flex items-center gap-2"><input type="number" value={formState.target_score} onChange={e => setFormState({ ...formState, target_score: Number(e.target.value) })} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-mono text-center outline-none focus:border-indigo-500 transition-colors shadow-inner" /><span className="text-[10px] text-slate-500 font-bold shrink-0">{t('min_score_from', { score: minScoreAllowed.toLocaleString() })}</span></div></div></div>
                    <div className="md:col-span-5 flex gap-4"><div className="flex-1 space-y-1.5"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{t('stage_image_label')}</label><div className="flex gap-2"><div className="flex bg-slate-800 rounded-xl p-1 border border-slate-700 shadow-inner"><button onClick={() => setFormState({ ...formState, image_type: 'emoji' })} className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${formState.image_type === 'emoji' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>😊</button><button onClick={() => setFormState({ ...formState, image_type: 'upload' })} className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${formState.image_type === 'upload' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}><UploadIcon className="w-4 h-4" /></button></div><div className="flex-1">{formState.image_type === 'emoji' ? <input value={formState.image_value} onChange={e => setFormState({ ...formState, image_value: e.target.value })} className="w-full h-full bg-slate-800 border border-slate-700 rounded-xl px-4 text-center text-xl outline-none focus:border-indigo-500 transition-colors shadow-inner" /> : <label className="flex items-center justify-center w-full h-full bg-slate-800 border border-slate-700 rounded-xl cursor-pointer hover:bg-slate-700/50 transition-colors shadow-inner">{isGoalUploading ? <RefreshIcon className="w-5 h-5 animate-spin text-indigo-400" /> : <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{t('upload_file')}</span>}<input type="file" className="hidden" accept="image/*" onChange={handleGoalImageUpload} /></label>}</div></div></div><div className="w-12 h-12 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden self-end mb-0.5 shadow-lg">{formState.image_type === 'upload' && formState.image_value ? <img src={formState.image_value} className="w-full h-full object-cover" /> : <span className="text-2xl">{formState.image_value}</span>}</div></div>
                    <div className="md:col-span-12 mt-4">{formError && <div className="text-xs text-red-400 font-bold bg-red-900/20 p-2.5 rounded-xl border border-red-500/20 mb-3 animate-in fade-in slide-in-from-top-1">⚠️ {formError}</div>}<div className="flex gap-3"><button onClick={handleSaveGoal} disabled={!formState.name || !formState.target_score || isGoalUploading} className={`flex-1 py-4 rounded-xl font-black text-white shadow-xl transition-all active:scale-[0.98] ${(!formState.name || !formState.target_score) ? 'bg-slate-700 opacity-50' : 'bg-green-600 hover:bg-green-500'}`}>{editingId ? t('update_stage_details') : t('add_stage_to_list')}</button>{editingId && <button onClick={() => resetForm()} className="px-6 py-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold transition-all shadow-xl">{t('cancel')}</button>}</div></div>
                </div>
            </div>
        </div>
    );
};

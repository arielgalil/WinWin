import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { useToast } from '../../hooks/useToast';
import { useConfirmation } from '../../hooks/useConfirmation';
import { ClassRoom, AppSettings, ScorePreset } from '../../types';
import { RefreshIcon, XIcon, UploadIcon, StarIcon, SunIcon, MoonIcon, SaveIcon, MusicIcon, Volume2Icon, SparklesIcon } from '../ui/Icons';
import { supabase } from '../../supabaseClient';
import { FormattedNumber } from '../ui/FormattedNumber';
import { formatNumberWithCommas, parseFormattedNumber } from '../../utils/stringUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { useSaveNotification } from '../../contexts/SaveNotificationContext';
import { ConfirmationModal } from '../ui/ConfirmationModal';

const MotionDiv = motion.div as any;

interface SchoolSettingsProps {
    settings: AppSettings;
    classes?: ClassRoom[];
    onRefresh?: () => Promise<void>;
    totalScore: number;
    tickerMessages?: TickerMessage[];
    addTickerMessage?: (message: string) => Promise<void>;
    deleteTickerMessage?: (id: string) => Promise<void>;
    updateTickerMessage?: (id: string, updates: Partial<TickerMessage>) => Promise<void>;
}

export const SchoolSettings: React.FC<SchoolSettingsProps> = ({ settings, onRefresh, tickerMessages, addTickerMessage, deleteTickerMessage, updateTickerMessage }) => {
    const { t } = useLanguage();
    const { showToast } = useToast();
    const { triggerSave } = useSaveNotification();
    const { modalConfig, openConfirmation, closeConfirmation } = useConfirmation();
    
    const [formData, setFormData] = useState<Partial<AppSettings>>({
        min_points: -100,
        max_points: 1000,
        points_step: 5,
        background_brightness: 50,
        background_music_volume: 50,
        primary_color: '#4c1d95',
        secondary_color: '#0f172a',
        header_text_color_1: '#ffffff',
        header_text_color_2: '#ffffff',
        background_music_mode: 'loop'
    });
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const [newPresetLabel, setNewPresetLabel] = useState('');
    const [newPresetValue, setNewPresetValue] = useState('');

    // Sync props to state
    useEffect(() => {
        if (settings && Object.keys(settings).length > 0) {
            setFormData(settings);
            setHasChanges(false);
        }
    }, [settings]);

    const updateForm = (updates: Partial<AppSettings>) => {
        setFormData(prev => ({ ...prev, ...updates }));
        setHasChanges(true);
    };

    const handleSaveSettings = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (isSaving) return;

        const campaignId = settings.campaign_id || formData.campaign_id;

        if (!campaignId) {
            showToast(t('missing_campaign_id_error'), 'error');
            return;
        }

        setIsSaving(true);

        try {
            const payload = {
                campaign_id: campaignId,
                school_name: formData.school_name || '',
                competition_name: formData.competition_name || '',
                logo_url: formData.logo_url || null,
                primary_color: formData.primary_color || '#4c1d95',
                secondary_color: formData.secondary_color || '#0f172a',
                background_brightness: formData.background_brightness ?? 50,
                min_points: formData.min_points ?? -100,
                max_points: formData.max_points ?? 1000,
                points_step: formData.points_step ?? 5,
                header_text_color_1: formData.header_text_color_1 || '#ffffff',
                header_text_color_2: formData.header_text_color_2 || '#ffffff',
                score_presets: formData.score_presets || [],
                background_music_url: formData.background_music_url || null,
                background_music_mode: formData.background_music_mode || 'loop',
                background_music_volume: formData.background_music_volume ?? 50,
                language: formData.language || 'he',
                settings_updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('app_settings')
                .upsert(payload, { onConflict: 'campaign_id' });

            if (error) throw error;

            showToast(t('settings_saved_success'), 'success');
            setHasChanges(false);
            triggerSave('settings');

            if (onRefresh) {
                await onRefresh();
            }

        } catch (err: any) {
            console.error("Critical Save Error:", err);
            showToast(t('save_error', { message: err.message || t('run_sql_code_check') }), 'error');
        } finally {
            setIsSaving(false);
        }
    };


    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setUploadError(null);
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setUploadError(t('unsupported_file'));
            return;
        }
        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `logo_${settings.campaign_id}_${Date.now()}.${fileExt}`;
            const { error: uploadErr } = await supabase.storage.from('campaign-logos').upload(fileName, file);
            if (uploadErr) throw uploadErr;
            const { data: { publicUrl } } = supabase.storage.from('campaign-logos').getPublicUrl(fileName);
            updateForm({ logo_url: publicUrl });
        } catch (err: any) {
            setUploadError(t('upload_error', { message: err.message }));
        } finally {
            setIsUploading(false);
        }
    };

    const handleAddPreset = () => {
        if (!newPresetLabel || !newPresetValue) return;
        const val = parseInt(newPresetValue);
        if (isNaN(val)) return;
        const newPreset: ScorePreset = { label: newPresetLabel, value: val };
        const currentPresets = formData.score_presets || [];
        updateForm({ score_presets: [...currentPresets, newPreset] });
        setNewPresetLabel('');
        setNewPresetValue('');
    };

    const removePreset = (index: number) => {
        const currentPresets = formData.score_presets || [];
        const presetToRemove = currentPresets[index];
        
        openConfirmation({
            title: 'Delete Score Preset',
            message: `Are you sure you want to delete the preset "${presetToRemove?.label || ''}"?`,
            onConfirm: async () => {
                closeConfirmation();
                const updated = currentPresets.filter((_, i) => i !== index);
                updateForm({ score_presets: updated });
            }
        });
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-8">
            <form onSubmit={handleSaveSettings} className="space-y-6">
                {/* 1. פרטים ולוגו */}
                <div className="bg-white/5 p-6 rounded-[var(--radius-main)] border border-white/10 space-y-3 shadow-xl backdrop-blur-md">
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                         <StarIcon className="w-5 h-5 text-blue-400" /> {t('details_logo')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-slate-400 text-xs font-bold mb-1">{t('institution_name')}</label>
                            <input value={formData.school_name || ''} onChange={e => updateForm({ school_name: e.target.value })} className="w-full bg-slate-900/50 border border-white/10 rounded-[var(--radius-main)] p-3 text-white focus:border-blue-500/50 outline-none transition-all" />
                        </div>
                        <div>
                            <label className="block text-slate-400 text-xs font-bold mb-1">{t('competition_name_setting')}</label>
                            <input value={formData.competition_name || ''} onChange={e => updateForm({ competition_name: e.target.value })} className="w-full bg-slate-900/50 border border-white/10 rounded-[var(--radius-main)] p-3 text-white focus:border-blue-500/50 outline-none transition-all" />
                        </div>

                        <div>
                            <label className="block text-slate-400 text-xs font-bold mb-1">{t('language_setting')}</label>
                            <div className="flex bg-slate-900/50 p-1 rounded-[var(--radius-main)] border border-white/10">
                                <button
                                    type="button"
                                    onClick={() => updateForm({ language: 'he' })}
                                    className={`flex-1 py-2 rounded-[var(--radius-main)] text-xs font-bold transition-all ${formData.language !== 'en' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    {t('hebrew')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => updateForm({ language: 'en' })}
                                    className={`flex-1 py-2 rounded-[var(--radius-main)] text-xs font-bold transition-all ${formData.language === 'en' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    {t('english')}
                                </button>
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-slate-400 text-xs font-bold mb-1">{t('logo_upload')}</label>
                            <div className="flex gap-4 items-center">
                                <div className="flex-1 flex gap-2">
                                    <input value={formData.logo_url || ''} onChange={e => updateForm({ logo_url: e.target.value })} className="flex-1 bg-slate-900/50 border border-white/10 rounded-[var(--radius-main)] p-3 text-white dir-ltr text-xs focus:border-blue-500/50 outline-none transition-all" placeholder="https://..." />
                                    <label className="bg-slate-700 hover:bg-slate-600 px-4 rounded-[var(--radius-main)] flex items-center justify-center cursor-pointer transition-colors">
                                        {isUploading ? <RefreshIcon className="w-4 h-4 animate-spin text-white" /> : <UploadIcon className="w-4 h-4 text-white" />}
                                        <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={isUploading} />
                                    </label>
                                </div>
                                {formData.logo_url && (
                                    <div className="w-14 h-14 bg-white/10 rounded-[var(--radius-main)] p-1 border border-white/20 shrink-0">
                                        <img src={formData.logo_url} alt="Preview" className="w-full h-full object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                                    </div>
                                )}
                            </div>
                            {uploadError && <p className="text-red-400 text-xs mt-1 font-bold">{uploadError}</p>}
                        </div>
                    </div>
                </div>

                {/* 2. מוזיקה ואווירה */}
                <div className="bg-white/5 p-6 rounded-[var(--radius-main)] border border-white/10 space-y-6 shadow-xl backdrop-blur-md">
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                        <MusicIcon className="w-5 h-5 text-indigo-400" /> {t('music_atmosphere')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-5">
                            <div>
                                <label className="block text-slate-400 text-xs font-bold mb-1">{t('youtube_link')}</label>
                                <div className="relative">
                                    <input
                                        value={formData.background_music_url || ''}
                                        onChange={e => updateForm({ background_music_url: e.target.value })}
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-[var(--radius-main)] p-3 pr-10 text-white dir-ltr text-sm focus:border-blue-500/50 outline-none transition-all"
                                        placeholder="https://www.youtube.com/watch?v=..."
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                                        <MusicIcon className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-slate-400 text-xs font-bold mb-1">{t('playback_mode')}</label>
                                <div className="flex bg-slate-900/50 p-1 rounded-[var(--radius-main)] border border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => updateForm({ background_music_mode: 'loop' })}
                                        className={`flex-1 py-2 rounded-[var(--radius-main)] text-xs font-bold transition-all ${formData.background_music_mode === 'loop' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        {t('loop')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => updateForm({ background_music_mode: 'once' })}
                                        className={`flex-1 py-2 rounded-[var(--radius-main)] text-xs font-bold transition-all ${formData.background_music_mode === 'once' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        {t('once')}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="block text-slate-400 text-xs font-bold">{t('initial_volume')}</label>
                                    <span className="text-xs font-mono text-indigo-400">{formData.background_music_volume || 50}%</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Volume2Icon className="w-4 h-4 text-slate-500" />
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={formData.background_music_volume || 50}
                                        onChange={e => updateForm({ background_music_volume: Number(e.target.value) })}
                                        className="flex-1 h-1.5 bg-slate-700 rounded-[var(--radius-main)] appearance-none cursor-pointer accent-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="bg-indigo-500/5 rounded-[var(--radius-main)] p-5 border border-indigo-500/10 flex flex-col justify-center">
                            <h4 className="text-indigo-300 font-bold text-sm mb-2">{t('tip_atmosphere_title')}</h4>
                            <ul className="text-slate-400 text-[11px] leading-relaxed space-y-2 list-disc pr-4">
                                <li>{t('tip_lofi')}</li>
                                <li>{t('tip_playlist')}</li>
                                <li>{t('tip_mute')}</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* 3. עיצוב חזותי */}
                <div className="bg-white/5 p-6 rounded-[var(--radius-main)] border border-white/10 shadow-xl backdrop-blur-md">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-pink-400" /> {t('visual_design')}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-slate-400 text-xs font-bold mb-1">{t('primary_color_label')}</label>
                                <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded-[var(--radius-main)] border border-white/10">
                                    <input type="color" value={formData.primary_color || '#4c1d95'} onChange={e => updateForm({ primary_color: e.target.value })} className="w-10 h-10 rounded cursor-pointer bg-transparent border-none" />
                                    <span className="text-xs font-mono dir-ltr">{formData.primary_color}</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-slate-400 text-xs font-bold mb-1">{t('secondary_color_label')}</label>
                                <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded-[var(--radius-main)] border border-white/10">
                                    <input type="color" value={formData.secondary_color || '#0f172a'} onChange={e => updateForm({ secondary_color: e.target.value })} className="w-10 h-10 rounded cursor-pointer bg-transparent border-none" />
                                    <span className="text-xs font-mono dir-ltr">{formData.secondary_color}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900/50 rounded-[var(--radius-main)] p-4 border border-white/10 flex flex-col justify-center">
                            <label className="block text-slate-300 text-sm font-bold mb-4 flex items-center justify-between">
                                <span>{t('lighting_effect')}</span>
                                <span className="text-xs bg-white/10 px-2 py-0.5 rounded-[var(--radius-main)]">{formData.background_brightness || 50}%</span>
                            </label>

                            <div className="flex items-center gap-3">
                                <MoonIcon className="w-5 h-5 text-slate-500" />
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={formData.background_brightness || 50}
                                    onChange={e => updateForm({ background_brightness: Number(e.target.value) })}
                                    className="flex-1 h-2 bg-slate-700 rounded-[var(--radius-main)] appearance-none cursor-pointer accent-blue-500"
                                />
                                <SunIcon className="w-5 h-5 text-yellow-400" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                        <div>
                            <label className="block text-slate-400 text-xs font-bold mb-1">{t('header_color_1')}</label>
                            <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-[var(--radius-main)] border border-white/10">
                                <input type="color" value={formData.header_text_color_1 || '#ffffff'} onChange={e => updateForm({ header_text_color_1: e.target.value })} className="w-6 h-6 rounded cursor-pointer bg-transparent border-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-slate-400 text-xs font-bold mb-1">{t('header_color_2')}</label>
                            <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-[var(--radius-main)] border border-white/10">
                                <input type="color" value={formData.header_text_color_2 || '#ffffff'} onChange={e => updateForm({ header_text_color_2: e.target.value })} className="w-6 h-6 rounded cursor-pointer bg-transparent border-none" />
                            </div>
                        </div>
                 </div>
            </div>

            {/* Messages Management */}
            <div className="border-t border-white/5 pt-4">
                <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                    <SparklesIcon className="w-4 h-4" /> {t('tab_messages')}
                </h4>
                {/* <MessagesManager 
                    messages={tickerMessages} 
                    onAdd={addTickerMessage} 
                    onDelete={deleteTickerMessage} 
                    onUpdate={updateTickerMessage} 
                /> */}
            </div>

            {/* 4. הגדרות ניקוד */}
            <div className="bg-white/5 p-6 rounded-[var(--radius-main)] border border-white/10 space-y-6 shadow-xl backdrop-blur-md">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 text-pink-400" /> {t('visual_design')}
                </h3>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div>
                            <label className="block text-slate-400 text-[10px] font-bold mb-1">{t('min_points_label')}</label>
                            <input
                                type="text"
                                value={formatNumberWithCommas(formData.min_points ?? -100)}
                                onChange={e => updateForm({ min_points: parseFormattedNumber(e.target.value) || -100 })}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-[var(--radius-main)] p-2 text-white text-center font-bold outline-none focus:border-blue-500/50 transition-all"
                                dir="ltr"
                            />
                        </div>
                        <div>
                            <label className="block text-slate-400 text-[10px] font-bold mb-1">{t('max_points_label')}</label>
                            <input
                                type="text"
                                value={formatNumberWithCommas(formData.max_points ?? 1000)}
                                onChange={e => updateForm({ max_points: parseFormattedNumber(e.target.value) || 1000 })}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-[var(--radius-main)] p-2 text-white text-center font-bold outline-none focus:border-blue-500/50 transition-all"
                                dir="ltr"
                            />
                        </div>
                        <div>
                            <label className="block text-slate-400 text-[10px] font-bold mb-1">{t('points_step_label')}</label>
                            <input
                                type="text"
                                value={formatNumberWithCommas(formData.points_step ?? 5)}
                                onChange={e => updateForm({ points_step: parseFormattedNumber(e.target.value) || 5 })}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-[var(--radius-main)] p-2 text-white text-center font-bold outline-none focus:border-blue-500/50 transition-all"
                                dir="ltr"
                            />
                        </div>
                    </div>

                    <div className="mb-2">
                        <label className="block text-slate-400 text-xs font-bold mb-2">{t('existing_buttons')}</label>
                        <div className="flex flex-wrap gap-2 mb-6">
                            {(formData.score_presets || []).map((preset, idx) => (
                                <div key={idx} className="bg-slate-800 border border-white/10 rounded-[var(--radius-main)] px-3 py-1 flex items-center gap-2 shadow-sm">
                                    <span className="text-sm font-bold text-white">{preset.label}</span>
                                    <span className="text-xs bg-black/30 px-1.5 rounded-[var(--radius-main)] text-yellow-300 font-mono">
                                        <FormattedNumber value={preset.value} forceSign={true} />
                                    </span>
                                    <button type="button" onClick={() => removePreset(idx)} className="text-slate-500 hover:text-red-400 transition-colors"><XIcon className="w-3 h-3" /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-white/5 pt-4">
                        <h4 className="text-sm font-bold text-slate-300 mb-3">{t('add_new_button')}</h4>
                        <div className="flex gap-2 items-end bg-black/20 p-3 rounded-[var(--radius-main)] border border-white/5">
                            <div className="flex-1">
                                <label className="block text-slate-400 text-[10px] font-bold mb-1">{t('button_label')}</label>
                                <input value={newPresetLabel || ''} onChange={e => setNewPresetLabel(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 rounded-[var(--radius-main)] px-3 py-2 text-white text-sm outline-none focus:border-blue-500/50" placeholder="למשל: מבחן" />
                            </div>
                            <div className="w-24">
                                <label className="block text-slate-400 text-[10px] font-bold mb-1">{t('points')}</label>
                                <input
                                    type="text"
                                    value={formatNumberWithCommas(newPresetValue || '')}
                                    onChange={e => setNewPresetValue(parseFormattedNumber(e.target.value).toString())}
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-[var(--radius-main)] px-3 py-2 text-white text-sm font-bold text-center outline-none focus:border-blue-500/50"
                                    placeholder="10"
                                    dir="ltr"
                                />
                            </div>
                            <button type="button" onClick={handleAddPreset} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-[var(--radius-main)] font-bold text-sm h-[38px] flex items-center transition-all active:scale-95 shadow-lg">
                                {t('add')}
                            </button>
                        </div>
                    </div>
                </div>

            </form>

            {hasChanges && (
                <div className="fixed bottom-12 left-6 md:left-10 z-[200] w-auto pointer-events-none">
                    <AnimatePresence>
                        <MotionDiv
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 20, opacity: 0 }}
                            className="bg-slate-900/90 backdrop-blur-xl border border-white/20 p-2 rounded-[var(--radius-main)] shadow-2xl flex items-center gap-3 pointer-events-auto"
                        >
                            <div className="flex-1 px-3 whitespace-nowrap">
                                <span className="text-sm font-bold text-slate-300">{t('unsaved_changes')}</span>
                            </div>
                            <button
                                onClick={handleSaveSettings}
                                disabled={isSaving}
                                className="bg-green-600 hover:bg-green-600 text-white font-bold py-2.5 px-6 rounded-[var(--radius-main)] flex items-center gap-2 transition-all shadow-lg active:scale-95"
                            >
                                {isSaving ? <RefreshIcon className="w-4 h-4 animate-spin" /> : <SaveIcon className="w-4 h-4" />}
                                {isSaving ? t('saving') : t('save')}
                            </button>
                        </MotionDiv>
                    </AnimatePresence>
                </div>
            )}

            <ConfirmationModal 
                isOpen={modalConfig.isOpen} 
                title={modalConfig.title} 
                message={modalConfig.message} 
                onConfirm={modalConfig.onConfirm} 
                onCancel={() => closeConfirmation()} 
            />

        </div>
    );
};

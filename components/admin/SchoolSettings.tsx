import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { useToast } from '../../hooks/useToast';
import { useConfirmation } from '../../hooks/useConfirmation';
import { ClassRoom, AppSettings, ScorePreset, TickerMessage } from '../../types';
import { RefreshIcon, XIcon, UploadIcon, StarIcon, SunIcon, MoonIcon, SaveIcon, MusicIcon, Volume2Icon, SparklesIcon, PlusIcon } from '../ui/Icons';
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

export const SchoolSettings: React.FC<SchoolSettingsProps> = ({ settings, onRefresh }) => {
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
            title: t('delete_preset_title'),
            message: t('delete_preset_confirm', { label: presetToRemove?.label || '' }),
            isDanger: true,
            onConfirm: () => {
                const updated = currentPresets.filter((_, i) => i !== index);
                updateForm({ score_presets: updated });
            }
        });
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <form onSubmit={handleSaveSettings} className="space-y-8">
                <div className="bg-white dark:bg-[#1e1e2e] p-6 sm:p-8 rounded-[var(--radius-container)] border border-gray-200 dark:border-white/10 shadow-sm">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-[var(--radius-main)] text-indigo-600 dark:text-indigo-400">
                            <StarIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('details_logo')}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('basic_info_desc')}</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t('institution_name')}</label>
                            <input 
                                value={formData.school_name || ''} 
                                onChange={e => updateForm({ school_name: e.target.value })} 
                                className="w-full px-4 py-3 rounded-[var(--radius-main)] border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-sm font-medium" 
                                placeholder={t('school_name_placeholder')} 
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t('competition_name_setting')}</label>
                            <input 
                                value={formData.competition_name || ''} 
                                onChange={e => updateForm({ competition_name: e.target.value })} 
                                className="w-full px-4 py-3 rounded-[var(--radius-main)] border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-sm font-medium" 
                                placeholder={t('competition_name_placeholder')} 
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">{t('language_setting')}</label>
                            <div className="flex gap-4 p-1">
                                <button
                                    type="button"
                                    onClick={() => updateForm({ language: 'he' })}
                                    className={`flex items-center gap-3 px-4 py-2 rounded-[var(--radius-main)] border transition-all ${formData.language !== 'en' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                >
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.language !== 'en' ? 'border-indigo-500' : 'border-gray-400'}`}>
                                        {formData.language !== 'en' && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                                    </div>
                                    <span className="text-sm font-bold">{t('hebrew')}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => updateForm({ language: 'en' })}
                                    className={`flex items-center gap-3 px-4 py-2 rounded-[var(--radius-main)] border transition-all ${formData.language === 'en' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                                >
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.language === 'en' ? 'border-indigo-500' : 'border-gray-400'}`}>
                                        {formData.language === 'en' && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                                    </div>
                                    <span className="text-sm font-bold">{t('english')}</span>
                                </button>
                            </div>
                        </div>

                        <div className="md:col-span-2 pt-6 border-t border-gray-100 dark:border-white/5">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">{t('logo_upload')}</label>
                            <div className="flex flex-col sm:flex-row gap-6 items-start">
                                {formData.logo_url && (
                                    <div className="w-24 h-24 bg-gray-50 dark:bg-black/20 rounded-full p-2 border border-gray-200 dark:border-white/10 shrink-0 overflow-hidden shadow-sm flex items-center justify-center">
                                        <img src={formData.logo_url} alt="Preview" className="max-w-full max-h-full object-contain" />
                                    </div>
                                )}
                                <div className="flex-1 w-full space-y-4">
                                    <input
                                        value={formData.logo_url || ''}
                                        onChange={e => updateForm({ logo_url: e.target.value })}
                                        className="w-full px-4 py-3 rounded-[var(--radius-main)] border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-sm font-mono"
                                        placeholder="https://image-url.com/logo.png"
                                    />
                                    <div className="flex gap-3">
                                        <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-[var(--radius-main)] border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-white/10 transition-all text-sm">
                                            {isUploading ? <RefreshIcon className="w-4 h-4 animate-spin" /> : <UploadIcon className="w-4 h-4" />}
                                            {isUploading ? t('saving') : t('upload_file_button')}
                                            <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={isUploading} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                            {uploadError && <p className="text-red-500 text-xs mt-2 font-bold">{uploadError}</p>}
                        </div>
                    </div>
                </div>

                {/* 2. Music & Atmosphere */}
                <div className="bg-white dark:bg-[#1e1e2e] p-6 sm:p-8 rounded-[var(--radius-container)] border border-gray-200 dark:border-white/10 shadow-sm">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-purple-50 dark:bg-purple-500/10 rounded-[var(--radius-main)] text-purple-600 dark:text-purple-400">
                            <MusicIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('music_atmosphere')}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('music_settings_desc')}</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t('youtube_link')}</label>
                                    <input
                                        value={formData.background_music_url || ''}
                                        onChange={e => updateForm({ background_music_url: e.target.value })}
                                        className="w-full px-4 py-3 rounded-[var(--radius-main)] border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-sm ltr:text-left"
                                        placeholder={t('youtube_placeholder')}
                                    />
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-black/20 rounded-[var(--radius-main)] border border-gray-100 dark:border-white/5">
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('playback_mode')}</span>
                                    <div className="flex bg-gray-200 dark:bg-white/10 p-1 rounded-[var(--radius-main)]">
                                        <button
                                            type="button"
                                            onClick={() => updateForm({ background_music_mode: 'loop' })}
                                            className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${formData.background_music_mode === 'loop' ? 'bg-white dark:bg-[#3A3B3C] text-indigo-600 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                                        >
                                            {t('loop')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => updateForm({ background_music_mode: 'once' })}
                                            className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${formData.background_music_mode === 'once' ? 'bg-white dark:bg-[#3A3B3C] text-indigo-600 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                                        >
                                            {t('once')}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('initial_volume')}</label>
                                        <span className="text-xs font-bold text-indigo-600">{formData.background_music_volume || 50}%</span>
                                    </div>
                                    <div className="flex items-center gap-4 group bg-gray-50 dark:bg-black/20 p-4 rounded-[var(--radius-main)] border border-gray-100 dark:border-white/5">
                                        <Volume2Icon className="w-5 h-5 text-gray-400" />
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={formData.background_music_volume || 50}
                                            onChange={e => updateForm({ background_music_volume: Number(e.target.value) })}
                                            className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-indigo-600"
                                        />
                                    </div>
                                </div>
                                <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-[var(--radius-main)]">
                                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium leading-relaxed">
                                        {t('tip_atmosphere_desc')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Visual Design */}
                <div className="bg-white dark:bg-[#1e1e2e] p-6 sm:p-8 rounded-[var(--radius-container)] border border-gray-200 dark:border-white/10 shadow-sm">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-pink-50 dark:bg-pink-500/10 rounded-[var(--radius-main)] text-pink-600 dark:text-pink-400">
                            <SparklesIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('visual_design')}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('visual_design_desc')}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="p-6 bg-gray-50 dark:bg-black/20 rounded-[var(--radius-main)] border border-gray-100 dark:border-white/5 space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{t('brand_palette')}</h4>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-gray-500">{t('primary_color')}</label>
                                        <div className="flex items-center gap-3 bg-white dark:bg-white/5 p-2 rounded-[var(--radius-main)] border border-gray-200 dark:border-white/10 shadow-sm">
                                            <input type="color" value={formData.primary_color || '#1877F2'} onChange={e => updateForm({ primary_color: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-none bg-transparent" />
                                            <span className="text-[10px] font-mono font-bold uppercase text-gray-600 dark:text-gray-300">{formData.primary_color}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-gray-500">{t('secondary_color')}</label>
                                        <div className="flex items-center gap-3 bg-white dark:bg-white/5 p-2 rounded-[var(--radius-main)] border border-gray-200 dark:border-white/10 shadow-sm">
                                            <input type="color" value={formData.secondary_color || '#050505'} onChange={e => updateForm({ secondary_color: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-none bg-transparent" />
                                            <span className="text-[10px] font-mono font-bold uppercase text-gray-600 dark:text-gray-300">{formData.secondary_color}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('lighting_effect')}</label>
                                    <span className="text-xs font-bold text-indigo-600">{formData.background_brightness || 50}%</span>
                                </div>
                                <div className="flex items-center gap-4 bg-gray-50 dark:bg-black/20 p-4 rounded-[var(--radius-main)] border border-gray-100 dark:border-white/5">
                                    <MoonIcon className="w-4 h-4 text-gray-400" />
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={formData.background_brightness || 50}
                                        onChange={e => updateForm({ background_brightness: Number(e.target.value) })}
                                        className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-indigo-600"
                                    />
                                    <SunIcon className="w-4 h-4 text-amber-500" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="p-6 bg-gray-50 dark:bg-black/20 rounded-[var(--radius-main)] border border-gray-100 dark:border-white/5 space-y-4">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{t('typography_colors')}</h4>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-gray-500">{t('title_1_label')}</label>
                                        <div className="flex items-center gap-3 bg-white dark:bg-white/5 p-2 rounded-[var(--radius-main)] border border-gray-200 dark:border-white/10 shadow-sm">
                                            <input type="color" value={formData.header_text_color_1 || '#ffffff'} onChange={e => updateForm({ header_text_color_1: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-none bg-transparent" />
                                            <span className="text-[10px] font-mono font-bold uppercase text-gray-600 dark:text-gray-300">{formData.header_text_color_1}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase text-gray-500">{t('title_2_label')}</label>
                                        <div className="flex items-center gap-3 bg-white dark:bg-white/5 p-2 rounded-[var(--radius-main)] border border-gray-200 dark:border-white/10 shadow-sm">
                                            <input type="color" value={formData.header_text_color_2 || '#ffffff'} onChange={e => updateForm({ header_text_color_2: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-none bg-transparent" />
                                            <span className="text-[10px] font-mono font-bold uppercase text-gray-600 dark:text-gray-300">{formData.header_text_color_2}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-pink-50 dark:bg-pink-500/10 border border-pink-100 dark:border-pink-500/20 rounded-[var(--radius-main)]">
                                <p className="text-xs text-pink-600 dark:text-pink-400 font-medium leading-relaxed italic">
                                    {t('contrast_test_tip')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>


                {/* 4. Scoring Settings */}
                <div className="bg-white dark:bg-[#1e1e2e] p-6 sm:p-8 rounded-[var(--radius-container)] border border-gray-200 dark:border-white/10 shadow-sm">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-orange-50 dark:bg-orange-500/10 rounded-[var(--radius-main)] text-orange-600 dark:text-orange-400">
                            <StarIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('scoring_settings')}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('scoring_settings_desc')}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t('min_points_label')}</label>
                            <input
                                type="text"
                                value={formatNumberWithCommas(formData.min_points ?? -100)}
                                onChange={e => updateForm({ min_points: parseFormattedNumber(e.target.value) || -100 })}
                                className="w-full px-4 py-3 rounded-[var(--radius-main)] border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-sm font-bold text-center"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t('max_points_label')}</label>
                            <input
                                type="text"
                                value={formatNumberWithCommas(formData.max_points ?? 1000)}
                                onChange={e => updateForm({ max_points: parseFormattedNumber(e.target.value) || 1000 })}
                                className="w-full px-4 py-3 rounded-[var(--radius-main)] border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-sm font-bold text-center"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t('points_step_label')}</label>
                            <input
                                type="text"
                                value={formatNumberWithCommas(formData.points_step ?? 5)}
                                onChange={e => updateForm({ points_step: parseFormattedNumber(e.target.value) || 5 })}
                                className="w-full px-4 py-3 rounded-[var(--radius-main)] border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-sm font-bold text-center"
                            />
                        </div>
                    </div>

                    <div className="space-y-4 pt-6 mt-6 border-t border-gray-100 dark:border-white/5">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t('existing_buttons')}</label>
                        <div className="flex flex-wrap gap-3">
                            {(formData.score_presets || []).map((preset, idx) => (
                                <div key={idx} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-[var(--radius-main)] px-4 py-2 flex items-center gap-3 shadow-sm hover:border-indigo-500 transition-colors group">
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{preset.label}</span>
                                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-md">
                                        <FormattedNumber value={preset.value} forceSign={true} />
                                    </span>
                                    <button type="button" onClick={() => removePreset(idx)} className="text-gray-400 hover:text-red-500 transition-colors">
                                        <XIcon className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4 pt-6 mt-6 border-t border-gray-100 dark:border-white/5">
                        <h4 className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t('add_new_button')}</h4>
                        <div className="flex flex-col sm:flex-row gap-4 p-6 bg-gray-50 dark:bg-black/20 rounded-[var(--radius-main)] border border-gray-100 dark:border-white/5">
                            <div className="flex-1 space-y-1">
                                <label className="text-[10px] font-bold uppercase text-gray-400">{t('button_label')}</label>
                                <input value={newPresetLabel || ''} onChange={e => setNewPresetLabel(e.target.value)} className="w-full px-4 py-2.5 rounded-[var(--radius-main)] border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-sm" placeholder={t('button_label_placeholder')} />
                            </div>
                            <div className="sm:w-32 space-y-1">
                                <label className="text-[10px] font-bold uppercase text-gray-400 text-center block">{t('points')}</label>
                                <input
                                    type="text"
                                    value={formatNumberWithCommas(newPresetValue || '')}
                                    onChange={e => setNewPresetValue(parseFormattedNumber(e.target.value).toString())}
                                    className="w-full px-4 py-2.5 rounded-[var(--radius-main)] border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-sm font-bold text-center"
                                    placeholder="10"
                                />
                            </div>
                            <div className="sm:pt-5 pt-2 flex items-end">
                                <button type="button" onClick={handleAddPreset} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-[var(--radius-main)] transition-all active:scale-95 shadow-lg shadow-indigo-500/20 flex items-center gap-2 w-full sm:w-auto justify-center">
                                    <PlusIcon className="w-4 h-4" />
                                    {t('add')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </form>

            {hasChanges && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] max-w-md w-full px-4 animate-in slide-in-from-bottom-10">
                    <AnimatePresence>
                        <MotionDiv
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 20, opacity: 0 }}
                            className="bg-white dark:bg-[#25262b] text-gray-900 dark:text-white p-3 rounded-[var(--radius-main)] shadow-2xl flex items-center justify-between gap-4 border border-gray-200 dark:border-gray-700"
                        >
                            <span className="text-sm font-bold pl-2">{t('unsaved_changes')}</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setFormData(settings)}
                                    className="px-4 py-2 rounded-[var(--radius-main)] text-sm font-bold hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-gray-600 dark:text-gray-300"
                                >
                                    {t('cancel' as any)}
                                </button>
                                <button
                                    onClick={handleSaveSettings}
                                    disabled={isSaving}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-[var(--radius-main)] flex items-center gap-2 font-bold disabled:opacity-50 shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                                >
                                    {isSaving ? <RefreshIcon className="w-4 h-4 animate-spin" /> : <SaveIcon className="w-4 h-4" />}
                                    {isSaving ? t('saving') : t('save')}
                                </button>
                            </div>
                        </MotionDiv>
                    </AnimatePresence>
                </div>
            )}

            <ConfirmationModal {...modalConfig} />

        </div>
    );
};

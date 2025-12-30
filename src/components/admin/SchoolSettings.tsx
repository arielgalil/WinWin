import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { useToast } from '../../hooks/useToast';
import { useConfirmation } from '../../hooks/useConfirmation';
import { AppSettings, ScorePreset } from '../../types';
import { UploadIcon, SaveIcon, StarIcon, MusicIcon, Volume2Icon, SparklesIcon, MoonIcon, SunIcon, XIcon, PlusIcon, PlayIcon, PauseIcon } from '../ui/Icons';
import { supabase } from '../../supabaseClient';
import { FormattedNumber } from '../ui/FormattedNumber';
import { formatNumberWithCommas, parseFormattedNumber } from '../../utils/stringUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { useSaveNotification } from '../../contexts/SaveNotificationContext';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { AdminSectionCard } from '../ui/AdminSectionCard';
import { AdminButton } from '../ui/AdminButton';
import { BackgroundMusic } from '../dashboard/BackgroundMusic';
import { BrandingPreview } from './settings/BrandingPreview';
import { VisualDesignSection } from './settings/VisualDesignSection';

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
    const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const [newPresetLabel, setNewPresetLabel] = useState('');
    const [newPresetValue, setNewPresetValue] = useState('');

    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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
        setMessage(null);
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
        setMessage(null);

        try {
            if (!window.navigator.onLine) {
                showToast(t('sync_pending'), 'info');
            }

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

            setMessage({ type: 'success', text: t('settings_saved_success') });
            setHasChanges(false);
            triggerSave('settings');

            if (onRefresh) {
                await onRefresh();
            }
            setTimeout(() => setMessage(null), 3000);

        } catch (err: any) {
            console.error("Critical Save Error:", err);
            setMessage({ type: 'error', text: t('save_error', { message: err.message || t('run_sql_code_check') }) });
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
            if (!window.navigator.onLine) {
                showToast(t('sync_pending'), 'info');
            }
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
        <div className="max-w-6xl mx-auto space-y-8 pb-12 w-full">
            <form onSubmit={handleSaveSettings} className="space-y-8">
                <AdminSectionCard
                    title={t('details_logo')}
                    description={t('basic_info_desc')}
                    icon={<StarIcon className="w-6 h-6" />}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-1">
                            <label className="block text-[var(--fs-sm)] font-[var(--fw-bold)] text-[var(--text-muted)] uppercase tracking-wider mb-2">{t('institution_name')}</label>
                            <input 
                                value={formData.school_name || ''} 
                                onChange={e => updateForm({ school_name: e.target.value })} 
                                className="w-full px-4 py-3 rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-input)] text-[var(--text-main)] font-[var(--fw-medium)] focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-[var(--fs-base)] shadow-sm" 
                                placeholder={t('school_name_placeholder')} 
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-[var(--fs-sm)] font-[var(--fw-bold)] text-[var(--text-muted)] uppercase tracking-wider mb-2">{t('competition_name_setting')}</label>
                            <input 
                                value={formData.competition_name || ''} 
                                onChange={e => updateForm({ competition_name: e.target.value })} 
                                className="w-full px-4 py-3 rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-input)] text-[var(--text-main)] font-[var(--fw-bold)] focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-[var(--fs-base)] shadow-sm" 
                                placeholder={t('competition_name_placeholder')} 
                            />
                        </div>

                        <div>
                            <label className="block text-[var(--fs-sm)] font-[var(--fw-bold)] text-[var(--text-muted)] uppercase tracking-wider mb-3">{t('language_setting')}</label>
                            <div className="flex gap-4 p-1">
                                <button
                                    type="button"
                                    onClick={() => updateForm({ language: 'he' })}
                                    className={`flex-1 justify-center flex items-center gap-3 px-4 py-2 rounded-[var(--radius-main)] border transition-all ${formData.language !== 'en' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-900 dark:text-indigo-400 font-[var(--fw-bold)]' : 'border-[var(--border-main)] hover:bg-[var(--bg-hover)] text-[var(--text-main)]'}`}
                                >
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.language !== 'en' ? 'border-indigo-500' : 'border-[var(--text-muted)]'}`}>
                                        {formData.language !== 'en' && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                                    </div>
                                    <span className="text-[var(--fs-base)]">{t('hebrew')}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => updateForm({ language: 'en' })}
                                    className={`flex-1 justify-center flex items-center gap-3 px-4 py-2 rounded-[var(--radius-main)] border transition-all ${formData.language === 'en' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-900 dark:text-indigo-400' : 'border-[var(--border-main)] hover:bg-[var(--bg-hover)] text-[var(--text-main)]'}`}
                                >
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.language === 'en' ? 'border-indigo-500' : 'border-[var(--text-muted)]'}`}>
                                        {formData.language === 'en' && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                                    </div>
                                    <span className="text-[var(--fs-base)]">{t('english')}</span>
                                </button>
                            </div>
                        </div>

                        <div className="md:col-span-2 pt-6 border-t border-[var(--border-subtle)]">
                            <label className="block text-[var(--fs-sm)] font-[var(--fw-bold)] text-[var(--text-muted)] uppercase tracking-wider mb-3">{t('logo_upload')}</label>
                            <div className="flex flex-col sm:flex-row gap-6 items-start">
                                {formData.logo_url && (
                                    <div className="w-24 h-24 bg-[var(--bg-surface)] rounded-full p-2 border border-[var(--border-main)] shrink-0 overflow-hidden shadow-sm flex items-center justify-center">
                                        <img src={formData.logo_url} alt="Preview" className="max-w-full max-h-full object-contain" />
                                    </div>
                                )}
                                <div className="flex-1 w-full space-y-4">
                                    <input
                                        value={formData.logo_url || ''}
                                        onChange={e => updateForm({ logo_url: e.target.value })}
                                        className="w-full px-4 py-3 rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-input)] text-[var(--text-main)] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-[var(--fs-sm)] font-mono shadow-sm"
                                        placeholder={t('logo_upload_placeholder' as any)}
                                    />
                                    <div className="flex gap-3">
                                        <AdminButton
                                            type="button"
                                            variant="secondary"
                                            size="md"
                                            isLoading={isUploading}
                                            icon={<UploadIcon className="w-4 h-4" />}
                                            onClick={() => (document.getElementById('logo-upload-input') as HTMLInputElement)?.click()}
                                        >
                                            {t('upload_file_button')}
                                            <input 
                                                id="logo-upload-input"
                                                type="file" 
                                                className="hidden" 
                                                accept="image/*" 
                                                onChange={handleLogoUpload} 
                                                disabled={isUploading} 
                                            />
                                        </AdminButton>
                                    </div>
                                </div>
                            </div>
                            {uploadError && <p className="text-red-500 text-[var(--fs-xs)] mt-2 font-[var(--fw-bold)]">{uploadError}</p>}
                        </div>
                    </div>
                </AdminSectionCard>

                {/* 2. Music & Atmosphere */}
                <AdminSectionCard
                    title={t('music_atmosphere')}
                    description={t('music_settings_desc')}
                    icon={<MusicIcon className="w-6 h-6" />}
                >
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[var(--fs-sm)] font-[var(--fw-bold)] text-[var(--text-muted)] uppercase tracking-wider mb-2">{t('youtube_link')}</label>
                                    <div className="flex gap-2">
                                        <input
                                            value={formData.background_music_url || ''}
                                            onChange={e => updateForm({ background_music_url: e.target.value })}
                                            className="flex-1 px-4 py-3 rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-main)] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-[var(--fs-sm)] ltr:text-left shadow-inner"
                                            placeholder={t('youtube_placeholder')}
                                        />
                                        {formData.background_music_url && (
                                            <button
                                                type="button"
                                                onClick={() => setIsPreviewPlaying(!isPreviewPlaying)}
                                                className={`px-4 rounded-[var(--radius-main)] border transition-all flex items-center justify-center gap-2 ${isPreviewPlaying ? 'bg-amber-500 border-amber-600 text-white shadow-lg scale-105' : 'bg-[var(--bg-surface)] border-[var(--border-main)] text-[var(--text-main)] hover:bg-[var(--bg-hover)]'}`}
                                                title={isPreviewPlaying ? t('pause_preview' as any) : t('play_preview' as any)}
                                            >
                                                {isPreviewPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                                                <span className="text-[var(--fs-xs)] font-[var(--fw-bold)] uppercase hidden sm:inline">{isPreviewPlaying ? t('pause' as any) : t('preview' as any)}</span>
                                            </button>
                                        )}
                                    </div>
                                    <BackgroundMusic
                                        url={formData.background_music_url}
                                        mode={formData.background_music_mode}
                                        volume={formData.background_music_volume}
                                        isPlaying={isPreviewPlaying}
                                    />
                                </div>
                                <div className="flex items-center justify-between p-4 bg-[var(--bg-surface)] rounded-[var(--radius-main)] border border-[var(--border-subtle)] shadow-inner">
                                    <span className="text-[var(--fs-base)] font-[var(--fw-bold)] text-[var(--text-main)]">{t('playback_mode')}</span>
                                    <div className="flex bg-[var(--bg-card)] p-1 rounded-[var(--radius-main)] border border-[var(--border-subtle)] shadow-sm">
                                        <button
                                            type="button"
                                            onClick={() => updateForm({ background_music_mode: 'loop' })}
                                            className={`flex-1 px-4 py-1.5 rounded-md text-[var(--fs-xs)] font-[var(--fw-bold)] uppercase tracking-wider transition-all ${formData.background_music_mode === 'loop' ? 'bg-indigo-600 text-white shadow-md' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                                        >
                                            {t('loop')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => updateForm({ background_music_mode: 'once' })}
                                            className={`flex-1 px-4 py-1.5 rounded-md text-[var(--fs-xs)] font-[var(--fw-bold)] uppercase tracking-wider transition-all ${formData.background_music_mode === 'once' ? 'bg-indigo-600 text-white shadow-md' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                                        >
                                            {t('once')}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="block text-[var(--fs-sm)] font-[var(--fw-bold)] text-[var(--text-muted)] uppercase tracking-wider">{t('initial_volume')}</label>
                                        <span className="text-[var(--fs-sm)] font-[var(--fw-bold)] text-indigo-600">{formData.background_music_volume || 50}%</span>
                                    </div>
                                    <div className="flex items-center gap-4 group bg-[var(--bg-surface)] p-4 rounded-[var(--radius-main)] border border-[var(--border-subtle)] shadow-inner">
                                        <Volume2Icon className="w-5 h-5 text-[var(--text-muted)]" />
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={formData.background_music_volume || 50}
                                            onChange={e => updateForm({ background_music_volume: Number(e.target.value) })}
                                            className="flex-1 h-1.5 bg-[var(--bg-card)] rounded-full appearance-none cursor-pointer accent-indigo-600 border border-[var(--border-subtle)]"
                                        />
                                    </div>
                                </div>
                                <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-[var(--radius-main)]">
                                    <p className="text-[var(--fs-sm)] text-blue-600 dark:text-blue-400 font-[var(--fw-medium)] leading-relaxed">
                                        💡 <strong>{t('tip_atmosphere_title' as any)}</strong> {t('tip_atmosphere_desc' as any).replace('💡 **טיפ:**', '').replace(/\*\*/g, '').trim()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </AdminSectionCard>

                {/* 3. Visual Design */}
                <VisualDesignSection settings={formData} onUpdate={updateForm} />

                {/* 4. Scoring Settings */}
                <AdminSectionCard
                    title={t('scoring_settings')}
                    description={t('scoring_settings_desc')}
                    icon={<StarIcon className="w-6 h-6" />}
                >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                        <div className="space-y-1">
                            <label className="block text-[var(--fs-sm)] font-[var(--fw-bold)] text-[var(--text-muted)] uppercase tracking-wider mb-2 text-center">{t('min_points_label')}</label>
                            <input
                                type="text"
                                dir="ltr"
                                value={formatNumberWithCommas(formData.min_points ?? -100)}
                                onChange={e => updateForm({ min_points: parseFormattedNumber(e.target.value) || -100 })}
                                className="w-full px-4 py-3 rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-input)] text-[var(--text-main)] font-[var(--fw-bold)] text-center shadow-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-[var(--fs-sm)] font-[var(--fw-bold)] text-[var(--text-muted)] uppercase tracking-wider mb-2 text-center">{t('max_points_label')}</label>
                            <input
                                type="text"
                                dir="ltr"
                                value={formatNumberWithCommas(formData.max_points ?? 1000)}
                                onChange={e => updateForm({ max_points: parseFormattedNumber(e.target.value) || 1000 })}
                                className="w-full px-4 py-3 rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-input)] text-[var(--text-main)] font-[var(--fw-bold)] text-center shadow-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-[var(--fs-sm)] font-[var(--fw-bold)] text-[var(--text-muted)] uppercase tracking-wider mb-2 text-center">{t('points_step_label')}</label>
                            <input
                                type="text"
                                dir="ltr"
                                value={formatNumberWithCommas(formData.points_step ?? 5)}
                                onChange={e => updateForm({ points_step: parseFormattedNumber(e.target.value) || 5 })}
                                className="w-full px-4 py-3 rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-input)] text-[var(--text-main)] font-[var(--fw-bold)] text-center shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-4 pt-6 mt-6 border-t border-[var(--border-subtle)]">
                        <label className="block text-[var(--fs-sm)] font-[var(--fw-bold)] text-[var(--text-muted)] uppercase tracking-wider mb-2">{t('existing_buttons')}</label>
                        <div className="flex flex-wrap gap-3">
                            {(formData.score_presets || []).map((preset, idx) => (
                                <div key={idx} className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[var(--radius-main)] px-4 py-2 flex items-center gap-3 shadow-sm hover:border-indigo-500 transition-colors group">
                                    <span className="text-[var(--fs-base)] font-[var(--fw-bold)] text-[var(--text-main)]">{preset.label}</span>
                                    <span className="text-[var(--fs-sm)] text-indigo-700 dark:text-indigo-400 font-[var(--fw-bold)] px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-md">
                                        <FormattedNumber value={preset.value} forceSign={true} />
                                    </span>
                                    <button type="button" onClick={() => removePreset(idx)} className="text-[var(--text-muted)] hover:text-red-500 transition-colors p-1">
                                        <XIcon className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4 pt-6 mt-6 border-t border-[var(--border-subtle)]">
                        <h4 className="block text-[var(--fs-sm)] font-[var(--fw-bold)] text-[var(--text-muted)] uppercase tracking-wider mb-2">{t('add_new_button')}</h4>
                        <div className="flex flex-col sm:flex-row gap-4 p-6 bg-[var(--bg-surface)] rounded-[var(--radius-main)] border border-[var(--border-main)] shadow-inner">
                            <div className="flex-1 space-y-1">
                                <label className="text-[var(--fs-xs)] font-[var(--fw-bold)] uppercase text-[var(--text-muted)]">{t('button_label')}</label>
                                <input value={newPresetLabel || ''} onChange={e => setNewPresetLabel(e.target.value)} className="w-full px-4 py-2.5 rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-input)] text-[var(--text-main)] font-[var(--fw-bold)] focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-[var(--fs-base)] shadow-sm" placeholder={t('button_label_placeholder')} />
                            </div>
                            <div className="sm:w-32 space-y-1">
                                <label className="text-[var(--fs-xs)] font-[var(--fw-bold)] uppercase text-[var(--text-muted)] text-center block">{t('points')}</label>
                                <input
                                    type="text"
                                    value={formatNumberWithCommas(newPresetValue || '')}
                                    onChange={e => setNewPresetValue(parseFormattedNumber(e.target.value).toString())}
                                    className="w-full px-4 py-2.5 rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-input)] text-[var(--text-main)] font-[var(--fw-bold)] focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-[var(--fs-base)] text-center shadow-sm"
                                    placeholder="10"
                                />
                            </div>
                            <div className="sm:pt-5 pt-2 flex items-end">
                                <AdminButton
                                    type="button"
                                    variant="primary"
                                    size="md"
                                    onClick={handleAddPreset}
                                    icon={<PlusIcon className="w-4 h-4" />}
                                    className="w-full sm:w-auto"
                                >
                                    {t('add')}
                                </AdminButton>
                            </div>
                        </div>
                    </div>
                </AdminSectionCard>

            </form>

            {(hasChanges || message) && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] max-w-md w-full px-4 animate-in slide-in-from-bottom-10">
                    <AnimatePresence>
                        <MotionDiv
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 20, opacity: 0 }}
                            className="bg-[var(--bg-card)] text-[var(--text-main)] p-3 rounded-[var(--radius-main)] shadow-2xl flex items-center justify-between gap-4 border border-[var(--border-main)]"
                        >
                            <div className="flex-1 px-2">
                                {message ? (
                                    <span className={`text-[var(--fs-base)] font-[var(--fw-bold)] ${message.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {message.text}
                                    </span>
                                ) : (
                                    <span className="text-[var(--fs-base)] font-[var(--fw-bold)]">{t('unsaved_changes')}</span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                {!message && (
                                    <AdminButton
                                        variant="ghost"
                                        size="md"
                                        onClick={() => setFormData(settings)}
                                    >
                                        {t('cancel' as any)}
                                    </AdminButton>
                                )}
                                <AdminButton
                                    variant="primary"
                                    size="md"
                                    onClick={handleSaveSettings}
                                    isLoading={isSaving}
                                    icon={<SaveIcon className="w-4 h-4" />}
                                >
                                    {t('save')}
                                </AdminButton>
                            </div>
                        </MotionDiv>
                    </AnimatePresence>
                </div>
            )}

            <ConfirmationModal {...modalConfig} />

        </div>
    );
};
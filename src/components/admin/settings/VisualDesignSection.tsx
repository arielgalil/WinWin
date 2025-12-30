import React, { useState, useEffect, useCallback } from 'react';
import { AppSettings } from '../../../types';
import { useLanguage } from '../../../hooks/useLanguage';
import { AdminSectionCard } from '../../ui/AdminSectionCard';
import { SparklesIcon, MoonIcon, SunIcon } from '../../ui/Icons';
import { BrandingPreview } from './BrandingPreview';

interface VisualDesignSectionProps {
    settings: Partial<AppSettings>;
    onUpdate: (updates: Partial<AppSettings>) => void;
}

export const VisualDesignSection: React.FC<VisualDesignSectionProps> = ({ settings, onUpdate }) => {
    const { t } = useLanguage();
    
    // Local state for high-frequency updates (dragging)
    const [localState, setLocalState] = useState({
        primary_color: settings.primary_color || '#4c1d95',
        secondary_color: settings.secondary_color || '#0f172a',
        background_brightness: settings.background_brightness ?? 50,
        header_text_color_1: settings.header_text_color_1 || '#ffffff',
        header_text_color_2: settings.header_text_color_2 || '#ffffff'
    });

    // Sync from props if they change externally (e.g. on Reset)
    useEffect(() => {
        setLocalState({
            primary_color: settings.primary_color || '#4c1d95',
            secondary_color: settings.secondary_color || '#0f172a',
            background_brightness: settings.background_brightness ?? 50,
            header_text_color_1: settings.header_text_color_1 || '#ffffff',
            header_text_color_2: settings.header_text_color_2 || '#ffffff'
        });
    }, [
        settings.primary_color, 
        settings.secondary_color, 
        settings.background_brightness, 
        settings.header_text_color_1, 
        settings.header_text_color_2
    ]);

    // Handle high-frequency input (dragging)
    const handleInput = useCallback((updates: Partial<typeof localState>) => {
        setLocalState(prev => ({ ...prev, ...updates }));
        // Note: We DON'T call onUpdate here to avoid heavy parent re-renders
    }, []);

    // Handle change (end of drag / click) - sync to parent
    const handleChange = useCallback((updates: Partial<typeof localState>) => {
        setLocalState(prev => ({ ...prev, ...updates }));
        onUpdate(updates);
    }, [onUpdate]);

    return (
        <AdminSectionCard
            title={t('visual_design')}
            description={t('visual_design_desc')}
            icon={<SparklesIcon className="w-6 h-6" />}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 1. Live Preview - Now updates instantly from localState */}
                <div className="md:col-span-2">
                    <label className="block text-[var(--fs-sm)] font-[var(--fw-bold)] text-[var(--text-muted)] uppercase tracking-wider mb-4">{t('live_preview')}</label>
                    <BrandingPreview 
                        primaryColor={localState.primary_color}
                        secondaryColor={localState.secondary_color}
                        brightness={localState.background_brightness}
                        textColor1={localState.header_text_color_1}
                        textColor2={localState.header_text_color_2}
                        title={settings.competition_name || t('sample_title')}
                    />
                </div>
                
                <div className="space-y-6">
                    {/* Brand Palette */}
                    <div className="p-6 bg-[var(--bg-surface)] rounded-[var(--radius-main)] border border-[var(--border-subtle)] space-y-4 shadow-inner">
                        <h4 className="text-[var(--fs-xs)] font-[var(--fw-bold)] uppercase tracking-widest text-[var(--text-muted)] mb-2">{t('brand_palette')}</h4>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[var(--fs-xs)] font-[var(--fw-bold)] uppercase text-[var(--text-muted)]">{t('primary_color')}</label>
                                <div className="flex items-center gap-3 bg-[var(--bg-card)] p-2 rounded-[var(--radius-main)] border border-[var(--border-main)] shadow-sm">
                                    <input 
                                        type="color" 
                                        value={localState.primary_color} 
                                        onInput={e => handleInput({ primary_color: (e.target as HTMLInputElement).value })}
                                        onChange={e => handleChange({ primary_color: (e.target as HTMLInputElement).value })}
                                        className="w-8 h-8 rounded cursor-pointer border-none bg-transparent" 
                                    />
                                    <span className="text-[var(--fs-xs)] font-mono font-[var(--fw-bold)] uppercase text-[var(--text-main)]">{localState.primary_color}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[var(--fs-xs)] font-[var(--fw-bold)] uppercase text-[var(--text-muted)]">{t('secondary_color')}</label>
                                <div className="flex items-center gap-3 bg-[var(--bg-card)] p-2 rounded-[var(--radius-main)] border border-[var(--border-main)] shadow-sm">
                                    <input 
                                        type="color" 
                                        value={localState.secondary_color} 
                                        onInput={e => handleInput({ secondary_color: (e.target as HTMLInputElement).value })}
                                        onChange={e => handleChange({ secondary_color: (e.target as HTMLInputElement).value })}
                                        className="w-8 h-8 rounded cursor-pointer border-none bg-transparent" 
                                    />
                                    <span className="text-[var(--fs-xs)] font-mono font-[var(--fw-bold)] uppercase text-[var(--text-main)]">{localState.secondary_color}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lighting Effect */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <label className="block text-[var(--fs-sm)] font-[var(--fw-bold)] text-[var(--text-muted)] uppercase tracking-wider">{t('lighting_effect')}</label>
                            <span className="text-[var(--fs-sm)] font-[var(--fw-bold)] text-indigo-600">{localState.background_brightness}%</span>
                        </div>
                        <div className="flex items-center gap-4 bg-[var(--bg-surface)] p-4 rounded-[var(--radius-main)] border border-[var(--border-subtle)] shadow-inner">
                            <MoonIcon className="w-4 h-4 text-[var(--text-muted)]" />
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={localState.background_brightness}
                                onInput={e => handleInput({ background_brightness: Number((e.target as HTMLInputElement).value) })}
                                onChange={e => handleChange({ background_brightness: Number((e.target as HTMLInputElement).value) })}
                                className="flex-1 h-1.5 bg-[var(--bg-card)] rounded-full appearance-none cursor-pointer accent-indigo-600 border border-[var(--border-subtle)]"
                            />
                            <SunIcon className="w-4 h-4 text-amber-500" />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Typography Colors */}
                    <div className="p-6 bg-[var(--bg-surface)] rounded-[var(--radius-main)] border border-[var(--border-subtle)] space-y-4 shadow-inner">
                        <h4 className="text-[var(--fs-xs)] font-[var(--fw-bold)] uppercase tracking-widest text-[var(--text-muted)] mb-2">{t('typography_colors')}</h4>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[var(--fs-xs)] font-[var(--fw-bold)] uppercase text-[var(--text-muted)]">{t('title_1_label')}</label>
                                <div className="flex items-center gap-3 bg-[var(--bg-card)] p-2 rounded-[var(--radius-main)] border border-[var(--border-main)] shadow-sm">
                                    <input 
                                        type="color" 
                                        value={localState.header_text_color_1} 
                                        onInput={e => handleInput({ header_text_color_1: (e.target as HTMLInputElement).value })}
                                        onChange={e => handleChange({ header_text_color_1: (e.target as HTMLInputElement).value })}
                                        className="w-8 h-8 rounded cursor-pointer border-none bg-transparent" 
                                    />
                                    <span className="text-[var(--fs-xs)] font-mono font-[var(--fw-bold)] uppercase text-[var(--text-main)]">{localState.header_text_color_1}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[var(--fs-xs)] font-[var(--fw-bold)] uppercase text-[var(--text-muted)]">{t('title_2_label')}</label>
                                <div className="flex items-center gap-3 bg-[var(--bg-card)] p-2 rounded-[var(--radius-main)] border border-[var(--border-main)] shadow-sm">
                                    <input 
                                        type="color" 
                                        value={localState.header_text_color_2} 
                                        onInput={e => handleInput({ header_text_color_2: (e.target as HTMLInputElement).value })}
                                        onChange={e => handleChange({ header_text_color_2: (e.target as HTMLInputElement).value })}
                                        className="w-8 h-8 rounded cursor-pointer border-none bg-transparent" 
                                    />
                                    <span className="text-[var(--fs-xs)] font-mono font-[var(--fw-bold)] uppercase text-[var(--text-main)]">{localState.header_text_color_2}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-pink-50 dark:bg-pink-500/10 border border-pink-200 dark:border-pink-500/20 rounded-[var(--radius-main)]">
                        <p className="text-[var(--fs-sm)] text-pink-700 dark:text-pink-400 font-[var(--fw-medium)] leading-relaxed italic">
                            {t('contrast_test_tip')}
                        </p>
                    </div>
                </div>
            </div>
        </AdminSectionCard>
    );
};

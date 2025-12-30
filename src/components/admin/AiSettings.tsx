import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AppSettings } from '../../types';
import { SparklesIcon, SaveIcon, RefreshIcon, XIcon, PlusIcon, KeyIcon, CheckIcon, AlertIcon, ListIcon } from '../ui/Icons';
import { supabase } from '../../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { testGeminiConnection } from '../../services/geminiService';
import { useLanguage } from '../../hooks/useLanguage';
import { useConfirmation } from '../../hooks/useConfirmation';
import { useSaveNotification } from '../../contexts/SaveNotificationContext';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { AdminSectionCard } from '../ui/AdminSectionCard';

const MotionDiv = motion.div as any;

interface AiSettingsProps {
    settings: AppSettings;
    onRefresh?: () => Promise<void>;
}

export const AiSettings: React.FC<AiSettingsProps> = ({ settings, onRefresh }) => {
    const { t, language, isRTL } = useLanguage();
    const { triggerSave } = useSaveNotification();
    const { modalConfig, openConfirmation, closeConfirmation } = useConfirmation();

    const [customPrompt, setCustomPrompt] = useState('');
    const [keywords, setKeywords] = useState<string[]>([]);
    const [newKeyword, setNewKeyword] = useState('');
    const [geminiApiKey, setGeminiApiKey] = useState('');

    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean, message: string } | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        setCustomPrompt(settings.ai_custom_prompt || '');
        setKeywords(settings.ai_keywords || []);
        setGeminiApiKey(settings.gemini_api_key || '');
    }, [settings]);

    const defaultPrompt = t('ai_default_prompt_content' as any);

    const hasChanges = useMemo(() => {
        const initialPrompt = settings.ai_custom_prompt || '';
        const initialKeywords = settings.ai_keywords || [];
        const initialApiKey = settings.gemini_api_key || '';

        const promptChanged = customPrompt !== initialPrompt;
        const apiKeyChanged = geminiApiKey !== initialApiKey;
        const keywordsChanged = JSON.stringify([...keywords].sort()) !== JSON.stringify([...initialKeywords].sort());

        return promptChanged || keywordsChanged || apiKeyChanged;
    }, [customPrompt, keywords, geminiApiKey, settings]);

    const handleAddKeyword = (e: React.FormEvent) => {
        e.preventDefault();
        if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
            setKeywords([...keywords, newKeyword.trim()]);
            setNewKeyword('');
        }
    };

    const removeKeyword = (kw: string) => {
        openConfirmation({
            title: t('delete_keyword_title'),
            message: t('delete_keyword_confirm', { kw: kw }),
            isDanger: true,
            onConfirm: () => {
                setKeywords(keywords.filter(k => k !== kw));
            }
        });
    };

    const handleTestConnection = async () => {
        setIsTesting(true);
        setTestResult(null);
        const result = await testGeminiConnection(geminiApiKey, language);
        setTestResult(result);
        setIsTesting(false);
        setTimeout(() => setTestResult(null), 5000);
    };

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            const { error } = await supabase
                .from('app_settings')
                .update({
                    ai_custom_prompt: customPrompt || null,
                    ai_keywords: keywords,
                    gemini_api_key: geminiApiKey || null,
                    settings_updated_at: new Date().toISOString()
                })
                .eq('campaign_id', settings.campaign_id);

            if (error) throw error;
            triggerSave('settings'); // AI is part of settings
            setMessage({ type: 'success', text: t('ai_settings_saved') });
            if (onRefresh) await onRefresh();
            setTimeout(() => setMessage(null), 3000);
        } catch (err: any) {
            setMessage({ type: 'error', text: t('ai_settings_save_error', { error: err.message }) });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* API Configuration Card */}
            <AdminSectionCard
                title={t('ai_api_key_title')}
                description={t('ai_api_key_desc')}
                icon={<KeyIcon className="w-6 h-6" />}
                rightAction={
                    <div className="flex items-center gap-3">
                        {testResult && (
                            <div className={`text-[var(--fs-sm)] px-3 py-1.5 rounded-[var(--radius-main)] font-[var(--fw-bold)] flex items-center gap-2 animate-in fade-in ${testResult.success ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400'}`}>
                                {testResult.success ? <CheckIcon className="w-4 h-4" /> : <AlertIcon className="w-4 h-4" />}
                                {testResult.message}
                            </div>
                        )}
                        <button
                            onClick={handleTestConnection}
                            disabled={isTesting}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-[var(--fw-bold)] rounded-[var(--radius-main)] border border-blue-100 dark:border-blue-500/20 transition-all text-[var(--fs-sm)] disabled:opacity-50 active:scale-95 shadow-sm"
                        >
                            <RefreshIcon className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
                            <span>{t('ai_test_connection_button')}</span>
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !hasChanges}
                            className="flex items-center justify-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-[var(--fw-bold)] rounded-[var(--radius-main)] transition-all shadow-md shadow-indigo-500/20 text-[var(--fs-sm)] disabled:opacity-30 active:scale-95"
                        >
                            {isSaving ? <RefreshIcon className="w-4 h-4 animate-spin" /> : <SaveIcon className="w-4 h-4" />}
                            <span>{t('save')}</span>
                        </button>
                    </div>
                }
            >
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-[var(--fs-sm)] font-[var(--fw-bold)] text-[var(--text-muted)] uppercase tracking-wider mb-2">{t('ai_api_key_placeholder')}</label>
                        <div className="relative max-w-2xl">
                            <input
                                type="password"
                                value={geminiApiKey}
                                onChange={e => setGeminiApiKey(e.target.value)}
                                placeholder={t('ai_api_key_placeholder')}
                                className="w-full px-4 py-3 rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-input)] text-[var(--text-main)] focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-[var(--fs-sm)] font-mono ltr:pl-12 rtl:pr-12 shadow-sm"
                            />
                            <KeyIcon className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] opacity-50 pointer-events-none" />
                        </div>
                        <p className="text-[var(--fs-sm)] text-[var(--text-muted)] italic mt-2 opacity-70">{t('ai_test_connection_desc')}</p>
                    </div>
                </div>
            </AdminSectionCard>

            <AdminSectionCard
                title={t('ai_prompt_title')}
                description={t('ai_prompt_desc')}
                icon={<SparklesIcon className="w-6 h-6" />}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <label className="block text-[var(--fs-sm)] font-[var(--fw-bold)] text-[var(--text-muted)] uppercase tracking-wider">{t('ai_default_prompt_label')}</label>
                        <textarea
                            value={defaultPrompt}
                            disabled
                            className="w-full px-4 py-3 rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-surface)] text-[var(--text-muted)] text-[var(--fs-sm)] leading-relaxed resize-none font-[var(--fw-medium)] h-64 shadow-inner"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="block text-[var(--fs-sm)] font-[var(--fw-bold)] text-[var(--text-muted)] uppercase tracking-wider">{t('ai_custom_prompt_label')}</label>
                        <textarea
                            value={customPrompt}
                            onChange={e => setCustomPrompt(e.target.value)}
                            placeholder={t('ai_custom_prompt_placeholder')}
                            className="w-full px-4 py-3 rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-input)] text-[var(--text-main)] focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-[var(--fs-base)] leading-relaxed h-64 shadow-sm font-[var(--fw-medium)] placeholder:text-[var(--text-muted)] opacity-60"
                        />
                    </div>
                </div>
            </AdminSectionCard>

            <AdminSectionCard
                title={t('ai_keywords_title')}
                description={t('ai_keywords_desc')}
                icon={<ListIcon className="w-6 h-6" />}
            >
                <div className="space-y-6">
                    <form onSubmit={handleAddKeyword} className="flex gap-3">
                        <input
                            value={newKeyword}
                            onChange={e => setNewKeyword(e.target.value)}
                            placeholder={t('ai_keywords_placeholder')}
                            className="flex-1 px-4 py-3 rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-input)] text-[var(--text-main)] focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-[var(--fs-base)] font-[var(--fw-medium)] placeholder:text-[var(--text-muted)] opacity-60 shadow-sm"
                        />
                        <button type="submit" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-[var(--fw-bold)] rounded-[var(--radius-main)] transition-all shadow-md shadow-indigo-500/20 active:scale-95 flex items-center justify-center">
                            <PlusIcon className="w-5 h-5" />
                        </button>
                    </form>

                    <div className="flex flex-wrap gap-2.5 p-6 bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] min-h-[80px] shadow-inner">
                        {keywords.length === 0 ? (
                            <div className="w-full flex items-center justify-center text-[var(--text-muted)] text-[var(--fs-base)] italic py-2 font-[var(--fw-medium)]">
                                {t('ai_no_tags')}
                            </div>
                        ) : (
                            keywords.map((kw, idx) => (
                                <div key={idx} className="bg-[var(--bg-card)] text-[var(--text-main)] px-4 py-1.5 rounded-full flex items-center gap-3 text-[var(--fs-sm)] font-[var(--fw-bold)] border border-[var(--border-main)] shadow-sm animate-in zoom-in-95">
                                    <span>{kw}</span>
                                    <button onClick={() => removeKeyword(kw)} className="text-[var(--text-muted)] hover:text-red-600 transition-colors">
                                        <XIcon className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </AdminSectionCard>

            {createPortal(
                <AnimatePresence>
                    {(hasChanges || message) && (
                        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] max-w-md w-full px-4 animate-in slide-in-from-bottom-10 pointer-events-none">
                            <MotionDiv
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 20, opacity: 0 }}
                                className="bg-[var(--bg-card)] border border-[var(--border-main)] p-2 rounded-xl shadow-2xl flex items-center gap-4 pointer-events-auto w-full"
                            >
                                <div className="flex-1 px-4">
                                    {message ? (
                                        <span className={`text-[var(--fs-base)] font-[var(--fw-bold)] ${message.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {message.text}
                                        </span>
                                    ) : (
                                        <span className="text-[var(--fs-base)] font-[var(--fw-bold)] text-[var(--text-main)]">{t('changes_detected')}</span>
                                    )}
                                </div>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-[var(--fw-bold)] py-2.5 px-8 rounded-[var(--radius-main)] flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
                                >
                                    {isSaving ? <RefreshIcon className="w-4 h-4 animate-spin" /> : <SaveIcon className="w-4 h-4" />}
                                    {isSaving ? t('saving') : t('save')}
                                </button>
                            </MotionDiv>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            <ConfirmationModal {...modalConfig} />

        </div>
    );
};

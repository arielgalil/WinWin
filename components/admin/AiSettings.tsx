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

const MotionDiv = motion.div as any;

interface AiSettingsProps {
    settings: AppSettings;
    onRefresh?: () => Promise<void>;
}

const DEFAULT_PROMPT = `
אתה מנטור חינוכי נלהב המלווה מבצע בית-ספרי.
      
נתוני המצב בזמן אמת:
1. פעולה אחרונה: [פעולה].
2. מובילי הטבלה: [מובילים].
3. יעד משותף (Mission Control): [יעד]
4. מצב יעדים כיתתיים: [כיתות]

המטרה: לעודד "קנאת סופרים תרבה חוכמה" (תחרות בונה) ולהתייחס למצב היעד המשותף או הכיתתי אם רלוונטי.
כתוב משפט קצר (עד 15 מילים), אנרגטי ומפרגן בעברית.

הנחיות קריטיות:
1. אם אנחנו קרובים ליעד המשותף, תזכיר את זה בהתלהבות!
2. אם כיתה השיגה יעד, פרגן לה.
3. השתמש בשפה של "בנייה", "טיפוס", "צמיחה", "שותפות", "יחד", "התקדמות", "השראה" ועוד.
4. הימנע משפה אלימה/כוחנית.
5. תהיה שנון וקליל.
`;

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
            title: 'Delete Keyword',
            message: `Are you sure you want to delete the keyword "${kw}"?`,
            onConfirm: () => {
                closeConfirmation();
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
            <div className="bg-white dark:bg-[#1e1e2e] p-6 sm:p-8 rounded-[var(--radius-container)] border border-gray-200 dark:border-white/10 shadow-sm space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 dark:border-white/5 pb-6 gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                            <KeyIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{t('ai_api_key_title')}</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('ai_api_key_desc')}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {testResult && (
                            <div className={`text-xs px-3 py-1.5 rounded-[var(--radius-main)] font-bold flex items-center gap-2 animate-in fade-in ${testResult.success ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400'}`}>
                                {testResult.success ? <CheckIcon className="w-4 h-4" /> : <AlertIcon className="w-4 h-4" />}
                                {testResult.message}
                            </div>
                        )}
                        <button
                            onClick={handleTestConnection}
                            disabled={isTesting}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold rounded-[var(--radius-main)] border border-blue-100 dark:border-blue-500/20 transition-all text-sm disabled:opacity-50 active:scale-95"
                        >
                            <RefreshIcon className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
                            <span>{t('ai_test_connection_button')}</span>
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !hasChanges}
                            className="flex items-center justify-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-[var(--radius-main)] transition-all shadow-md shadow-indigo-500/20 text-sm disabled:opacity-30 active:scale-95"
                        >
                            {isSaving ? <RefreshIcon className="w-4 h-4 animate-spin" /> : <SaveIcon className="w-4 h-4" />}
                            <span>{t('save')}</span>
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t('ai_api_key_placeholder')}</label>
                        <div className="relative max-w-2xl">
                            <input
                                type="password"
                                value={geminiApiKey}
                                onChange={e => setGeminiApiKey(e.target.value)}
                                placeholder={t('ai_api_key_placeholder')}
                                className="w-full px-4 py-3 rounded-[var(--radius-main)] border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-sm font-mono ltr:pl-12 rtl:pr-12"
                            />
                            <KeyIcon className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 italic mt-2">{t('ai_test_connection_desc')}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#1e1e2e] p-6 sm:p-8 rounded-[var(--radius-container)] border border-gray-200 dark:border-white/10 shadow-sm space-y-8">
                <div className="flex items-center gap-4 border-b border-gray-100 dark:border-white/5 pb-6">
                    <div className="p-3 bg-pink-50 dark:bg-pink-500/10 rounded-xl border border-pink-100 dark:border-pink-500/20">
                        <SparklesIcon className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{t('ai_prompt_title')}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('ai_prompt_desc')}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('ai_default_prompt_label')}</label>
                        <textarea
                            value={DEFAULT_PROMPT}
                            disabled
                            className="w-full px-4 py-3 rounded-[var(--radius-main)] border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-xs leading-relaxed resize-none font-medium h-64 text-gray-400 dark:text-gray-500"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('ai_custom_prompt_label')}</label>
                        <textarea
                            value={customPrompt}
                            onChange={e => setCustomPrompt(e.target.value)}
                            placeholder={t('ai_custom_prompt_placeholder')}
                            className="w-full px-4 py-3 rounded-[var(--radius-main)] border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-sm leading-relaxed h-64 shadow-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#1e1e2e] p-6 sm:p-8 rounded-[var(--radius-container)] border border-gray-200 dark:border-white/10 shadow-sm space-y-8">
                <div className="flex items-center gap-4 border-b border-gray-100 dark:border-white/5 pb-6">
                    <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-500/20">
                        <ListIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{t('ai_keywords_title')}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('ai_keywords_desc')}</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <form onSubmit={handleAddKeyword} className="flex gap-3">
                        <input
                            value={newKeyword}
                            onChange={e => setNewKeyword(e.target.value)}
                            placeholder={t('ai_keywords_placeholder')}
                            className="flex-1 px-4 py-3 rounded-[var(--radius-main)] border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-sm"
                        />
                        <button type="submit" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-[var(--radius-main)] transition-all shadow-md shadow-indigo-500/20 active:scale-95">
                            <PlusIcon className="w-5 h-5" />
                        </button>
                    </form>

                    <div className="flex flex-wrap gap-2.5 p-6 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-100 dark:border-white/5 min-h-[80px]">
                        {keywords.length === 0 ? (
                            <div className="w-full flex items-center justify-center text-gray-400 text-sm italic py-2">
                                {t('ai_no_tags')}
                            </div>
                        ) : (
                            keywords.map((kw, idx) => (
                                <div key={idx} className="bg-white dark:bg-white/10 text-gray-700 dark:text-gray-200 px-4 py-1.5 rounded-full flex items-center gap-3 text-xs font-bold border border-gray-200 dark:border-white/10 shadow-sm animate-in zoom-in-95">
                                    <span>{kw}</span>
                                    <button onClick={() => removeKeyword(kw)} className="text-gray-400 hover:text-red-500 transition-colors">
                                        <XIcon className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {createPortal(
                <AnimatePresence>
                    {(hasChanges || message) && (
                        <div className={`fixed bottom-10 z-[200] w-auto pointer-events-none ${isRTL ? 'right-10 md:right-16' : 'left-10 md:left-16'}`}>
                            <MotionDiv
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 20, opacity: 0 }}
                                className="bg-white dark:bg-[#25262b] border border-gray-200 dark:border-gray-700 p-2 rounded-xl shadow-2xl flex items-center gap-4 pointer-events-auto min-w-[300px]"
                            >
                                <div className="flex-1 px-4">
                                    {message ? (
                                        <span className={`text-sm font-bold ${message.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {message.text}
                                        </span>
                                    ) : (
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{t('changes_detected')}</span>
                                    )}
                                </div>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-8 rounded-[var(--radius-main)] flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
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


import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AppSettings } from '../../types';
import { SparklesIcon, SaveIcon, RefreshIcon, XIcon, PlusIcon, KeyIcon, CheckIcon, AlertIcon } from '../ui/Icons';
import { supabase } from '../../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { testGeminiConnection } from '../../services/geminiService';
import { useLanguage } from '../../hooks/useLanguage';

// Fix for framer-motion type mismatch
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
    const [customPrompt, setCustomPrompt] = useState('');
    const [keywords, setKeywords] = useState<string[]>([]);
    const [newKeyword, setNewKeyword] = useState('');
    const [geminiApiKey, setGeminiApiKey] = useState('');

    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean, message: string } | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Initialize state from props
    useEffect(() => {
        setCustomPrompt(settings.ai_custom_prompt || '');
        setKeywords(settings.ai_keywords || []);
        setGeminiApiKey(settings.gemini_api_key || '');
    }, [settings]);

    // Check for changes to show/hide save button
    const hasChanges = useMemo(() => {
        const initialPrompt = settings.ai_custom_prompt || '';
        const initialKeywords = settings.ai_keywords || [];
        const initialApiKey = settings.gemini_api_key || '';

        const promptChanged = customPrompt !== initialPrompt;
        const apiKeyChanged = geminiApiKey !== initialApiKey;

        // Array comparison
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
        setKeywords(keywords.filter(k => k !== kw));
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
                    ai_custom_prompt: customPrompt || null, // If empty, save null to revert to default
                    ai_keywords: keywords,
                    gemini_api_key: geminiApiKey || null
                })
                .eq('campaign_id', settings.campaign_id);

            if (error) throw error;
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
        <div className="max-w-4xl mx-auto space-y-8 pb-32 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
            <h2 className="text-3xl font-black text-white flex items-center gap-3">
                <SparklesIcon className="w-8 h-8 text-cyan-400" /> {t('ai_settings_title')}
            </h2>

            {/* Test Connection Section */}
            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                            <RefreshIcon className="w-5 h-5 text-yellow-400" /> {t('ai_test_connection_title')}
                        </h3>
                        <p className="text-sm text-slate-400">
                            {t('ai_test_connection_desc')}
                        </p>
                    </div>
                    {testResult && (
                        <div className={`text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 ${testResult.success ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                            {testResult.success ? <CheckIcon className="w-4 h-4" /> : <AlertIcon className="w-4 h-4" />}
                            {testResult.message}
                        </div>
                    )}
                </div>

                <button
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg"
                >
                    {isTesting ? <RefreshIcon className="w-5 h-5 animate-spin" /> : <RefreshIcon className="w-5 h-5" />}
                    <span>{t('ai_test_connection_button')}</span>
                </button>
            </div>

            {/* API Key Management */}
            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <KeyIcon className="w-5 h-5 text-emerald-400" /> {t('ai_api_key_title')}
                </h3>
                <p className="text-sm text-slate-400">
                    {t('ai_api_key_desc')}
                </p>
                <div className="relative">
                    <input
                        type="password"
                        value={geminiApiKey}
                        onChange={e => setGeminiApiKey(e.target.value)}
                        placeholder={t('ai_api_key_placeholder')}
                        className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500 font-mono text-sm"
                    />
                    <KeyIcon className="absolute ltr:right-4 rtl:left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                </div>
            </div>

            {/* Prompt Customization */}
            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 text-pink-400" /> {t('ai_prompt_title')}
                </h3>
                <p className="text-sm text-slate-400">
                    {t('ai_prompt_desc')}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-slate-400 text-xs font-bold mb-1">{t('ai_default_prompt_label')}</label>
                        <textarea
                            value={DEFAULT_PROMPT}
                            disabled
                            className="w-full h-64 bg-black/30 border border-slate-700 rounded-xl p-3 text-slate-500 text-xs leading-relaxed resize-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-slate-400 text-xs font-bold mb-1">{t('ai_custom_prompt_label')}</label>
                        <textarea
                            value={customPrompt}
                            onChange={e => setCustomPrompt(e.target.value)}
                            placeholder={t('ai_custom_prompt_placeholder')}
                            className="w-full h-64 bg-slate-900 border border-slate-600 rounded-xl p-3 text-white text-sm leading-relaxed focus:border-pink-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Keywords / Tags */}
            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <span className="text-2xl">🏷️</span> {t('ai_keywords_title')}
                </h3>
                <p className="text-sm text-slate-400">
                    {t('ai_keywords_desc')}
                </p>

                <form onSubmit={handleAddKeyword} className="flex gap-2">
                    <input
                        value={newKeyword}
                        onChange={e => setNewKeyword(e.target.value)}
                        placeholder={t('ai_keywords_placeholder')}
                        className="flex-1 bg-slate-900 border border-slate-600 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500"
                    />
                    <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 rounded-xl font-bold">
                        <PlusIcon className="w-5 h-5" />
                    </button>
                </form>

                <div className="flex flex-wrap gap-2 mt-4 min-h-[50px]">
                    {keywords.length === 0 && <span className="text-slate-500 text-sm italic">{t('ai_no_tags')}</span>}
                    {keywords.map((kw, idx) => (
                        <div key={idx} className="bg-slate-700 text-white px-3 py-1 rounded-full flex items-center gap-2 text-sm border border-slate-600">
                            <span>{kw}</span>
                            <button onClick={() => removeKeyword(kw)} className="text-slate-400 hover:text-red-400">
                                <XIcon className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Floating Save Bar */}
            {createPortal(
                <AnimatePresence>
                    {(hasChanges || message) && (
                        <div className={`fixed bottom-12 z-[200] w-auto pointer-events-none ${isRTL ? 'right-6 md:right-10' : 'left-6 md:left-10'}`}>
                            <MotionDiv
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 20, opacity: 0 }}
                                className="bg-slate-900/90 backdrop-blur-xl border border-white/20 p-2 rounded-2xl shadow-2xl flex items-center gap-3 pointer-events-auto"
                            >
                                <div className="flex-1 px-3 whitespace-nowrap">
                                    {message ? (
                                        <span className={`text-sm font-bold ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                            {message.text}
                                        </span>
                                    ) : (
                                        <span className="text-sm font-bold text-slate-300">{t('changes_detected')}</span>
                                    )}
                                </div>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 transition-all shadow-lg"
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
        </div>
    );
};

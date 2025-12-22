import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AppSettings } from '../../types';
import { SparklesIcon, SaveIcon, RefreshIcon, XIcon, PlusIcon, KeyIcon, CheckIcon, AlertIcon } from '../ui/Icons';
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
        <div className="max-w-5xl mx-auto space-y-6 pb-12" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="bg-white/5 p-6 rounded-[var(--radius-main)] border border-white/10 shadow-xl backdrop-blur-md space-y-6">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3">
                        <RefreshIcon className="w-5 h-5 text-yellow-400" />
                        <h3 className="text-lg font-bold text-white">{t('ai_test_connection_title')}</h3>
                    </div>
                    {testResult && (
                        <div className={`text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 animate-in fade-in ${testResult.success ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                            {testResult.success ? <CheckIcon className="w-4 h-4" /> : <AlertIcon className="w-4 h-4" />}
                            {testResult.message}
                        </div>
                    )}
                </div>
                
                <p className="text-sm text-slate-400">{t('ai_test_connection_desc')}</p>
                
                <button
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg active:scale-95"
                >
                    {isTesting ? <RefreshIcon className="w-4 h-4 animate-spin" /> : <RefreshIcon className="w-4 h-4" />}
                    <span className="text-sm">{t('ai_test_connection_button')}</span>
                </button>
            </div>

            <div className="bg-white/5 p-6 rounded-[var(--radius-main)] border border-white/10 shadow-xl backdrop-blur-md space-y-4">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
                    <KeyIcon className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-bold text-white">{t('ai_api_key_title')}</h3>
                </div>
                <p className="text-sm text-slate-400">{t('ai_api_key_desc')}</p>
                <div className="relative">
                    <input
                        type="password"
                        value={geminiApiKey}
                        onChange={e => setGeminiApiKey(e.target.value)}
                        placeholder={t('ai_api_key_placeholder')}
                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 ltr:pl-12 rtl:pr-12 text-white outline-none focus:border-emerald-500 font-mono text-sm transition-all"
                    />
                    <KeyIcon className="absolute ltr:right-4 rtl:left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                </div>
            </div>

            <div className="bg-white/5 p-6 rounded-[var(--radius-main)] border border-white/10 shadow-xl backdrop-blur-md space-y-4">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
                    <SparklesIcon className="w-5 h-5 text-pink-400" />
                    <h3 className="text-lg font-bold text-white">{t('ai_prompt_title')}</h3>
                </div>
                <p className="text-sm text-slate-400">{t('ai_prompt_desc')}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-slate-400 text-xs font-bold mb-1">{t('ai_default_prompt_label')}</label>
                        <textarea
                            value={DEFAULT_PROMPT}
                            disabled
                            className="w-full h-64 bg-black/30 border border-white/5 rounded-xl p-3 text-slate-500 text-xs leading-relaxed resize-none font-medium"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-slate-400 text-xs font-bold mb-1">{t('ai_custom_prompt_label')}</label>
                        <textarea
                            value={customPrompt}
                            onChange={e => setCustomPrompt(e.target.value)}
                            placeholder={t('ai_custom_prompt_placeholder')}
                            className="w-full h-64 bg-slate-900/50 border border-white/10 rounded-xl p-3 text-white text-sm leading-relaxed focus:border-pink-500 outline-none transition-all shadow-inner"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white/5 p-6 rounded-[var(--radius-main)] border border-white/10 shadow-xl backdrop-blur-md space-y-4">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
                    <span className="text-2xl">🏷️</span>
                    <h3 className="text-lg font-bold text-white">{t('ai_keywords_title')}</h3>
                </div>
                <p className="text-sm text-slate-400">{t('ai_keywords_desc')}</p>

                <form onSubmit={handleAddKeyword} className="flex gap-2">
                    <input
                        value={newKeyword}
                        onChange={e => setNewKeyword(e.target.value)}
                        placeholder={t('ai_keywords_placeholder')}
                        className="flex-1 bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500 transition-all"
                    />
                    <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-5 rounded-xl font-bold transition-all active:scale-95 shadow-lg">
                        <PlusIcon className="w-5 h-5" />
                    </button>
                </form>

                <div className="flex flex-wrap gap-2 mt-4 min-h-[50px] p-4 bg-black/20 rounded-xl border border-white/5">
                    {keywords.length === 0 && <span className="text-slate-500 text-sm italic w-full text-center">{t('ai_no_tags')}</span>}
                    {keywords.map((kw, idx) => (
                        <div key={idx} className="bg-slate-800 text-white px-3 py-1 rounded-full flex items-center gap-2 text-xs font-bold border border-white/10 shadow-sm animate-in zoom-in-50 duration-200">
                            <span>{kw}</span>
                            <button onClick={() => removeKeyword(kw)} className="text-slate-500 hover:text-red-400 transition-colors">
                                <XIcon className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

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
                                    className="bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 transition-all shadow-lg active:scale-95"
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

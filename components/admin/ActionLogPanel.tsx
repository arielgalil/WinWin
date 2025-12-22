import React, { useState, useEffect, useRef } from 'react';
import { ActionLog, UserProfile, AppSettings } from '../../types';
import { SparklesIcon, LayersIcon, RefreshIcon, CopyIcon, CheckIcon, EditIcon, XIcon, UndoIcon, SaveIcon, TrashIcon, AlertIcon } from '../ui/Icons';
import { generateAdminSummary } from '../../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import { FormattedNumber } from '../ui/FormattedNumber';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { formatNumberWithCommas, parseFormattedNumber } from '../../utils/stringUtils';
import { useLanguage } from '../../hooks/useLanguage';
import { formatForWhatsApp, parseFormattedText } from '../../utils/whatsappUtils';
import { useSaveNotification } from '../../contexts/SaveNotificationContext';

const MotionDiv = motion.div as any;

interface ActionLogPanelProps {
    logs: ActionLog[];
    onLoadMore: () => void;
    onDelete: (id: string) => Promise<void>;
    onUpdate: (id: string, description: string, points: number) => Promise<void>;
    currentUser?: UserProfile;
    settings: AppSettings;
    isAdmin: boolean;
    onSave?: () => Promise<void>;
}

export const ActionLogPanel: React.FC<ActionLogPanelProps> = ({
    logs,
    onLoadMore,
    onDelete,
    onUpdate,
    currentUser,
    isAdmin,
    onSave
}) => {
    const { t, language, isRTL } = useLanguage();
    const { triggerSave } = useSaveNotification();

    const [summary, setSummary] = useState<string | null>(null);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [editingLogId, setEditingLogId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{ points: number, desc: string }>({ points: 0, desc: '' });
    const [isProcessing, setIsProcessing] = useState(false);
    const [actionStatus, setActionStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean; title: string; message: string; isDanger: boolean; onConfirm: () => void;
    }>({ isOpen: false, title: '', message: '', isDanger: false, onConfirm: () => { } });

    const bottomRef = useRef<HTMLTableRowElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    onLoadMore();
                }
            },
            { threshold: 0.1 }
        );

        if (bottomRef.current) observer.observe(bottomRef.current);
        return () => observer.disconnect();
    }, [logs.length, onLoadMore]);

    const showStatus = (type: 'success' | 'error', text: string) => {
        setActionStatus({ type, text });
        setTimeout(() => setActionStatus(null), 3000);
    };

    const handleGenerateSummary = async () => {
        if (logs.length === 0) return;
        setIsLoadingAI(true);
        setIsCopied(false);
        try {
            const result = await generateAdminSummary(logs, language);
            setSummary(result);
            triggerSave('logs');
            if (onSave) await onSave();
        } catch (error: any) {
            console.error("AI Summary Error:", error);
            setSummary(`${t('ai_summary_error_prefix')}\n${error.message || t('unknown_error')}\n${t('ai_api_key_check')}`);
        } finally {
            setIsLoadingAI(false);
        }
    };

    const handleCopySummary = async () => {
        if (!summary) return;
        try {
            const formattedSummary = formatForWhatsApp(summary);
            await navigator.clipboard.writeText(formattedSummary);
            setIsCopied(true);
            showStatus('success', t('summary_copied'));
            setTimeout(() => setIsCopied(false), 3000);
        } catch (err) {
            showStatus('error', t('copy_error'));
        }
    };

    const handleUpdate = async (id: string) => {
        setIsProcessing(true);
        try {
            await onUpdate(id, editForm.desc, editForm.points);
            setEditingLogId(null);
            showStatus('success', t('changes_saved'));
            triggerSave('logs');
            if (onSave) await onSave();
        } catch (err: any) {
            showStatus('error', t('update_error_prefix', { error: err.message }));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleToggleCancel = async (log: ActionLog) => {
        const actionVerb = log.is_cancelled ? t('restore') : t('cancel_short');
        setModalConfig({
            isOpen: true,
            title: t('modify_action_title', { action: actionVerb }),
            message: t('modify_action_confirm', { action: actionVerb.toLowerCase() }),
            isDanger: !log.is_cancelled,
            onConfirm: async () => {
                setModalConfig(prev => ({ ...prev, isOpen: false }));
                setIsProcessing(true);
                try {
                    await onDelete(log.id);
                    setActionStatus({ type: 'success', text: t('action_completed_successfully') });
                    triggerSave('logs');
                    if (onSave) await onSave();
                } catch (error: any) {
                    showStatus('error', t('error_prefix', { error: error.message }));
                } finally {
                    setIsProcessing(false);
                }
            }
        });
    };

    const startEditing = (log: ActionLog) => {
        setEditingLogId(log.id);
        setEditForm({ points: log.points, desc: log.description });
    };

    const getInitials = (name?: string) => {
        if (!name) return '??';
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.slice(0, 2).toUpperCase();
    };

    const renderFormattedSummary = (text: string) => {
        if (!text) return <div className="absolute inset-0 flex items-center justify-center text-center text-slate-300 p-6 font-bold italic">{t('click_below_for_ai_analysis')}</div>;
        return text.split('\n').filter(line => line.trim() !== '').map((paragraph, i) => (
            <p key={i} className="mb-4 text-slate-100 leading-relaxed text-sm font-medium">
                {parseFormattedText(paragraph).map((part, j) => {
                    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('*') && part.endsWith('*'))) {
                        const content = part.startsWith('**') ? part.slice(2, -2) : part.slice(1, -1);
                        return <strong key={j} className="text-yellow-400 font-black">{content}</strong>;
                    }
                    return part;
                })}
            </p>
        ));
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 flex flex-col pb-12 h-full relative" dir={isRTL ? 'rtl' : 'ltr'}>
            <ConfirmationModal isOpen={modalConfig.isOpen} title={modalConfig.title} message={modalConfig.message} onConfirm={modalConfig.onConfirm} onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))} />

            <AnimatePresence>
                {actionStatus && (
                    <MotionDiv initial={{ opacity: 0, y: -20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0 }} className={`fixed top-12 left-1/2 z-[100] px-8 py-3 rounded-full shadow-2xl font-black flex items-center gap-3 border border-white/20 ${actionStatus.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                        {actionStatus.type === 'success' ? <CheckIcon className="w-5 h-5" /> : <AlertIcon className="w-5 h-5" />}
                        {actionStatus.text}
                    </MotionDiv>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
                <div className="lg:col-span-2 flex flex-col gap-6 min-h-0">
                    <div className="bg-white/5 rounded-[var(--radius-main)] border border-white/10 flex flex-col flex-1 min-h-0 shadow-xl backdrop-blur-md overflow-hidden">
                        <div className="p-6 border-b border-white/10 flex items-center gap-3 bg-black/20">
                             <LayersIcon className="w-6 h-6 text-indigo-400" />
                             <h3 className="text-xl font-bold text-white">{t('activity_history_title')}</h3>
                        </div>
                        <div className="custom-scrollbar overflow-x-auto flex-1">
                            <table className="w-full text-right border-collapse">
                                <thead className="sticky top-0 bg-slate-900/90 backdrop-blur-md z-10 text-slate-400 text-[11px] font-black uppercase tracking-wider">
                                    <tr>
                                        <th className="p-4 border-b border-white/5">{t('time')}</th>
                                        <th className="p-4 border-b border-white/5">{t('performer')}</th>
                                        <th className="p-4 border-b border-white/5">{t('description')}</th>
                                        <th className="p-4 border-b border-white/5 text-center">{t('points')}</th>
                                        {isAdmin && <th className="p-4 border-b border-white/5 text-center">{t('actions')}</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {logs.map((log) => {
                                        const isMine = log.user_id === currentUser?.id;
                                        const isCancelled = log.is_cancelled;
                                        const isEditing = editingLogId === log.id;

                                        return (
                                            <tr key={log.id} className={`group hover:bg-white/5 transition-colors ${isCancelled ? 'opacity-40 grayscale' : ''}`}>
                                                <td className="p-4 text-xs text-slate-400 font-mono">
                                                    {new Date(log.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-xl shrink-0 ${isMine ? 'bg-cyan-600 ring-2 ring-cyan-400/40' : 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-300'}`}>
                                                            {getInitials(log.teacher_name)}
                                                        </div>
                                                        <span className={`text-xs font-bold whitespace-nowrap ${isMine ? 'text-cyan-400' : 'text-white'}`}>{isMine ? t('me') : log.teacher_name || t('system')}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    {isEditing ? (
                                                        <input value={editForm.desc} onChange={e => setEditForm(prev => ({ ...prev, desc: e.target.value }))} className="bg-slate-900 border border-indigo-500/50 rounded-lg p-2 text-sm text-white w-full outline-none" />
                                                    ) : (
                                                        <span className="text-sm text-slate-300 font-medium line-clamp-1">{log.description}</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-center">
                                                    {isEditing ? (
                                                        <input type="text" value={formatNumberWithCommas(editForm.points || 0)} onChange={e => setEditForm(prev => ({ ...prev, points: parseFormattedNumber(e.target.value) }))} className="bg-slate-900 border border-indigo-500/50 rounded-lg p-2 text-sm text-white w-20 text-center font-bold outline-none" />
                                                    ) : (
                                                        <span className={`text-sm font-black tabular-nums ${log.points > 0 ? 'text-green-400' : 'text-rose-400'}`}>
                                                            <FormattedNumber value={log.points} forceSign={true} />
                                                        </span>
                                                    )}
                                                </td>
                                                {isAdmin && (
                                                    <td className="p-4">
                                                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {isEditing ? (
                                                                <>
                                                                    <button onClick={() => handleUpdate(log.id)} disabled={isProcessing} className="p-3 min-w-[44px] min-h-[44px] bg-green-600 rounded-lg text-white hover:bg-green-500 transition-colors shadow-lg active:scale-95"><SaveIcon className="w-4 h-4" /></button>
                                                                    <button onClick={() => setEditingLogId(null)} className="p-3 min-w-[44px] min-h-[44px] bg-slate-700 rounded-lg text-white hover:bg-slate-600 transition-colors shadow-lg active:scale-95"><XIcon className="w-4 h-4" /></button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <button onClick={() => startEditing(log)} className="p-3 min-w-[44px] min-h-[44px] bg-white/5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/5 active:scale-95" title={t('edit_action')}><EditIcon className="w-4 h-4" /></button>
                                                                    <button onClick={() => handleToggleCancel(log)} className={`p-3 min-w-[44px] min-h-[44px] rounded-lg transition-all border active:scale-95 ${isCancelled ? 'bg-green-600/20 text-green-400 border-green-500/30 hover:bg-green-600 hover:text-white' : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-600 hover:text-white'}`} title={isCancelled ? t('restore_action') : t('cancel_action')}>{isCancelled ? <UndoIcon className="w-4 h-4" /> : <TrashIcon className="w-4 h-4" />}</button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                    <tr ref={bottomRef}><td colSpan={5} className="p-8 text-center text-slate-500 text-[10px] font-black uppercase tracking-widest">{t('end_of_list')}</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {isAdmin && (
                    <div className="md:col-span-1 flex flex-col gap-6 md:sticky md:top-4 order-1 md:order-2">
                        <div className="bg-gradient-to-br from-indigo-950/80 to-purple-950/80 p-8 rounded-[2rem] border border-indigo-500/30 flex flex-col h-[600px] shadow-2xl backdrop-blur-xl">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black text-white flex items-center gap-3">
                                    <SparklesIcon className="w-6 h-6 text-indigo-400 animate-pulse" /> {t('summary_ai_title')}
                                </h3>
                                {summary && (
                                    <button onClick={handleCopySummary} className={`p-2.5 rounded-xl transition-all flex items-center gap-2 text-xs font-black shadow-lg ${isCopied ? 'bg-green-600 text-white' : 'bg-white/10 text-slate-200 border border-white/10 hover:bg-white/20'}`}>
                                        {isCopied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                                        {isCopied ? t('copied') : t('copy')}
                                    </button>
                                )}
                            </div>
                            <button onClick={handleGenerateSummary} disabled={isLoadingAI} className="mb-6 w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-[0_15px_30px_-5px_rgba(79,70,229,0.5)] border border-indigo-400/50 relative z-20 cursor-pointer">
                                <div className="flex items-center justify-center gap-3 pointer-events-none">
                                    {isLoadingAI ? <RefreshIcon className="w-6 h-6 animate-spin" /> : <SparklesIcon className="w-6 h-6" />}
                                    <span>{isLoadingAI ? t('analyzing_data') : t('generate_new_analysis')}</span>
                                </div>
                            </button>
                            <div className="bg-black/60 rounded-[1.5rem] p-6 flex-1 overflow-y-auto border border-white/10 relative min-h-[300px] custom-scrollbar shadow-inner">
                                {renderFormattedSummary(summary || '')}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

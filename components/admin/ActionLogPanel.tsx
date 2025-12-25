import React, { useState, useEffect, useRef } from 'react';
import { ActionLog, UserProfile, AppSettings } from '../../types';
import { SparklesIcon, RefreshIcon, CopyIcon, CheckIcon, EditIcon, XIcon, UndoIcon, SaveIcon, TrashIcon, AlertIcon } from '../ui/Icons';
import { generateAdminSummary } from '../../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import { FormattedNumber } from '../ui/FormattedNumber';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { formatNumberWithCommas, parseFormattedNumber } from '../../utils/stringUtils';
import { useLanguage } from '../../hooks/useLanguage';
import { formatForWhatsApp, parseFormattedText } from '../../utils/whatsappUtils';
import { useSaveNotification } from '../../contexts/SaveNotificationContext';

import { useConfirmation } from '../../hooks/useConfirmation';
import { AdminSectionCard } from '../ui/AdminSectionCard';

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

    const { modalConfig, openConfirmation } = useConfirmation();

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
        const actionTitle = log.is_cancelled ? t('restore_action') : t('delete_log');
        
        openConfirmation({
            title: actionTitle,
            message: t('modify_action_confirm', { action: actionVerb.toLowerCase() }),
            confirmText: actionTitle,
            isDanger: !log.is_cancelled,
            onConfirm: async () => {
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
        if (!text) return <div className="absolute inset-0 flex items-center justify-center text-center text-[var(--text-secondary)] p-6 font-bold italic">{t('click_below_for_ai_analysis')}</div>;
        return text.split('\n').filter(line => line.trim() !== '').map((paragraph, i) => (
            <p key={i} className="mb-4 text-[var(--text-main)] leading-relaxed text-sm font-medium">
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
        <div className="max-w-6xl mx-auto space-y-8 flex flex-col pb-12 h-full relative" dir={isRTL ? 'rtl' : 'ltr'}>
            <ConfirmationModal {...modalConfig} />

            <AnimatePresence>
                {actionStatus && (
                    <MotionDiv initial={{ opacity: 0, y: -20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0 }} className={`fixed top-12 left-1/2 z-[100] px-8 py-3 rounded-full shadow-2xl font-bold flex items-center gap-3 border border-white/10 ${actionStatus.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                        {actionStatus.type === 'success' ? <CheckIcon className="w-5 h-5" /> : <AlertIcon className="w-5 h-5" />}
                        {actionStatus.text}
                    </MotionDiv>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
                <div className="lg:col-span-2 flex flex-col gap-6 min-h-0">
                    <AdminSectionCard
                        title={t('activity_history_title')}
                        icon={<RefreshIcon className="w-6 h-6" />}
                        className="flex-1 flex flex-col min-h-0 !p-0 overflow-hidden"
                    >
                        <div className="custom-scrollbar overflow-x-auto flex-1 h-full">
                            <table className="w-full text-right border-collapse">
                                <thead className="sticky top-0 bg-slate-50 dark:bg-white/5 z-10 text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-wider shadow-sm">
                                    <tr>
                                        <th className="p-4 border-b border-gray-300 dark:border-white/10">{t('time')}</th>
                                        <th className="p-4 border-b border-gray-300 dark:border-white/10">{t('performer')}</th>
                                        <th className="p-4 border-b border-gray-300 dark:border-white/10">{t('description')}</th>
                                        <th className="p-4 border-b border-gray-300 dark:border-white/10 text-center">{t('points')}</th>
                                        {isAdmin && <th className="p-4 border-b border-gray-300 dark:border-white/10 text-center">{t('actions')}</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                                    {logs.map((log) => {
                                        const isMine = log.user_id === currentUser?.id;
                                        const isCancelled = log.is_cancelled;
                                        const isEditing = editingLogId === log.id;

                                        return (
                                            <tr key={log.id} className={`group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${isCancelled ? 'opacity-50 grayscale' : ''}`}>
                                                <td className="p-4 text-xs text-gray-900 dark:text-gray-400 font-mono font-bold">
                                                    {new Date(log.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm shrink-0 ${isMine ? 'bg-cyan-600' : 'bg-indigo-600 dark:bg-indigo-500/20 text-white dark:text-indigo-300'}`}>
                                                            {getInitials(log.teacher_name)}
                                                        </div>
                                                        <span className={`text-xs font-bold whitespace-nowrap ${isMine ? 'text-cyan-900 dark:text-cyan-400' : 'text-gray-900 dark:text-gray-100'}`}>{isMine ? t('me') : log.teacher_name || t('system')}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    {isEditing ? (
                                                        <input value={editForm.desc} onChange={e => setEditForm(prev => ({ ...prev, desc: e.target.value }))} className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-black/20 text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm" />
                                                    ) : (
                                                        <span className="text-sm text-gray-900 dark:text-gray-300 font-bold line-clamp-1">{log.description}</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-center">
                                                    {isEditing ? (
                                                        <input type="text" value={formatNumberWithCommas(editForm.points || 0)} onChange={e => setEditForm(prev => ({ ...prev, points: parseFormattedNumber(e.target.value) }))} className="w-20 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-black/20 text-sm text-center font-bold outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm" />
                                                    ) : (
                                                        <span className={`text-sm font-black tabular-nums ${log.points > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                            <FormattedNumber value={log.points} forceSign={true} />
                                                        </span>
                                                    )}
                                                </td>
                                                {isAdmin && (
                                                    <td className="p-4">
                                                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {isEditing ? (
                                                                <>
                                                                    <button onClick={() => handleUpdate(log.id)} disabled={isProcessing} className="p-2 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-500/20 rounded-[var(--radius-main)]-colors min-h-[44px] min-w-[44px] flex items-center justify-center"><SaveIcon className="w-4 h-4" /></button>
                                                                    <button onClick={() => setEditingLogId(null)} className="p-2 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 rounded-[var(--radius-main)]-colors min-h-[44px] min-w-[44px] flex items-center justify-center"><XIcon className="w-4 h-4" /></button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <button onClick={() => startEditing(log)} className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-[var(--radius-main)]-all min-h-[44px] min-w-[44px] flex items-center justify-center" title={t('edit_action')}><EditIcon className="w-4 h-4" /></button>
                                                                    <button onClick={() => handleToggleCancel(log)} className={`p-2 rounded-[var(--radius-main)]-all min-h-[44px] min-w-[44px] flex items-center justify-center ${isCancelled ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'}`} title={isCancelled ? t('restore_action') : t('cancel_action')}>{isCancelled ? <UndoIcon className="w-4 h-4" /> : <TrashIcon className="w-4 h-4" />}</button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                    <tr ref={bottomRef}><td colSpan={5} className="p-6 text-center text-gray-400 text-[10px] font-bold uppercase tracking-widest">{t('end_of_list')}</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </AdminSectionCard>
                </div>

                {isAdmin && (
                    <div className="md:col-span-1 flex flex-col gap-6 md:sticky md:top-4 order-1 md:order-2">
                        <AdminSectionCard
                            title={t('summary_ai_title')}
                            icon={<SparklesIcon className="w-6 h-6 text-indigo-500 animate-pulse" />}
                            className="flex flex-col h-[600px]"
                            rightAction={summary && (
                                <button onClick={handleCopySummary} className={`p-2 rounded-[var(--radius-main)]-all flex items-center gap-2 text-xs font-bold min-h-[44px] ${isCopied ? 'bg-green-100 text-green-700' : 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50'}`}>
                                    {isCopied ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
                                    {isCopied ? t('copied') : t('copy')}
                                </button>
                            )}
                        >
                            <button onClick={handleGenerateSummary} disabled={isLoadingAI} className="mb-6 w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-bold py-3 rounded-[var(--radius-main)] items-center justify-center gap-2 transition-all shadow-md shadow-indigo-500/20 disabled:opacity-70 disabled:cursor-not-allowed">
                                {isLoadingAI ? <RefreshIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                                <span>{isLoadingAI ? t('analyzing_data') : t('generate_new_analysis')}</span>
                            </button>
                            <div className="bg-slate-50 dark:bg-black/20 rounded-xl p-6 flex-1 overflow-y-auto border border-gray-300 dark:border-white/5 custom-scrollbar text-gray-800 dark:text-gray-200 shadow-inner">
                                {renderFormattedSummary(summary || '')}
                            </div>
                        </AdminSectionCard>
                    </div>
                )}
            </div>
        </div>
    );
};

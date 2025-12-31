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
import { AdminButton } from '../ui/AdminButton';

const MotionDiv = motion.div as any;

interface ActionLogPanelProps {
    logs: ActionLog[];
    onLoadMore: () => void;
    onDelete: (id: string) => Promise<void>;
    onUpdate: (id: string, description: string, points: number) => Promise<void>;
    onUpdateSummary?: (text: string) => Promise<void>;
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
    onUpdateSummary,
    currentUser,
    settings,
    isAdmin,
    onSave
}) => {
    const { t, language, isRTL } = useLanguage();
    const { triggerSave } = useSaveNotification();

    const [summary, setSummary] = useState<string | null>(settings.ai_summary || null);
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

    // Update local summary state when settings change (e.g. from another client)
    useEffect(() => {
        if (settings.ai_summary) {
            setSummary(settings.ai_summary);
        }
    }, [settings.ai_summary]);

    // Auto-generate summary on mount if logs exist AND NO summary exists in settings
    useEffect(() => {
        if (logs.length > 0 && !settings.ai_summary && !isLoadingAI) {
            handleGenerateSummary();
        }
    }, [logs.length]);

    const showStatus = (type: 'success' | 'error', text: string) => {
        setActionStatus({ type, text });
        setTimeout(() => setActionStatus(null), 3000);
    };

    const handleGenerateSummary = async () => {
        if (logs.length === 0) return;
        setIsLoadingAI(true);
        setIsCopied(false);
        try {
            const result = await generateAdminSummary(logs, settings, language, settings.campaign_id || '');
            setSummary(result);
            if (onUpdateSummary) {
                await onUpdateSummary(result);
            }
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
        if (!text && !isLoadingAI) return <div className="absolute inset-0 flex items-center justify-center text-center text-[var(--text-secondary)] p-6 font-[var(--fw-bold)] italic">{t('click_below_for_ai_analysis')}</div>;
        if (isLoadingAI) return (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-[var(--text-muted)] p-6">
                <RefreshIcon className="w-10 h-10 animate-spin" />
                <span className="font-[var(--fw-bold)]">{t('analyzing_data')}</span>
            </div>
        );
        return text.split('\n').filter(line => line.trim() !== '').map((paragraph, i) => (
            <p key={i} className="mb-4 text-[var(--text-main)] leading-relaxed text-[var(--fs-base)] font-[var(--fw-medium)]">
                {parseFormattedText(paragraph).map((part, j) => {
                    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('*') && part.endsWith('*'))) {
                        const content = part.startsWith('**') ? part.slice(2, -2) : part.slice(1, -1);
                        return <strong key={j} className="text-indigo-600 dark:text-indigo-400 font-[var(--fw-bold)]">{content}</strong>;
                    }
                    return part;
                })}
            </p>
        ));
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 flex flex-col pb-12 h-full relative w-full" dir={isRTL ? 'rtl' : 'ltr'}>
            <ConfirmationModal {...modalConfig} />

            <AnimatePresence>
                {actionStatus && (
                    <MotionDiv initial={{ opacity: 0, y: -20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0 }} className={`fixed top-12 left-1/2 z-[100] px-8 py-3 rounded-full shadow-2xl font-[var(--fw-bold)] flex items-center gap-3 border border-white/10 ${actionStatus.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
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
                                <thead className="sticky top-0 bg-[var(--bg-surface)] z-10 text-[var(--text-main)] text-[var(--fs-sm)] font-[var(--fw-bold)] uppercase tracking-wider shadow-sm border-b border-[var(--border-main)]">
                                    <tr>
                                        <th className="p-4 border-b border-[var(--border-subtle)]">{t('time')}</th>
                                        <th className="p-4 border-b border-[var(--border-subtle)]">{t('performer')}</th>
                                        <th className="p-4 border-b border-[var(--border-subtle)]">{t('description')}</th>
                                        <th className="p-4 border-b border-[var(--border-subtle)] text-center">{t('points')}</th>
                                        {isAdmin && <th className="p-4 border-b border-[var(--border-subtle)] text-center">{t('actions')}</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-subtle)]">
                                    {logs.map((log) => {
                                        const isMine = log.user_id === currentUser?.id;
                                        const isCancelled = log.is_cancelled;
                                        const isEditing = editingLogId === log.id;

                                        return (
                                            <tr key={log.id} className={`group hover:bg-[var(--bg-hover)] transition-colors ${isCancelled ? 'opacity-50 grayscale' : ''}`}>
                                                <td className="p-4 text-[var(--fs-sm)] text-[var(--text-main)] font-mono font-[var(--fw-medium)]">
                                                    {new Date(log.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[var(--fs-sm)] font-[var(--fw-bold)] text-white shadow-sm shrink-0 ${isMine ? 'bg-cyan-700 dark:bg-cyan-600' : 'bg-indigo-600 dark:bg-indigo-500/20 text-white dark:text-indigo-300'}`}>
                                                            {getInitials(log.teacher_name)}
                                                        </div>
                                                        <span className={`text-[var(--fs-sm)] font-[var(--fw-bold)] whitespace-nowrap ${isMine ? 'text-cyan-700 dark:text-cyan-400' : 'text-[var(--text-main)]'}`}>{isMine ? t('me') : log.teacher_name || t('system')}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    {isEditing ? (
                                                        <input value={editForm.desc || ''} onChange={e => setEditForm(prev => ({ ...prev, desc: e.target.value }))} className="w-full px-3 py-1.5 rounded-lg border border-[var(--border-main)] bg-[var(--bg-input)] text-[var(--fs-base)] text-[var(--text-main)] outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm" />
                                                    ) : (
                                                        <span className="text-[var(--fs-base)] text-[var(--text-main)] font-[var(--fw-medium)] line-clamp-1 opacity-90">{log.description}</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-center">
                                                    {isEditing ? (
                                                        <input type="text" value={formatNumberWithCommas(editForm.points || 0)} onChange={e => setEditForm(prev => ({ ...prev, points: parseFormattedNumber(e.target.value) }))} className="w-20 px-3 py-1.5 rounded-lg border border-[var(--border-main)] bg-[var(--bg-input)] text-[var(--fs-base)] text-center font-[var(--fw-bold)] text-[var(--text-main)] outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm" />
                                                    ) : (
                                                        <span className={`text-[var(--fs-base)] font-[var(--fw-bold)] tabular-nums ${log.points > 0 ? 'text-[var(--status-success-text)]' : 'text-[var(--status-error-text)]'}`}>
                                                            <FormattedNumber value={log.points} forceSign={true} />
                                                        </span>
                                                    )}
                                                </td>
                                                {isAdmin && (
                                                    <td className="p-4">
                                                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {isEditing ? (
                                                                <>
                                                                    <AdminButton onClick={() => handleUpdate(log.id)} isLoading={isProcessing} variant="success" size="sm" className="w-10 h-10 px-0" icon={<SaveIcon className="w-4 h-4" />} />
                                                                    <AdminButton onClick={() => setEditingLogId(null)} variant="secondary" size="sm" className="w-10 h-10 px-0" icon={<XIcon className="w-4 h-4" />} />
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <AdminButton onClick={() => startEditing(log)} variant="ghost" size="sm" className="w-10 h-10 px-0" icon={<EditIcon className="w-4 h-4" />} title={t('edit_action')} />
                                                                    <AdminButton onClick={() => handleToggleCancel(log)} variant={isCancelled ? 'success' : 'ghost'} size="sm" className="w-10 h-10 px-0" icon={isCancelled ? <UndoIcon className="w-4 h-4" /> : <TrashIcon className="w-4 h-4" />} title={isCancelled ? t('restore_action') : t('cancel_action')} />
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                    <tr ref={bottomRef}><td colSpan={5} className="p-6 text-center text-[var(--text-muted)] text-[var(--fs-sm)] font-[var(--fw-bold)] uppercase tracking-widest">{t('end_of_list')}</td></tr>
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
                            className="flex flex-col"
                        >
                            <div className="flex flex-wrap justify-end gap-3 mb-6">
                                <AdminButton 
                                    onClick={handleGenerateSummary} 
                                    isLoading={isLoadingAI} 
                                    variant="primary"
                                    size="md"
                                    className="flex-1 min-w-[140px]"
                                    icon={<SparklesIcon className="w-5 h-5" />}
                                >
                                    {t('generate_new_analysis')}
                                </AdminButton>

                                {summary && (
                                    <AdminButton
                                        onClick={handleCopySummary}
                                        variant={isCopied ? 'success' : 'secondary'}
                                        size="md"
                                        className="shrink-0"
                                        icon={isCopied ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
                                    >
                                        {isCopied ? t('copied') : t('copy')}
                                    </AdminButton>
                                )}
                            </div>

                            <div className="bg-[var(--bg-surface)] rounded-xl p-6 border border-[var(--border-main)] text-[var(--text-main)] shadow-inner relative min-h-[200px]">
                                {renderFormattedSummary(summary || '')}
                                {settings.ai_summary_updated_at && summary && !isLoadingAI && (
                                    <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] text-[var(--fs-xs)] text-[var(--text-muted)] text-center italic">
                                        {t('last_update')}: {new Date(settings.ai_summary_updated_at).toLocaleString(language === 'he' ? 'he-IL' : 'en-US')}
                                    </div>
                                )}
                            </div>
                        </AdminSectionCard>
                    </div>
                )}
            </div>
        </div>
    );
};

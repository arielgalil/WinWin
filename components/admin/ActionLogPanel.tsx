
import React, { useState, useEffect, useRef } from 'react';
import { ActionLog, UserProfile, AppSettings } from '../../types';
import { SparklesIcon, LayersIcon, RefreshIcon, CopyIcon, CheckIcon, EditIcon, XIcon, UndoIcon, SaveIcon, TrashIcon, AlertIcon } from '../ui/Icons';
import { generateAdminSummary } from '../../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import { FormattedNumber } from '../ui/FormattedNumber';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { useLanguage } from '../../hooks/useLanguage';
import { formatForWhatsApp, parseFormattedText } from '../../utils/whatsappUtils';

const MotionDiv = motion.div as any;

interface ActionLogPanelProps {
    logs: ActionLog[];
    onLoadMore: () => void;
    onDelete: (id: string) => Promise<void>;
    onUpdate: (id: string, description: string, points: number) => Promise<void>;
    currentUser?: UserProfile;
    settings: AppSettings;
    isAdmin: boolean;
}

export const ActionLogPanel: React.FC<ActionLogPanelProps> = ({
    logs,
    onLoadMore,
    onDelete,
    onUpdate,
    currentUser,
    settings,
    isAdmin
}) => {
    const { t, language, isRTL } = useLanguage();
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
        return () => { if (bottomRef.current) observer.unobserve(bottomRef.current); };
    }, [logs.length, onLoadMore]);

    const showStatus = (type: 'success' | 'error', text: string) => {
        setActionStatus({ type, text });
        setTimeout(() => setActionStatus(null), 3000);
    };

    const handleGenerateSummary = async () => {
        setIsLoadingAI(true);
        setIsCopied(false);
        try {
            const result = await generateAdminSummary(logs, language);
            setSummary(result);
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
                    showStatus('success', t('action_completed_successfully'));
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

    const saveEdit = async () => {
        if (!editingLogId) return;
        setIsProcessing(true);
        try {
            await onUpdate(editingLogId, editForm.desc, editForm.points);
            setEditingLogId(null);
            showStatus('success', t('changes_saved'));
        } catch (error: any) {
            showStatus('error', t('update_error_prefix', { error: error.message }));
        } finally {
            setIsProcessing(false);
        }
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
        <div className="max-w-6xl mx-auto space-y-8 flex flex-col pb-6 h-full relative" dir={isRTL ? 'rtl' : 'ltr'}>
            <ConfirmationModal isOpen={modalConfig.isOpen} title={modalConfig.title} message={modalConfig.message} isDanger={modalConfig.isDanger} onConfirm={modalConfig.onConfirm} onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))} />

            <AnimatePresence>
                {actionStatus && (
                    <MotionDiv initial={{ opacity: 0, y: -20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0 }} className={`fixed top-12 left-1/2 z-[100] px-8 py-3 rounded-full shadow-2xl font-black flex items-center gap-3 border border-white/20 ${actionStatus.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                        {actionStatus.type === 'success' ? <CheckIcon className="w-5 h-5" /> : <AlertIcon className="w-5 h-5" />}
                        {actionStatus.text}
                    </MotionDiv>
                )}
            </AnimatePresence>

            <div className="shrink-0 px-2">
                <h2 className="text-3xl font-black text-white flex items-center gap-4">
                    <SparklesIcon className="w-9 h-9 text-yellow-400" />
                    {t('activity_log_and_ai_title')}
                </h2>
                <p className="text-slate-200 font-bold mt-2 ltr:ml-12 rtl:mr-12 opacity-90">{t('activity_log_and_ai_description')}</p>
            </div>

            <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-6 items-start min-h-0`}>
                <div className={`${isAdmin ? 'md:col-span-2 order-2 md:order-1' : 'col-span-full'} bg-slate-900/60 rounded-[2rem] border border-white/20 flex flex-col overflow-hidden shadow-2xl h-auto`}>
                    <div className="p-5 border-b border-white/10 bg-black/40 shrink-0">
                        <h3 className="font-black text-white flex items-center gap-3">
                            <LayersIcon className="w-5 h-5 text-indigo-400" /> {t('activity_history_title')}
                        </h3>
                    </div>

                    <div className="custom-scrollbar overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-black/60 text-slate-200 text-[11px] uppercase font-black sticky top-0 backdrop-blur-md z-10">
                                <tr className="border-b border-white/10">
                                    <th className="p-4">{t('time')}</th>
                                    <th className="p-4">{t('performer')}</th>
                                    <th className="p-4">{t('description')}</th>
                                    <th className="p-4 text-center">{t('points')}</th>
                                    <th className="p-4 text-center">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {logs.map(log => {
                                    const isCancelled = log.is_cancelled;
                                    const isEditing = editingLogId === log.id;
                                    const isMine = log.user_id && currentUser?.id === log.user_id;
                                    const canManage = isAdmin || isMine;

                                    return (
                                        <tr key={log.id} className={`transition-all duration-300 group ${isCancelled ? 'bg-red-950/40 grayscale opacity-70' : 'hover:bg-white/5'}`}>
                                            <td className="p-4 text-slate-300 whitespace-nowrap text-xs font-bold leading-tight">
                                                {new Date(log.created_at).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US')}<br />
                                                <span className="text-[10px] opacity-70 font-black">{new Date(log.created_at).toLocaleTimeString(language === 'he' ? 'he-IL' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black text-white shadow-xl shrink-0 ${isMine ? 'bg-cyan-600 ring-2 ring-cyan-400/40' : 'bg-slate-700'}`}>
                                                        {log.teacher_name?.charAt(0) || 'U'}
                                                    </div>
                                                    <span className={`font-black text-xs ${isCancelled ? 'text-slate-400 line-through' : isMine ? 'text-cyan-400' : 'text-white'}`}>
                                                        {isMine ? t('me') : log.teacher_name || t('system')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className={`block max-w-[200px] truncate font-bold ${isCancelled ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
                                                        {log.description}
                                                    </span>
                                                    {log.note && <span className="text-[10px] text-slate-400 truncate italic font-bold">"{log.note}"</span>}
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                {isEditing ? (
                                                    <input type="number" value={editForm.points} onChange={e => setEditForm({ ...editForm, points: Number(e.target.value) })} className="bg-slate-950 border border-indigo-500 rounded-lg px-2 py-1 text-white w-16 text-center font-black outline-none focus:ring-2 focus:ring-indigo-500/50" />
                                                ) : (
                                                    <span className={`font-black px-3 py-1 rounded-lg text-xs tabular-nums border ${isCancelled ? 'bg-slate-800 text-slate-400 line-through border-transparent' : log.points > 0 ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                                                        <FormattedNumber value={log.points} forceSign={true} />
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                {canManage && (
                                                    <div className="flex items-center justify-center gap-5 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                                        {isEditing ? (
                                                            <>
                                                                <button onClick={saveEdit} disabled={isProcessing} aria-label={t('save_changes')} className="p-2 bg-green-600 text-white rounded-xl shadow-lg hover:bg-green-500"><SaveIcon className="w-4 h-4" /></button>
                                                                <button onClick={() => setEditingLogId(null)} disabled={isProcessing} aria-label={t('cancel_edit')} className="p-2 bg-slate-700 text-white rounded-xl shadow-lg hover:bg-slate-600"><XIcon className="w-4 h-4" /></button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button onClick={() => startEditing(log)} aria-label={t('edit_action')} className="p-2 bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><EditIcon className="w-4 h-4" /></button>
                                                                <button onClick={() => handleToggleCancel(log)} aria-label={isCancelled ? t('restore_action') : t('cancel_action')} className={`p-2 border rounded-xl transition-all ${isCancelled ? 'bg-green-600/20 text-green-300 border-green-500/30 hover:bg-green-600 hover:text-white' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-slate-700/50 hover:text-white'}`}>
                                                                    {isCancelled ? <UndoIcon className="w-4 h-4" /> : <TrashIcon className="w-4 h-4" />}
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                <tr ref={bottomRef}><td colSpan={5} className="p-8 text-center opacity-40 text-slate-500 font-bold text-xs">{t('end_of_list')}</td></tr>
                            </tbody>
                        </table>
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
                            <div className="bg-black/60 rounded-[1.5rem] p-6 flex-1 overflow-y-auto border border-white/10 relative min-h-[300px] custom-scrollbar shadow-inner">
                                {renderFormattedSummary(summary || '')}
                            </div>
                            <button onClick={handleGenerateSummary} disabled={isLoadingAI} className="mt-6 w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-[0_15px_30px_-5px_rgba(79,70,229,0.5)] border border-indigo-400/50">
                                {isLoadingAI ? <RefreshIcon className="w-6 h-6 animate-spin" /> : <SparklesIcon className="w-6 h-6" />}
                                {isLoadingAI ? t('analyzing_data') : t('generate_new_analysis')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

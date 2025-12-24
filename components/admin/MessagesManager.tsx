
import React, { useState } from 'react';
import { TickerMessage } from '../../types';
import { PlusIcon, EditIcon, LayersIcon, CheckIcon, XIcon } from '../ui/Icons';
import { DeleteButton } from '../ui/DeleteButton';

import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../hooks/useLanguage';
import { useToast } from '../../hooks/useToast';

import { normalizeString } from '../../utils/stringUtils';
import { useErrorFormatter } from '../../utils/errorUtils';

// Fix for framer-motion type mismatch
const MotionDiv = motion.div as any;

const ArrowUpIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m18 15-6-6-6 6" /></svg>
);
const ArrowDownIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6" /></svg>
);

interface MessagesManagerProps {
    messages: TickerMessage[];
    onAdd: (text: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onUpdate: (id: string, updates: Partial<TickerMessage>) => Promise<void>;
}

export const MessagesManager: React.FC<MessagesManagerProps> = ({ messages, onAdd, onDelete, onUpdate }) => {
    const { t, isRTL } = useLanguage();
    const [newMessage, setNewMessage] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [isReordering, setIsReordering] = useState(false);

    const { showToast } = useToast();
    const { getErrorMessage } = useErrorFormatter();

    const placeholders = [
        { label: t('placeholder_institution_name'), value: '[שם המוסד]' },
        { label: t('placeholder_campaign_name'), value: '[שם המבצע]' },
        { label: t('placeholder_institution_score'), value: '[ניקוד מוסדי]' },
        { label: t('placeholder_target_name'), value: '[שם היעד]' },
        { label: t('placeholder_target_score'), value: '[ניקוד היעד]' },
        { label: t('placeholder_distance_from_target'), value: '[מרחק מהיעד]' },
        { label: t('placeholder_group_1'), value: '[כיתה ראשונה]' },
        { label: t('placeholder_group_2'), value: '[כיתה שניה]' },
        { label: t('placeholder_group_3'), value: '[כיתה שלישית]' },
        { label: t('placeholder_place_1'), value: '[מקום ראשון]' },
    ];

    const insertPlaceholder = (ph: string) => {
        if (editingId) setEditText(prev => prev + ' ' + ph);
        else setNewMessage(prev => prev + ' ' + ph);
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanMsg = normalizeString(newMessage);
        if (!cleanMsg) return;
        try {
            await onAdd(cleanMsg);
            setNewMessage('');
            showToast(t('changes_saved'), 'success');
        } catch (err: any) {
            showToast(getErrorMessage(err), 'error');
        }
    };

    const saveEdit = async () => {
        const cleanEdit = normalizeString(editText);
        if (editingId && cleanEdit) {
            try {
                await onUpdate(editingId, { text: cleanEdit });
                setEditingId(null);
                showToast(t('changes_saved'), 'success');
            } catch (err: any) {
                showToast(getErrorMessage(err), 'error');
            }
        }
    };

    const handleMove = async (index: number, direction: 'up' | 'down') => {
        if ((direction === 'up' && index === 0) || (direction === 'down' && index === messages.length - 1)) return;
        setIsReordering(true);
        const newMessages = [...messages];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newMessages[index], newMessages[targetIndex]] = [newMessages[targetIndex], newMessages[index]];
        try {
            await Promise.all(newMessages.map((msg, i) => onUpdate(msg.id, { display_order: i })));
        } catch (err: any) {
            showToast(getErrorMessage(err), 'error');
        }
        setIsReordering(false);
    };

    return (
                    <div className="max-w-6xl mx-auto bg-white dark:bg-[#1e1e2e] p-8 rounded-[var(--radius-container)] border border-gray-200 dark:border-white/10 shadow-sm space-y-8">            <div className="flex flex-col gap-1 border-b border-gray-100 dark:border-white/5 pb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <LayersIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> {t('messages_mgmt_title')}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('messages_mgmt_desc')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-gray-50 dark:bg-black/20 p-6 rounded-[var(--radius-main)] border border-gray-100 dark:border-white/5 shadow-sm">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">{t('add_message_card')}</label>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div className="relative">
                                <textarea
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    maxLength={150}
                                    placeholder={t('write_encouraging_msg')}
                                    className="w-full px-4 py-3 rounded-[var(--radius-main)] border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm h-32 resize-none"
                                />
                                <div className={`absolute bottom-2 ${isRTL ? 'left-3' : 'right-3'} text-[9px] font-bold ${newMessage.length >= 140 ? 'text-red-500' : 'text-gray-400 dark:text-gray-500 opacity-80'}`}>
                                    {newMessage.length}/150
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-x-1.5 gap-y-2 bg-indigo-50 dark:bg-indigo-500/10 p-2 rounded-[var(--radius-main)] border border-indigo-100 dark:border-indigo-500/20">
                                {placeholders.map(ph => (
                                    <button
                                        key={ph.value}
                                        type="button"
                                        onClick={() => insertPlaceholder(ph.value)}
                                        className="group relative h-6 transition-all active:scale-95 bg-indigo-100 dark:bg-indigo-950/80 hover:bg-indigo-200 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 rounded-full px-3 text-xs font-semibold"
                                    >
                                        {ph.label}
                                    </button>
                                ))}
                            </div>

                            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-[var(--radius-main)] shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 uppercase tracking-wide active:scale-95">
                                <PlusIcon className="w-4 h-4" /> {t('add_new_button')}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex justify-between items-center">
                        <span>{t('active_messages_list', { count: messages.length })}</span>
                    </h4>

                    <div className="bg-gray-50 dark:bg-black/20 rounded-[var(--radius-main)] border border-gray-100 dark:border-white/5 min-h-[300px] max-h-[450px] overflow-y-auto custom-scrollbar p-3 space-y-3 relative shadow-inner">
                        <AnimatePresence initial={false}>
                            {messages.length === 0 ? (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm italic">
                                    {t('no_data')}
                                </div>
                            ) : (
                                messages.map((msg, index) => (
                                    <MotionDiv
                                        key={msg.id}
                                        layout
                                        initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className={`group p-4 rounded-[var(--radius-main)] border flex items-start justify-between gap-4 transition-all ${editingId === msg.id ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/40' : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-500/30'}`}
                                    >
                                        {/* Message Text Area */}
                                        <div className="flex-1 min-w-0">
                                            {editingId === msg.id ? (
                                                <div className="flex gap-2 items-center">
                                                    <div className="relative flex-1">
                                                        <textarea
                                                            value={editText}
                                                            onChange={e => setEditText(e.target.value)}
                                                            maxLength={150}
                                                            className="w-full px-3 py-2 rounded-[var(--radius-main)] border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm h-24 resize-none"
                                                            autoFocus
                                                        />
                                                        <div className={`absolute -top-5 ${isRTL ? 'left-0' : 'right-0'} text-[9px] font-bold ${editText.length >= 140 ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
                                                            {editText.length}/150
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1 shrink-0">
                                                        <button onClick={saveEdit} className="p-2 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/20 rounded-[var(--radius-main)] transition-all active:scale-95 shadow-sm hover:bg-green-100 dark:hover:bg-green-500/20">
                                                            <CheckIcon className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => setEditingId(null)} className="p-2 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10 rounded-[var(--radius-main)] transition-all active:scale-95 shadow-sm hover:bg-gray-200 dark:hover:bg-white/10">
                                                            <XIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between gap-4">
                                                    <p className="text-gray-700 dark:text-gray-200 text-sm font-semibold leading-relaxed whitespace-pre-wrap break-words">
                                                        {msg.text}
                                                    </p>

                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                        <button onClick={() => handleMove(index, 'up')} disabled={index === 0 || isReordering} className="p-3 text-gray-400 hover:text-indigo-500 disabled:opacity-0 min-h-[44px] min-w-[44px] flex items-center justify-center"><ArrowUpIcon className="w-4 h-4" /></button>
                                                        <span className="text-[10px] text-gray-400 font-bold min-w-[12px] text-center">{index + 1}</span>
                                                        <button onClick={() => handleMove(index, 'down')} disabled={index === messages.length - 1 || isReordering} className="p-3 text-gray-400 hover:text-indigo-500 disabled:opacity-0 min-h-[44px] min-w-[44px] flex items-center justify-center"><ArrowDownIcon className="w-4 h-4" /></button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className={`flex items-center gap-2 shrink-0 ${isRTL ? 'border-r pr-4' : 'border-l pl-4'} border-gray-100 dark:border-white/5`}>
                                            <DeleteButton
                                                onClick={() => onDelete(msg.id)}
                                                className="!h-10 !min-w-[44px] !bg-white dark:!bg-white/5"
                                            />

                                            <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1" />

                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => onAdd(msg.text)}
                                                    title={t('duplicate_message')}
                                                    className="p-2 bg-white dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-gray-400 hover:text-indigo-500 rounded-[var(--radius-main)] transition-all border border-gray-200 dark:border-white/10"
                                                >
                                                    <LayersIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => { setEditingId(msg.id); setEditText(msg.text); }}
                                                    title={t('edit_message')}
                                                    className="p-2 bg-white dark:bg-white/5 hover:bg-green-50 dark:hover:bg-green-500/10 text-gray-400 hover:text-green-500 rounded-[var(--radius-main)] transition-all border border-gray-200 dark:border-white/10"
                                                >
                                                    <EditIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </MotionDiv>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

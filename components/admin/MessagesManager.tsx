
import React, { useState } from 'react';
import { TickerMessage } from '../../types';
import { SparklesIcon, PlusIcon, EditIcon, LayersIcon } from '../ui/Icons';
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
    const { t } = useLanguage();
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
            showToast(t('save'), 'success');
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
                showToast(t('save'), 'success');
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
        <div className="max-w-5xl mx-auto space-y-8 flex flex-col h-full px-4">
            
            <div className="flex flex-col gap-1">
                <h2 className="text-3xl font-black text-white flex items-center gap-3">
                    <LayersIcon className="w-8 h-8 text-cyan-400" /> {t('messages_mgmt_title')}
                </h2>
                <p className="text-slate-400 font-medium ltr:ml-11 rtl:mr-11">{t('messages_mgmt_desc')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/10 shadow-xl">
                        <h3 className="text-lg font-black text-white mb-4 uppercase tracking-wider">{t('add_message_card')}</h3>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <textarea value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder={t('write_encouraging_msg')} className="w-full h-32 bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm focus:border-cyan-400 outline-none resize-none" />
                            <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-wide">
                                <PlusIcon className="w-5 h-5" /> {t('add_to_list')}
                            </button>
                        </form>
                    </div>
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/10 shadow-xl">
                        <h3 className="text-xs font-black text-slate-500 mb-4 flex items-center gap-2 uppercase tracking-widest"><SparklesIcon className="w-4 h-4" /> {t('smart_tags')}</h3>
                        <div className="flex flex-wrap gap-2">
                            {placeholders.map(ph => <button key={ph.value} onClick={() => insertPlaceholder(ph.value)} className="bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg px-2.5 py-1.5 text-[10px] font-black text-cyan-300 uppercase tracking-tighter transition-colors">{ph.label}</button>)}
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-2 bg-white/5 p-6 rounded-3xl border border-white/10 flex flex-col min-h-[400px] shadow-xl overflow-hidden relative">
                    <h3 className="text-lg font-black text-white mb-4 uppercase tracking-wider">{t('active_messages_list', { count: messages.length })}</h3>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
                        <AnimatePresence initial={false}>
                            {messages.map((msg, index) => (
                                <MotionDiv key={msg.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`p-4 rounded-2xl border flex gap-3 ${editingId === msg.id ? 'bg-cyan-900/30 border-cyan-500' : 'bg-slate-900/50 border-white/5'}`}>
                                    <div className="flex flex-col gap-2 items-center justify-center shrink-0 ltr:border-r rtl:border-l border-white/5 ltr:pr-3 rtl:pl-3 ltr:mr-1 rtl:ml-1">
                                        <button onClick={() => handleMove(index, 'up')} disabled={index === 0 || isReordering} className="p-3 min-w-[44px] min-h-[44px] text-slate-500 hover:text-white rounded-lg transition-colors active:scale-95"><ArrowUpIcon className="w-5 h-5" /></button>
                                        <span className="text-[10px] text-slate-600 font-black">{index + 1}</span>
                                        <button onClick={() => handleMove(index, 'down')} disabled={index === messages.length - 1 || isReordering} className="p-3 min-w-[44px] min-h-[44px] text-slate-500 hover:text-white rounded-lg transition-colors active:scale-95"><ArrowDownIcon className="w-5 h-5" /></button>
                                    </div>
                                    <div className="flex-1 flex flex-col gap-2 min-w-0">
                                        {editingId === msg.id ? (
                                            <>
                                                <textarea value={editText} onChange={e => setEditText(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-xl p-2 text-white outline-none resize-none h-20" />
                                                <div className="flex gap-3 justify-end"><button onClick={saveEdit} className="bg-green-600 text-white px-4 py-2.5 min-h-[44px] rounded-lg text-xs font-black uppercase active:scale-95 transition-all">{t('save')}</button><button onClick={() => setEditingId(null)} className="bg-slate-700 text-white px-4 py-2.5 min-h-[44px] rounded-lg text-xs font-black uppercase active:scale-95 transition-all">{t('cancel')}</button></div>
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-white text-base font-bold leading-relaxed">{msg.text}</p>
                                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
                                                    <div className="flex gap-4 items-center">
                                                        <DeleteButton onClick={() => onDelete(msg.id)} />
                                                        <button onClick={() => { setEditingId(msg.id); setEditText(msg.text); }} className="text-cyan-400 hover:text-cyan-200 text-[10px] font-black uppercase flex items-center gap-2 transition-colors"><EditIcon className="w-4 h-4" /> {t('edit_message')}</button>
                                                        <button onClick={() => onAdd(msg.text)} className="text-blue-400 hover:text-blue-200 text-[10px] font-black uppercase flex items-center gap-2 transition-colors"><LayersIcon className="w-4 h-4" /> {t('duplicate_message')}</button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </MotionDiv>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

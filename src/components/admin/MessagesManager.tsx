
import React, { useState } from 'react';
import { TickerMessage } from '../../types';
import { PlusIcon, LayersIcon, XIcon } from '../ui/Icons';
import { AdminRowActions } from '../ui/AdminRowActions';

import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../hooks/useLanguage';
import { useToast } from '../../hooks/useToast';

import { normalizeString } from '../../utils/stringUtils';
import { useErrorFormatter } from '../../utils/errorUtils';
import { useConfirmation } from '../../hooks/useConfirmation';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { AdminSectionCard } from '../ui/AdminSectionCard';
import { EditModal } from '../ui/EditModal';
import { AdminButton } from '../ui/AdminButton';

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
    const { modalConfig, openConfirmation } = useConfirmation();

    const placeholders = [
        { label: t('placeholder_institution_name'), value: t('tag_institution_name') },
        { label: t('placeholder_campaign_name'), value: t('tag_campaign_name') },
        { label: t('placeholder_institution_score'), value: t('tag_institution_score') },
        { label: t('placeholder_target_name'), value: t('tag_target_name') },
        { label: t('placeholder_target_score'), value: t('tag_target_score') },
        { label: t('placeholder_distance_from_target'), value: t('tag_distance_from_target') },
        { label: t('placeholder_group_1'), value: t('tag_group_1') },
        { label: t('placeholder_group_2'), value: t('tag_group_2') },
        { label: t('placeholder_group_3'), value: t('tag_group_3') },
        { label: t('placeholder_place_1'), value: t('tag_place_1') },
        { label: t('placeholder_place_2'), value: t('tag_place_2') },
        { label: t('placeholder_place_3'), value: t('tag_place_3') },
        { label: t('placeholder_random_participant'), value: t('tag_random_participant') },
        { label: t('placeholder_random_group'), value: t('tag_random_group') },
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
        <div className="max-w-6xl mx-auto space-y-8 pb-12 w-full">
            <ConfirmationModal 
                isOpen={modalConfig.isOpen}
                title={modalConfig.title}
                message={modalConfig.message}
                isDanger={modalConfig.isDanger}
                confirmText={modalConfig.confirmText}
                onConfirm={modalConfig.onConfirm}
                onCancel={modalConfig.onCancel}
                showCancel={modalConfig.showCancel}
            />
            <AdminSectionCard
                title={t('messages_mgmt_title')}
                description={t('messages_mgmt_desc')}
                icon={<LayersIcon className="w-5 h-5" />}
            >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[var(--bg-card)] p-6 rounded-[var(--radius-main)] border border-[var(--border-main)] shadow-sm">
                        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4">{t('add_message_card')}</label>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div className="relative">
                                <textarea
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    maxLength={150}
                                    placeholder={t('write_encouraging_msg')}
                                    className="w-full px-4 py-3 rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-input)] text-[var(--text-main)] text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm h-32 resize-none"
                                />
                                <div className={`absolute bottom-2 end-3 text-[9px] font-bold ${newMessage.length >= 140 ? 'text-red-500' : 'text-[var(--text-muted)] opacity-80'}`}>
                                    {newMessage.length}/150
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-x-1.5 gap-y-2 bg-[var(--bg-surface)] p-2 rounded-[var(--radius-main)] border border-[var(--border-subtle)] shadow-inner">
                                {placeholders.map(ph => (
                                    <button
                                        key={ph.value}
                                        type="button"
                                        onClick={() => insertPlaceholder(ph.value)}
                                        className="group relative h-6 transition-all active:scale-95 bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-indigo-700 dark:text-indigo-400 rounded-full px-3 text-xs font-semibold shadow-sm"
                                    >
                                        {ph.label}
                                    </button>
                                ))}
                            </div>

                            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-[var(--radius-main)] shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 uppercase tracking-wide active:scale-95">
                                <PlusIcon className="w-4 h-4" /> {t('add_new_message')}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    <h4 className="text-[var(--fs-sm)] font-[var(--fw-bold)] text-[var(--text-muted)] uppercase tracking-wider flex justify-between items-center px-1">
                        <span>{t('active_messages_list', { count: messages.length })}</span>
                    </h4>

                    <div className="bg-[var(--bg-surface)] rounded-[var(--radius-main)] border border-[var(--border-main)] min-h-[300px] max-h-[450px] overflow-y-auto custom-scrollbar p-3 space-y-3 relative shadow-inner">
                        <AnimatePresence initial={false}>
                            {messages.length === 0 ? (
                                <div className="absolute inset-0 flex items-center justify-center text-[var(--text-muted)] text-[var(--fs-base)] italic font-[var(--fw-bold)]">
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
                                        className="group p-4 rounded-[var(--radius-main)] border flex items-start justify-between gap-4 transition-all bg-[var(--bg-card)] border-[var(--border-subtle)] shadow-sm hover:border-[var(--border-main)] hover:bg-[var(--bg-hover)]"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-4">
                                                <p className="text-[var(--text-main)] text-[var(--fs-base)] font-[var(--fw-bold)] leading-relaxed whitespace-pre-wrap break-words opacity-90">
                                                    {msg.text}
                                                </p>

                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                    <button onClick={() => handleMove(index, 'up')} disabled={index === 0 || isReordering} className="p-3 text-[var(--text-muted)] hover:text-indigo-700 disabled:opacity-0 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"><ArrowUpIcon className="w-4 h-4" /></button>
                                                    <span className="text-[var(--fs-sm)] text-[var(--text-main)] font-[var(--fw-bold)] min-w-[12px] text-center">{index + 1}</span>
                                                    <button onClick={() => handleMove(index, 'down')} disabled={index === messages.length - 1 || isReordering} className="p-3 text-[var(--text-muted)] hover:text-indigo-700 disabled:opacity-0 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"><ArrowDownIcon className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0 border-s ps-4 border-[var(--border-subtle)]">
                                            <AdminRowActions
                                                onDelete={() => {
                                                    openConfirmation({
                                                        title: t('delete_message'),
                                                        message: t('confirm_deletion'),
                                                        confirmText: t('delete_message'),
                                                        isDanger: true,
                                                        onConfirm: () => onDelete(msg.id)
                                                    });
                                                }}
                                                onEdit={() => { setEditingId(msg.id); setEditText(msg.text); }}
                                                onSecondary={() => onAdd(msg.text)}
                                                secondaryIcon={<LayersIcon className="w-4 h-4" />}
                                                secondaryTitle={t('duplicate_message')}
                                                editTitle={t('edit_message')}
                                            />
                                        </div>
                                    </MotionDiv>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </AdminSectionCard>

        {/* Message Edit Modal */}
        <EditModal 
            isOpen={!!editingId} 
            onClose={() => { setEditingId(null); setEditText(''); }} 
            title={t('edit_message')}
        >
            <form onSubmit={(e) => { e.preventDefault(); saveEdit(); }} className="space-y-6">
                <div className="relative">
                    <textarea
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        maxLength={150}
                        className="w-full px-4 py-3 rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-input)] text-[var(--text-main)] text-[var(--fs-base)] outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm h-32 resize-none font-[var(--fw-bold)]"
                        autoFocus
                    />
                    <div className={`absolute bottom-2 end-3 text-[10px] font-bold ${editText.length >= 140 ? 'text-red-500' : 'text-[var(--text-muted)] opacity-80'}`}>
                        {editText.length}/150
                    </div>
                </div>

                <div className="flex flex-wrap gap-x-1.5 gap-y-2 bg-[var(--bg-surface)] p-2 rounded-[var(--radius-main)] border border-[var(--border-subtle)] shadow-inner">
                    {placeholders.map(ph => (
                        <button
                            key={ph.value}
                            type="button"
                            onClick={() => insertPlaceholder(ph.value)}
                            className="group relative h-6 transition-all active:scale-95 bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-main)] text-indigo-700 dark:text-indigo-400 rounded-full px-3 text-xs font-semibold shadow-sm"
                        >
                            {ph.label}
                        </button>
                    ))}
                </div>

                <div className="flex gap-3 pt-4 border-t border-[var(--border-subtle)]">
                    <AdminButton type="submit" variant="success" size="md" className="flex-1">
                        {t('save')}
                    </AdminButton>
                    <AdminButton type="button" variant="secondary" size="md" onClick={() => { setEditingId(null); setEditText(''); }} className="flex-1">
                        {t('cancel')}
                    </AdminButton>
                </div>
            </form>
        </EditModal>
    </div>
    );
};

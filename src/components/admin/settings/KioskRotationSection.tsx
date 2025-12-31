import React, { useState } from 'react';
import { AppSettings } from '../../../types';
import { useLanguage } from '../../../hooks/useLanguage';
import { AdminSectionCard } from '../../ui/AdminSectionCard';
import { RefreshIcon, PlusIcon, XIcon, GlobeIcon, ClockIcon, EditIcon, CheckIcon } from '../../ui/Icons';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as any;

interface KioskRotationSectionProps {
    settings: Partial<AppSettings>;
    onUpdate: (updates: Partial<AppSettings>) => void;
}

export const KioskRotationSection: React.FC<KioskRotationSectionProps> = ({ settings, onUpdate }) => {
    const { t, isRTL } = useLanguage();
    
    const config = settings.rotation_config || [];
    const rotationInterval = settings.rotation_interval || 30;
    const enabled = settings.rotation_enabled || false;
    
    const [newUrl, setNewUrl] = useState('');
    const [editingIdx, setEditingIdx] = useState<number | null>(null);
    const [editUrl, setEditUrl] = useState('');
    const [editDuration, setEditDuration] = useState(30);

    const handleAddUrl = () => {
        const trimmedUrl = newUrl.trim();
        if (trimmedUrl && !config.some(i => i.url === trimmedUrl)) {
            const updated = [...config, { url: trimmedUrl, duration: rotationInterval }];
            onUpdate({ rotation_config: updated });
            setNewUrl('');
        }
    };

    const removeUrl = (index: number) => {
        const updated = config.filter((_, i) => i !== index);
        onUpdate({ rotation_config: updated });
    };

    const startEdit = (idx: number) => {
        setEditingIdx(idx);
        setEditUrl(config[idx].url);
        setEditDuration(config[idx].duration);
    };

    const saveEdit = () => {
        if (editingIdx === null) return;
        const updated = [...config];
        updated[editingIdx] = { url: editUrl.trim(), duration: editDuration };
        onUpdate({ rotation_config: updated });
        setEditingIdx(null);
    };

    const toggleEnabled = () => {
        onUpdate({ rotation_enabled: !enabled });
    };

    return (
        <AdminSectionCard
            title={t('kiosk_rotation_title' as any)}
            description={t('kiosk_rotation_desc' as any)}
            icon={<RefreshIcon className="w-6 h-6" />}
            rightAction={
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={toggleEnabled}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${enabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? (isRTL ? '-translate-x-6' : 'translate-x-6') : (isRTL ? '-translate-x-1' : 'translate-x-1')}`} />
                    </button>
                    <span className="text-[var(--fs-sm)] font-[var(--fw-bold)] text-[var(--text-main)]">
                        {enabled ? t('active_status') : t('inactive_status')}
                    </span>
                </div>
            }
        >
            <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <label className="block text-[var(--fs-sm)] font-[var(--fw-bold)] text-[var(--text-muted)] uppercase tracking-wider">
                            {t('rotation_urls_label' as any)}
                        </label>
                        
                        <div className="flex gap-2 items-stretch h-12">
                            <div className="flex-1 flex items-center gap-3 px-4 rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-input)] focus-within:ring-2 focus-within:ring-indigo-500 transition-all shadow-sm">
                                <GlobeIcon className="w-5 h-5 text-[var(--text-muted)] shrink-0" />
                                <input
                                    value={newUrl}
                                    onChange={e => setNewUrl(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddUrl())}
                                    placeholder="https://example.com"
                                    className="flex-1 bg-transparent border-none outline-none text-[var(--text-main)] text-body min-w-0 h-full"
                                />
                            </div>
                            <button 
                                type="button" 
                                onClick={handleAddUrl}
                                className="w-12 h-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-[var(--radius-main)] transition-all active:scale-95 shadow-md shadow-indigo-500/20 shrink-0"
                            >
                                <PlusIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <AnimatePresence initial={false}>
                                {config.map((item, idx) => (
                                    <MotionDiv
                                        key={item.url + idx}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] overflow-hidden shadow-sm"
                                    >
                                        {editingIdx === idx ? (
                                            <div className="p-4 space-y-4 bg-indigo-50/30 dark:bg-indigo-500/5">
                                                <div className="flex gap-2">
                                                    <input 
                                                        value={editUrl}
                                                        onChange={e => setEditUrl(e.target.value)}
                                                        className="flex-1 px-3 py-2 rounded-lg border border-[var(--border-main)] bg-[var(--bg-input)] text-sm"
                                                    />
                                                    <button onClick={saveEdit} className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                                        <CheckIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <ClockIcon className="w-4 h-4 text-[var(--text-muted)]" />
                                                    <input 
                                                        type="range" min="5" max="300" step="5"
                                                        value={editDuration}
                                                        onChange={e => setEditDuration(Number(e.target.value))}
                                                        className="flex-1 h-1.5 accent-indigo-600"
                                                    />
                                                    <span className="text-xs font-bold text-indigo-600 min-w-[3rem] text-end">{editDuration}s</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-3 flex items-center justify-between group">
                                                <div className="flex-1 min-w-0 flex items-center gap-3">
                                                    <GlobeIcon className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="text-[var(--fs-sm)] text-[var(--text-main)] truncate font-medium">{item.url}</p>
                                                        <p className="text-[var(--fs-xs)] text-[var(--text-muted)] flex items-center gap-1">
                                                            <ClockIcon className="w-3 h-3" /> {item.duration} {t('seconds' as any)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => startEdit(idx)} className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg">
                                                        <EditIcon className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => removeUrl(idx)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg">
                                                        <XIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </MotionDiv>
                                ))}
                            </AnimatePresence>
                            {config.length === 0 && (
                                <div className="text-center py-10 text-[var(--text-muted)] italic border-2 border-dashed border-[var(--border-subtle)] rounded-xl bg-[var(--bg-surface)]/50">
                                    {t('no_urls_added' as any)}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="p-5 bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl shadow-sm">
                            <h4 className="text-[var(--fs-sm)] font-[var(--fw-bold)] text-indigo-900 dark:text-indigo-100 mb-2 flex items-center gap-2">
                                <ClockIcon className="w-4 h-4" />
                                {t('global_kiosk_settings' as any)}
                            </h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[var(--fs-xs)] text-[var(--text-muted)] uppercase tracking-wider font-bold">{t('default_interval_label' as any)}</span>
                                    <span className="text-[var(--fs-sm)] font-bold text-indigo-600">{rotationInterval}s</span>
                                </div>
                                <input
                                    type="range" min="5" max="300" step="5"
                                    value={rotationInterval}
                                    onChange={e => onUpdate({ rotation_interval: Number(e.target.value) })}
                                    className="w-full h-1.5 bg-indigo-200 dark:bg-indigo-900 rounded-full appearance-none cursor-pointer accent-indigo-600"
                                />
                                <p className="text-[var(--fs-xs)] text-indigo-600/70 italic leading-relaxed">
                                    {t('global_interval_desc' as any)}
                                </p>
                            </div>
                        </div>

                        <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-[var(--radius-main)] space-y-3 shadow-sm">
                            <p className="text-[var(--fs-sm)] text-amber-700 dark:text-amber-400 font-[var(--fw-medium)] leading-relaxed">
                                💡 <strong>{t('kiosk_tip_title' as any)}</strong> {t('kiosk_tip_desc' as any)}
                            </p>
                            <p className="text-[var(--fs-xs)] text-amber-600/80 dark:text-amber-500/60 italic leading-snug">
                                {t('kiosk_security_note' as any)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AdminSectionCard>
    );
};
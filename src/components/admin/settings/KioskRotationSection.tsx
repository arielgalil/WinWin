import React, { useState } from 'react';
import { AppSettings } from '../../../types';
import { useLanguage } from '../../../hooks/useLanguage';
import { AdminSectionCard } from '../../ui/AdminSectionCard';
import { RefreshIcon, PlusIcon, XIcon, GlobeIcon, ClockIcon, EditIcon, CheckIcon, LayoutDashboardIcon, EyeIcon, EyeOffIcon } from '../../ui/Icons';
import { motion, AnimatePresence } from 'framer-motion';

const MotionDiv = motion.div as any;

import { KIOSK_CONSTANTS } from '../../../constants';

interface KioskRotationSectionProps {
    settings: Partial<AppSettings>;
    onUpdate: (updates: Partial<AppSettings>) => void;
    competitionName?: string;
    institutionName?: string;
}

// Special marker for dashboard entry
const DASHBOARD_URL = KIOSK_CONSTANTS.DASHBOARD_URL;

export const KioskRotationSection: React.FC<KioskRotationSectionProps> = ({ 
    settings, 
    onUpdate,
    competitionName = '',
    institutionName = ''
}) => {
    const { t, isRTL } = useLanguage();
    
    // Get external URLs only (filter out dashboard marker)
    const externalConfig = (settings.rotation_config || []).filter(i => i.url !== DASHBOARD_URL);
    // Get dashboard duration from config or use default
    const dashboardEntry = (settings.rotation_config || []).find(i => i.url === DASHBOARD_URL);
    const dashboardDuration = dashboardEntry?.duration || settings.rotation_interval || 30;
    
    const rotationInterval = settings.rotation_interval || 30;
    const enabled = settings.rotation_enabled || false;
    
    const [newUrl, setNewUrl] = useState('');
    const [editingIdx, setEditingIdx] = useState<number | null>(null);
    const [editUrl, setEditUrl] = useState('');
    const [editDuration, setEditDuration] = useState(30);
    const [editingDashboardDuration, setEditingDashboardDuration] = useState(false);
    const [tempDashboardDuration, setTempDashboardDuration] = useState(dashboardDuration);

    // Normalize URL - add https:// if missing
    const normalizeUrl = (url: string): string => {
        const trimmed = url.trim();
        if (!trimmed) return trimmed;
        // If already has protocol, return as-is
        if (/^https?:\/\//i.test(trimmed)) return trimmed;
        // Add https:// prefix
        return `https://${trimmed}`;
    };

    // Build full config with dashboard always first
    const buildFullConfig = (external: typeof externalConfig, dashDuration: number) => {
        return [{ url: DASHBOARD_URL, duration: dashDuration }, ...external];
    };

    const handleAddUrl = () => {
        const normalizedUrl = normalizeUrl(newUrl);
        if (normalizedUrl && !externalConfig.some(i => i.url === normalizedUrl)) {
            const updated = buildFullConfig([...externalConfig, { url: normalizedUrl, duration: rotationInterval, hidden: false }], dashboardDuration);
            onUpdate({ rotation_config: updated });
            setNewUrl('');
        }
    };

    const removeUrl = (index: number) => {
        const updated = buildFullConfig(externalConfig.filter((_, i) => i !== index), dashboardDuration);
        onUpdate({ rotation_config: updated });
    };

    const startEdit = (idx: number) => {
        setEditingIdx(idx);
        setEditUrl(externalConfig[idx].url);
        setEditDuration(externalConfig[idx].duration);
    };

    const saveEdit = () => {
        if (editingIdx === null) return;
        const updatedExternal = [...externalConfig];
        const normalizedUrl = normalizeUrl(editUrl);
        updatedExternal[editingIdx] = { ...updatedExternal[editingIdx], url: normalizedUrl, duration: editDuration };
        onUpdate({ rotation_config: buildFullConfig(updatedExternal, dashboardDuration) });
        setEditingIdx(null);
    };

    const toggleVisibility = (idx: number) => {
        const updatedExternal = [...externalConfig];
        updatedExternal[idx] = { ...updatedExternal[idx], hidden: !updatedExternal[idx].hidden };
        onUpdate({ rotation_config: buildFullConfig(updatedExternal, dashboardDuration) });
    };

    const saveDashboardDuration = () => {
        onUpdate({ rotation_config: buildFullConfig(externalConfig, tempDashboardDuration) });
        setEditingDashboardDuration(false);
    };

    const toggleEnabled = () => {
        onUpdate({ rotation_enabled: !enabled });
    };

    const dashboardLabel = `${t('competition_dashboard' as any)} ${competitionName}${institutionName ? ` - ${institutionName}` : ''}`;

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
                            {/* DASHBOARD ENTRY - Always First, Not Deletable */}
                            <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border-2 border-indigo-300 dark:border-indigo-500/30 overflow-hidden shadow-sm">
                                {editingDashboardDuration ? (
                                    <div className="p-4 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <LayoutDashboardIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                            <span className="flex-1 text-[var(--fs-sm)] font-bold truncate" style={{ color: 'var(--text-main, black)' }}>{dashboardLabel}</span>
                                            <button onClick={saveDashboardDuration} className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                                <CheckIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <ClockIcon className="w-4 h-4 text-[var(--text-muted)]" />
                                            <input 
                                                type="range" min="5" max="300" step="5"
                                                value={tempDashboardDuration}
                                                onChange={e => setTempDashboardDuration(Number(e.target.value))}
                                                className="flex-1 h-1.5 accent-indigo-600"
                                            />
                                            <span className="text-xs font-bold text-indigo-600 min-w-[3rem] text-end">{tempDashboardDuration}s</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-3 flex items-center justify-between group">
                                        <div className="flex-1 min-w-0 flex items-center gap-3">
                                            <LayoutDashboardIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-[var(--fs-sm)] truncate font-bold" style={{ color: 'var(--text-main, black)' }}>{dashboardLabel}</p>
                                                <p className="text-[var(--fs-xs)] text-indigo-800 dark:text-indigo-400/80 flex items-center gap-1">
                                                    <ClockIcon className="w-3 h-3" /> {dashboardDuration} {t('seconds' as any)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button 
                                                onClick={() => { setTempDashboardDuration(dashboardDuration); setEditingDashboardDuration(true); }} 
                                                className="p-2 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-lg"
                                            >
                                                <EditIcon className="w-4 h-4" />
                                            </button>
                                            {/* No delete button for dashboard */}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* External URLs */}
                            <AnimatePresence initial={false}>
                                {externalConfig.map((item, idx) => (
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
                                            <div className={`p-3 flex items-center justify-between group ${item.hidden ? 'opacity-50' : ''}`}>
                                                <div className="flex-1 min-w-0 flex items-center gap-3">
                                                    <GlobeIcon className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className={`text-[var(--fs-sm)] truncate font-medium ${item.hidden ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-main)]'}`}>{item.url}</p>
                                                        <p className="text-[var(--fs-xs)] text-[var(--text-muted)] flex items-center gap-1">
                                                            <ClockIcon className="w-3 h-3" /> {item.duration} {t('seconds' as any)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button 
                                                        onClick={() => toggleVisibility(idx)} 
                                                        className={`p-2 rounded-lg transition-colors ${item.hidden ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-500/10'}`}
                                                        title={item.hidden ? t('show_site' as any) : t('hide_site' as any)}
                                                    >
                                                        {item.hidden ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                                                    </button>
                                                    <button onClick={() => startEdit(idx)} className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <EditIcon className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => removeUrl(idx)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <XIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </MotionDiv>
                                ))}
                            </AnimatePresence>
                            {externalConfig.length === 0 && (
                                <div className="text-center py-6 text-[var(--text-muted)] italic border-2 border-dashed border-[var(--border-subtle)] rounded-xl bg-[var(--bg-surface)]/50">
                                    {t('add_external_sites' as any)}
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
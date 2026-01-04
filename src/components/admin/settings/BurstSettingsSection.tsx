import React from 'react';
import { useLanguage } from '../../../hooks/useLanguage';
import { AppSettings } from '../../../types';
import { AdminSectionCard } from '../../ui/AdminSectionCard';
import { SparklesIcon, Volume2Icon, CheckIcon } from '../../ui/Icons';

interface BurstSettingsSectionProps {
    settings: Partial<AppSettings>;
    onUpdate: (updates: Partial<AppSettings>) => void;
}

export const BurstSettingsSection: React.FC<BurstSettingsSectionProps> = ({ settings, onUpdate }) => {
    const { t, isRTL } = useLanguage();

    const burstTypes = [
        { id: 'GOAL_REACHED', label: t('type_goal_reached') },
        { id: 'LEADER_CHANGE', label: t('type_leader_change') },
        { id: 'STAR_STUDENT', label: t('type_star_student') },
        { id: 'CLASS_BOOST', label: t('type_class_boost') },
        { id: 'SHOUTOUT', label: t('type_shoutout') },
    ];

    const toggleBurstType = (typeId: string) => {
        const currentTypes = settings.enabled_burst_types || ['GOAL_REACHED', 'LEADER_CHANGE', 'STAR_STUDENT', 'CLASS_BOOST', 'SHOUTOUT'];
        if (currentTypes.includes(typeId)) {
            onUpdate({ enabled_burst_types: currentTypes.filter(t => t !== typeId) });
        } else {
            onUpdate({ enabled_burst_types: [...currentTypes, typeId] });
        }
    };

    return (
        <AdminSectionCard
            title={t('burst_notifications_title')}
            description={t('burst_notifications_desc')}
            icon={<SparklesIcon className="w-6 h-6" />}
        >
            <div className="space-y-8">
                {/* Master Toggle */}
                <div className="flex items-center justify-between p-4 bg-[var(--bg-surface)] rounded-[var(--radius-main)] border border-[var(--border-subtle)] shadow-inner">
                    <span className="text-[var(--fs-base)] font-[var(--fw-bold)] text-[var(--text-main)]">{t('master_burst_toggle')}</span>
                    <button
                        type="button"
                        onClick={() => onUpdate({ burst_notifications_enabled: !settings.burst_notifications_enabled })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings.burst_notifications_enabled !== false ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-700'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.burst_notifications_enabled !== false ? (isRTL ? '-translate-x-6' : 'translate-x-6') : (isRTL ? '-translate-x-1' : 'translate-x-1')}`} />
                    </button>
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 transition-opacity ${settings.burst_notifications_enabled === false ? 'opacity-50 pointer-events-none' : ''}`}>
                    {/* Thresholds */}
                    <div className="space-y-6">
                        <div className="space-y-1">
                            <label className="block text-small font-[var(--fw-bold)] text-[var(--text-muted)] uppercase tracking-wider mb-2">{t('student_jump_threshold')}</label>
                            <input
                                type="number"
                                value={settings.burst_student_threshold ?? 50}
                                onChange={e => onUpdate({ burst_student_threshold: parseInt(e.target.value) || 0 })}
                                className="w-full px-4 py-3 rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-input)] text-[var(--text-main)] font-[var(--fw-bold)] focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-body shadow-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-small font-[var(--fw-bold)] text-[var(--text-muted)] uppercase tracking-wider mb-2">{t('class_boost_threshold')}</label>
                            <input
                                type="number"
                                value={settings.burst_class_threshold ?? 100}
                                onChange={e => onUpdate({ burst_class_threshold: parseInt(e.target.value) || 0 })}
                                className="w-full px-4 py-3 rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-input)] text-[var(--text-main)] font-[var(--fw-bold)] focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-body shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Sound Settings */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-[var(--bg-surface)] rounded-[var(--radius-main)] border border-[var(--border-subtle)] shadow-inner">
                            <span className="text-body font-[var(--fw-bold)] text-[var(--text-main)]">{t('burst_sounds_enabled')}</span>
                            <button
                                type="button"
                                onClick={() => onUpdate({ burst_sounds_enabled: !settings.burst_sounds_enabled })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings.burst_sounds_enabled !== false ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-700'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.burst_sounds_enabled !== false ? (isRTL ? '-translate-x-6' : 'translate-x-6') : (isRTL ? '-translate-x-1' : 'translate-x-1')}`} />
                            </button>
                        </div>
                        <div className={`space-y-2 transition-opacity ${settings.burst_sounds_enabled === false ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div className="flex justify-between items-center px-1">
                                <label className="block text-small font-[var(--fw-bold)] text-[var(--text-muted)] uppercase tracking-wider">{t('burst_volume')}</label>
                                <span className="text-small font-[var(--fw-bold)] text-indigo-600">{settings.burst_volume ?? 50}%</span>
                            </div>
                            <div className="flex items-center gap-4 group bg-[var(--bg-surface)] p-4 rounded-[var(--radius-main)] border border-[var(--border-subtle)] shadow-inner">
                                <Volume2Icon className="w-5 h-5 text-[var(--text-muted)]" />
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={settings.burst_volume ?? 50}
                                    onChange={e => onUpdate({ burst_volume: parseInt(e.target.value) })}
                                    className="flex-1 h-1.5 bg-[var(--bg-card)] rounded-full appearance-none cursor-pointer accent-indigo-600 border border-[var(--border-subtle)]"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enabled Burst Types */}
                <div className={`pt-6 border-t border-[var(--border-subtle)] transition-opacity ${settings.burst_notifications_enabled === false ? 'opacity-50 pointer-events-none' : ''}`}>
                    <label className="block text-small font-[var(--fw-bold)] text-[var(--text-muted)] uppercase tracking-wider mb-4">{t('enabled_burst_types')}</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {burstTypes.map(type => (
                            <button
                                key={type.id}
                                type="button"
                                onClick={() => toggleBurstType(type.id)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-[var(--radius-main)] border transition-all ${
                                    (settings.enabled_burst_types || ['GOAL_REACHED', 'LEADER_CHANGE', 'STAR_STUDENT', 'CLASS_BOOST', 'SHOUTOUT']).includes(type.id)
                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-900 dark:text-indigo-400 font-[var(--fw-bold)]'
                                        : 'border-[var(--border-main)] hover:bg-[var(--bg-hover)] text-[var(--text-main)]'
                                }`}
                            >
                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                                    (settings.enabled_burst_types || ['GOAL_REACHED', 'LEADER_CHANGE', 'STAR_STUDENT', 'CLASS_BOOST', 'SHOUTOUT']).includes(type.id)
                                        ? 'border-indigo-500 bg-indigo-500 text-white'
                                        : 'border-[var(--text-muted)]'
                                }`}>
                                    {(settings.enabled_burst_types || ['GOAL_REACHED', 'LEADER_CHANGE', 'STAR_STUDENT', 'CLASS_BOOST', 'SHOUTOUT']).includes(type.id) && <CheckIcon className="w-3.5 h-3.5" />}
                                </div>
                                <span className="text-body">{type.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </AdminSectionCard>
    );
};

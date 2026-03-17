import React, { useState } from 'react';
import { AdminSectionCard } from '@/components/ui/AdminSectionCard';
import { AdminButton } from '@/components/ui/AdminButton';
import { PlusIcon, XIcon, SettingsIcon } from '@/components/ui/Icons';
import { MessagesManager } from '@/components/admin/MessagesManager';
import { useDemoContext } from './DemoContext';
import { ScorePreset } from '@/types';

// ── Visual & Branding ─────────────────────────────────────────────────────────

const BrandingSection: React.FC = () => {
    const { settings, updateSettings } = useDemoContext();
    const [name, setName] = useState(settings.competition_name);
    const [school, setSchool] = useState(settings.school_name);

    const save = () => updateSettings({ competition_name: name, school_name: school });

    return (
        <AdminSectionCard title="מיתוג וזהות" icon={<SettingsIcon className="w-6 h-6" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-[var(--fs-sm)] font-[var(--fw-bold)] text-[var(--text-muted)] uppercase tracking-wider mb-2">
                        שם התחרות
                    </label>
                    <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        onBlur={save}
                        className="w-full px-4 py-2.5 rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-input)] text-[var(--text-main)] outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <div>
                    <label className="block text-[var(--fs-sm)] font-[var(--fw-bold)] text-[var(--text-muted)] uppercase tracking-wider mb-2">
                        שם בית הספר
                    </label>
                    <input
                        value={school}
                        onChange={e => setSchool(e.target.value)}
                        onBlur={save}
                        className="w-full px-4 py-2.5 rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-input)] text-[var(--text-main)] outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>
        </AdminSectionCard>
    );
};

// ── Visual Design ─────────────────────────────────────────────────────────────

const VisualSection: React.FC = () => {
    const { settings, updateSettings } = useDemoContext();

    return (
        <AdminSectionCard title="עיצוב ויזואלי">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                    <label className="block text-[var(--fs-sm)] font-[var(--fw-bold)] text-[var(--text-muted)] uppercase tracking-wider mb-2">
                        צבע ראשי
                    </label>
                    <div className="flex items-center gap-3">
                        <input
                            type="color"
                            value={settings.primary_color || '#7c3aed'}
                            onChange={e => updateSettings({ primary_color: e.target.value })}
                            className="w-10 h-10 rounded-lg cursor-pointer border border-[var(--border-main)] bg-transparent"
                        />
                        <span className="text-sm font-mono text-[var(--text-muted)]">
                            {settings.primary_color}
                        </span>
                    </div>
                </div>
                <div>
                    <label className="block text-[var(--fs-sm)] font-[var(--fw-bold)] text-[var(--text-muted)] uppercase tracking-wider mb-2">
                        צבע משני
                    </label>
                    <div className="flex items-center gap-3">
                        <input
                            type="color"
                            value={settings.secondary_color || '#0f172a'}
                            onChange={e => updateSettings({ secondary_color: e.target.value })}
                            className="w-10 h-10 rounded-lg cursor-pointer border border-[var(--border-main)] bg-transparent"
                        />
                        <span className="text-sm font-mono text-[var(--text-muted)]">
                            {settings.secondary_color}
                        </span>
                    </div>
                </div>
                <div>
                    <label className="block text-[var(--fs-sm)] font-[var(--fw-bold)] text-[var(--text-muted)] uppercase tracking-wider mb-2">
                        בהירות רקע: {settings.background_brightness ?? 60}%
                    </label>
                    <input
                        type="range"
                        min={10}
                        max={100}
                        value={settings.background_brightness ?? 60}
                        onChange={e => updateSettings({ background_brightness: Number(e.target.value) })}
                        className="w-full accent-indigo-500"
                    />
                </div>
            </div>
        </AdminSectionCard>
    );
};

// ── Score Presets ─────────────────────────────────────────────────────────────

const PresetsSection: React.FC = () => {
    const { settings, updateSettings } = useDemoContext();
    const presets: ScorePreset[] = settings.score_presets || [];
    const [newLabel, setNewLabel] = useState('');
    const [newValue, setNewValue] = useState('');

    const add = () => {
        const val = parseInt(newValue, 10);
        if (!newLabel.trim() || isNaN(val)) return;
        updateSettings({ score_presets: [...presets, { label: newLabel.trim(), value: val }] });
        setNewLabel('');
        setNewValue('');
    };

    const remove = (i: number) => {
        updateSettings({ score_presets: presets.filter((_, idx) => idx !== i) });
    };

    return (
        <AdminSectionCard title="פריסות ניקוד מהיר">
            <div className="flex flex-wrap gap-2 mb-4">
                {presets.map((p, i) => (
                    <div key={i} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-main)] text-sm font-bold">
                        <span>{p.label}</span>
                        <button onClick={() => remove(i)} className="text-[var(--text-muted)] hover:text-red-400 transition-colors ms-1">
                            <XIcon className="w-3 h-3" />
                        </button>
                    </div>
                ))}
                {presets.length === 0 && (
                    <span className="text-sm text-[var(--text-muted)] opacity-60">אין פריסות מוגדרות</span>
                )}
            </div>
            <div className="flex gap-2 flex-wrap">
                <input
                    value={newLabel}
                    onChange={e => setNewLabel(e.target.value)}
                    placeholder="תווית (למשל +10)"
                    className="px-3 py-2 rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-input)] text-[var(--text-main)] outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-32"
                />
                <input
                    type="number"
                    value={newValue}
                    onChange={e => setNewValue(e.target.value)}
                    placeholder="ערך"
                    className="px-3 py-2 rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-input)] text-[var(--text-main)] outline-none focus:ring-2 focus:ring-indigo-500 text-sm w-24"
                    onKeyDown={e => e.key === 'Enter' && add()}
                />
                <AdminButton onClick={add} variant="primary" icon={<PlusIcon className="w-4 h-4" />}>
                    הוסף
                </AdminButton>
            </div>
        </AdminSectionCard>
    );
};

// ── Burst Settings ────────────────────────────────────────────────────────────

const BurstSection: React.FC = () => {
    const { settings, updateSettings } = useDemoContext();

    return (
        <AdminSectionCard title="התראות פרץ">
            <div className="flex flex-col gap-4">
                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={settings.burst_notifications_enabled !== false}
                        onChange={e => updateSettings({ burst_notifications_enabled: e.target.checked })}
                        className="w-4 h-4 accent-indigo-500"
                    />
                    <span className="font-bold text-[var(--text-main)] text-sm">הפעל התראות פרץ</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[var(--fs-sm)] font-[var(--fw-bold)] text-[var(--text-muted)] uppercase tracking-wider mb-2">
                            סף ניקוד - תלמיד
                        </label>
                        <input
                            type="number"
                            value={settings.burst_student_threshold ?? 20}
                            onChange={e => updateSettings({ burst_student_threshold: Number(e.target.value) })}
                            className="w-full px-3 py-2 rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-input)] text-[var(--text-main)] outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-[var(--fs-sm)] font-[var(--fw-bold)] text-[var(--text-muted)] uppercase tracking-wider mb-2">
                            סף ניקוד - כיתה
                        </label>
                        <input
                            type="number"
                            value={settings.burst_class_threshold ?? 50}
                            onChange={e => updateSettings({ burst_class_threshold: Number(e.target.value) })}
                            className="w-full px-3 py-2 rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-input)] text-[var(--text-main)] outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                    </div>
                </div>
            </div>
        </AdminSectionCard>
    );
};

// ── Page ──────────────────────────────────────────────────────────────────────

export const DemoSettingsTab: React.FC = () => {
    const { tickerMessages, addTickerMessage, deleteTickerMessage, updateTickerMessage } = useDemoContext();

    return (
        <div className="space-y-[var(--admin-section-gap)] pb-12">
            <BrandingSection />
            <VisualSection />
            <PresetsSection />
            <BurstSection />
            <MessagesManager
                messages={tickerMessages}
                onAdd={addTickerMessage}
                onDelete={deleteTickerMessage}
                onUpdate={(id, updates) => updateTickerMessage(id, updates)}
            />
        </div>
    );
};

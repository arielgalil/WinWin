import React, { useState } from 'react';
import { AppSettings } from '../../types';
import { DatabaseIcon, DownloadIcon, UploadIcon, AlertIcon, CheckIcon, RefreshIcon, UsersIcon } from '../ui/Icons';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { supabase } from '../../supabaseClient';
import { useLanguage } from '../../hooks/useLanguage';
import { useSaveNotification } from '../../contexts/SaveNotificationContext';

import { useConfirmation } from '../../hooks/useConfirmation';

interface DataManagementProps {
    settings: AppSettings;
    onSave?: () => Promise<void>;
    onRefresh: () => Promise<void>;
}

export const DataManagement: React.FC<DataManagementProps> = ({ settings, onSave, onRefresh }) => {
    const { t } = useLanguage();
    const { triggerSave } = useSaveNotification();

    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const { modalConfig, openConfirmation } = useConfirmation();

    const handleExport = async (type: 'full' | 'settings' | 'staff' | 'structure') => {
        setIsExporting(true);
        try {
            const campaignId = settings.campaign_id;
            if (!campaignId) throw new Error("No campaign ID found");

            const timestamp = new Date().toISOString().split('T')[0];
            let data: any = { type, timestamp, campaign_name: settings.competition_name };
            let filename = `winwin_${type}_${timestamp}.json`;

            if (type === 'full' || type === 'settings') {
                data.settings = settings;
            }

            if (type === 'full' || type === 'structure') {
                const { data: cls } = await supabase.from('classes').select('*, students(*)').eq('campaign_id', campaignId);
                data.classes = cls;
            }

            if (type === 'full' || type === 'staff') {
                const { data: staff } = await supabase.from('campaign_users').select('role, profiles(*)').eq('campaign_id', campaignId);
                data.staff = staff;
            }

            if (type === 'full') {
                const { data: logs } = await supabase.from('action_logs').select('*').eq('campaign_id', campaignId);
                data.logs = logs;
            }

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setStatusMsg({ type: 'success', text: t('export_completed') });
        } catch (err: any) {
            setStatusMsg({ type: 'error', text: t('export_error', { error: err.message }) });
        } finally {
            setIsExporting(false);
        }
    };

    const handleImportTrigger = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        openConfirmation({
            title: t('restore_from_backup'),
            message: t('import_warning'),
            isDanger: true,
            onConfirm: () => processImport(file)
        });
        e.target.value = '';
    };

    const processImport = async (file: File) => {
        setIsImporting(true);
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            const campaignId = settings.campaign_id;

            if (!campaignId) throw new Error("Campaign ID missing");

            if (data.settings) {
                const { id, ...cleanSettings } = data.settings;
                await supabase.from('app_settings').update({
                    ...cleanSettings,
                    settings_updated_at: new Date().toISOString()
                }).eq('campaign_id', campaignId);
            }

            if (data.classes && Array.isArray(data.classes)) {
                await supabase.from('students').delete().eq('campaign_id', campaignId);
                await supabase.from('classes').delete().eq('campaign_id', campaignId);

                for (const cls of data.classes) {
                    const { data: newClass, error } = await supabase.from('classes').insert({
                        name: cls.name,
                        score: cls.score,
                        color: cls.color,
                        campaign_id: campaignId
                    }).select().single();

                    if (error) throw error;

                    if (cls.students && cls.students.length > 0) {
                        const studentsPayload = cls.students.map((s: any) => ({
                            name: s.name,
                            score: s.score,
                            class_id: newClass.id,
                            campaign_id: campaignId
                        }));
                        await supabase.from('students').insert(studentsPayload);
                    }
                }
            }

            triggerSave('data-management');
            if (onSave) await onSave();
            setStatusMsg({ type: 'success', text: t('import_success_refresh') });
            setTimeout(() => window.location.reload(), 2000);

        } catch (err: any) {
            setStatusMsg({ type: 'error', text: t('import_error', { error: err.message }) });
        } finally {
            setIsImporting(false);
        }
    };

    const handleReset = (mode: 'logs' | 'scores' | 'full') => {
        let msg = "";
        if (mode === 'logs') msg = t('reset_logs_warning');
        if (mode === 'scores') msg = t('reset_scores_warning');
        if (mode === 'full') msg = t('reset_full_warning');

        openConfirmation({
            title: t('reset_data_title'),
            message: msg,
            isDanger: true,
            onConfirm: async () => {
                setIsResetting(true);
                try {
                    const campaignId = settings.campaign_id;
                    if (!campaignId) return;

                    if (mode === 'logs' || mode === 'full') {
                        await supabase.from('action_logs').delete().eq('campaign_id', campaignId);
                    }

                    if (mode === 'scores' || mode === 'full') {
                        await supabase.from('students').update({ score: 0, prev_score: 0, trend: 'same' }).eq('campaign_id', campaignId);
                        await supabase.from('classes').update({ score: 0 }).eq('campaign_id', campaignId);
                    }

                    triggerSave('data-management');
                    if (onSave) await onSave();
                    setStatusMsg({ type: 'success', text: t('reset_success') });
                    onRefresh();
                } catch (err: any) {
                    setStatusMsg({ type: 'error', text: t('reset_error', { error: err.message }) });
                } finally {
                    setIsResetting(false);
                }
            }
        });
    };

    return (
        <div className="space-y-8 pb-12 w-full">
            <ConfirmationModal {...modalConfig} />

            <div className="bg-[var(--bg-card)] p-6 sm:p-8 rounded-[var(--radius-container)] border border-[var(--border-main)] shadow-sm space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4 border-b border-[var(--border-subtle)] pb-6">
                    <div className="w-12 h-12 flex items-center justify-center bg-indigo-50 dark:bg-indigo-500/10 rounded-[var(--radius-main)] border border-indigo-100 dark:border-indigo-500/20">
                        <DatabaseIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-[var(--text-main)] leading-none">{t('data_mgmt_title')}</h3>
                        <p className="text-[var(--text-secondary)] text-sm mt-1 font-medium">{t('data_mgmt_subtitle')}</p>
                    </div>
                </div>

                {statusMsg && (
                    <div className={`p-4 rounded-[var(--radius-main)] border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${statusMsg.type === 'success' ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400'}`}>
                        <CheckIcon className="w-5 h-5" />
                        <span className="font-bold text-sm">{statusMsg.text}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Export Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 flex items-center justify-center bg-[var(--bg-surface)] dark:bg-emerald-500/10 rounded-[var(--radius-main)] border border-[var(--border-main)] shadow-sm">
                                <DownloadIcon className="w-4 h-4 text-emerald-800 dark:text-emerald-400" />
                            </div>
                            <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">{t('export_backup_title')}</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => handleExport('full')} disabled={isExporting} className="group p-4 bg-[var(--bg-surface)] hover:bg-emerald-100 dark:hover:bg-emerald-500/10 border border-[var(--border-main)] hover:border-emerald-400 dark:hover:border-emerald-500/20 rounded-[var(--radius-main)] transition-all text-start shadow-sm active:scale-95 flex justify-between items-start gap-3">
                                <div className="flex-1">
                                    <div className="text-[var(--text-main)] font-black text-sm mb-1 group-hover:text-emerald-900 dark:group-hover:text-emerald-400">{t('full_backup')}</div>
                                    <div className="text-[10px] text-[var(--text-muted)] font-bold">{t('full_backup_desc' as any)}</div>
                                </div>
                                <DownloadIcon className="w-4 h-4 text-emerald-600/40 group-hover:text-emerald-600 shrink-0 mt-1" />
                            </button>
                            <button onClick={() => handleExport('structure')} disabled={isExporting} className="group p-4 bg-[var(--bg-surface)] hover:bg-emerald-100 dark:hover:bg-emerald-500/10 border border-[var(--border-main)] hover:border-emerald-400 dark:hover:border-emerald-500/20 rounded-[var(--radius-main)] transition-all text-start shadow-sm active:scale-95 flex justify-between items-start gap-3">
                                <div className="flex-1">
                                    <div className="text-[var(--text-main)] font-black text-sm mb-1 group-hover:text-emerald-900 dark:group-hover:text-emerald-400">{t('structure_backup')}</div>
                                    <div className="text-[10px] text-[var(--text-muted)] font-bold">{t('structure_backup_desc' as any)}</div>
                                </div>
                                <DownloadIcon className="w-4 h-4 text-emerald-600/40 group-hover:text-emerald-600 shrink-0 mt-1" />
                            </button>
                            <button onClick={() => handleExport('settings')} disabled={isExporting} className="group p-4 bg-[var(--bg-surface)] hover:bg-emerald-100 dark:hover:bg-emerald-500/10 border border-[var(--border-main)] hover:border-emerald-400 dark:hover:border-emerald-500/20 rounded-[var(--radius-main)] transition-all text-start shadow-sm active:scale-95 flex justify-between items-start gap-3">
                                <div className="flex-1">
                                    <div className="text-[var(--text-main)] font-black text-sm mb-1 group-hover:text-emerald-900 dark:group-hover:text-emerald-400">{t('settings_backup')}</div>
                                    <div className="text-[10px] text-[var(--text-muted)] font-bold">{t('settings_backup_desc' as any)}</div>
                                </div>
                                <DownloadIcon className="w-4 h-4 text-emerald-600/40 group-hover:text-emerald-600 shrink-0 mt-1" />
                            </button>
                            <button onClick={() => handleExport('staff')} disabled={isExporting} className="group p-4 bg-[var(--bg-surface)] hover:bg-emerald-100 dark:hover:bg-emerald-500/10 border border-[var(--border-main)] hover:border-emerald-400 dark:hover:border-emerald-500/20 rounded-[var(--radius-main)] transition-all text-start shadow-sm active:scale-95 flex justify-between items-start gap-3">
                                <div className="flex-1">
                                    <div className="text-[var(--text-main)] font-black text-sm mb-1 group-hover:text-emerald-900 dark:group-hover:text-emerald-400">{t('staff_backup')}</div>
                                    <div className="text-[10px] text-[var(--text-muted)] font-bold">{t('staff_backup_desc' as any)}</div>
                                </div>
                                <DownloadIcon className="w-4 h-4 text-emerald-600/40 group-hover:text-emerald-600 shrink-0 mt-1" />
                            </button>
                        </div>
                    </div>

                    {/* Import Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 flex items-center justify-center bg-[var(--bg-surface)] dark:bg-blue-500/10 rounded-[var(--radius-main)] border border-[var(--border-main)] shadow-sm">
                                <UploadIcon className="w-4 h-4 text-blue-800 dark:text-blue-400" />
                            </div>
                            <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">{t('data_restore_title')}</h4>
                        </div>
                        <label className={`w-full flex flex-col items-center justify-center p-8 bg-[var(--bg-surface)] border-2 border-dashed border-[var(--border-main)] rounded-[var(--radius-container)] hover:bg-blue-50 dark:hover:bg-blue-500/5 hover:border-blue-500 dark:hover:border-blue-500/30 transition-all cursor-pointer group ${isImporting ? 'opacity-50' : ''} shadow-inner`}>
                            <div className="w-12 h-12 bg-blue-200 dark:bg-blue-500/10 rounded-[var(--radius-main)] border border-blue-300 dark:border-blue-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform text-blue-800 dark:text-blue-400">
                                {isImporting ? <RefreshIcon className="w-6 h-6 animate-spin" /> : <UploadIcon className="w-6 h-6" />}
                            </div>
                            <span className="text-sm font-black text-[var(--text-main)] group-hover:text-blue-900 dark:group-hover:text-blue-400 transition-colors">{t('select_backup_file')}</span>
                            <input type="file" accept=".json" onChange={handleImportTrigger} className="hidden" disabled={isImporting} />
                        </label>
                    </div>
                </div>

                {/* Danger Zone */}
                {/* 3. Global Score (Left) - actually it's VersionFooter, checking where logo background is */}
                <div className="mt-10 pt-10 border-t border-[var(--border-subtle)]">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 flex items-center justify-center bg-red-100 dark:bg-red-500/10 rounded-[var(--radius-main)] border border-red-200">
                            <AlertIcon className="w-4 h-4 text-red-800 dark:text-red-400" />
                        </div>
                        <h4 className="text-xs font-black text-red-800 dark:text-red-400 uppercase tracking-widest leading-none">{t('danger_zone_title')}</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[var(--radius-main)] shadow-sm hover:border-red-400 dark:hover:border-red-500/20 transition-colors">
                            <div className="text-[var(--text-main)] font-black text-sm mb-1">{t('reset_logs_label')}</div>
                            <div className="text-[11px] text-[var(--text-muted)] font-bold mb-4 min-h-[2.5em]">{t('reset_logs_desc')}</div>
                            <button onClick={() => handleReset('logs')} disabled={isResetting} className="w-full py-2.5 bg-[var(--bg-card)] hover:bg-red-100 dark:hover:bg-red-500/10 text-[var(--text-main)] hover:text-red-800 dark:hover:text-red-400 rounded-[var(--radius-main)] text-xs font-black transition-all border border-[var(--border-main)] hover:border-red-400 dark:hover:border-red-500/20 active:scale-95 flex items-center justify-center gap-2 shadow-sm">
                                <AlertIcon className="w-3.5 h-3.5" />
                                {t('reset_logs_btn')}
                            </button>
                        </div>

                        <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[var(--radius-main)] shadow-sm hover:border-red-400 dark:hover:border-red-500/20 transition-colors">
                            <div className="text-[var(--text-main)] font-black text-sm mb-1">{t('reset_scores_label')}</div>
                            <div className="text-[11px] text-[var(--text-muted)] font-bold mb-4 min-h-[2.5em]">{t('reset_scores_desc')}</div>
                            <button onClick={() => handleReset('scores')} disabled={isResetting} className="w-full py-2.5 bg-[var(--bg-card)] hover:bg-red-100 dark:hover:bg-red-500/10 text-[var(--text-main)] hover:text-red-800 dark:hover:text-red-400 rounded-[var(--radius-main)] text-xs font-black transition-all border border-[var(--border-main)] hover:border-red-400 dark:hover:border-red-500/20 active:scale-95 flex items-center justify-center gap-2 shadow-sm">
                                <AlertIcon className="w-3.5 h-3.5" />
                                {t('reset_scores_btn')}
                            </button>
                        </div>

                        <div className="p-6 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[var(--radius-main)] shadow-sm hover:border-red-400 dark:hover:border-red-500/20 transition-colors">
                            <div className="text-[var(--text-main)] font-black text-sm mb-1">{t('reset_full_label')}</div>
                            <div className="text-[11px] text-[var(--text-muted)] font-bold mb-4 min-h-[2.5em]">{t('reset_full_desc')}</div>
                            <button onClick={() => handleReset('full')} disabled={isResetting} className="w-full py-2.5 bg-[var(--bg-card)] hover:bg-red-100 dark:hover:bg-red-500/10 text-[var(--text-main)] hover:text-red-800 dark:hover:text-red-400 rounded-[var(--radius-main)] text-xs font-black transition-all border border-[var(--border-main)] hover:border-red-400 dark:hover:border-red-500/20 active:scale-95 flex items-center justify-center gap-2 shadow-sm">
                                <AlertIcon className="w-3.5 h-3.5" />
                                {t('reset_all_btn')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

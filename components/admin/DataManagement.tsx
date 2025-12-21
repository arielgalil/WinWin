
import React, { useState } from 'react';
import { AppSettings, ClassRoom, UserProfile, ActionLog } from '../../types';
import { DatabaseIcon, DownloadIcon, UploadIcon, AlertIcon, TrashIcon, CheckIcon, RefreshIcon, UsersIcon } from '../ui/Icons';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { supabase } from '../../supabaseClient';
import { useCompetitionData } from '../../hooks/useCompetitionData';
import { useLanguage } from '../../hooks/useLanguage';

interface DataManagementProps {
    settings: AppSettings;
    classes: ClassRoom[];
    user: UserProfile;
}

export const DataManagement: React.FC<DataManagementProps> = ({ settings, classes, user }) => {
    const { t } = useLanguage();
    const { refreshData } = useCompetitionData();
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean; title: string; message: string; isDanger: boolean; onConfirm: () => void;
    }>({ isOpen: false, title: '', message: '', isDanger: false, onConfirm: () => { } });

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

        setModalConfig({
            isOpen: true,
            title: t('restore_from_backup'),
            message: t('import_warning'),
            isDanger: true,
            onConfirm: () => processImport(file)
        });
        e.target.value = '';
    };

    const processImport = async (file: File) => {
        setIsImporting(true);
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            const campaignId = settings.campaign_id;

            if (!campaignId) throw new Error("Campaign ID missing");

            if (data.settings) {
                const { id, ...cleanSettings } = data.settings;
                await supabase.from('app_settings').update(cleanSettings).eq('campaign_id', campaignId);
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

        setModalConfig({
            isOpen: true,
            title: t('reset_data_title'),
            message: msg,
            isDanger: true,
            onConfirm: async () => {
                setIsResetting(true);
                setModalConfig(prev => ({ ...prev, isOpen: false }));
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

                    setStatusMsg({ type: 'success', text: t('reset_success') });
                    refreshData();
                } catch (err: any) {
                    setStatusMsg({ type: 'error', text: t('reset_error', { error: err.message }) });
                } finally {
                    setIsResetting(false);
                }
            }
        });
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-10">
            <ConfirmationModal isOpen={modalConfig.isOpen} title={modalConfig.title} message={modalConfig.message} isDanger={modalConfig.isDanger} onConfirm={modalConfig.onConfirm} onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))} />
            <h2 className="text-3xl font-black text-white flex items-center gap-3"><DatabaseIcon className="w-8 h-8 text-cyan-400" /> {t('data_mgmt_title')}</h2>
            {statusMsg && <div className={`p-4 rounded-xl border flex items-center gap-3 ${statusMsg.type === 'success' ? 'bg-green-500/20 border-green-500/50 text-green-200' : 'bg-red-500/20 border-red-500/50 text-red-200'}`}><CheckIcon className="w-5 h-5" /> <span className="font-bold">{statusMsg.text}</span> </div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2"><DownloadIcon className="w-5 h-5 text-green-400" /> {t('export_backup_title')}</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => handleExport('full')} disabled={isExporting} className="p-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-xl text-white text-sm font-bold transition-all flex flex-col items-center gap-2"><DatabaseIcon className="w-5 h-5 text-blue-300" /> {t('full_backup')}</button>
                        <button onClick={() => handleExport('structure')} disabled={isExporting} className="p-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-xl text-white text-sm font-bold transition-all flex flex-col items-center gap-2"><UploadIcon className="w-5 h-5 text-purple-300" /> {t('structure_backup')}</button>
                        <button onClick={() => handleExport('settings')} disabled={isExporting} className="p-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-xl text-white text-sm font-bold transition-all flex flex-col items-center gap-2"><CheckIcon className="w-5 h-5 text-yellow-300" /> {t('settings_backup')}</button>
                        <button onClick={() => handleExport('staff')} disabled={isExporting} className="p-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-xl text-white text-sm font-bold transition-all flex flex-col items-center gap-2"><UsersIcon className="w-5 h-5 text-pink-300" /> {t('staff_backup')}</button>
                    </div>
                    <div className="border-t border-white/10 pt-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4"><UploadIcon className="w-5 h-5 text-orange-400" /> {t('data_restore_title')}</h3>
                        <label className={`w-full flex items-center justify-center p-4 border-2 border-dashed border-slate-600 rounded-2xl cursor-pointer hover:bg-white/5 transition-all ${isImporting ? 'opacity-50' : ''}`}>
                            <div className="flex flex-col items-center gap-2">{isImporting ? <RefreshIcon className="w-6 h-6 animate-spin text-orange-400" /> : <UploadIcon className="w-6 h-6 text-orange-400" />} <span className="text-sm text-slate-300 font-bold">{t('select_backup_file')}</span> </div>
                            <input type="file" accept=".json" className="hidden" onChange={handleImportTrigger} disabled={isImporting} />
                        </label>
                    </div>
                </div>
                <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-6">
                    <h3 className="text-xl font-bold text-slate-300 flex items-center gap-2"><AlertIcon className="w-5 h-5 text-slate-400" /> {t('danger_zone_title')}</h3>
                    <div className="space-y-4">
                        <div className="bg-red-900/20 p-4 rounded-xl border border-red-500/20 flex justify-between items-center">
                            <div><h4 className="text-white font-bold">{t('reset_logs_label')}</h4><p className="text-xs text-red-200/70">{t('reset_logs_desc')}</p></div>
                            <button onClick={() => handleReset('logs')} disabled={isResetting} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-bold">{t('execute_action')}</button>
                        </div>
                        <div className="bg-red-900/20 p-4 rounded-xl border border-red-500/20 flex justify-between items-center">
                            <div><h4 className="text-white font-bold">{t('reset_scores_label')}</h4><p className="text-xs text-red-200/70">{t('reset_scores_desc')}</p></div>
                            <button onClick={() => handleReset('scores')} disabled={isResetting} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-bold">{t('execute_action')}</button>
                        </div>
                        <div className="bg-red-600/20 p-4 rounded-xl border border-red-500 flex justify-between items-center">
                            <div><h4 className="text-white font-bold">{t('reset_full_label')}</h4><p className="text-xs text-red-100">{t('reset_full_desc')}</p></div>
                            <button onClick={() => handleReset('full')} disabled={isResetting} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-bold">{t('execute_full_reset')}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

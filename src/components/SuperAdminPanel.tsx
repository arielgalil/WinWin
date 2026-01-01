import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Campaign, UserProfile, Institution } from '../types';
import { SchoolIcon, PlusIcon, LogoutIcon, RefreshIcon, SearchIcon, TrophyIcon, AlertIcon, SunIcon, MoonIcon, DollarSignIcon, TrashIcon, SproutIcon, SettingsIcon, CalculatorIcon, EditIcon, CopyIcon, PlayIcon, PauseIcon } from './ui/Icons';
import { ConfirmationModal } from './ui/ConfirmationModal';
import { Logo } from './ui/Logo';
import { useLanguage } from '../hooks/useLanguage';
import { useToast } from '../hooks/useToast';
import { useConfirmation } from '../hooks/useConfirmation';
import { VersionFooter } from './ui/VersionFooter';
import { Button } from './ui/button';
import { AdminCard } from './ui/AdminCard';
import { StatCard } from './ui/StatCard';
import { AdminModal } from './ui/AdminModal';
import { useTheme } from '../hooks/useTheme';

const { useNavigate } = ReactRouterDOM as any;

interface SuperAdminPanelProps {
    user: UserProfile | null;
    onLogout: () => void;
    onSelectCampaign: (campaign: Campaign) => void;
}

interface InstitutionStats extends Institution {
    campaigns: Campaign[];
    total_revenue: number;
}

// CompactStat replaced with StatCard component

export const SuperAdminPanel: React.FC<SuperAdminPanelProps> = ({ onLogout }) => {
    const { t, dir } = useLanguage();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [institutions, setInstitutions] = useState<InstitutionStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [fetchError, setFetchError] = useState<string | null>(null);
    const { theme, toggleTheme } = useTheme();
    const isDarkMode = theme === 'dark';

    const { modalConfig, openConfirmation } = useConfirmation();
    const [showInstModal, setShowInstModal] = useState(false);
    const [instForm, setInstForm] = useState<Partial<Institution>>({ name: '', type: t('yeshiva'), contacts: [], crm_notes: '' });

    const [showCampModal, setShowCampModal] = useState(false);
    const [campForm, setCampForm] = useState<Partial<Campaign>>({ name: '', slug: '', institution_id: '', is_active: true });

    // Theme is handled globally by useTheme/AuthContext or App wrapper

    useEffect(() => { fetchInstitutions(); }, []);

    const fetchInstitutions = async () => {
        setIsLoading(true);
        setFetchError(null);
        try {
            const { data: insts, error } = await supabase.from('institutions').select(`*, campaigns (*)`).order('created_at', { ascending: false });
            if (error) throw error;
            const enriched: InstitutionStats[] = (insts || []).map((inst: any) => {
                const camps = (inst.campaigns || []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                return { ...inst, contacts: inst.contacts || [], campaigns: camps, total_revenue: camps.reduce((sum: number, c: any) => sum + (c.price || 0), 0) };
            });
            setInstitutions(enriched);
        } catch (err: any) {
            setFetchError(err?.message || t('data_load_error'));
            showToast(err?.message || t('data_load_error'), 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveInstitution = async () => {
        try {
            if (!instForm.name) {
                showToast(t('error_missing_name'), 'error');
                return;
            }
            const payload = { name: instForm.name, type: instForm.type || t('yeshiva'), crm_notes: instForm.crm_notes || '', contacts: instForm.contacts || [] };
            if (instForm.id) {
                const { error } = await supabase.from('institutions').update(payload).eq('id', instForm.id);
                if (error) throw error;
                showToast(t('save_success'), 'success');
            } else {
                const { error } = await supabase.from('institutions').insert(payload);
                if (error) throw error;
                showToast(t('save_success'), 'success');
            }
            setShowInstModal(false);
            setInstForm({ name: '', type: t('yeshiva'), contacts: [], crm_notes: '' });
            fetchInstitutions();
        } catch (err: any) {
            showToast(err.message || t('error'), 'error');
        }
    };

    const handleDeleteInstitution = async (id: string) => {
        openConfirmation({
            title: t('delete_institution_title'),
            message: t('confirm_delete_institution'),
            isDanger: true,
            onConfirm: async () => {
                try {
                    const { error } = await supabase.from('institutions').delete().eq('id', id);
                    if (error) throw error;
                    showToast(t('deleted_successfully'), 'success');
                    fetchInstitutions();
                } catch (err: any) {
                    showToast(err.message || t('error_deleting'), 'error');
                }
            }
        });
    };

    const handleToggleActive = async (camp: Campaign) => {
        const newState = !camp.is_active;
        // Optimistic update
        setInstitutions(prev => prev.map(inst => ({
            ...inst,
            campaigns: inst.campaigns.map(c => c.id === camp.id ? { ...c, is_active: newState } : c)
        })));

        try {
            const { error } = await supabase.from('campaigns').update({ is_active: newState }).eq('id', camp.id);
            if (error) throw error;
            showToast(t('settings_saved_success'), 'success');
        } catch (error: any) {
            showToast(error.message || t('error_saving'), 'error');
            fetchInstitutions(); // Revert on error
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        showToast(t('copied_to_clipboard'), 'info');
    };

    const handleSaveCampaign = async () => {
        try {
            if (!campForm.name || !campForm.slug) {
                showToast(t('error_missing_fields'), 'error');
                return;
            }
            const payload: any = {
                name: campForm.name,
                slug: campForm.slug,
                institution_id: campForm.institution_id,
                is_active: campForm.is_active ?? true
            };

            if (campForm.id) {
                const { error } = await supabase.from('campaigns').update(payload).eq('id', campForm.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('campaigns').insert(payload);
                if (error) throw error;
            }

            showToast(t('save_success'), 'success');
            setShowCampModal(false);
            fetchInstitutions();
        } catch (err: any) {
            showToast(err.message, 'error');
        }
    };

    const handleDeleteCampaign = async (id: string) => {
        openConfirmation({
            title: t('delete_action'),
            message: t('confirm_delete_campaign'),
            isDanger: true,
            onConfirm: async () => {
                try {
                    const { error } = await supabase.from('campaigns').delete().eq('id', id);
                    if (error) throw error;
                    showToast(t('deleted_successfully'), 'success');
                    fetchInstitutions();
                } catch (err: any) {
                    showToast(err.message || t('error_deleting'), 'error');
                }
            }
        });
    };

    const filteredInstitutions = institutions.filter(i => {
        const lower = searchTerm.toLowerCase();
        return i.name.toLowerCase().includes(lower) || i.campaigns.some(c => c.name.toLowerCase().includes(lower));
    });

    return (
        <div className={`min-h-full bg-[var(--bg-page)] text-[var(--text-main)] transition-colors duration-300 flex flex-col admin-view`} dir={dir}>
            <ConfirmationModal {...modalConfig} />
            <header className="bg-[var(--bg-card-header)] border-b border-[var(--border-main)] sticky top-0 z-40 px-4 h-16 shadow-sm shrink-0 backdrop-blur-md">
                <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-h1 tracking-tight text-[var(--text-main)]">{t('super_admin_title')}</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={toggleTheme}
                            variant="ghost"
                            size="icon"
                            className="min-w-[44px] min-h-[44px]"
                        >
                            {isDarkMode ? <SunIcon className="w-5 h-5 text-yellow-400" /> : <MoonIcon className="w-5 h-5 text-slate-700" />}
                        </Button>
                        <Button
                            onClick={onLogout}
                            variant="ghost"
                            size="icon"
                            className="min-w-[44px] min-h-[44px] text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                            <LogoutIcon className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </header>
            <div className="px-4 py-4 border-b border-[var(--border-main)] bg-[var(--bg-surface)]/50 sticky top-16 z-30 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto flex flex-col-reverse md:flex-row items-center justify-between gap-4">
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-72">
                            <SearchIcon className="w-5 h-5 absolute top-1/2 -translate-y-1/2 text-[var(--text-muted)] rtl:right-3 ltr:left-3" />
                            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder={t('campaign_search_placeholder')} className={`bg-[var(--bg-input)] text-[var(--text-main)] border border-[var(--border-main)] rounded-[var(--radius-main)] px-4 py-3 rtl:pr-10 ltr:pl-10 text-base w-full outline-none shadow-sm transition-all focus:ring-2 focus:ring-blue-500/20`} />
                        </div>
                        <Button
                            onClick={() => { setInstForm({ name: '', type: t('yeshiva'), contacts: [], crm_notes: '' }); setShowInstModal(true); }}
                            variant="default"
                            size="default"
                            className="shadow-lg"
                        >
                            <PlusIcon className="w-5 h-5" />
                            <span className="hidden md:inline">{t('add_institution')}</span>
                        </Button>
                    </div>
                    <div className="grid grid-cols-3 md:flex gap-2 md:gap-3 w-full md:w-auto">
                        <StatCard label={t('institutions_label')} value={institutions.length} icon={<SchoolIcon className="w-4 h-4 text-blue-500" />} colorClass="bg-blue-500/10" />
                        <StatCard label={t('campaigns_label')} value={institutions.reduce((a, b) => a + b.campaigns.length, 0)} icon={<TrophyIcon className="w-4 h-4 text-yellow-500" />} colorClass="bg-yellow-500/10" />
                        <StatCard label={t('revenue_label')} value={institutions.reduce((a, b) => a + b.total_revenue, 0).toLocaleString()} icon={<DollarSignIcon className="w-4 h-4 text-green-500" />} colorClass="bg-green-500/10" />
                    </div>
                </div>
            </div>
            <main className="max-w-7xl mx-auto p-4 space-y-6 flex-1">
                {fetchError && (
                    <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-[var(--radius-main)] text-red-500 mb-6 flex items-center gap-3">
                        <AlertIcon className="w-6 h-6 shrink-0" />
                        <div className="flex-1"><span className="font-bold block">{t('data_load_error')}</span><span className="text-xs break-all">{fetchError}</span></div>
                        <button onClick={fetchInstitutions} className="bg-red-500/10 p-3 min-w-[44px] min-h-[44px] rounded-[var(--radius-main)] transition-colors active:scale-95"><RefreshIcon className="w-5 h-5" /></button>
                    </div>
                )}
                {isLoading ? <div className="text-center py-20"><RefreshIcon className="w-10 h-10 animate-spin mx-auto opacity-20" /></div> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredInstitutions.map(inst => (
                            <div key={inst.id} className={`bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[var(--radius-container)] overflow-hidden shadow-xl transition-all`}>
                                <div className="p-5 flex justify-between items-center border-b border-[var(--divide-main)] bg-[var(--bg-surface)]/30">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-[var(--bg-input)] flex items-center justify-center shadow-lg border border-[var(--border-main)] shrink-0 overflow-hidden">
                                            {inst.logo_url ? (
                                                <img src={inst.logo_url} className="w-full h-full object-contain p-1 no-select no-drag" alt={inst.name} />
                                            ) : (
                                                <SchoolIcon className="w-6 h-6 text-blue-500" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-xl text-[var(--text-main)]">{inst.name}</h3>
                                            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold">
                                                {inst.type || t('educational_institution')} • {t('campaigns_count', { count: inst.campaigns.length })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 items-center">
                                        <Button
                                            onClick={() => { setCampForm({ institution_id: inst.id, is_active: true }); setShowCampModal(true); }}
                                            variant="outline"
                                            size="sm"
                                            className="bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border-primary/20"
                                        >
                                            <PlusIcon className="w-3.5 h-3.5" />
                                            <span>{t('add_competition')}</span>
                                        </Button>
                                        <Button
                                            onClick={() => handleDeleteInstitution(inst.id)}
                                            variant="ghost"
                                            size="icon"
                                            className="min-w-[44px] min-h-[44px] text-muted-foreground/20 hover:text-muted-foreground"
                                        >
                                            <TrashIcon className="w-5 h-5 opacity-60" />
                                        </Button>
                                        <Button
                                            onClick={() => { setInstForm(inst); setShowInstModal(true); }}
                                            variant="ghost"
                                            size="icon"
                                            className="min-w-[44px] min-h-[44px] text-muted-foreground"
                                        >
                                            <EditIcon className="w-5 h-5 opacity-60" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="p-5 space-y-4">
                                    {inst.campaigns.length === 0 ? <p className="text-center py-8 text-[var(--text-muted)] font-bold italic">{t('no_active_campaigns')}</p> : (
                                        <div className="space-y-4">
                                            {inst.campaigns.map(camp => (
                                                <div key={camp.id} className="p-4 rounded-[var(--radius-main)] bg-[var(--bg-input)] border border-[var(--border-main)] space-y-4 transition-all hover:border-[var(--accent-blue)]/30 group">
                                                    {/* Header: Logo, Name, Toggle, Edit/Trash */}
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-10 h-10 rounded-full bg-[var(--bg-input)] flex items-center justify-center shadow-md border border-[var(--border-main)] shrink-0 overflow-hidden">
                                                                {camp.logo_url ? (
                                                                    <img src={camp.logo_url} className="w-full h-full object-contain p-1 no-select no-drag" alt={camp.name} />
                                                                ) : (
                                                                    <SproutIcon className="w-6 h-6 text-green-600" />
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h4 className="font-black text-lg truncate text-[var(--text-main)] leading-none mb-1">{camp.name}</h4>
                                                                <p className="text-[10px] text-[var(--text-muted)] font-mono truncate" dir="ltr">{camp.slug}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <Button
                                                                onClick={() => handleToggleActive(camp)}
                                                                variant="ghost"
                                                                size="icon"
                                                                className={`min-w-[44px] min-h-[44px] ${camp.is_active ? 'text-green-500 hover:bg-green-500/10' : 'text-red-500 hover:bg-red-500/10'}`}
                                                                title={camp.is_active ? t('active_status') : t('inactive_status')}
                                                            >
                                                                {camp.is_active ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                                                            </Button>
                                                            <div className="flex gap-3">
                                                                <Button
                                                                    onClick={() => handleDeleteCampaign(camp.id)}
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    title={t('delete')}
                                                                    className="min-w-[44px] min-h-[44px] text-muted-foreground/20 hover:text-muted-foreground"
                                                                >
                                                                    <TrashIcon className="w-5 h-5" />
                                                                </Button>
                                                                <Button
                                                                    onClick={() => { setCampForm(camp); setShowCampModal(true); }}
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    title={t('edit')}
                                                                    className="min-w-[44px] min-h-[44px] text-muted-foreground"
                                                                >
                                                                    <EditIcon className="w-5 h-5" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Action Buttons Grid */}
                                                    <div className="grid grid-cols-3 gap-3">
                                                        <div className="flex flex-col gap-2">
                                                            <Button
                                                                onClick={() => navigate(`/comp/${camp.slug}`)}
                                                                variant="outline"
                                                                size="sm"
                                                                title={t('open_board')}
                                                                className="h-12 min-h-[44px] bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20"
                                                            >
                                                                <TrophyIcon className="w-4 h-4" />
                                                                <span>{t('open_board')}</span>
                                                            </Button>
                                                            <Button
                                                                onClick={() => handleCopy(window.location.origin + '/comp/' + camp.slug)}
                                                                variant="ghost"
                                                                size="icon"
                                                                title={t('copy_link')}
                                                                className="min-w-[44px] min-h-[44px] text-muted-foreground hover:text-foreground"
                                                            >
                                                                <CopyIcon className="w-5 h-5" />
                                                            </Button>
                                                        </div>

                                                        <div className="flex flex-col gap-2">
                                                            <Button
                                                                onClick={() => navigate(`/vote/${camp.slug}`)}
                                                                variant="outline"
                                                                size="sm"
                                                                title={t('points_interface')}
                                                                className="h-12 min-h-[44px] bg-pink-500/10 text-pink-500 border-pink-500/20 hover:bg-pink-500/20"
                                                            >
                                                                <CalculatorIcon className="w-4 h-4" />
                                                                <span>{t('points_interface')}</span>
                                                            </Button>
                                                            <Button
                                                                onClick={() => handleCopy(window.location.origin + '/vote/' + camp.slug)}
                                                                variant="ghost"
                                                                size="icon"
                                                                title={t('copy_link')}
                                                                className="min-w-[44px] min-h-[44px] text-muted-foreground hover:text-foreground"
                                                            >
                                                                <CopyIcon className="w-5 h-5" />
                                                            </Button>
                                                        </div>

                                                        <div className="flex flex-col gap-2">
                                                            <Button
                                                                onClick={() => navigate(`/admin/${camp.slug}`)}
                                                                variant="outline"
                                                                size="sm"
                                                                title={t('competition_settings')}
                                                                className="h-12 min-h-[44px] bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20"
                                                            >
                                                                <SettingsIcon className="w-4 h-4" />
                                                                <span>{t('competition_settings')}</span>
                                                            </Button>
                                                            <Button
                                                                onClick={() => handleCopy(window.location.origin + '/admin/' + camp.slug)}
                                                                variant="ghost"
                                                                size="icon"
                                                                title={t('copy_link')}
                                                                className="min-w-[44px] min-h-[44px] text-muted-foreground hover:text-foreground"
                                                            >
                                                                <CopyIcon className="w-5 h-5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Institution Modal */}
            <AdminModal
                isOpen={showInstModal}
                onClose={() => setShowInstModal(false)}
                title={instForm.id ? t('edit_institution') : t('add_institution')}
                size="lg"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setShowInstModal(false)}>
                            {t('cancel')}
                        </Button>
                        <Button variant="default" onClick={handleSaveInstitution}>
                            {t('save_label')}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-[var(--text-muted)]">{t('institution_name')}</label>
                        <input value={instForm.name || ''} onChange={e => setInstForm({ ...instForm, name: e.target.value })} className="w-full bg-[var(--bg-input)] border border-[var(--border-main)] rounded-[var(--radius-main)] px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-[var(--text-muted)]">{t('institution_type')}</label>
                        <input value={instForm.type || ''} onChange={e => setInstForm({ ...instForm, type: e.target.value })} className="w-full bg-[var(--bg-input)] border border-[var(--border-main)] rounded-[var(--radius-main)] px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                </div>
            </AdminModal>


            {/* Campaign Modal */}
            <AdminModal
                isOpen={showCampModal}
                onClose={() => setShowCampModal(false)}
                title={campForm.id ? t('edit_campaign_title') : t('add_competition')}
                size="lg"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setShowCampModal(false)}>
                            {t('cancel')}
                        </Button>
                        <Button variant="default" onClick={handleSaveCampaign}>
                            {t('save_label')}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-[var(--text-muted)]">{t('campaign_name_label')}</label>
                        <input value={campForm.name || ''} onChange={e => setCampForm({ ...campForm, name: e.target.value })} className="w-full bg-[var(--bg-input)] border border-[var(--border-main)] rounded-[var(--radius-main)] px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-[var(--text-muted)]">{t('campaign_slug_label')}</label>
                        <input value={campForm.slug || ''} onChange={e => setCampForm({ ...campForm, slug: e.target.value })} className="w-full bg-[var(--bg-input)] border border-[var(--border-main)] rounded-[var(--radius-main)] px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                </div>
            </AdminModal>
            <VersionFooter />
        </div>
    );
};

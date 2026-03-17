import React, { useCallback, useEffect, useMemo, useState } from "react";
import * as ReactRouterDOM from "react-router-dom";
import { supabase } from "../supabaseClient";
import { Campaign, Institution } from "../types";
import {
    AlertIcon,
    CalculatorIcon,
    CopyIcon,
    DollarSignIcon,
    EditIcon,
    PauseIcon,
    PlayIcon,
    PlusIcon,
    RefreshIcon,
    SchoolIcon,
    SettingsIcon,
    SproutIcon,
    TrashIcon,
    TrophyIcon,
} from "./ui/Icons";
import { ConfirmationModal } from "./ui/ConfirmationModal";
import { useLanguage } from "../hooks/useLanguage";
import { useToast } from "../hooks/useToast";
import { useConfirmation } from "../hooks/useConfirmation";
import { Button } from "./ui/button";
import { StatCard } from "./ui/StatCard";
import { AdminModal } from "./ui/AdminModal";
import { useAuth } from "../hooks/useAuth";
import { NavItem, WorkspaceLayout } from "./layouts/WorkspaceLayout";
import { Plus, Search, Shield } from "lucide-react";

const { useNavigate } = ReactRouterDOM as any;

interface SuperAdminPanelProps {
}

interface InstitutionStats extends Institution {
    campaigns: Campaign[];
    total_revenue: number;
}

// CompactStat replaced with StatCard component

export const SuperAdminPanel: React.FC<SuperAdminPanelProps> = () => {
    const { t } = useLanguage();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [institutions, setInstitutions] = useState<InstitutionStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [fetchError, setFetchError] = useState<string | null>(null);

    const { modalConfig, openConfirmation } = useConfirmation();
    const [instForm, setInstForm] = useState<any>({
        name: "",
        type: t("yeshiva"),
        contacts: [],
        crm_notes: "",
    });
    const [campForm, setCampForm] = useState<any>({ is_active: true });
    const [showInstModal, setShowInstModal] = useState(false);
    const [showCampModal, setShowCampModal] = useState(false);

    const fetchInstitutions = useCallback(async () => {
        try {
            setIsLoading(true);
            setFetchError(null);

            const { data: instData, error: instError } = await supabase
                .from("institutions")
                .select("*")
                .order("name");
            if (instError) throw instError;

            const { data: campData, error: campError } = await supabase
                .from("campaigns")
                .select("*")
                .order("name");
            if (campError) throw campError;

            const stats: InstitutionStats[] = (instData || []).map((inst) => {
                const instCampaigns = (campData || []).filter((c) =>
                    c.institution_id === inst.id
                );
                return {
                    ...inst,
                    campaigns: instCampaigns,
                    total_revenue: instCampaigns.reduce(
                        (sum, camp) => sum + (Number(camp.amount_paid) || 0),
                        0,
                    ),
                };
            });

            setInstitutions(stats);
        } catch (err: any) {
            console.error("Error fetching institutions:", err);
            setFetchError(err.message || t("error"));
        } finally {
            setIsLoading(false);
        }
    }, [t]);
    useEffect(() => {
        fetchInstitutions();
    }, [fetchInstitutions]);

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    const navItems: NavItem[] = useMemo(() => [
        { id: "institutions", label: t("institutions_label"), icon: Shield },
    ], [t]);

    const userInitials = useMemo(() => {
        const name = user?.full_name?.trim() || "S";
        const parts = name.split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }, [user?.full_name]);

    const handleSaveInstitution = async () => {
        try {
            if (!instForm.name) {
                showToast(t("error_missing_name"), "error");
                return;
            }
            const payload = {
                name: instForm.name,
                type: instForm.type || t("yeshiva"),
                crm_notes: instForm.crm_notes || "",
                contacts: instForm.contacts || [],
            };
            if (instForm.id) {
                const { error } = await supabase.from("institutions").update(
                    payload,
                ).eq("id", instForm.id);
                if (error) throw error;
                showToast(t("save_success"), "success");
            } else {
                const { error } = await supabase.from("institutions").insert(
                    payload,
                );
                if (error) throw error;
                showToast(t("save_success"), "success");
            }
            setShowInstModal(false);
            setInstForm({
                name: "",
                type: t("yeshiva"),
                contacts: [],
                crm_notes: "",
            });
            fetchInstitutions();
        } catch (err: any) {
            showToast(err.message || t("error"), "error");
        }
    };

    const handleDeleteInstitution = async (id: string) => {
        openConfirmation({
            title: t("delete_institution_title"),
            message: t("confirm_delete_institution"),
            isDanger: true,
            onConfirm: async () => {
                try {
                    const { error } = await supabase.from("institutions")
                        .delete().eq("id", id);
                    if (error) throw error;
                    showToast(t("deleted_successfully"), "success");
                    fetchInstitutions();
                } catch (err: any) {
                    showToast(err.message || t("error_deleting"), "error");
                }
            },
        });
    };

    const handleToggleActive = async (camp: Campaign) => {
        const newState = !camp.is_active;
        // Optimistic update
        setInstitutions((prev) =>
            prev.map((inst) => ({
                ...inst,
                campaigns: inst.campaigns.map((c) =>
                    c.id === camp.id ? { ...c, is_active: newState } : c
                ),
            }))
        );

        try {
            const { error } = await supabase.from("campaigns").update({
                is_active: newState,
            }).eq("id", camp.id);
            if (error) throw error;
            showToast(t("settings_saved_success"), "success");
        } catch (error: any) {
            showToast(error.message || t("error_saving"), "error");
            fetchInstitutions(); // Revert on error
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        showToast(t("copied_to_clipboard"), "info");
    };

    const handleSaveCampaign = async () => {
        try {
            if (!campForm.name || !campForm.slug) {
                showToast(t("error_missing_fields"), "error");
                return;
            }
            const payload: any = {
                name: campForm.name,
                slug: campForm.slug,
                institution_id: campForm.institution_id,
                is_active: campForm.is_active ?? true,
                ai_enabled: campForm.ai_enabled ?? true,
            };

            if (campForm.id) {
                const { error } = await supabase.from("campaigns").update(
                    payload,
                ).eq("id", campForm.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from("campaigns").insert(
                    payload,
                );
                if (error) throw error;
            }

            showToast(t("save_success"), "success");
            setShowCampModal(false);
            fetchInstitutions();
        } catch (err: any) {
            showToast(err.message, "error");
        }
    };

    const handleDeleteCampaign = async (id: string) => {
        openConfirmation({
            title: t("delete_action"),
            message: t("confirm_delete_campaign"),
            isDanger: true,
            onConfirm: async () => {
                try {
                    const { error } = await supabase.from("campaigns").delete()
                        .eq("id", id);
                    if (error) throw error;
                    showToast(t("deleted_successfully"), "success");
                    fetchInstitutions();
                } catch (err: any) {
                    showToast(err.message || t("error_deleting"), "error");
                }
            },
        });
    };

    const filteredInstitutions = institutions.filter((i) => {
        const lower = searchTerm.toLowerCase();
        return i.name.toLowerCase().includes(lower) ||
            i.campaigns.some((c) => c.name.toLowerCase().includes(lower));
    });

    return (
        <WorkspaceLayout
            user={{
                full_name: user?.full_name || "Super Admin",
                initials: userInitials,
                roleLabel: t("role_super_user"),
            }}
            institution={{
                name: "🌱 מערכת תחרויות מצמיחה - פאנל משתמש על",
            }}
            navItems={navItems}
            activeTab="institutions"
            onTabChange={() => {}}
            onLogout={handleLogout}
            onViewDashboard={() => navigate("/")}
            headerTitle="ניהול מוסדות ותחרויות"
            headerIcon={Shield}
            headerColorVar="var(--acc-settings)"
            onRefresh={fetchInstitutions}
            isRefreshing={isLoading}
            headerActions={
                <div className="flex items-center gap-3">
                    <div className="relative w-64">
                        <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 text-muted-foreground rtl:right-3 ltr:left-3" />
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={t("campaign_search_placeholder")}
                            className="bg-muted border border-border rounded-lg px-4 py-2 rtl:pr-10 ltr:pl-10 text-sm w-full outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>
                    <Button
                        onClick={() => {
                            setInstForm({
                                name: "",
                                type: t("yeshiva"),
                                contacts: [],
                                crm_notes: "",
                            });
                            setShowInstModal(true);
                        }}
                        className="shadow-sm gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">
                            {t("add_institution")}
                        </span>
                    </Button>
                </div>
            }
        >
            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard
                        label={t("institutions_label")}
                        value={institutions.length}
                        icon={<SchoolIcon className="w-4 h-4 text-blue-500" />}
                        colorClass="bg-blue-500/10"
                    />
                    <StatCard
                        label={t("campaigns_label")}
                        value={institutions.reduce(
                            (a, b) => a + b.campaigns.length,
                            0,
                        )}
                        icon={
                            <TrophyIcon className="w-4 h-4 text-yellow-500" />
                        }
                        colorClass="bg-yellow-500/10"
                    />
                    <StatCard
                        label={t("revenue_label")}
                        value={institutions.reduce(
                            (a, b) => a + b.total_revenue,
                            0,
                        ).toLocaleString()}
                        icon={
                            <DollarSignIcon className="w-4 h-4 text-green-500" />
                        }
                        colorClass="bg-green-500/10"
                    />
                </div>

                <ConfirmationModal {...modalConfig} />

                {fetchError && (
                    <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-[var(--radius-main)] text-red-500 mb-6 flex items-center gap-3">
                        <AlertIcon className="w-6 h-6 shrink-0" />
                        <div className="flex-1">
                            <span className="font-bold block">
                                {t("data_load_error")}
                            </span>
                            <span className="text-xs break-all">
                                {fetchError}
                            </span>
                        </div>
                        <button
                            onClick={fetchInstitutions}
                            className="bg-red-500/10 p-3 min-w-[44px] min-h-[44px] rounded-[var(--radius-main)] transition-colors active:scale-95"
                        >
                            <RefreshIcon className="w-5 h-5" />
                        </button>
                    </div>
                )}
                {isLoading
                    ? (
                        <div className="text-center py-20">
                            <RefreshIcon className="w-10 h-10 animate-spin mx-auto opacity-20" />
                        </div>
                    )
                    : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredInstitutions.map((inst) => (
                                <div
                                    key={inst.id}
                                    className={`bg-[var(--bg-card)] border border-[var(--border-main)] rounded-[var(--radius-container)] overflow-hidden shadow-xl transition-all`}
                                >
                                    <div className="px-4 pt-3 pb-2.5 border-b border-[var(--divide-main)] bg-[var(--bg-surface)]/40 space-y-2">
                                        {/* Row 1: logo + name + edit | delete */}
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-start gap-2.5 min-w-0">
                                                <div className="w-10 h-10 rounded-full bg-[var(--bg-input)] flex items-center justify-center shadow-sm border-2 border-[var(--border-main)] shrink-0 overflow-hidden mt-0.5">
                                                    {inst.logo_url
                                                        ? (
                                                            <img
                                                                src={inst.logo_url}
                                                                className="w-full h-full object-contain p-1 no-select no-drag"
                                                                alt={inst.name}
                                                            />
                                                        )
                                                        : (
                                                            <SchoolIcon className="w-5 h-5 text-blue-500" />
                                                        )}
                                                </div>
                                                <h3 className="font-bold text-base text-[var(--text-main)] leading-snug pt-1.5 min-w-0">
                                                    {inst.name}
                                                </h3>
                                                <Button
                                                    onClick={() => { setInstForm(inst); setShowInstModal(true); }}
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-7 h-7 shrink-0 mt-1 text-muted-foreground/50 hover:text-muted-foreground"
                                                    title={t("edit")}
                                                >
                                                    <EditIcon className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                            <Button
                                                onClick={() => handleDeleteInstitution(inst.id)}
                                                variant="ghost"
                                                size="icon"
                                                className="w-7 h-7 shrink-0 mt-1 text-muted-foreground/30 hover:text-red-500"
                                                title={t("delete")}
                                            >
                                                <TrashIcon className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                        {/* Row 2: meta + add button */}
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-[10px] text-[var(--text-muted)] tracking-wide">
                                                {inst.type || t("educational_institution")} · {inst.campaigns.length} {t("campaigns_label")}
                                            </p>
                                            <Button
                                                onClick={() => { setCampForm({ institution_id: inst.id, is_active: true }); setShowCampModal(true); }}
                                                size="sm"
                                                className="h-7 gap-1 text-xs shrink-0"
                                            >
                                                <PlusIcon className="w-3 h-3" />
                                                {t("add_competition")}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="p-5 space-y-4">
                                        {inst.campaigns.length === 0
                                            ? (
                                                <p className="text-center py-8 text-[var(--text-muted)] font-bold italic">
                                                    {t("no_active_campaigns")}
                                                </p>
                                            )
                                            : (
                                                <div className="space-y-4">
                                                    {inst.campaigns.map(
                                                        (camp) => (
                                                            <div
                                                                key={camp.id}
                                                                className="p-4 rounded-[var(--radius-main)] bg-[var(--bg-input)] border border-[var(--border-main)] space-y-4 transition-all hover:border-[var(--accent-blue)]/30 group"
                                                            >
                                                                {/* Header: [toggle][logo][name+edit] | [delete] — single row */}
                                                                <div className="flex items-start justify-between gap-2">
                                                                    {/* Right side: toggle + logo + name + edit */}
                                                                    <div className="flex items-start gap-2 min-w-0">
                                                                        <Button
                                                                            onClick={() => handleToggleActive(camp)}
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className={`w-8 h-8 shrink-0 mt-0.5 ${
                                                                                camp.is_active
                                                                                    ? "text-green-500 hover:bg-green-500/10"
                                                                                    : "text-muted-foreground/40 hover:bg-green-500/10 hover:text-green-500"
                                                                            }`}
                                                                            title={camp.is_active ? t("active_status") : t("inactive_status")}
                                                                        >
                                                                            {camp.is_active
                                                                                ? <PauseIcon className="w-4 h-4" />
                                                                                : <PlayIcon className="w-4 h-4" />}
                                                                        </Button>
                                                                        <div className="w-9 h-9 rounded-full bg-[var(--bg-input)] flex items-center justify-center shadow-md border-2 border-[var(--border-main)] shrink-0 overflow-hidden mt-0.5">
                                                                            {camp.logo_url
                                                                                ? (
                                                                                    <img
                                                                                        src={camp.logo_url}
                                                                                        className="w-full h-full object-contain p-1 no-select no-drag"
                                                                                        alt={camp.name}
                                                                                    />
                                                                                )
                                                                                : (
                                                                                    <SproutIcon className="w-5 h-5 text-green-600" />
                                                                                )}
                                                                        </div>
                                                                        <div className="min-w-0 pt-1">
                                                                            <h4 className="font-black text-sm text-[var(--text-main)] leading-snug">
                                                                                {camp.name}
                                                                            </h4>
                                                                            <p
                                                                                className="text-[10px] text-[var(--text-muted)] font-mono truncate"
                                                                                dir="ltr"
                                                                            >
                                                                                {camp.slug}
                                                                            </p>
                                                                        </div>
                                                                        <Button
                                                                            onClick={() => {
                                                                                setCampForm(camp);
                                                                                setShowCampModal(true);
                                                                            }}
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            title={t("edit")}
                                                                            className="w-7 h-7 shrink-0 mt-1 text-muted-foreground/50 hover:text-muted-foreground"
                                                                        >
                                                                            <EditIcon className="w-3.5 h-3.5" />
                                                                        </Button>
                                                                    </div>
                                                                    {/* Left side: delete */}
                                                                    <Button
                                                                        onClick={() => handleDeleteCampaign(camp.id)}
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        title={t("delete")}
                                                                        className="w-7 h-7 shrink-0 mt-1 text-muted-foreground/25 hover:text-red-500"
                                                                    >
                                                                        <TrashIcon className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                </div>

                                                                {/* Action Buttons — compact 3-col grid */}
                                                                <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-[var(--border-main)]">
                                                                    {/* לוח */}
                                                                    <div className="flex flex-col gap-1">
                                                                        <Button
                                                                            onClick={() => navigate(`/comp/${camp.slug}`)}
                                                                            variant="outline"
                                                                            size="sm"
                                                                            title={t("open_board")}
                                                                            className="h-9 flex flex-col gap-0.5 items-center justify-center bg-amber-500/8 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/15 hover:border-amber-500/30 px-1"
                                                                        >
                                                                            <TrophyIcon className="w-3.5 h-3.5" />
                                                                            <span className="text-[10px] font-semibold leading-none">{t("open_board")}</span>
                                                                        </Button>
                                                                        <Button
                                                                            onClick={() => handleCopy(window.location.origin + "/comp/" + camp.slug)}
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            title={t("copy_link")}
                                                                            className="h-6 text-muted-foreground/50 hover:text-muted-foreground gap-1 px-1"
                                                                        >
                                                                            <CopyIcon className="w-3 h-3" />
                                                                            <span className="text-[9px]">{t("copy_link")}</span>
                                                                        </Button>
                                                                    </div>
                                                                    {/* ניקוד */}
                                                                    <div className="flex flex-col gap-1">
                                                                        <Button
                                                                            onClick={() => navigate(`/vote/${camp.slug}`)}
                                                                            variant="outline"
                                                                            size="sm"
                                                                            title={t("points_interface")}
                                                                            className="h-9 flex flex-col gap-0.5 items-center justify-center bg-pink-500/8 text-pink-600 dark:text-pink-400 border-pink-500/20 hover:bg-pink-500/15 hover:border-pink-500/30 px-1"
                                                                        >
                                                                            <CalculatorIcon className="w-3.5 h-3.5" />
                                                                            <span className="text-[10px] font-semibold leading-none">{t("points_interface")}</span>
                                                                        </Button>
                                                                        <Button
                                                                            onClick={() => handleCopy(window.location.origin + "/vote/" + camp.slug)}
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            title={t("copy_link")}
                                                                            className="h-6 text-muted-foreground/50 hover:text-muted-foreground gap-1 px-1"
                                                                        >
                                                                            <CopyIcon className="w-3 h-3" />
                                                                            <span className="text-[9px]">{t("copy_link")}</span>
                                                                        </Button>
                                                                    </div>
                                                                    {/* הגדרות */}
                                                                    <div className="flex flex-col gap-1">
                                                                        <Button
                                                                            onClick={() => navigate(`/admin/${camp.slug}`)}
                                                                            variant="outline"
                                                                            size="sm"
                                                                            title={t("competition_settings")}
                                                                            className="h-9 flex flex-col gap-0.5 items-center justify-center bg-blue-500/8 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/15 hover:border-blue-500/30 px-1"
                                                                        >
                                                                            <SettingsIcon className="w-3.5 h-3.5" />
                                                                            <span className="text-[10px] font-semibold leading-none">{t("competition_settings")}</span>
                                                                        </Button>
                                                                        <Button
                                                                            onClick={() => handleCopy(window.location.origin + "/admin/" + camp.slug)}
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            title={t("copy_link")}
                                                                            className="h-6 text-muted-foreground/50 hover:text-muted-foreground gap-1 px-1"
                                                                        >
                                                                            <CopyIcon className="w-3 h-3" />
                                                                            <span className="text-[9px]">{t("copy_link")}</span>
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                {/* Institution Modal */}
                <AdminModal
                    isOpen={showInstModal}
                    onClose={() => setShowInstModal(false)}
                    title={instForm.id
                        ? t("edit_institution")
                        : t("add_institution")}
                    size="lg"
                    footer={
                        <>
                            <Button
                                variant="ghost"
                                onClick={() => setShowInstModal(false)}
                            >
                                {t("cancel")}
                            </Button>
                            <Button
                                variant="default"
                                onClick={handleSaveInstitution}
                            >
                                {t("save_label")}
                            </Button>
                        </>
                    }
                >
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[var(--text-muted)]">
                                {t("institution_name")}
                            </label>
                            <input
                                value={instForm.name || ""}
                                onChange={(e) => setInstForm({
                                    ...instForm,
                                    name: e.target.value,
                                })}
                                className="w-full bg-[var(--bg-input)] border border-[var(--border-main)] rounded-[var(--radius-main)] px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[var(--text-muted)]">
                                {t("institution_type")}
                            </label>
                            <input
                                value={instForm.type || ""}
                                onChange={(e) => setInstForm({
                                    ...instForm,
                                    type: e.target.value,
                                })}
                                className="w-full bg-[var(--bg-input)] border border-[var(--border-main)] rounded-[var(--radius-main)] px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                    </div>
                </AdminModal>

                {/* Campaign Modal */}
                <AdminModal
                    isOpen={showCampModal}
                    onClose={() => setShowCampModal(false)}
                    title={campForm.id
                        ? t("edit_campaign_title")
                        : t("add_competition")}
                    size="lg"
                    footer={
                        <>
                            <Button
                                variant="ghost"
                                onClick={() => setShowCampModal(false)}
                            >
                                {t("cancel")}
                            </Button>
                            <Button
                                variant="default"
                                onClick={handleSaveCampaign}
                            >
                                {t("save_label")}
                            </Button>
                        </>
                    }
                >
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[var(--text-muted)]">
                                {t("campaign_name_label")}
                            </label>
                            <input
                                value={campForm.name || ""}
                                onChange={(e) =>
                                    setCampForm({
                                        ...campForm,
                                        name: e.target.value,
                                    })}
                                className="w-full bg-[var(--bg-input)] border border-[var(--border-main)] rounded-[var(--radius-main)] px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[var(--text-muted)]">
                                {t("campaign_slug_label")}
                            </label>
                            <input
                                value={campForm.slug || ""}
                                onChange={(e) =>
                                    setCampForm({
                                        ...campForm,
                                        slug: e.target.value,
                                    })}
                                className="w-full bg-[var(--bg-input)] border border-[var(--border-main)] rounded-[var(--radius-main)] px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>

                        {/* AI Feature Toggle */}
                        <div className="flex items-center justify-between p-4 bg-[var(--bg-input)] rounded-[var(--radius-main)] border border-[var(--border-main)]">
                            <div className="flex items-center gap-3">
                                <Shield className="w-5 h-5 text-indigo-500" />
                                <div>
                                    <h4 className="font-bold text-[var(--text-main)] leading-none mb-1">
                                        {t("ai_settings_title")}
                                    </h4>
                                    <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">
                                        {campForm.ai_enabled !== false ? t("ai_active_status") : t("ai_disabled_status")}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setCampForm({
                                    ...campForm,
                                    ai_enabled: campForm.ai_enabled === false
                                })}
                                className={`w-12 h-6 rounded-full transition-colors relative ${
                                    campForm.ai_enabled !== false ? 'bg-indigo-600' : 'bg-muted-foreground/30'
                                }`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${
                                    campForm.ai_enabled !== false ? 'ltr:right-1 rtl:left-1' : 'ltr:left-1 rtl:right-1'
                                }`} />
                            </button>
                        </div>
                    </div>
                </AdminModal>
            </div>
        </WorkspaceLayout>
    );
};

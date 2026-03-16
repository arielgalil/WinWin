import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useLuckyWheelTemplates } from "../../hooks/useLuckyWheelTemplates";
import { useLuckyWheelAdmin } from "../../hooks/useLuckyWheelControl";
import { useCampaign } from "../../hooks/useCampaign";
import { useClasses } from "../../hooks/useClasses";
import { useLanguage } from "../../hooks/useLanguage";
import { useToast } from "../../hooks/useToast";
import { useConfirmation } from "../../hooks/useConfirmation";
import { LuckyWheelTemplate, Student, WheelFilterCriteria } from "../../types";
import { RefreshIcon } from "../ui/Icons";
import { ConfirmationModal } from "../ui/ConfirmationModal";
import {
    Copy,
    Edit,
    FerrisWheel,
    Play,
    Plus,
    Trash2,
    Users,
    Zap,
} from "lucide-react";
import { createWheelSimulation } from "../../utils/wheelPhysics";

// ── Helpers ─────────────────────────────────────────────────────

const formatScore = (val: number | string | undefined | null): string => {
    if (val === undefined || val === null || val === "") return "";
    const num = Number(val);
    if (isNaN(num)) return String(val);
    return new Intl.NumberFormat("he-IL").format(num);
};

const parseScoreInput = (val: string): string => val.replace(/[^\d]/g, "");

// ── Main Component ──────────────────────────────────────────────

export const LuckyWheelManager: React.FC = () => {
    const { t } = useLanguage();
    const { showToast } = useToast();
    const { campaign, settings } = useCampaign();
    const { classes } = useClasses(campaign?.id);
    const campaignId = campaign?.id;

    const {
        templates,
        isLoadingTemplates,
        winners,
        filterParticipants,
        createTemplate,
        updateTemplate,
        deleteTemplate,
        duplicateTemplate,
        saveWinner,
        deleteWinner,
        deleteAllWinners,
        recordActivation,
        isCreating,
    } = useLuckyWheelTemplates(campaignId);

    const wheelAdmin = useLuckyWheelAdmin(campaignId);
    const queryClient = useQueryClient();

    // ── Local state ──

    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<
        LuckyWheelTemplate | null
    >(null);
    const [liveTemplate, setLiveTemplate] = useState<LuckyWheelTemplate | null>(
        null,
    );
    const [liveRound, setLiveRound] = useState(1);
    const [isSpinning, setIsSpinning] = useState(false);
    const spinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const shrinkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Ref mirror so shrinkTimer can check if wheel was deactivated before firing
    const liveTemplateRef = useRef<LuckyWheelTemplate | null>(null);

    const lastDeactivatedIdRef = useRef<string | null>(null);

    // Sync with other admin devices via broadcast
    useEffect(() => {
        const cmd = wheelAdmin.remoteCommand;
        if (!cmd) return;
        if (cmd.action === "ACTIVATE" && cmd.template_id) {
            const tmpl = templates.find((t) => t.id === cmd.template_id);
            if (tmpl) setLiveTemplate(tmpl);
        } else if (cmd.action === "SPIN") {
            if (cmd.round_number) setLiveRound(cmd.round_number);
            setIsSpinning(true);
            if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
            spinTimerRef.current = setTimeout(() => {
                setIsSpinning(false);
                queryClient.invalidateQueries({ queryKey: ["wheel-winners", campaignId] });
            }, (cmd.duration_ms ?? 10000) + 1500);
        } else if (cmd.action === "DEACTIVATE") {
            if (shrinkTimerRef.current) clearTimeout(shrinkTimerRef.current);
            if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
            setLiveTemplate(null);
            setLiveRound(1);
            setIsSpinning(false);
        }
    }, [wheelAdmin.remoteCommand, templates, campaignId, queryClient]);

    // Keep ref in sync with state for use inside timeouts
    React.useEffect(() => { liveTemplateRef.current = liveTemplate; }, [liveTemplate]);

    // Restore liveTemplate from settings
    React.useEffect(() => {
        const activeId = settings?.active_lucky_wheel_id;
        if (
            activeId && !liveTemplate && templates.length > 0 &&
            activeId !== lastDeactivatedIdRef.current
        ) {
            const tmpl = templates.find((t) => t.id === activeId);
            if (tmpl) {
                setLiveTemplate(tmpl);
            }
        }
    }, [settings?.active_lucky_wheel_id, templates, liveTemplate]);

    // All students from all classes
    const allStudents = useMemo<Student[]>(() => {
        if (!classes) return [];
        return classes.flatMap((c) =>
            c.students.map((s) => ({ ...s, class_id: c.id }))
        );
    }, [classes]);

    // ── Live participant counts per template (recalculated on student/winner changes) ──
    const [liveCounts, setLiveCounts] = useState<Record<string, number>>({});
    useEffect(() => {
        if (!templates.length) return;
        let cancelled = false;
        (async () => {
            const counts: Record<string, number> = {};
            for (const tmpl of templates) {
                const { names } = await filterParticipants(tmpl.filter_criteria, allStudents);
                counts[tmpl.id] = names.length;
            }
            if (!cancelled) setLiveCounts(counts);
        })();
        return () => { cancelled = true; };
    }, [templates, allStudents, filterParticipants]);

    // ── Create / Edit form ──
    const handleSaveTemplate = useCallback(
        async (name: string, totalRounds: number, criteria: WheelFilterCriteria) => {
            const { ids, names, weights } = await filterParticipants(
                criteria,
                allStudents,
            );
            if (names.length === 0) {
                showToast(t("no_participants_match_warning" as any), "info");
                // fall through — save with empty arrays, criteria preserved
            }

            if (editingTemplate) {
                await updateTemplate({
                    id: editingTemplate.id,
                    name,
                    total_rounds: totalRounds,
                    filter_criteria: criteria,
                    participant_ids: ids,
                    participant_names: names,
                    ticket_weights: weights.length > 0 ? weights : undefined,
                });
                showToast(t("template_updated_toast"), "success");
            } else {
                await createTemplate({
                    name,
                    total_rounds: totalRounds,
                    filter_criteria: criteria,
                    participant_ids: ids,
                    participant_names: names,
                    ticket_weights: weights.length > 0 ? weights : undefined,
                });
                showToast(
                    t("template_created_toast", { count: names.length }),
                    "success",
                );
            }

            setShowCreateDialog(false);
            setEditingTemplate(null);
        },
        [
            allStudents,
            editingTemplate,
            filterParticipants,
            createTemplate,
            updateTemplate,
            showToast,
        ],
    );

    // ── Live control ──
    const handleActivate = useCallback(
        async (template: LuckyWheelTemplate) => {
            if (!campaignId) {
                showToast(t("error_no_campaign" as any), "error");
                return;
            }

            // Re-filter against live student data so activation always reflects current state
            const { ids: liveIds, names: liveNames, weights: liveWeights } = await filterParticipants(
                template.filter_criteria,
                allStudents,
            );
            if (liveNames.length === 0) {
                showToast(t("wheel_zero_participants_warning" as any), "info");
                // proceed — empty wheel is visible to admin
            }
            const liveTmpl = {
                ...template,
                participant_ids: liveIds,
                participant_names: liveNames,
                ticket_weights: liveWeights.length > 0 ? liveWeights : undefined,
            };
            setLiveTemplate(liveTmpl);
            setLiveRound(1);

            // Resolve class names for the info card
            const resolvedClassNames = template.filter_criteria.class_ids?.length
                ? (classes ?? []).filter(c => template.filter_criteria.class_ids!.includes(c.id)).map(c => c.name)
                : [];

            // This hook function performs BOTH the broadcast AND the DB update to app_settings
            await wheelAdmin.activateWheel(
                liveTmpl.id,
                liveNames,
                template.name,
                1,
                template.filter_criteria,
                resolvedClassNames,
            );

            await recordActivation(template.id);
            showToast(
                t("wheel_activated_toast", { name: template.name }),
                "success",
            );
        },
        [wheelAdmin, recordActivation, showToast, t, campaignId, filterParticipants, allStudents],
    );

    const handleSpin = useCallback(async () => {
        if (!liveTemplate) return;
        const totalRounds = liveTemplate.total_rounds ?? 0;
        const placeNumber = totalRounds > 0 && liveRound <= totalRounds
            ? totalRounds - liveRound + 1
            : null;
        const weights = liveTemplate.ticket_weights;
        const idx = (weights && weights.length === liveTemplate.participant_names.length)
            ? (() => {
                const total = weights.reduce((a, b) => a + b, 0);
                let r = Math.random() * total;
                for (let i = 0; i < weights.length; i++) {
                    r -= weights[i];
                    if (r <= 0) return i;
                }
                return weights.length - 1;
            })()
            : Math.floor(Math.random() * liveTemplate.participant_names.length);
        const winnerName = liveTemplate.participant_names[idx];
        const winnerId = liveTemplate.participant_ids[idx];
        const winnerStudent = allStudents.find((s) => s.id === winnerId || s.name === winnerName);
        const winnerClassName = classes?.find((c) => c.id === winnerStudent?.class_id)?.name;

        // 1. Pre-calculate animation duration
        const dummySim = createWheelSimulation({
            segmentCount: liveTemplate.participant_names.length,
            winnerIndex: idx,
        });
        // physics duration is in seconds
        const physicsDurationSec = dummySim.getDuration();
        const durationMs = Math.ceil(physicsDurationSec * 1000);

        // 2. Set synchronized start time (300ms buffer for network)
        const startAtMs = Date.now() + 300;

        // 3. Broadcast the synchronized spin event
        await wheelAdmin.spinWheel(
            idx,
            winnerName,
            liveRound,
            startAtMs,
            durationMs,
            liveTemplate.participant_names,
            winnerClassName,
            placeNumber,
            totalRounds > 0 ? totalRounds : undefined,
        );

        // 3b. Mark spinning state locally (remote admins get it via remoteCommand effect)
        setIsSpinning(true);
        if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
        spinTimerRef.current = setTimeout(() => {
            setIsSpinning(false);
        }, durationMs + 1500);

        // 4. Remove winner from local state IMMEDIATELY so next spin can't pick them
        const newNames = [...liveTemplate.participant_names];
        const newIds = [...liveTemplate.participant_ids];
        const newWeights = liveTemplate.ticket_weights ? [...liveTemplate.ticket_weights] : undefined;
        newNames.splice(idx, 1);
        newIds.splice(idx, 1);
        if (newWeights) newWeights.splice(idx, 1);
        const updatedTemplate = {
            ...liveTemplate,
            participant_names: newNames,
            participant_ids: newIds,
            ticket_weights: newWeights,
        };
        setLiveTemplate(updatedTemplate);
        setLiveRound((r) => r + 1);

        // 5. Save winner to DB
        try {
            await saveWinner({
                template_id: liveTemplate.id,
                student_id: winnerId || winnerStudent?.id || null,
                student_name: winnerName,
                class_name: winnerClassName,
                round_number: liveRound,
                place_number: placeNumber,
                wheel_name: liveTemplate.name,
            });
        } catch (e) {
            console.error("Failed to save winner", e);
        }

        // 6. After celebration, push updated list to dashboard so the wheel shrinks
        if (shrinkTimerRef.current) clearTimeout(shrinkTimerRef.current);
        shrinkTimerRef.current = setTimeout(async () => {
            // Abort if wheel was deactivated while waiting
            if (!liveTemplateRef.current || liveTemplateRef.current.id !== updatedTemplate.id) return;
            try {
                const shrinkClassNames = updatedTemplate.filter_criteria.class_ids?.length
                    ? (classes ?? []).filter(c => updatedTemplate.filter_criteria.class_ids!.includes(c.id)).map(c => c.name)
                    : [];
                await wheelAdmin.activateWheel(
                    updatedTemplate.id,
                    updatedTemplate.participant_names,
                    updatedTemplate.name,
                    liveRound + 1,
                    updatedTemplate.filter_criteria,
                    shrinkClassNames,
                );
            } catch (e) {
                console.error("Failed to shrink wheel", e);
            }
        }, durationMs + 10000);
    }, [liveTemplate, liveRound, wheelAdmin, saveWinner, allStudents, classes]);

    const handleDeactivate = useCallback(async () => {
        // Cancel any pending post-spin re-activation
        if (shrinkTimerRef.current) clearTimeout(shrinkTimerRef.current);
        if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
        // Mark as deactivated BEFORE clearing, so the restore-effect won't
        // re-activate while settings.active_lucky_wheel_id is still the old ID.
        lastDeactivatedIdRef.current = liveTemplateRef.current?.id ?? null;
        setLiveTemplate(null);
        setLiveRound(1);
        setIsSpinning(false);
        await wheelAdmin.deactivateWheel();
        showToast(t("wheel_deactivated_toast"), "success");
    }, [wheelAdmin, showToast, t]);

    const { modalConfig, openConfirmation } =
        useConfirmation();

    const handleDelete = useCallback(
        async (id: string) => {
            openConfirmation({
                title: t("confirm_deletion"),
                message: t("click_again_to_confirm"),
                isDanger: true,
                onConfirm: async () => {
                    await deleteTemplate(id);
                    showToast(t("deleted_successfully"), "success");
                },
            });
        },
        [deleteTemplate, showToast, t, openConfirmation],
    );

    const handleDeleteWinner = useCallback(
        async (winner: any) => {
            openConfirmation({
                title: t("confirm_delete_winner"),
                message: `${
                    t("confirm_delete_winner_desc")
                }: ${winner.student_name} (${winner.class_name || ""})`,
                isDanger: true,
                onConfirm: async () => {
                    await deleteWinner(winner.id);
                    showToast(t("deleted_successfully"), "success");
                },
            });
        },
        [deleteWinner, showToast, t, openConfirmation],
    );

    const handleDeleteAllWinners = useCallback(
        async () => {
            openConfirmation({
                title: t("confirm_delete_all_winners", { defaultValue: "מחיקת כל הזוכים" } as any),
                message: t("confirm_delete_all_winners_desc", { defaultValue: "האם את/ה בטוח/ה שברצונך למחוק את כל היסטוריית הזכיות? פעולה זו תימחק לצמיתות את כל הרשומות." } as any),
                isDanger: true,
                onConfirm: async () => {
                    await deleteAllWinners();
                    showToast(t("deleted_successfully"), "success");
                },
            });
        },
        [deleteAllWinners, showToast, t, openConfirmation],
    );

    const handleDuplicate = useCallback(
        async (template: LuckyWheelTemplate) => {
            await duplicateTemplate(template);
            showToast(t("copied_to_clipboard"), "success");
        },
        [duplicateTemplate, showToast, t],
    );

    if (isLoadingTemplates) {
        return (
            <div className="flex items-center justify-center h-40">
                <RefreshIcon className="w-8 h-8 animate-spin text-[var(--text-muted)]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <ConfirmationModal
                isOpen={modalConfig.isOpen}
                title={modalConfig.title}
                message={modalConfig.message}
                onConfirm={modalConfig.onConfirm}
                onCancel={modalConfig.onCancel}
                showCancel={modalConfig.showCancel}
                isDanger={modalConfig.isDanger}
                confirmText={modalConfig.confirmText}
            />
            {/* Live Control Bar */}
            <AnimatePresence>
                {liveTemplate && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 shadow-xl text-white"
                    >
                        <div className="flex items-center gap-4">
                            {/* Close / Stop button — far left, always red, touch-friendly */}
                            <button
                                onClick={handleDeactivate}
                                disabled={isSpinning}
                                className="shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-bold active:scale-95 transition-transform disabled:opacity-30 disabled:cursor-not-allowed"
                                style={{ touchAction: "manipulation" }}
                                title={t("close_wheel_btn")}
                            >
                                {/* Filled stop square */}
                                <span className="block w-4 h-4 rounded-sm bg-white" />
                                <span>{t("close_wheel_btn")}</span>
                            </button>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="text-xs uppercase tracking-wider opacity-70 font-bold">
                                    {t("live_control_title")}
                                </div>
                                <div className="font-bold text-lg leading-tight truncate">
                                    {liveTemplate.name}
                                </div>
                                <div className="text-sm opacity-70">
                                    {(() => {
                                        const totalRounds = liveTemplate.total_rounds ?? 0;
                                        const placeNum = totalRounds > 0 && liveRound <= totalRounds
                                            ? totalRounds - liveRound + 1 : null;
                                        return placeNum !== null
                                            ? t("place_label" as any, { place: placeNum, total: totalRounds })
                                            : t("bonus_label" as any, { round: liveRound });
                                    })()} •{" "}
                                    {t("participants_count_label", {
                                        count: liveTemplate.participant_names.length,
                                    })}
                                </div>
                            </div>

                            {/* Spin button — far right */}
                            <button
                                onClick={handleSpin}
                                disabled={isSpinning}
                                className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-amber-400 text-slate-900 rounded-lg font-bold active:scale-95 transition-transform shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
                                style={{ touchAction: "manipulation" }}
                            >
                                {isSpinning
                                    ? <RefreshIcon className="w-4 h-4 animate-spin" />
                                    : <Play className="w-4 h-4 fill-current" />}
                                {(() => {
                                    const totalRounds = liveTemplate.total_rounds ?? 0;
                                    const placeNum = totalRounds > 0 && liveRound <= totalRounds
                                        ? totalRounds - liveRound + 1 : null;
                                    return placeNum !== null
                                        ? t("spin_place_btn" as any, { place: placeNum, total: totalRounds })
                                        : t("spin_bonus_btn" as any, { round: liveRound });
                                })()}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Templates Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-[var(--text-main)]">
                        {t("wheel_templates_title")}
                    </h3>
                    <p className="text-sm text-[var(--text-muted)]">
                        {t("lucky_wheel_mgmt_desc")}
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditingTemplate(null);
                        setShowCreateDialog(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--primary-base)] text-white rounded-lg font-medium hover:bg-[var(--primary-hover)] active:scale-95 transition-all shadow-md"
                >
                    <Plus className="w-4 h-4" />
                    {t("new_wheel_template")}
                </button>
            </div>

            {/* Template Cards */}
            {templates.length === 0
                ? (
                    <div className="text-center py-16 text-[var(--text-muted)]">
                        <div className="flex justify-center mb-4">
                            <FerrisWheel className="w-16 h-16 opacity-20" />
                        </div>
                        <p className="font-medium">
                            {t("no_templates_yet_label")}
                        </p>
                        <p className="text-sm">
                            {t("create_first_template_desc")}
                        </p>
                    </div>
                )
                : (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {templates.map((tmpl) => (
                            <motion.div
                                key={tmpl.id}
                                layout
                                className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-4 shadow-[var(--card-shadow)] hover:border-[var(--primary-base)]/30 transition-colors"
                            >
                                {/* Card header: name + status + go-live */}
                                <div className="flex items-start justify-between gap-2 mb-3">
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-bold text-[var(--text-main)] flex items-center gap-2 flex-wrap leading-tight">
                                            {tmpl.name}
                                            {liveTemplate?.id === tmpl.id
                                                ? (
                                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500 text-[10px] font-black uppercase tracking-wider text-white rounded-full animate-pulse">
                                                        <span className="w-1.5 h-1.5 bg-white rounded-full" />
                                                        {t("live_status")}
                                                    </span>
                                                )
                                                : tmpl.last_activated_at
                                                    ? (
                                                        <span className="px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-bold flex items-center gap-1">
                                                            <Zap className="w-2.5 h-2.5" />
                                                            {t("activated_badge")}
                                                        </span>
                                                    )
                                                    : (
                                                        <span className="px-1.5 py-0.5 rounded-full bg-[var(--bg-surface)] text-[var(--text-muted)] text-[10px] font-bold">
                                                            {t("never_activated_badge")}
                                                        </span>
                                                    )}
                                        </h4>
                                    </div>
                                    <button
                                        onClick={() => handleActivate(tmpl)}
                                        disabled={!!liveTemplate}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm font-bold hover:bg-emerald-500/20 active:scale-95 transition-all disabled:opacity-40 shrink-0"
                                    >
                                        <Play className="w-3.5 h-3.5" />
                                        {t("go_live_btn")}
                                    </button>
                                </div>

                                {/* Stats pills row */}
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    {/* Participants */}
                                    <span className="flex items-center gap-1 text-xs text-[var(--text-muted)] bg-[var(--bg-surface)] px-2 py-0.5 rounded-full">
                                        <Users className="w-3 h-3" />
                                        {t("participants_count_label", {
                                            count: liveCounts[tmpl.id] ?? tmpl.participant_names.length,
                                        })}
                                    </span>
                                    {/* Total rounds */}
                                    {(tmpl.total_rounds ?? 0) > 0 && (
                                        <span className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                            🏆 {t("n_rounds" as any, { count: tmpl.total_rounds })}
                                        </span>
                                    )}
                                    {/* Class filter */}
                                    {tmpl.filter_criteria && (
                                        <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-surface)] px-2 py-0.5 rounded-full">
                                            {tmpl.filter_criteria.class_ids?.length
                                                ? `${tmpl.filter_criteria.class_ids.length} ${t("classes_plural" as any)}`
                                                : t("all_groups" as any)}
                                        </span>
                                    )}
                                    {/* Score range */}
                                    {tmpl.filter_criteria?.min_score != null && (
                                        <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-surface)] px-2 py-0.5 rounded-full">
                                            {t("min_score_filter_label")}: {formatScore(tmpl.filter_criteria.min_score)}
                                        </span>
                                    )}
                                    {tmpl.filter_criteria?.max_score != null && (
                                        <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-surface)] px-2 py-0.5 rounded-full">
                                            {t("max_score_filter_label")}: {formatScore(tmpl.filter_criteria.max_score)}
                                        </span>
                                    )}
                                    {tmpl.filter_criteria?.exclude_previous_winners && (
                                        <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-surface)] px-2 py-0.5 rounded-full">
                                            {t("exclude_past_winners_label")}
                                        </span>
                                    )}
                                    {/* Last activated */}
                                    {tmpl.last_activated_at && (
                                        <span className="text-[11px] text-[var(--text-muted)] bg-[var(--bg-surface)] px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <RefreshIcon className="w-2.5 h-2.5 opacity-50" />
                                            {new Date(tmpl.last_activated_at).toLocaleString("he-IL", {
                                                day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                                            })}
                                        </span>
                                    )}
                                </div>

                                <div className="flex gap-1.5">
                                    <button
                                        onClick={() => {
                                            setEditingTemplate(tmpl);
                                            setShowCreateDialog(true);
                                        }}
                                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-[var(--text-muted)] hover:bg-[var(--bg-hover)] rounded-md transition-colors"
                                    >
                                        <Edit className="w-3 h-3" />{" "}
                                        {t("edit" as any)}
                                    </button>
                                    <button
                                        onClick={() => handleDuplicate(tmpl)}
                                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-[var(--text-muted)] hover:bg-[var(--bg-hover)] rounded-md transition-colors"
                                    >
                                        <Copy className="w-3 h-3" />{" "}
                                        {t("duplicate_message" as any)}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(tmpl.id)}
                                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-500/10 rounded-md transition-colors ms-auto"
                                    >
                                        <Trash2 className="w-3 h-3" />{" "}
                                        {t("delete" as any)}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

            {/* Winner History */}
            {winners.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold text-[var(--text-main)]">
                            {t("winner_history_title")}
                        </h3>
                        <button
                            onClick={handleDeleteAllWinners}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg text-sm font-bold transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            {t("delete_all" as any) || "מחק את כולם"}
                        </button>
                    </div>
                    <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl overflow-hidden shadow-[var(--card-shadow)]">
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            <table className="w-full text-sm">
                                <thead className="bg-[var(--bg-surface)] sticky top-0">
                                    <tr>
                                        <th className="text-start px-4 py-2.5 font-bold text-[var(--text-muted)]">
                                            {t("full_name_label" as any)}
                                        </th>
                                        <th className="text-start px-4 py-2.5 font-bold text-[var(--text-muted)]">
                                            {t("group_label" as any)}
                                        </th>
                                        <th className="text-start px-4 py-2.5 font-bold text-[var(--text-muted)]">
                                            {t("tab_lucky_wheel")}
                                        </th>
                                        <th className="text-start px-4 py-2.5 font-bold text-[var(--text-muted)]">
                                            {t("round_prefix")}
                                        </th>
                                        <th className="text-start px-4 py-2.5 font-bold text-[var(--text-muted)]">
                                            {t("time" as any)}
                                        </th>
                                        <th className="w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--divide-main)]">
                                    {winners.map((w) => (
                                        <tr
                                            key={w.id}
                                            className="hover:bg-[var(--bg-hover)] transition-colors"
                                        >
                                            <td className="px-4 py-2.5 font-medium text-[var(--text-main)]">
                                                {w.student_name}
                                            </td>
                                            <td className="px-4 py-2.5 text-[var(--text-muted)]">
                                                {w.class_name || "—"}
                                            </td>
                                            <td className="px-4 py-2.5 text-[var(--text-muted)]">
                                                {w.wheel_name || "—"}
                                            </td>
                                            <td className="px-4 py-2.5 text-[var(--text-muted)] font-bold">
                                                {w.place_number != null
                                                    ? `מקום ${w.place_number}`
                                                    : w.place_number === null
                                                        ? t("bonus_label" as any, { round: w.round_number })
                                                        : `#${w.round_number}`}
                                            </td>
                                            <td className="px-4 py-2.5 text-[var(--text-muted)] text-xs whitespace-nowrap">
                                                {new Date(w.won_at)
                                                    .toLocaleString(
                                                        "he-IL",
                                                        {
                                                            day: "2-digit",
                                                            month: "2-digit",
                                                            year: "numeric",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        }
                                                    )}
                                            </td>
                                            <td className="px-2 py-1">
                                                <button
                                                    onClick={() =>
                                                        handleDeleteWinner(w)}
                                                    className="p-1.5 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                                                    title={t("delete" as any)}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Edit Dialog */}
            <AnimatePresence>
                {showCreateDialog && (
                    <TemplateFormDialog
                        template={editingTemplate}
                        classes={classes || []}
                        allStudents={allStudents}
                        filterParticipants={filterParticipants}
                        onSave={handleSaveTemplate}
                        onClose={() => {
                            setShowCreateDialog(false);
                            setEditingTemplate(null);
                        }}
                        isSaving={isCreating}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

// ── Template Form Dialog ─────────────────────────────────────────

interface TemplateFormDialogProps {
    template: LuckyWheelTemplate | null;
    classes: { id: string; name: string; students: Student[] }[];
    allStudents: Student[];
    filterParticipants: (
        criteria: WheelFilterCriteria,
        students: Student[],
    ) => Promise<{ ids: string[]; names: string[]; weights: number[] }>;
    onSave: (name: string, totalRounds: number, criteria: WheelFilterCriteria) => void;
    onClose: () => void;
    isSaving: boolean;
}

const TemplateFormDialog: React.FC<TemplateFormDialogProps> = ({
    template,
    classes,
    allStudents,
    filterParticipants,
    onSave,
    onClose,
    isSaving,
}) => {
    const { t } = useLanguage();
    const [name, setName] = useState(template?.name || "");
    const [totalRounds, setTotalRounds] = useState<string>(
        template?.total_rounds?.toString() || "",
    );
    const [selectedClassIds, setSelectedClassIds] = useState<string[]>(
        template?.filter_criteria?.class_ids || [],
    );
    const [minScore, setMinScore] = useState<string>(
        template?.filter_criteria?.min_score?.toString() || "",
    );
    const [maxScore, setMaxScore] = useState<string>(
        template?.filter_criteria?.max_score?.toString() || "",
    );
    const [excludeWinners, setExcludeWinners] = useState(
        template?.filter_criteria?.exclude_previous_winners || false,
    );
    const [pointsPerTicket, setPointsPerTicket] = useState<string>(
        template?.filter_criteria?.points_per_ticket?.toString() || "",
    );
    const [previewNames, setPreviewNames] = useState<string[]>([]);
    const [previewWeights, setPreviewWeights] = useState<number[]>([]);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);

    const buildCriteria = useCallback((): WheelFilterCriteria => ({
        class_ids: selectedClassIds.length > 0 ? selectedClassIds : undefined,
        min_score: minScore ? Number(minScore) : undefined,
        max_score: maxScore ? Number(maxScore) : undefined,
        exclude_previous_winners: excludeWinners || undefined,
        points_per_ticket: pointsPerTicket ? Number(pointsPerTicket) : undefined,
    }), [selectedClassIds, minScore, maxScore, excludeWinners, pointsPerTicket]);

    const handlePreview = useCallback(async () => {
        setIsPreviewLoading(true);
        const { names, weights } = await filterParticipants(
            buildCriteria(),
            allStudents,
        );
        setPreviewNames(names);
        setPreviewWeights(weights);
        setIsPreviewLoading(false);
    }, [filterParticipants, buildCriteria, allStudents]);

    const handleSubmit = useCallback(() => {
        if (!name.trim() || !totalRounds || Number(totalRounds) < 1) return;
        onSave(name.trim(), Number(totalRounds), buildCriteria());
    }, [name, totalRounds, buildCriteria, onSave]);

    const toggleClass = useCallback((classId: string) => {
        setSelectedClassIds((prev) =>
            prev.includes(classId)
                ? prev.filter((id) => id !== classId)
                : [...prev, classId]
        );
        setPreviewNames([]);
        setPreviewWeights([]);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 space-y-5">
                    <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                        {template
                            ? <Edit className="w-5 h-5" />
                            : <Plus className="w-5 h-5" />}
                        {template
                            ? t("edit_wheel_template")
                            : t("new_wheel_template")}
                    </h2>

                    {/* Name + Total Rounds (side by side) */}
                    <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                {t("template_name_label")}
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t("template_name_placeholder")}
                                className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-lg text-[var(--text-main)] focus:ring-2 focus:ring-[var(--primary-base)] focus:border-transparent outline-none text-start"
                            />
                        </div>
                        <div className="w-28">
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                {t("total_rounds_label")} <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="number"
                                min={1}
                                value={totalRounds}
                                onChange={(e) => setTotalRounds(e.target.value)}
                                placeholder={t("total_rounds_placeholder" as any)}
                                className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-lg text-[var(--text-main)] focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none text-center font-bold"
                            />
                        </div>
                    </div>

                    {/* Class filter */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            {t("filter_by_classes_label")}
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {[...classes].sort((a, b) => a.name.localeCompare(b.name, "he", { numeric: true, sensitivity: "base" })).map((cls) => (
                                <button
                                    key={cls.id}
                                    onClick={() => toggleClass(cls.id)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                                        selectedClassIds.includes(cls.id)
                                            ? "bg-[var(--primary-base)] text-white border-transparent"
                                            : "bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:border-[var(--primary-base)]/50"
                                    }`}
                                >
                                    {cls.name} ({cls.students.length})
                                </button>
                            ))}
                        </div>
                        {selectedClassIds.length === 0 && (
                            <p className="text-xs text-[var(--text-muted)] mt-1">
                                {t("all_classes_default_hint")}
                            </p>
                        )}
                    </div>

                    {/* Score range */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                {t("min_score_filter_label")}
                            </label>
                            <input
                                type="text"
                                value={formatScore(minScore)}
                                onChange={(e) => {
                                    setMinScore(
                                        parseScoreInput(e.target.value),
                                    );
                                    setPreviewNames([]);
                                    setPreviewWeights([]);
                                }}
                                placeholder="0"
                                className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-lg text-[var(--text-main)] focus:ring-2 focus:ring-[var(--primary-base)] focus:border-transparent outline-none text-start"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                                {t("max_score_filter_label")}
                            </label>
                            <input
                                type="text"
                                value={formatScore(maxScore)}
                                onChange={(e) => {
                                    setMaxScore(
                                        parseScoreInput(e.target.value),
                                    );
                                    setPreviewNames([]);
                                    setPreviewWeights([]);
                                }}
                                placeholder="∞"
                                className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-lg text-[var(--text-main)] focus:ring-2 focus:ring-[var(--primary-base)] focus:border-transparent outline-none text-start"
                            />
                        </div>
                    </div>

                    {/* Points per ticket — weighted lottery */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                            🎟 נקודות לכרטיס (הגרלה משוקללת)
                        </label>
                        <input
                            type="text"
                            value={formatScore(pointsPerTicket)}
                            onChange={(e) => {
                                setPointsPerTicket(parseScoreInput(e.target.value));
                                setPreviewNames([]);
                                setPreviewWeights([]);
                            }}
                            placeholder="ריק = סיכוי שווה לכולם"
                            className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-lg text-[var(--text-main)] focus:ring-2 focus:ring-[var(--primary-base)] focus:border-transparent outline-none text-start"
                        />
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                            למשל: 50 = כל 50 נקודות = כרטיס אחד נוסף
                        </p>
                    </div>

                    {/* Exclude past winners */}
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={excludeWinners}
                            onChange={(e) => {
                                setExcludeWinners(e.target.checked);
                                setPreviewNames([]);
                                setPreviewWeights([]);
                            }}
                            className="w-4 h-4 rounded accent-[var(--primary-base)]"
                        />
                        <span className="text-sm text-[var(--text-secondary)]">
                            {t("exclude_past_winners_label")}
                        </span>
                    </label>

                    {/* Preview */}
                    <div>
                        <button
                            onClick={handlePreview}
                            disabled={isPreviewLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-surface)] text-[var(--text-secondary)] rounded-lg text-sm font-medium hover:bg-[var(--bg-hover)] active:scale-95 transition-all"
                        >
                            <Users className="w-4 h-4" />
                            {isPreviewLoading
                                ? t("loading" as any)
                                : t("preview_participants_btn")}
                        </button>
                        {previewNames.length > 0 && (
                            <div className="mt-2 bg-[var(--bg-surface)] rounded-lg p-3 max-h-40 overflow-y-auto custom-scrollbar">
                                <div className="text-xs font-bold text-[var(--text-muted)] mb-1">
                                    {t("preview_participants_btn", {
                                        count: previewNames.length,
                                    })}
                                    {previewWeights.length > 0 && (
                                        <span className="ms-1 text-amber-500">
                                            • {previewWeights.reduce((a, b) => a + b, 0)} 🎟 סה״כ כרטיסים
                                        </span>
                                    )}:
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {previewNames.map((n, i) => (
                                        <span
                                            key={i}
                                            className="text-xs bg-[var(--bg-card)] text-[var(--text-main)] px-2 py-0.5 rounded-full border border-[var(--border-subtle)]"
                                        >
                                            {n}{previewWeights[i] != null ? ` (${previewWeights[i]}🎟)` : ""}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
                        >
                            {t("cancel" as any)}
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!name.trim() || isSaving}
                            className="px-5 py-2 bg-[var(--primary-base)] text-white rounded-lg font-medium hover:bg-[var(--primary-hover)] active:scale-95 transition-all disabled:opacity-50 shadow-md"
                        >
                            {isSaving
                                ? t("saving" as any)
                                : template
                                ? t("save" as any)
                                : t("add" as any)}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

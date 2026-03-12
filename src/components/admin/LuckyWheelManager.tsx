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
    Square,
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
            setLiveTemplate(null);
            setLiveRound(1);
            setIsSpinning(false);
            if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
        }
    }, [wheelAdmin.remoteCommand, templates, campaignId, queryClient]);

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

    // ── Create / Edit form ──
    const handleSaveTemplate = useCallback(
        async (name: string, criteria: WheelFilterCriteria) => {
            const { ids, names } = await filterParticipants(
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
                    filter_criteria: criteria,
                    participant_ids: ids,
                    participant_names: names,
                });
                showToast(t("template_updated_toast"), "success");
            } else {
                await createTemplate({
                    name,
                    filter_criteria: criteria,
                    participant_ids: ids,
                    participant_names: names,
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
            const { ids: liveIds, names: liveNames } = await filterParticipants(
                template.filter_criteria,
                allStudents,
            );
            if (liveNames.length === 0) {
                showToast(t("wheel_zero_participants_warning" as any), "info");
                // proceed — empty wheel is visible to admin
            }
            const liveTmpl = { ...template, participant_ids: liveIds, participant_names: liveNames };
            setLiveTemplate(liveTmpl);
            setLiveRound(1);

            // This hook function performs BOTH the broadcast AND the DB update to app_settings
            await wheelAdmin.activateWheel(
                liveTmpl.id,
                liveNames,
                template.name,
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
        const idx = Math.floor(
            Math.random() * liveTemplate.participant_names.length,
        );
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
        newNames.splice(idx, 1);
        newIds.splice(idx, 1);
        const updatedTemplate = { ...liveTemplate, participant_names: newNames, participant_ids: newIds };
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
                wheel_name: liveTemplate.name,
            });
        } catch (e) {
            console.error("Failed to save winner", e);
        }

        // 6. After celebration, push updated list to dashboard so the wheel shrinks
        setTimeout(async () => {
            try {
                await wheelAdmin.activateWheel(
                    updatedTemplate.id,
                    updatedTemplate.participant_names,
                    updatedTemplate.name,
                    liveRound + 1,
                );
            } catch (e) {
                console.error("Failed to shrink wheel", e);
            }
        }, durationMs + 10000);
    }, [liveTemplate, liveRound, wheelAdmin, saveWinner, allStudents, classes]);

    const handleDeactivate = useCallback(async () => {
        setLiveTemplate(null);
        setLiveRound(1);
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
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div>
                                <div className="text-xs uppercase tracking-wider opacity-70 font-bold">
                                    {t("live_control_title")}
                                </div>
                                <div className="font-bold text-lg">
                                    {liveTemplate.name}
                                </div>
                                <div className="text-sm opacity-70">
                                    {t("round_prefix")} #{liveRound} •{" "}
                                    {t("participants_count_label", {
                                        count: liveTemplate.participant_names
                                            .length,
                                    })}
                                </div>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                <button
                                    onClick={handleSpin}
                                    disabled={isSpinning}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-amber-400 text-slate-900 rounded-lg font-bold hover:bg-amber-300 active:scale-95 transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
                                >
                                    {isSpinning
                                        ? <RefreshIcon className="w-4 h-4 animate-spin" />
                                        : <Zap className="w-4 h-4" />}
                                    {t("spin_btn")} #{liveRound}
                                </button>
                                <button
                                    onClick={handleDeactivate}
                                    disabled={isSpinning}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-red-500/30 text-white rounded-lg font-medium hover:bg-red-500/50 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <Square className="w-4 h-4" />
                                    {t("close_wheel_btn")}
                                </button>
                            </div>
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
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h4 className="font-bold text-[var(--text-main)] flex items-center gap-2 flex-wrap">
                                            {tmpl.name}
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {liveTemplate?.id === tmpl.id &&
                                                    (
                                                        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500 text-[10px] font-black uppercase tracking-wider text-white rounded-full animate-pulse shadow-sm">
                                                            <span className="w-1.5 h-1.5 bg-white rounded-full" />
                                                            {t("live_status")}
                                                        </span>
                                                    )}
                                                {(!liveTemplate ||
                                                    liveTemplate.id !==
                                                        tmpl.id) && (
                                                        tmpl.last_activated_at
                                                            ? (
                                                                <span className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                                                    <Zap className="w-2.5 h-2.5" />
                                                                    {t("activated_badge")}
                                                                </span>
                                                            )
                                                            : (
                                                                <span className="px-1.5 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-wider">
                                                                    {t("never_activated_badge")}
                                                                </span>
                                                            )
                                                    )}
                                            </div>
                                        </h4>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <Users className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                                            <span className="text-sm text-[var(--text-muted)]">
                                                {t("participants_count_label", {
                                                    count:
                                                        tmpl.participant_names
                                                            .length,
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleActivate(tmpl)}
                                        disabled={!!liveTemplate}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm font-bold hover:bg-emerald-500/20 active:scale-95 transition-all disabled:opacity-40"
                                    >
                                        <Play className="w-3.5 h-3.5" />
                                        {t("go_live_btn")}
                                    </button>
                                </div>

                                {/* Filter summary */}
                                {tmpl.filter_criteria && (
                                    <div className="text-xs text-[var(--text-muted)] bg-[var(--bg-surface)] rounded-lg px-3 py-2 mb-3">
                                        {tmpl.filter_criteria.class_ids?.length
                                            ? `${tmpl.filter_criteria.class_ids.length} ${
                                                t("classes_plural" as any)
                                            }`
                                            : t("all_campaigns" as any)}
                                        {tmpl.filter_criteria.min_score !=
                                                null &&
                                            ` • ${
                                                t("min_score_filter_label")
                                            }: ${
                                                formatScore(
                                                    tmpl.filter_criteria
                                                        .min_score,
                                                )
                                            }`}
                                        {tmpl.filter_criteria.max_score !=
                                                null &&
                                            ` • ${
                                                t("max_score_filter_label")
                                            }: ${
                                                formatScore(
                                                    tmpl.filter_criteria
                                                        .max_score,
                                                )
                                            }`}
                                        {tmpl.filter_criteria
                                            .exclude_previous_winners &&
                                            ` • ${
                                                t("exclude_past_winners_label")
                                            }`}
                                    </div>
                                )}

                                {tmpl.last_activated_at && (
                                    <div className="text-[11px] text-[var(--text-muted)] mt-1 flex items-center gap-1">
                                        <RefreshIcon className="w-3 h-3 opacity-50" />
                                        {t("last_activated_label")}:{" "}
                                        {new Date(tmpl.last_activated_at)
                                            .toLocaleString("he-IL", {
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                    </div>
                                )}

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
                                            <td className="px-4 py-2.5 text-[var(--text-muted)]">
                                                #{w.round_number}
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
    ) => Promise<{ ids: string[]; names: string[] }>;
    onSave: (name: string, criteria: WheelFilterCriteria) => void;
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
    const [previewNames, setPreviewNames] = useState<string[]>([]);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);

    const buildCriteria = useCallback((): WheelFilterCriteria => ({
        class_ids: selectedClassIds.length > 0 ? selectedClassIds : undefined,
        min_score: minScore ? Number(minScore) : undefined,
        max_score: maxScore ? Number(maxScore) : undefined,
        exclude_previous_winners: excludeWinners || undefined,
    }), [selectedClassIds, minScore, maxScore, excludeWinners]);

    const handlePreview = useCallback(async () => {
        setIsPreviewLoading(true);
        const { names } = await filterParticipants(
            buildCriteria(),
            allStudents,
        );
        setPreviewNames(names);
        setIsPreviewLoading(false);
    }, [filterParticipants, buildCriteria, allStudents]);

    const handleSubmit = useCallback(() => {
        if (!name.trim()) return;
        onSave(name.trim(), buildCriteria());
    }, [name, buildCriteria, onSave]);

    const toggleClass = useCallback((classId: string) => {
        setSelectedClassIds((prev) =>
            prev.includes(classId)
                ? prev.filter((id) => id !== classId)
                : [...prev, classId]
        );
        setPreviewNames([]); // reset preview
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

                    {/* Name */}
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

                    {/* Class filter */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            {t("filter_by_classes_label")}
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {classes.map((cls) => (
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
                                }}
                                placeholder="∞"
                                className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-main)] rounded-lg text-[var(--text-main)] focus:ring-2 focus:ring-[var(--primary-base)] focus:border-transparent outline-none text-start"
                            />
                        </div>
                    </div>

                    {/* Exclude past winners */}
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={excludeWinners}
                            onChange={(e) => {
                                setExcludeWinners(e.target.checked);
                                setPreviewNames([]);
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
                                    })}:
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {previewNames.map((n, i) => (
                                        <span
                                            key={i}
                                            className="text-xs bg-[var(--bg-card)] text-[var(--text-main)] px-2 py-0.5 rounded-full border border-[var(--border-subtle)]"
                                        >
                                            {n}
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

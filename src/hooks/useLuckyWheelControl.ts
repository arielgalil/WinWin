import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../supabaseClient";
import { LuckyWheelControlState, WheelFilterCriteria } from "../types";
import { logger } from "../utils/logger";

/**
 * Admin-side hook: sends commands to all Dashboard clients via Supabase Broadcast,
 * and also listens for commands from other admin devices on the same campaign.
 */
export function useLuckyWheelAdmin(campaignId: string | undefined) {
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
    const [remoteCommand, setRemoteCommand] = useState<LuckyWheelControlState | null>(null);

    useEffect(() => {
        if (!campaignId) return;

        const channel = supabase
            .channel(`lucky_wheel_control_${campaignId}`)
            .on("broadcast", { event: "wheel_command" }, ({ payload }) => {
                logger.info("[WheelAdmin] Received remote command:", payload?.action);
                setRemoteCommand(payload as LuckyWheelControlState);
            })
            .subscribe((status) => {
                if (status === "SUBSCRIBED") {
                    logger.info(
                        `[WheelAdmin] Subscribed to broadcast channel for ${campaignId}`,
                    );
                }
            });
        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [campaignId]);

    const broadcast = useCallback(
        async (payload: any, event: string = "wheel_command") => {
            if (!channelRef.current) {
                logger.error("[WheelAdmin] No broadcast channel available");
                return;
            }
            const status = await channelRef.current.send({
                type: "broadcast",
                event,
                payload,
            });
            if (status !== "ok") {
                logger.error(`[WheelAdmin] Broadcast FAILED: ${status}`, {
                    event,
                    action: payload.action,
                });
            } else {
                logger.info(
                    `[WheelAdmin] Broadcast sent: ${event} ${
                        payload.action || ""
                    }`,
                    {
                        status,
                        round: payload.round_number,
                    },
                );
            }
        },
        [],
    );

    const activateWheel = useCallback(
        async (
            templateId: string,
            participantNames: string[],
            wheelName?: string,
            roundNumber: number = 1,
            filterCriteria?: WheelFilterCriteria,
            classNames?: string[],
        ) => {
            // Send broadcast for immediate response
            await broadcast({
                action: "ACTIVATE",
                template_id: templateId,
                participant_names: participantNames,
                wheel_name: wheelName,
                round_number: roundNumber,
                filter_criteria: filterCriteria,
                class_names: classNames,
            });

            // Persist to DB for reliability/refresh
            if (campaignId) {
                const { error } = await supabase
                    .from("app_settings")
                    .update({ active_lucky_wheel_id: templateId })
                    .eq("campaign_id", campaignId);

                if (error) {
                    logger.error(
                        "[WheelAdmin] Failed to persist activation:",
                        error,
                    );
                } else {
                    // Force refresh for clients that missed the direct ACTIVATE broadcast
                    await broadcast({}, "settings_updated");
                }
            }
        },
        [broadcast, campaignId],
    );

    const spinWheel = useCallback(
        async (
            winnerIndex: number,
            winnerName: string,
            roundNumber: number,
            startAtMs: number,
            durationMs: number,
            participantNames: string[],
            winnerClass?: string,
            placeNumber?: number | null,
            totalRounds?: number,
            prizeEmoji?: string,
        ) => {
            await broadcast({
                action: "SPIN",
                winner_index: winnerIndex,
                winner_name: winnerName,
                winner_class: winnerClass,
                round_number: roundNumber,
                place_number: placeNumber,
                total_rounds: totalRounds,
                start_at_ms: startAtMs,
                duration_ms: durationMs,
                participant_names: participantNames,
                prize_emoji: prizeEmoji,
            });

            // Persist spin for late joiners (cleared automatically after spin ends)
            if (campaignId) {
                await supabase
                    .from("app_settings")
                    .update({
                        active_spin: {
                            winner_index: winnerIndex,
                            winner_name: winnerName,
                            round_number: roundNumber,
                            place_number: placeNumber,
                            total_rounds: totalRounds,
                            start_at_ms: startAtMs,
                            duration_ms: durationMs,
                            participant_names: participantNames,
                        },
                    })
                    .eq("campaign_id", campaignId);

                // Auto-clear once the spin animation finishes (+1s buffer)
                window.setTimeout(async () => {
                    await supabase
                        .from("app_settings")
                        .update({ active_spin: null })
                        .eq("campaign_id", campaignId);
                }, durationMs + 1000);
            }
        },
        [broadcast, campaignId],
    );

    const resetWheel = useCallback(
        () => broadcast({ action: "RESET" }),
        [broadcast],
    );

    const deactivateWheel = useCallback(
        async () => {
            await broadcast({ action: "DEACTIVATE" });

            if (campaignId) {
                const { error } = await supabase
                    .from("app_settings")
                    .update({ active_lucky_wheel_id: null })
                    .eq("campaign_id", campaignId);

                if (error) {
                    logger.error(
                        "[WheelAdmin] Failed to persist deactivation:",
                        error,
                    );
                } else {
                    // Force refresh for clients
                    await broadcast({}, "settings_updated");
                }
            }
        },
        [broadcast, campaignId],
    );

    return { activateWheel, spinWheel, resetWheel, deactivateWheel, remoteCommand };
}

/**
 * Dashboard-side hook: listens for wheel commands from admin.
 */
export function useLuckyWheelListener(campaignId: string | undefined) {
    const [wheelState, setWheelState] = useState<LuckyWheelControlState | null>(
        null,
    );
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    useEffect(() => {
        if (!campaignId) {
            logger.debug("[WheelListener] Waiting for campaignId...");
            return;
        }

        logger.info(`[WheelListener] Setting up channel for ${campaignId}`);
        const channel = supabase
            .channel(`lucky_wheel_control_${campaignId}`, {
                config: {
                    broadcast: { self: true },
                },
            })
            .on("broadcast", { event: "wheel_command" }, ({ payload }) => {
                logger.info(
                    "[WheelListener] Received wheel command:",
                    payload?.action,
                    payload,
                );
                setWheelState(payload as LuckyWheelControlState);
            })
            .subscribe((status) => {
                if (status === "SUBSCRIBED") {
                    logger.info(
                        `[WheelListener] SUBSCRIBED to lucky_wheel_control_${campaignId}`,
                    );
                } else if (status === "CHANNEL_ERROR") {
                    logger.error(
                        `[WheelListener] CHANNEL_ERROR for ${campaignId}`,
                    );
                } else if (status === "TIMED_OUT") {
                    logger.warn(`[WheelListener] TIMED_OUT for ${campaignId}`);
                }
            });
        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                logger.debug(
                    `[WheelListener] Cleaning up channel for ${campaignId}`,
                );
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [campaignId]);

    const clearState = useCallback(() => setWheelState(null), []);

    return { wheelState, clearState };
}

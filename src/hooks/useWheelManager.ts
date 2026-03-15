import { useCallback, useEffect, useRef, useState } from "react";
import { useLuckyWheelListener } from "./useLuckyWheelControl";
import { useToast } from "./useToast";
import { supabase } from "../supabaseClient";
import { logger } from "../utils/logger";
import { AppSettings } from "../types";

interface UseWheelManagerOptions {
    campaignId: string | undefined;
    activeLuckyWheelId: string | null | undefined;
    activeSpin: AppSettings["active_spin"];
    language: string | undefined;
}

export interface WheelManagerState {
    wheelParticipants: string[];
    wheelWinnerIndex: number | null;
    wheelWinnerName: string | undefined;
    wheelWinnerClass: string | undefined;
    wheelName: string | undefined;
    wheelRound: number;
    wheelStartAtMs: number | undefined;
    wheelDurationMs: number | undefined;
    handleWheelSpinComplete: (index: number, name: string) => void;
}

export function useWheelManager({
    campaignId,
    activeLuckyWheelId,
    activeSpin,
    language,
}: UseWheelManagerOptions): WheelManagerState {
    const { wheelState } = useLuckyWheelListener(campaignId);
    const { showToast } = useToast();

    const [wheelParticipants, setWheelParticipants] = useState<string[]>([]);
    const [wheelWinnerIndex, setWheelWinnerIndex] = useState<number | null>(null);
    const [wheelWinnerName, setWheelWinnerName] = useState<string | undefined>();
    const [wheelWinnerClass, setWheelWinnerClass] = useState<string | undefined>();
    const [wheelName, setWheelName] = useState<string | undefined>();
    const [wheelRound, setWheelRound] = useState(1);
    const [wheelStartAtMs, setWheelStartAtMs] = useState<number | undefined>();
    const [wheelDurationMs, setWheelDurationMs] = useState<number | undefined>();

    const wheelCloseTimerRef = useRef<number | undefined>(undefined);
    const isWinnerAnnouncedRef = useRef(false);

    // Handle spin complete from the wheel
    const handleWheelSpinComplete = useCallback(
        (index: number, name: string) => {
            logger.info(`[WheelSync] Spin complete: ${name} (index ${index})`);
            isWinnerAnnouncedRef.current = true;

            showToast(
                language === "he"
                    ? `מזל טוב ל${name}! 🎉`
                    : `Congratulations to ${name}! 🎉`,
                "success",
            );

            if (wheelCloseTimerRef.current) {
                window.clearTimeout(wheelCloseTimerRef.current);
            }
            wheelCloseTimerRef.current = window.setTimeout(() => {
                logger.info("[WheelSync] Resetting winner view to idle");
                setWheelWinnerIndex(null);
                isWinnerAnnouncedRef.current = false;
                wheelCloseTimerRef.current = undefined;
            }, 10000);
        },
        [showToast, language],
    );

    // Handle wheel broadcast commands
    useEffect(() => {
        if (!wheelState) return;

        logger.debug(`[WheelSync] Command: ${wheelState.action}`, wheelState);

        switch (wheelState.action) {
            case "ACTIVATE":
                if (isWinnerAnnouncedRef.current) {
                    logger.warn("[WheelSync] Ignoring ACTIVATE during winner celebration");
                    return;
                }
                setWheelParticipants(wheelState.participant_names || []);
                setWheelWinnerIndex(null);
                setWheelWinnerName(undefined);
                setWheelWinnerClass(undefined);
                setWheelName(wheelState.wheel_name);
                setWheelRound(wheelState.round_number || 1);
                setWheelStartAtMs(undefined);
                setWheelDurationMs(undefined);
                break;
            case "SPIN":
                if (wheelCloseTimerRef.current) {
                    window.clearTimeout(wheelCloseTimerRef.current);
                    wheelCloseTimerRef.current = undefined;
                }
                isWinnerAnnouncedRef.current = false;
                if (wheelState.participant_names?.length) {
                    setWheelParticipants(wheelState.participant_names);
                }
                setWheelWinnerIndex(wheelState.winner_index ?? null);
                setWheelWinnerName(wheelState.winner_name);
                setWheelWinnerClass(wheelState.winner_class);
                setWheelRound(wheelState.round_number || wheelRound);
                setWheelStartAtMs(wheelState.start_at_ms);
                setWheelDurationMs(wheelState.duration_ms);
                break;
            case "RESET":
            case "DEACTIVATE":
                setWheelWinnerIndex(null);
                setWheelWinnerName(undefined);
                setWheelWinnerClass(undefined);
                isWinnerAnnouncedRef.current = false;
                break;
        }
    }, [wheelState, wheelRound]);

    // Initialize/Restore wheel participants from DB if not received via broadcast.
    // Also restores an active spin for users who join mid-spin.
    useEffect(() => {
        if (activeLuckyWheelId && wheelParticipants.length === 0) {
            const restoreWheel = async () => {
                try {
                    const { data } = await supabase
                        .from("lucky_wheel_templates")
                        .select("*")
                        .eq("id", activeLuckyWheelId)
                        .maybeSingle();
                    if (data) {
                        setWheelParticipants(data.participant_names || []);
                        setWheelName(data.name);
                    }
                } catch (err) {
                    logger.error("[WheelSync] Restoration error:", err);
                }
            };
            restoreWheel();
        }

        if (activeSpin && Date.now() < activeSpin.start_at_ms + activeSpin.duration_ms) {
            logger.info("[WheelSync] Restoring active spin for late joiner", activeSpin);
            if (activeSpin.participant_names?.length) {
                setWheelParticipants(activeSpin.participant_names);
            }
            setWheelWinnerIndex(activeSpin.winner_index ?? null);
            setWheelWinnerName(activeSpin.winner_name);
            setWheelRound(activeSpin.round_number || 1);
            setWheelStartAtMs(activeSpin.start_at_ms);
            setWheelDurationMs(activeSpin.duration_ms);
        }
    }, [activeLuckyWheelId, activeSpin, wheelParticipants.length]);

    return {
        wheelParticipants,
        wheelWinnerIndex,
        wheelWinnerName,
        wheelWinnerClass,
        wheelName,
        wheelRound,
        wheelStartAtMs,
        wheelDurationMs,
        handleWheelSpinComplete,
    };
}

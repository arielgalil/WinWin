import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "../../hooks/useLanguage";
import { LuckyWheel } from "./LuckyWheel";
import { WheelPhase } from "../../utils/wheelPhysics";

function vibrate(pattern: number | number[]) {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(pattern);
}

interface LuckyWheelOverlayProps {
    /** Whether the overlay is visible */
    isActive: boolean;
    /** List of participant names */
    participants: string[];
    /** Pre-determined winner index (null = waiting to spin) */
    winnerIndex: number | null;
    /** Absolute truth winner name from admin */
    winnerName?: string;
    /** Winner's class name */
    winnerClass?: string;
    /** Campaign primary color */
    primaryColor?: string;
    /** Campaign secondary color */
    secondaryColor?: string;
    /** Wheel template name */
    wheelName?: string;
    /** Current round */
    roundNumber?: number;
    /** Synchronized start timestamp (UNIX ms) */
    startAtMs?: number;
    /** Expected duration of the animation (ms) */
    durationMs?: number;
    /** Called when spin finishes */
    onSpinComplete?: (winnerIndex: number, winnerName: string) => void;
}

export const LuckyWheelOverlay: React.FC<LuckyWheelOverlayProps> = ({
    isActive,
    participants,
    winnerIndex,
    winnerName,
    winnerClass,
    primaryColor,
    secondaryColor,
    wheelName,
    roundNumber = 1,
    startAtMs,
    durationMs,
    onSpinComplete,
}) => {
    const { t } = useLanguage();

    // -- State Locking & Local Lifecycle --
    const [frozenParticipants, setFrozenParticipants] = useState<string[]>([]);
    const [frozenWinnerIndex, setFrozenWinnerIndex] = useState<number | null>(
        null,
    );
    const [frozenWinnerName, setFrozenWinnerName] = useState<
        string | undefined
    >();
    const [frozenStartAtMs, setFrozenStartAtMs] = useState<
        number | undefined
    >();
    const [frozenDurationMs, setFrozenDurationMs] = useState<
        number | undefined
    >();
    const [localActive, setLocalActive] = useState(false);
    // Use a ref instead of state so the effect never re-runs due to isBusy changing,
    // which previously caused the lockTimerRef to be cleared mid-spin → permanent lock.
    const isBusyRef = useRef(false);
    const frozenRoundRef = useRef<number>(0);

    const lockTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // 1. Explicit Close: If the admin closes the wheel, we respect it immediately
        if (!isActive) {
            setLocalActive(false);
            isBusyRef.current = false;
            if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
            return;
        }

        // 2. Normal Sync: If we are not in the middle of a spin sequence, sync with props
        if (!isBusyRef.current) {
            setLocalActive(true);
            vibrate(40);

            // Sync data only when not busy
            if (winnerIndex === null) {
                setFrozenParticipants(participants);
                setFrozenWinnerIndex(null);
                setFrozenWinnerName(undefined);
                setFrozenStartAtMs(undefined);
                setFrozenDurationMs(undefined);
            }
        }

        // 3. Spin Detection: If a spin starts and we aren't already busy
        // Allow a new-round spin (different roundNumber) to bypass the busy lock
        const isNewRound = roundNumber !== frozenRoundRef.current;
        if (isActive && winnerIndex !== null && (!isBusyRef.current || isNewRound)) {
            frozenRoundRef.current = roundNumber ?? 0;
            isBusyRef.current = true;
            setLocalActive(true);
            setFrozenParticipants(participants);
            setFrozenWinnerIndex(winnerIndex);
            setFrozenWinnerName(winnerName);
            setFrozenStartAtMs(startAtMs);
            setFrozenDurationMs(durationMs);

            if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
            lockTimerRef.current = setTimeout(() => {
                isBusyRef.current = false;
                // When the lock expires, the next render will sync with the latest props
                // (e.g., it will show the empty wheel for the next round if the admin already reset it)
            }, (durationMs || 10000) + 1000);
        }

        return () => {
            if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
        };
    }, [
        isActive,
        winnerIndex,
        participants,
        winnerName,
        startAtMs,
        durationMs,
        roundNumber,
        // isBusy intentionally omitted — using isBusyRef to prevent the cleanup
        // from cancelling the spin timer and causing a permanent lock
    ]);

    return (
        <AnimatePresence>
            {localActive && frozenParticipants.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.4 } }}
                    className="fixed inset-0 z-[9998] flex flex-col items-center bg-slate-950/95 backdrop-blur-lg overflow-hidden"
                >
                    {/* Header — fixed height, stays at top */}
                    <motion.div
                        initial={{ y: -30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="w-full shrink-0 pt-4 pb-2 text-center z-10"
                    >
                        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                            🎡 {wheelName || t("tab_lucky_wheel")}
                        </h1>
                        <p className="text-white/50 text-sm mt-1">
                            {t("participants_count_label", {
                                count: frozenParticipants.length,
                            })} • {t("round_prefix")} #{roundNumber}
                        </p>
                    </motion.div>

                    {/* Wheel — flex-1 so it fills remaining space, min-h-0 allows shrinking */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                            type: "spring",
                            stiffness: 150,
                            damping: 20,
                            delay: 0.1,
                        }}
                        className="flex-1 min-h-0 w-full flex items-center justify-center px-4"
                    >
                        <LuckyWheel
                            participants={frozenParticipants}
                            primaryColor={primaryColor}
                            secondaryColor={secondaryColor}
                            winnerIndex={frozenWinnerIndex}
                            winnerName={frozenWinnerName}
                            winnerClass={winnerClass}
                            roundNumber={roundNumber}
                            startAtMs={frozenStartAtMs}
                            durationMs={frozenDurationMs}
                            onSpinComplete={onSpinComplete}
                            onPhaseChange={(phase: WheelPhase) => {
                                if (phase === "accelerating") vibrate(30);
                                else if (phase === "decelerating") vibrate([20, 20, 15, 20, 10]);
                                else if (phase === "done") vibrate([50, 30, 50, 30, 100]);
                            }}
                        />
                    </motion.div>

                    {/* Bottom slot — waiting indicator or spacer to keep wheel centered */}
                    <div className="w-full shrink-0 flex justify-center items-center py-5 min-h-[64px]">
                        {frozenWinnerIndex == null && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                                    <span className="text-white/80 text-sm font-medium">
                                        {t("waiting_for_admin_label")}
                                    </span>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

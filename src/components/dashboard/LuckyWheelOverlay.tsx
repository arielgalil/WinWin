import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "../../hooks/useLanguage";
import { LuckyWheel } from "./LuckyWheel";
import { WheelPhase } from "../../utils/wheelPhysics";
import { WheelFilterCriteria } from "../../types";
import { formatRoundLabel } from "../../utils/stringUtils";

function vibrate(pattern: number | number[]) {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(pattern);
}

// ── Info Card ────────────────────────────────────────────────────

interface WheelInfoCardProps {
    participantCount: number;
    totalRounds?: number;
    filterCriteria?: WheelFilterCriteria;
    classNames?: string[];
}

const WheelInfoCard = React.memo(function WheelInfoCard({ participantCount, totalRounds, filterCriteria, classNames }: WheelInfoCardProps) {
    const { isRTL } = useLanguage();

    const chips: { icon: string; label: string; value?: string }[] = [];

    // Participants — always first
    chips.push({
        icon: "👥",
        label: isRTL ? "משתתפים" : "Participants",
        value: String(participantCount),
    });

    // Rounds
    if (totalRounds && totalRounds > 0) {
        chips.push({
            icon: "🔄",
            label: isRTL ? "סבבים" : "Rounds",
            value: String(totalRounds),
        });
    }

    if (filterCriteria) {
        // Min score
        if (filterCriteria.min_score != null) {
            chips.push({
                icon: "⭐",
                label: isRTL ? "ניקוד מינימלי" : "Min score",
                value: String(filterCriteria.min_score),
            });
        }

        // Points per ticket
        if (filterCriteria.points_per_ticket && filterCriteria.points_per_ticket > 0) {
            chips.push({
                icon: "🎟️",
                label: isRTL ? "נק' לכרטיס" : "Pts/ticket",
                value: String(filterCriteria.points_per_ticket),
            });
        }

        // Exclude previous winners
        if (filterCriteria.exclude_previous_winners) {
            chips.push({
                icon: "🚫",
                label: isRTL ? "ללא זוכים קודמים" : "No prev. winners",
            });
        }

        // Classes
        const hasSpecificClasses = classNames && classNames.length > 0;
        const classLabel = hasSpecificClasses
            ? classNames!.join(", ")
            : (isRTL ? "כל הכיתות" : "All classes");
        chips.push({
            icon: "🎓",
            label: isRTL ? "כיתות" : "Classes",
            value: classLabel,
        });
    }

    return (
        <div
            className="w-full px-4 py-2.5"
            dir={isRTL ? "rtl" : "ltr"}
        >
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, auto)",
                    justifyContent: "center",
                    gap: "6px",
                }}
            >
                {chips.map((chip, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/12 text-white"
                        style={{ fontSize: "0.75rem" }}
                    >
                        <span style={{ fontSize: "0.8rem" }}>{chip.icon}</span>
                        <span className="text-white/55 font-medium">{chip.label}</span>
                        {chip.value !== undefined && (
                            <>
                                <span className="text-white/25 mx-0.5">·</span>
                                <span className="font-bold text-white/90 max-w-[16ch] overflow-hidden text-ellipsis whitespace-nowrap">
                                    {chip.value}
                                </span>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
});

// ── Props ─────────────────────────────────────────────────────────

interface LuckyWheelOverlayProps {
    isActive: boolean;
    participants: string[];
    winnerIndex: number | null;
    winnerName?: string;
    winnerClass?: string;
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
    wheelName?: string;
    roundNumber?: number;
    placeNumber?: number | null;
    totalRounds?: number;
    startAtMs?: number;
    durationMs?: number;
    filterCriteria?: WheelFilterCriteria;
    classNames?: string[];
    prizeEmoji?: string;
    onSpinComplete?: (winnerIndex: number, winnerName: string) => void;
}

// ── Component ────────────────────────────────────────────────────

export const LuckyWheelOverlay: React.FC<LuckyWheelOverlayProps> = ({
    isActive,
    participants,
    winnerIndex,
    winnerName,
    winnerClass,
    primaryColor,
    secondaryColor,
    logoUrl,
    wheelName,
    roundNumber = 1,
    placeNumber,
    totalRounds,
    startAtMs,
    durationMs,
    filterCriteria,
    classNames,
    prizeEmoji,
    onSpinComplete,
}) => {
    const { t, isRTL } = useLanguage();

    // Compute place number (counts down: round 1 → highest place, then toward 1st)
    const effectivePlaceNumber: number | null | undefined = placeNumber !== undefined
        ? placeNumber
        : (totalRounds && totalRounds > 0)
            ? (roundNumber <= totalRounds ? totalRounds - roundNumber + 1 : null)
            : undefined;

    const roundLabel = formatRoundLabel(roundNumber, effectivePlaceNumber, totalRounds, isRTL);

    // ── Frozen state (locks during spin) ─────────────────────────
    const [frozenParticipants, setFrozenParticipants] = useState<string[]>([]);
    const [frozenWinnerIndex, setFrozenWinnerIndex] = useState<number | null>(null);
    const [frozenWinnerName, setFrozenWinnerName] = useState<string | undefined>();
    const [frozenStartAtMs, setFrozenStartAtMs] = useState<number | undefined>();
    const [frozenDurationMs, setFrozenDurationMs] = useState<number | undefined>();
    const [frozenPrizeEmoji, setFrozenPrizeEmoji] = useState<string | undefined>();
    const [localActive, setLocalActive] = useState(false);
    const isBusyRef = useRef(false);
    const frozenRoundRef = useRef<number>(0);
    const lockTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!isActive) {
            setLocalActive(false);
            isBusyRef.current = false;
            if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
            return;
        }

        if (!isBusyRef.current) {
            setLocalActive(true);
            vibrate(40);
            if (winnerIndex === null) {
                setFrozenParticipants(participants);
                setFrozenWinnerIndex(null);
                setFrozenWinnerName(undefined);
                setFrozenStartAtMs(undefined);
                setFrozenDurationMs(undefined);
            }
        }

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
            if (prizeEmoji) setFrozenPrizeEmoji(prizeEmoji);

            if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
            lockTimerRef.current = setTimeout(() => {
                isBusyRef.current = false;
            }, (durationMs || 10000) + 1000);
        }

        return () => {
            if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
        };
    }, [isActive, winnerIndex, participants, winnerName, startAtMs, durationMs, roundNumber]);

    const isWaiting = frozenWinnerIndex == null;

    return (
        <AnimatePresence>
            {localActive && frozenParticipants.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.4 } }}
                    className="fixed inset-0 z-[9998] flex flex-col items-center bg-slate-950/95 backdrop-blur-lg overflow-hidden"
                >
                    {/* ── HEADER: title + info chips (stable height) ── */}
                    <motion.div
                        initial={{ y: -30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="w-full shrink-0 pt-4 pb-3 px-4 flex flex-col items-center gap-2 z-10"
                    >
                        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight text-center">
                            🎡 {wheelName || t("tab_lucky_wheel")}
                        </h1>

                        {/*
                          Info card is ALWAYS in the DOM (never removed) so the header
                          height stays constant → wheel position never shifts.
                        */}
                        <div className="w-full max-w-xl">
                            <WheelInfoCard
                                participantCount={frozenParticipants.length}
                                totalRounds={totalRounds}
                                filterCriteria={filterCriteria}
                                classNames={classNames}
                            />
                        </div>
                    </motion.div>

                    {/* ── WHEEL: flex-1, vertically centered, never moves ── */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 150, damping: 20, delay: 0.1 }}
                        className="flex-1 min-h-0 w-full flex items-center justify-center px-4"
                    >
                        <LuckyWheel
                            participants={frozenParticipants}
                            primaryColor={primaryColor}
                            secondaryColor={secondaryColor}
                            logoUrl={logoUrl}
                            winnerIndex={frozenWinnerIndex}
                            winnerName={frozenWinnerName}
                            winnerClass={winnerClass}
                            roundNumber={roundNumber}
                            placeNumber={effectivePlaceNumber}
                            totalRounds={totalRounds}
                            startAtMs={frozenStartAtMs}
                            durationMs={frozenDurationMs}
                            prizeEmoji={frozenPrizeEmoji}
                            onSpinComplete={onSpinComplete}
                            onPhaseChange={(phase: WheelPhase) => {
                                if (phase === "accelerating") vibrate(30);
                                else if (phase === "decelerating") vibrate([20, 20, 15, 20, 10]);
                                else if (phase === "done") vibrate([50, 30, 50, 30, 100]);
                            }}
                        />
                    </motion.div>

                    {/*
                      ── FOOTER: fixed min-height so the wheel never shifts ──
                      Shows round label always + waiting pill only when idle.
                    */}
                    <div
                        className="w-full shrink-0 flex flex-col items-center justify-center gap-2 pb-5 pt-1 px-4"
                        style={{ minHeight: "80px" }}
                    >
                        {/* Round label */}
                        {roundLabel && (
                            <motion.span
                                key={roundLabel}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-sm md:text-base font-bold text-amber-400 tracking-wide"
                            >
                                {roundLabel}
                            </motion.span>
                        )}

                        {/* Waiting pill — AnimatePresence so it fades without shifting wheel */}
                        <AnimatePresence mode="wait">
                            {isWaiting && (
                                <motion.div
                                    key="waiting-pill"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2 }}
                                    className="inline-flex items-center gap-2 px-5 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20"
                                >
                                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                                    <span className="text-white/80 text-sm font-medium">
                                        {t("waiting_for_admin_label")}
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

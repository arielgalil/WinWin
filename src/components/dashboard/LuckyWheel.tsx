import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    createWheelSimulation,
    generateSegmentColors,
    normalizeAngle,
    segmentAtPointer,
    WheelPhase,
} from "../../utils/wheelPhysics";
import { useLanguage } from "../../hooks/useLanguage";
import { Confetti } from "../ui/Confetti";

// ── Types ───────────────────────────────────────────────────────

interface LuckyWheelProps {
    /** Participant names (segments) */
    participants: string[];
    /** Campaign primary color (hex) */
    primaryColor?: string;
    /** Campaign secondary color (hex) */
    secondaryColor?: string;
    /** Index of the pre-determined winner — triggers spin when set */
    winnerIndex: number | null;
    /** Absolute truth name of the winner from admin */
    winnerName?: string;
    /** Called when wheel fully settled on winner */
    onSpinComplete?: (winnerIndex: number, winnerName: string) => void;
    /** Current round number */
    roundNumber?: number;
    /** Synchronized start timestamp (UNIX ms) */
    startAtMs?: number;
    /** Expected duration of the animation (ms) */
    durationMs?: number;
}

// Number of visible names in the magnifying glass
const MAGNIFIER_VISIBLE = 3;

// ── Component ────────────────────────────────────────────────────

export const LuckyWheel: React.FC<LuckyWheelProps> = ({
    participants,
    primaryColor = "#6366f1",
    secondaryColor = "#818cf8",
    winnerIndex,
    winnerName: externalWinnerName,
    onSpinComplete,
    roundNumber = 1,
    startAtMs,
    durationMs,
}) => {
    const { t } = useLanguage();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number>(0);
    const simRef = useRef<ReturnType<typeof createWheelSimulation> | null>(
        null,
    );
    const lastTimeRef = useRef<number>(0);

    const [phase, setPhase] = useState<WheelPhase>("idle");
    const [currentAngle, setCurrentAngle] = useState(0);
    const [showWinner, setShowWinner] = useState(false);
    const [winnerName, setWinnerName] = useState("");

    // Refs for synchronization parameters
    const startAtMsRef = useRef<number | undefined>(startAtMs);
    const durationMsRef = useRef<number | undefined>(durationMs);

    useEffect(() => {
        startAtMsRef.current = startAtMs;
        durationMsRef.current = durationMs;
    }, [startAtMs, durationMs]);

    // Keep a ref to the latest onSpinComplete to avoid triggering re-renders
    const onSpinCompleteRef = useRef(onSpinComplete);
    useEffect(() => {
        onSpinCompleteRef.current = onSpinComplete;
    }, [onSpinComplete]);

    // ── Segment Limiting & Subset Selection ───────────────────
    // If we have too many participants, we pick a subset that includes the winner
    const { displayParticipants, displayWinnerIndex } = React.useMemo(() => {
        const MAX_SEGMENTS = 40;
        if (participants.length <= MAX_SEGMENTS) {
            return {
                displayParticipants: participants,
                displayWinnerIndex: winnerIndex,
            };
        }

        // Limit to MAX_SEGMENTS
        const subsetSize = MAX_SEGMENTS;
        const realWinnerIndex = winnerIndex ?? 0;
        // If we have an external winner name, use it. Otherwise use the name from participants[realWinnerIndex]
        const winnerNameStr = externalWinnerName ||
            participants[realWinnerIndex];

        // Pick a stable subset of other participants
        const others = participants.filter((p, i) =>
            i !== realWinnerIndex && p !== winnerNameStr
        );

        // DETERMINISTIC seeded "shuffle" based on participant count to ensure ALL screens see same segments
        const seed = participants.length + (winnerNameStr.length * 7);
        const seededOthers = [...others].sort((a, b) => {
            const valA = (a.length * seed + a.charCodeAt(0)) % 1000;
            const valB = (b.length * seed + b.charCodeAt(0)) % 1000;
            return valA - valB;
        });

        const subset = seededOthers.slice(0, subsetSize - 1);
        subset.push(winnerNameStr);

        // Deterministic sort for the final display
        const finalDisplay = subset.sort((a, b) => {
            const valA = (a.length * 13 + a.charCodeAt(0)) % 1000;
            const valB = (b.length * 13 + b.charCodeAt(0)) % 1000;
            return valA - valB;
        });

        const newWinnerIdx = finalDisplay.indexOf(winnerNameStr);

        return {
            displayParticipants: finalDisplay,
            displayWinnerIndex: winnerIndex != null ? newWinnerIdx : null,
        };
    }, [participants, winnerIndex, externalWinnerName]);

    const count = displayParticipants.length;
    const segmentArc = (2 * Math.PI) / count;
    const colors = React.useMemo(
        () => generateSegmentColors(count, primaryColor, secondaryColor),
        [count, primaryColor, secondaryColor],
    );

    // Keep refs of props used in animation to avoid re-creating the animate function
    // which causes the spin to restart if settings/colors update mid-spin.
    const externalWinnerNameRef = useRef(externalWinnerName);
    const displayWinnerIndexRef = useRef(displayWinnerIndex);
    useEffect(() => {
        externalWinnerNameRef.current = externalWinnerName;
        displayWinnerIndexRef.current = displayWinnerIndex;
    }, [externalWinnerName, displayWinnerIndex]);

    // ── Draw wheel on Canvas ──────────────────────────────────────
    const drawWheel = useCallback(
        (angle: number) => {
            const canvas = canvasRef.current;
            if (!canvas || count === 0) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);

            const cx = rect.width / 2;
            const cy = rect.height / 2;
            const radius = Math.min(cx, cy) - 8;

            ctx.clearRect(0, 0, rect.width, rect.height);

            // Draw segments
            for (let i = 0; i < count; i++) {
                const startAngle = angle + segmentArc * i - segmentArc / 2;
                const endAngle = startAngle + segmentArc;

                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.arc(cx, cy, radius, startAngle, endAngle);
                ctx.closePath();
                ctx.fillStyle = colors[i];
                ctx.fill();

                ctx.strokeStyle = "rgba(255,255,255,0.15)";
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            // Center circle
            ctx.beginPath();
            ctx.arc(cx, cy, radius * 0.08, 0, Math.PI * 2);
            ctx.fillStyle = "#1e1b4b";
            ctx.fill();
            ctx.strokeStyle = "rgba(255,255,255,0.3)";
            ctx.lineWidth = 2;
            ctx.stroke();
        },
        [count, segmentArc, colors],
    );

    // ── Animation loop ────────────────────────────────────────────
    const animate = useCallback(
        () => {
            if (!simRef.current) return;

            // Wait if we have a synchronized start time in the future
            const now = Date.now();
            if (startAtMsRef.current && now < startAtMsRef.current) {
                rafRef.current = requestAnimationFrame(animate);
                return;
            }

            // Calculate exact wall-clock elapsed time in seconds
            let dt = 0;
            if (startAtMsRef.current) {
                dt = (now - startAtMsRef.current) / 1000;
            } else {
                // Fallback for non-synchronized legacy spins
                if (lastTimeRef.current === 0) {
                    lastTimeRef.current = now;
                }
                dt = (now - lastTimeRef.current) / 1000;
            }

            // Clamp dt slightly to prevent simulation explosions if suspended,
            // though not strictly necessary since the sim uses absolute elapsed time,
            // but the step takes elapsed directly now.
            const result = simRef.current.step(dt);

            setCurrentAngle(result.angle);
            setPhase(result.phase);
            drawWheel(result.angle);

            if (result.phase === "done") {
                // Determine winner name from refs/state at the moment of completion
                const finalWinnerName = externalWinnerNameRef.current ||
                    "Winner";
                setWinnerName(finalWinnerName);

                // Trigger celebration
                setTimeout(() => {
                    setShowWinner(true);
                }, 400);

                onSpinCompleteRef.current?.(
                    displayWinnerIndexRef.current ?? 0,
                    finalWinnerName,
                );
                return;
            }

            rafRef.current = requestAnimationFrame(animate);
        },
        [drawWheel, count], // Minimal dependencies to prevent re-creation
    );

    // ── Start spin when roundNumber or winner changes ────────────────
    const lastTriggerRef = useRef<string>("");
    useEffect(() => {
        if (displayWinnerIndex == null || count === 0) return;

        // Prevent accidental restarts if the same trigger hits again
        const triggerKey = `${displayWinnerIndex}-${roundNumber}-${count}`;
        if (lastTriggerRef.current === triggerKey) return;
        lastTriggerRef.current = triggerKey;

        // Reset state for a fresh spin
        setShowWinner(false);
        setWinnerName("");

        const sim = createWheelSimulation({
            segmentCount: count,
            winnerIndex: displayWinnerIndex,
        });
        simRef.current = sim;
        sim.start();

        // 0 indicates the animation should compute its own start time if startAtMs is missing
        lastTimeRef.current = 0;

        rafRef.current = requestAnimationFrame(animate);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [displayWinnerIndex, count, roundNumber, animate]);

    // ── Initial idle draw ──────────────────────────────────────────
    useEffect(() => {
        drawWheel(0);
    }, [drawWheel]);

    // ── Compute magnifier names ────────────────────────────────────
    const magnifierNames = React.useMemo(() => {
        if (count === 0) return [];
        const centerIdx = segmentAtPointer(currentAngle, count);
        const names: { name: string; isCurrent: boolean }[] = [];
        for (let offset = -1; offset <= 1; offset++) {
            const idx = ((centerIdx + offset) % count + count) % count;
            names.push({
                name: displayParticipants[idx],
                isCurrent: offset === 0,
            });
        }
        return names;
    }, [currentAngle, count, displayParticipants]);

    return (
        <div
            ref={containerRef}
            className="relative flex flex-col items-center justify-center w-full h-full select-none"
        >
            {/* Wheel container */}
            <div className="relative w-[min(80vw,450px)] aspect-square lg:w-[500px]">
                {/* Canvas */}
                <canvas
                    ref={canvasRef}
                    className="w-full h-full rounded-full"
                    style={{ willChange: "transform" }}
                />

                {/* Top Pointer Arrow - Fixed at the top (12 o'clock) */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40">
                    <div
                        className="w-0 h-0"
                        style={{
                            borderLeft: "16px solid transparent",
                            borderRight: "16px solid transparent",
                            borderTop: "24px solid #facc15",
                            filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.5))",
                        }}
                    />
                </div>

                {/* MAGNIFIER - NOW POSITIONED BELOW THE WHEEL */}
                <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 z-30 pointer-events-none w-full max-w-[280px]">
                    <div className="bg-white/10 backdrop-blur-3xl border border-white/20 rounded-3xl p-1.5 shadow-2xl overflow-hidden ring-1 ring-white/5">
                        <div className="flex items-center gap-2">
                            {magnifierNames.map((item, i) => (
                                <div
                                    key={`${item.name}-${i}`}
                                    className={`relative flex-1 px-2 py-3 transition-all duration-300 flex items-center justify-center ${
                                        item.isCurrent
                                            ? "bg-white/20 scale-105 z-10 rounded-2xl"
                                            : "opacity-40"
                                    }`}
                                >
                                    <div
                                        className={`truncate transition-all duration-300 text-center ${
                                            item.isCurrent
                                                ? "text-white text-xl font-black drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                                                : "text-white/60 text-xs font-bold"
                                        }`}
                                    >
                                        {item.name}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Phase indicator */}
            {phase !== "idle" && phase !== "done" && (
                <div className="mt-20 text-white/60 text-xs font-mono animate-pulse">
                    {t(`phase_${phase}` as any)}
                </div>
            )}

            {/* Winner celebration overlay */}
            <AnimatePresence>
                {showWinner && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 flex items-center justify-center"
                    >
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
                        <Confetti isActive={true} />
                        <motion.div
                            initial={{ scale: 0, rotate: -10 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{
                                type: "spring",
                                stiffness: 200,
                                damping: 12,
                                delay: 0.1,
                            }}
                            className="relative z-10 text-center px-6"
                        >
                            <motion.div
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="text-6xl mb-4"
                            >
                                🏆
                            </motion.div>
                            <motion.h2
                                initial={{ y: 30, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight drop-shadow-[0_0_30px_rgba(250,204,21,0.5)]"
                            >
                                {winnerName}
                            </motion.h2>
                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="text-amber-400 text-lg font-bold"
                            >
                                🎉 {t("round_prefix")} #{roundNumber}
                            </motion.p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

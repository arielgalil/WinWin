import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    createWheelSimulation,
    generateSegmentColors,
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
    /** Campaign logo URL — drawn at wheel center */
    logoUrl?: string;
    /** Campaign secondary color (hex) */
    secondaryColor?: string;
    /** Index of the pre-determined winner — triggers spin when set */
    winnerIndex: number | null;
    /** Absolute truth name of the winner from admin */
    winnerName?: string;
    /** Winner's class name */
    winnerClass?: string;
    /** Called when wheel fully settled on winner */
    onSpinComplete?: (winnerIndex: number, winnerName: string) => void;
    /** Called whenever the wheel phase changes */
    onPhaseChange?: (phase: WheelPhase) => void;
    /** Current round number */
    roundNumber?: number;
    /** Computed place (1 = first, null = bonus) */
    placeNumber?: number | null;
    /** Total planned rounds */
    totalRounds?: number;
    /** Synchronized start timestamp (UNIX ms) */
    startAtMs?: number;
    /** Expected duration of the animation (ms) */
    durationMs?: number;
}

// ── Component ────────────────────────────────────────────────────

export const LuckyWheel: React.FC<LuckyWheelProps> = ({
    participants,
    primaryColor = "#6366f1",
    secondaryColor = "#818cf8",
    logoUrl,
    winnerIndex,
    winnerName: externalWinnerName,
    winnerClass,
    onSpinComplete,
    onPhaseChange,
    roundNumber = 1,
    placeNumber,
    totalRounds,
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
    const drawWheelCallbackRef = useRef<(angle: number) => void>(() => {});
    const currentAngleForLogoRef = useRef<number>(0);
    const logoWrapperRef = useRef<HTMLDivElement>(null);

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

    const onPhaseChangeRef = useRef(onPhaseChange);
    useEffect(() => {
        onPhaseChangeRef.current = onPhaseChange;
    }, [onPhaseChange]);
    const lastPhaseRef = useRef<WheelPhase>("idle");

    // ── Segment Limiting & Subset Selection ───────────────────
    // If we have too many participants, we pick a subset that includes the winner.
    // Also rotates the array each round so the wheel starts at a different position.
    const { displayParticipants, displayWinnerIndex } = React.useMemo(() => {
        const MAX_SEGMENTS = 40;
        let base: string[];
        let baseWinnerIdx: number | null;

        if (participants.length <= MAX_SEGMENTS) {
            base = participants;
            baseWinnerIdx = winnerIndex;
        } else {
            const subsetSize = MAX_SEGMENTS;
            const realWinnerIndex = winnerIndex ?? 0;
            const winnerNameStr = externalWinnerName || participants[realWinnerIndex];

            const others = participants.filter((p, i) =>
                i !== realWinnerIndex && p !== winnerNameStr
            );

            const seed = participants.length + (winnerNameStr.length * 7);
            const seededOthers = [...others].sort((a, b) => {
                const valA = (a.length * seed + a.charCodeAt(0)) % 1000;
                const valB = (b.length * seed + b.charCodeAt(0)) % 1000;
                return valA - valB;
            });

            const subset = seededOthers.slice(0, subsetSize - 1);
            subset.push(winnerNameStr);

            const finalDisplay = subset.sort((a, b) => {
                const valA = (a.length * 13 + a.charCodeAt(0)) % 1000;
                const valB = (b.length * 13 + b.charCodeAt(0)) % 1000;
                return valA - valB;
            });

            base = finalDisplay;
            baseWinnerIdx = winnerIndex != null ? finalDisplay.indexOf(winnerNameStr) : null;
        }

        // Rotate array per-round so wheel starts at a different position each spin.
        // Uses (roundNumber * 7) % count — deterministic across all devices.
        const count = base.length;
        const rotationOffset = count > 1 ? (roundNumber * 7) % count : 0;
        const rotated = rotationOffset > 0
            ? [...base.slice(rotationOffset), ...base.slice(0, rotationOffset)]
            : base;
        const rotatedWinnerIdx = baseWinnerIdx != null
            ? (baseWinnerIdx - rotationOffset + count) % count
            : null;

        return {
            displayParticipants: rotated,
            displayWinnerIndex: rotatedWinnerIdx,
        };
    }, [participants, winnerIndex, externalWinnerName, roundNumber]);

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
            currentAngleForLogoRef.current = angle;
            // Rotate logo in sync with wheel — direct DOM update to skip React re-render
            if (logoWrapperRef.current) {
                logoWrapperRef.current.style.transform =
                    `translate(-50%, -50%) rotate(${angle}rad)`;
            }
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

            // Center hub — white backplate so logo (or fallback) looks clean, not black
            const hubRadius = radius * 0.13;
            ctx.beginPath();
            ctx.arc(cx, cy, hubRadius, 0, Math.PI * 2);
            ctx.fillStyle = "#ffffff";
            ctx.fill();
            ctx.strokeStyle = "rgba(255,255,255,0.6)";
            ctx.lineWidth = 2;
            ctx.stroke();
        },
        [count, segmentArc, colors],
    );

    // ── Keep drawWheelCallbackRef in sync (used by logo redraw on load) ──────
    useEffect(() => {
        drawWheelCallbackRef.current = drawWheel;
    }, [drawWheel]);

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

            if (result.phase !== lastPhaseRef.current) {
                lastPhaseRef.current = result.phase;
                onPhaseChangeRef.current?.(result.phase);
            }

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

    // ── Random prize emoji (changes each new winner) ─────────────
    const prizeEmoji = React.useMemo(() => {
        const emojis = ['🎁', '🎀', '🥇', '🏅', '💎', '👑', '🌟', '🎯', '🎊', '💝'];
        return emojis[Math.floor(Math.random() * emojis.length)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [winnerIndex]);

    // ── Compute 3-slot names data ─────────────────────────────────
    // Always exactly 3 names: left (just passed), center (current), right (next to arrive).
    // Clockwise wheel → at the bottom (pointer) segments move RIGHT→LEFT:
    //   right slot = centerIdx-1 (approaching from right)
    //   left slot  = centerIdx+1 (just exited to left)
    const namesData = React.useMemo(() => {
        if (count === 0 || segmentArc === 0) return null;
        const norm = ((Math.PI / 2 - currentAngle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        const segPos = norm / segmentArc;
        const centerIdx = Math.round(segPos) % count;
        const frac = Math.round(segPos) - segPos; // [-0.5, +0.5]
        return {
            left:   displayParticipants[(centerIdx + 1) % count],
            center: displayParticipants[centerIdx],
            right:  displayParticipants[((centerIdx - 1) + count) % count],
            frac,
        };
    }, [currentAngle, count, segmentArc, displayParticipants]);

    return (
        <div
            ref={containerRef}
            className="relative flex flex-col items-center gap-3 select-none w-full"
        >
            {/* Wheel container — capped by both vw and vh so it always fits */}
            <div className="relative w-[min(80vw,450px,calc(100svh-220px))] aspect-square">
                {/* Canvas — explicit z-index so logo overlay is definitively on top */}
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full rounded-full"
                    style={{ zIndex: 1 }}
                />

                {/* Logo overlay — rotates with the wheel via direct DOM transform */}
                <div
                    ref={logoWrapperRef}
                    className="absolute rounded-full pointer-events-none flex items-center justify-center overflow-hidden bg-white"
                    style={{
                        width: "22%",
                        height: "22%",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        zIndex: 2,
                    }}
                >
                    {logoUrl && (
                        <img
                            src={logoUrl}
                            alt=""
                            className="w-full h-full object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                    )}
                </div>

                {/* Bottom Pointer Arrow - Fixed at the bottom (6 o'clock), tip pointing up into wheel */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-40">
                    <div
                        className="w-0 h-0"
                        style={{
                            borderLeft: "16px solid transparent",
                            borderRight: "16px solid transparent",
                            borderBottom: "24px solid #facc15",
                            filter: "drop-shadow(0 -4px 6px rgba(0,0,0,0.5))",
                        }}
                    />
                </div>
            </div>

            {/* NAMES STRIP — always exactly 3 names: left | CENTER | right */}
            {namesData && (
                <div className="w-full max-w-[min(80vw,450px,calc(100svh-220px))] flex items-center pointer-events-none py-1">
                    {/* Left — just passed */}
                    <div className="flex-1 flex justify-center overflow-hidden px-1">
                        <span
                            style={{
                                fontSize: "0.85rem",
                                fontWeight: 700,
                                color: "white",
                                opacity: 0.55,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: "100%",
                                display: "block",
                                textAlign: "center",
                            }}
                        >
                            {namesData.left}
                        </span>
                    </div>

                    {/* Center — current segment under arrow */}
                    <div className="flex-[1.6] flex justify-center overflow-hidden px-1">
                        <span
                            style={{
                                fontSize: "1.35rem",
                                fontWeight: 900,
                                color: "white",
                                opacity: 1,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: "100%",
                                display: "block",
                                textAlign: "center",
                                textShadow: "0 0 16px rgba(255,255,255,0.8)",
                            }}
                        >
                            {namesData.center}
                        </span>
                    </div>

                    {/* Right — next to arrive */}
                    <div className="flex-1 flex justify-center overflow-hidden px-1">
                        <span
                            style={{
                                fontSize: "0.85rem",
                                fontWeight: 700,
                                color: "white",
                                opacity: 0.55,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: "100%",
                                display: "block",
                                textAlign: "center",
                            }}
                        >
                            {namesData.right}
                        </span>
                    </div>
                </div>
            )}

            {/* Phase indicator */}
            {phase !== "idle" && phase !== "done" && (
                <div className="text-white/60 text-xs font-mono animate-pulse">
                    {t(`phase_${phase}` as any)}
                </div>
            )}

            {/* Winner celebration overlay — fixed to cover the entire screen */}
            <AnimatePresence>
                {showWinner && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center"
                    >
                        <div className="absolute inset-0 bg-black/75 backdrop-blur-xl" />
                        <Confetti />
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
                                {prizeEmoji}
                            </motion.div>
                            <motion.h2
                                initial={{ y: 30, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight drop-shadow-[0_0_30px_rgba(250,204,21,0.5)]"
                            >
                                {winnerName}
                            </motion.h2>
                            {winnerClass && (
                                <motion.p
                                    initial={{ y: 15, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.45 }}
                                    className="text-white/70 text-xl font-semibold mb-1"
                                >
                                    {winnerClass}
                                </motion.p>
                            )}
                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="text-amber-400 text-lg font-bold"
                            >
                                {placeNumber != null
                                    ? `🏆 ${t("place_label" as any, { place: placeNumber, total: totalRounds ?? placeNumber })}`
                                    : placeNumber === null
                                        ? `🎁 ${t("bonus_label" as any, { round: roundNumber })}`
                                        : `🎉 ${t("round_prefix")} #${roundNumber}`}
                            </motion.p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

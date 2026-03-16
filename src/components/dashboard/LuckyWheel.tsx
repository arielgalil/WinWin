import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    createWheelSimulation,
    generateSegmentColors,
    WheelPhase,
} from "../../utils/wheelPhysics";
import { useLanguage } from "../../hooks/useLanguage";
import { Confetti } from "../ui/Confetti";
import { formatRoundLabel } from "../../utils/stringUtils";

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
    /** Synchronized prize emoji from admin — same on all screens */
    prizeEmoji?: string;
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
    prizeEmoji: prizeEmojiProp,
}) => {
    const { isRTL } = useLanguage();

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>(0);
    const simRef = useRef<ReturnType<typeof createWheelSimulation> | null>(null);
    const lastTimeRef = useRef<number>(0);
    const logoWrapperRef = useRef<HTMLDivElement>(null);

    // ── Performance: track canvas size via ResizeObserver (avoids
    //    getBoundingClientRect layout reflow on every animation frame) ─
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
    const lastCanvasSizeRef = useRef({ w: 0, h: 0, dpr: 0 });
    const canvasDimsRef = useRef({ w: 0, h: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ro = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            canvasDimsRef.current = { w: width, h: height };
        });
        ro.observe(canvas);
        return () => ro.disconnect();
    }, []);

    // ── Names strip — direct DOM refs to avoid React re-renders ────
    const leftNameRef = useRef<HTMLSpanElement>(null);
    const centerNameRef = useRef<HTMLSpanElement>(null);
    const rightNameRef = useRef<HTMLSpanElement>(null);

    // Refs that the animate loop reads (avoids stale closures)
    const displayParticipantsRef = useRef<string[]>([]);
    const countRef = useRef(0);
    const segmentArcRef = useRef(0);

    const phaseRef = useRef<WheelPhase>("idle");
    const [showWinner, setShowWinner] = useState(false);
    const [winnerName, setWinnerName] = useState("");

    const startAtMsRef = useRef<number | undefined>(startAtMs);
    useEffect(() => { startAtMsRef.current = startAtMs; }, [startAtMs]);

    const onSpinCompleteRef = useRef(onSpinComplete);
    useEffect(() => { onSpinCompleteRef.current = onSpinComplete; }, [onSpinComplete]);

    const onPhaseChangeRef = useRef(onPhaseChange);
    useEffect(() => { onPhaseChangeRef.current = onPhaseChange; }, [onPhaseChange]);
    const lastPhaseRef = useRef<WheelPhase>("idle");

    // ── Segment Limiting & Subset Selection ───────────────────────
    const { displayParticipants, displayWinnerIndex } = React.useMemo(() => {
        const MAX_SEGMENTS = 40;
        let base: string[];
        let baseWinnerIdx: number | null;

        if (participants.length <= MAX_SEGMENTS) {
            base = participants;
            baseWinnerIdx = winnerIndex;
        } else {
            const realWinnerIndex = winnerIndex ?? 0;
            const winnerNameStr = externalWinnerName || participants[realWinnerIndex];
            const others = participants.filter((p, i) => i !== realWinnerIndex && p !== winnerNameStr);
            const seed = participants.length + (winnerNameStr.length * 7);
            const seededOthers = [...others].sort((a, b) => {
                const valA = (a.length * seed + a.charCodeAt(0)) % 1000;
                const valB = (b.length * seed + b.charCodeAt(0)) % 1000;
                return valA - valB;
            });
            const subset = seededOthers.slice(0, MAX_SEGMENTS - 1);
            subset.push(winnerNameStr);
            const finalDisplay = subset.sort((a, b) => {
                const valA = (a.length * 13 + a.charCodeAt(0)) % 1000;
                const valB = (b.length * 13 + b.charCodeAt(0)) % 1000;
                return valA - valB;
            });
            base = finalDisplay;
            baseWinnerIdx = winnerIndex != null ? finalDisplay.indexOf(winnerNameStr) : null;
        }

        const count = base.length;
        const rotationOffset = count > 1 ? (roundNumber * 7) % count : 0;
        const rotated = rotationOffset > 0
            ? [...base.slice(rotationOffset), ...base.slice(0, rotationOffset)]
            : base;
        const rotatedWinnerIdx = baseWinnerIdx != null
            ? (baseWinnerIdx - rotationOffset + count) % count
            : null;

        return { displayParticipants: rotated, displayWinnerIndex: rotatedWinnerIdx };
    }, [participants, winnerIndex, externalWinnerName, roundNumber]);

    const count = displayParticipants.length;
    const segmentArc = (2 * Math.PI) / count;
    const colors = React.useMemo(
        () => generateSegmentColors(count, primaryColor, secondaryColor),
        [count, primaryColor, secondaryColor],
    );

    // Sync animate-loop refs
    useEffect(() => {
        displayParticipantsRef.current = displayParticipants;
        countRef.current = count;
        segmentArcRef.current = segmentArc;
    }, [displayParticipants, count, segmentArc]);

    const externalWinnerNameRef = useRef(externalWinnerName);
    const displayWinnerIndexRef = useRef(displayWinnerIndex);
    useEffect(() => {
        externalWinnerNameRef.current = externalWinnerName;
        displayWinnerIndexRef.current = displayWinnerIndex;
    }, [externalWinnerName, displayWinnerIndex]);

    // ── Direct DOM update for names strip (no React re-render per frame) ──
    const updateNamesDOM = useCallback((angle: number) => {
        const c = countRef.current;
        const arc = segmentArcRef.current;
        const parts = displayParticipantsRef.current;
        if (c === 0 || arc === 0) return;

        const norm = ((Math.PI / 2 - angle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        const centerIdx = Math.round(norm / arc) % c;

        if (leftNameRef.current)   leftNameRef.current.textContent   = parts[(centerIdx + 1) % c];
        if (centerNameRef.current) centerNameRef.current.textContent = parts[centerIdx];
        if (rightNameRef.current)  rightNameRef.current.textContent  = parts[((centerIdx - 1) + c) % c];
    }, []);

    // ── Draw wheel on Canvas ──────────────────────────────────────
    const drawWheel = useCallback(
        (angle: number) => {
            // Logo: direct DOM transform (already zero-cost for React)
            if (logoWrapperRef.current) {
                logoWrapperRef.current.style.transform = `translate(-50%, -50%) rotate(${angle}rad)`;
            }

            const canvas = canvasRef.current;
            if (!canvas || count === 0) return;

            const dpr = window.devicePixelRatio || 1;
            let { w, h } = canvasDimsRef.current;
            // Fallback: ResizeObserver may not have fired yet on initial mount
            if (w === 0 || h === 0) {
                const rect = canvas.getBoundingClientRect();
                w = rect.width;
                h = rect.height;
                if (w > 0 && h > 0) canvasDimsRef.current = { w, h };
            }
            if (w === 0 || h === 0) return;

            // Only resize (expensive GPU realloc) when dimensions actually changed
            if (w !== lastCanvasSizeRef.current.w || h !== lastCanvasSizeRef.current.h || dpr !== lastCanvasSizeRef.current.dpr) {
                canvas.width = w * dpr;
                canvas.height = h * dpr;
                const newCtx = canvas.getContext("2d");
                if (!newCtx) return;
                newCtx.scale(dpr, dpr);
                ctxRef.current = newCtx;
                lastCanvasSizeRef.current = { w, h, dpr };
            }

            const ctx = ctxRef.current;
            if (!ctx) return;

            const cx = w / 2;
            const cy = h / 2;
            const radius = Math.min(cx, cy) - 8;

            ctx.clearRect(0, 0, w, h);

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

            // Center hub
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

    // ── Animation loop ────────────────────────────────────────────
    const animate = useCallback(() => {
        if (!simRef.current) return;

        const now = Date.now();
        if (startAtMsRef.current && now < startAtMsRef.current) {
            rafRef.current = requestAnimationFrame(animate);
            return;
        }

        let dt = 0;
        if (startAtMsRef.current) {
            dt = (now - startAtMsRef.current) / 1000;
        } else {
            if (lastTimeRef.current === 0) lastTimeRef.current = now;
            dt = (now - lastTimeRef.current) / 1000;
        }

        const result = simRef.current.step(dt);

        // Draw canvas (GPU-accelerated, no React re-render)
        drawWheel(result.angle);
        // Update names strip directly in DOM (no React re-render)
        updateNamesDOM(result.angle);

        phaseRef.current = result.phase;
        if (result.phase !== lastPhaseRef.current) {
            lastPhaseRef.current = result.phase;
            onPhaseChangeRef.current?.(result.phase);
        }

        if (result.phase === "done") {
            const finalWinnerName = externalWinnerNameRef.current || "Winner";
            setWinnerName(finalWinnerName);
            setTimeout(() => setShowWinner(true), 400);
            onSpinCompleteRef.current?.(displayWinnerIndexRef.current ?? 0, finalWinnerName);
            return;
        }

        rafRef.current = requestAnimationFrame(animate);
    }, [drawWheel, updateNamesDOM]);

    // ── Start spin when winner changes ────────────────────────────
    const lastTriggerRef = useRef<string>("");
    useEffect(() => {
        if (displayWinnerIndex == null || count === 0) return;

        const triggerKey = `${displayWinnerIndex}-${roundNumber}-${count}`;
        if (lastTriggerRef.current === triggerKey) return;
        lastTriggerRef.current = triggerKey;

        setShowWinner(false);
        setWinnerName("");

        const sim = createWheelSimulation({ segmentCount: count, winnerIndex: displayWinnerIndex });
        simRef.current = sim;
        sim.start();
        lastTimeRef.current = 0;
        rafRef.current = requestAnimationFrame(animate);

        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [displayWinnerIndex, count, roundNumber, animate]);

    // ── Initial idle draw — randomized angle so different student shows each open ──
    const initialAngleRef = useRef(Math.random() * 2 * Math.PI);
    useEffect(() => {
        drawWheel(initialAngleRef.current);
        updateNamesDOM(initialAngleRef.current);
    }, [drawWheel, updateNamesDOM]);

    // ── Prize emoji — use synchronized prop from admin, fallback to local random ──
    const lastPrizeEmojiRef = useRef<string | null>(null);
    const prizeEmoji = React.useMemo(() => {
        if (prizeEmojiProp) return prizeEmojiProp;
        const emojis = ['🎁', '🎀', '🥇', '🏅', '💎', '👑', '🌟', '🎯', '🎊', '💝'];
        const pool = lastPrizeEmojiRef.current ? emojis.filter(e => e !== lastPrizeEmojiRef.current) : emojis;
        const picked = pool[Math.floor(Math.random() * pool.length)];
        lastPrizeEmojiRef.current = picked;
        return picked;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [winnerIndex, prizeEmojiProp]);

    const winnerRoundLabel = formatRoundLabel(roundNumber, placeNumber, totalRounds, isRTL);

    return (
        <div className="relative flex flex-col items-center gap-3 select-none w-full">
            {/* Wheel container */}
            <div className="relative w-[min(80vw,450px,calc(100svh-220px))] aspect-square">
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full rounded-full"
                    style={{ zIndex: 1, willChange: "contents" }}
                />

                {/* Logo — rotates via direct DOM transform */}
                <div
                    ref={logoWrapperRef}
                    className="absolute rounded-full pointer-events-none flex items-center justify-center overflow-hidden bg-white"
                    style={{ width: "22%", height: "22%", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 2 }}
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

                {/* Pointer arrow */}
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

            {/* NAMES STRIP — updated via direct DOM refs, zero React re-renders */}
            <div className="w-full max-w-[min(80vw,450px,calc(100svh-220px))] flex items-center pointer-events-none py-1">
                <div className="flex-[0.75] flex justify-end overflow-hidden pr-2">
                    <span
                        ref={leftNameRef}
                        style={{
                            fontSize: "0.82rem", fontWeight: 700,
                            color: "white", opacity: 0.45,
                            whiteSpace: "nowrap", overflow: "hidden",
                            textOverflow: "ellipsis", maxWidth: "100%",
                            display: "block", textAlign: "right",
                        }}
                    />
                </div>
                <div className="flex-[1.5] flex justify-center overflow-hidden px-1">
                    <span
                        ref={centerNameRef}
                        style={{
                            fontSize: "1.35rem", fontWeight: 900,
                            color: "white", opacity: 1,
                            whiteSpace: "nowrap", overflow: "hidden",
                            textOverflow: "ellipsis", maxWidth: "100%",
                            display: "block", textAlign: "center",
                            textShadow: "0 0 16px rgba(255,255,255,0.8)",
                        }}
                    />
                </div>
                <div className="flex-[0.75] flex justify-start overflow-hidden pl-2">
                    <span
                        ref={rightNameRef}
                        style={{
                            fontSize: "0.82rem", fontWeight: 700,
                            color: "white", opacity: 0.45,
                            whiteSpace: "nowrap", overflow: "hidden",
                            textOverflow: "ellipsis", maxWidth: "100%",
                            display: "block", textAlign: "left",
                        }}
                    />
                </div>
            </div>

            {/* Winner celebration overlay */}
            <AnimatePresence>
                {showWinner && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center"
                    >
                        {/* Simple dark overlay — no blur (perf) */}
                        <div className="absolute inset-0 bg-black/80" />
                        <Confetti />

                        <motion.div
                            initial={{ scale: 0.7, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.05 }}
                            className="relative z-10 text-center px-8 py-10 rounded-3xl"
                            style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)" }}
                        >
                            <div className="text-6xl mb-5 animate-pulse">
                                {prizeEmoji}
                            </div>

                            <motion.h2
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.15 }}
                                className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight"
                                style={{ textShadow: "0 0 40px rgba(250,204,21,0.5)" }}
                            >
                                {winnerName}
                            </motion.h2>

                            {winnerClass && (
                                <motion.p
                                    initial={{ y: 12, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.25 }}
                                    className="text-white/70 text-xl font-semibold mb-3"
                                >
                                    {winnerClass}
                                </motion.p>
                            )}

                            <motion.p
                                initial={{ y: 12, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.35 }}
                                className="text-amber-400 text-base font-bold tracking-wide"
                            >
                                {winnerRoundLabel}
                            </motion.p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

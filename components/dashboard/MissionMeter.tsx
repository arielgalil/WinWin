
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TargetIcon } from '../ui/Icons';
import { CompetitionGoal } from '../../types';
import { AnimatedCounter } from '../ui/AnimatedCounter';

import { useLanguage } from '../../hooks/useLanguage';

const MotionPath = motion.path as any;
const MotionCircle = motion.circle as any;

interface MissionMeterProps {
    totalScore: number;
    goals: CompetitionGoal[];
    legacyTargetScore?: number;
    legacyImageUrl?: string | null;
    competitionName: string;
    topContributors?: string[];
}

export const MissionMeter: React.FC<MissionMeterProps> = ({
    totalScore,
    goals,
    legacyTargetScore,
    legacyImageUrl,
    competitionName,
    topContributors = []
}) => {
    const { t } = useLanguage();
    const [celebratingGoalIndex, setCelebratingGoalIndex] = useState<number | null>(null);
    const lastCompletedIndexRef = useRef<number>(-1);
    const prevScoreRef = useRef(totalScore);
    const pathRef = useRef<SVGPathElement>(null);
    const [pathLength, setPathLength] = useState(0);
    const isFirstMountRef = useRef(true);

    const [irises, setIrises] = useState<{ cx: number; cy: number; weight: number; delay: number }[]>([]);

    useEffect(() => {
        const newIrises: { cx: number; cy: number; weight: number; delay: number }[] = [];
        let attempts = 0;
        while (newIrises.length < 3 && attempts < 50) {
            const cx = Math.random() * 0.6 + 0.2; // Keep away from extreme edges
            const cy = Math.random() * 0.6 + 0.2;

            // Check distance from existing irises
            const isTooClose = newIrises.some(iris => {
                const dx = iris.cx - cx;
                const dy = iris.cy - cy;
                return Math.sqrt(dx * dx + dy * dy) < 0.3; // Min distance 0.3
            });

            if (!isTooClose) {
                newIrises.push({
                    cx,
                    cy,
                    weight: 0.8 + Math.random() * 0.4, // Weights 0.8 - 1.2
                    delay: Math.random() * 0.5
                });
            }
            attempts++;
        }
        // Fallback if we couldn't place 3
        if (newIrises.length < 3) {
            newIrises.push({ cx: 0.5, cy: 0.5, weight: 1, delay: 0 });
        }
        setIrises(newIrises);
    }, []);

    const { activeIndex, sortedGoals } = useMemo(() => {
        const sorted = [...(goals || [])].sort((a, b) => a.target_score - b.target_score);
        if (sorted.length === 0) return { activeIndex: 0, sortedGoals: [] };
        let idx = sorted.findIndex(g => totalScore < g.target_score);
        if (idx === -1) idx = sorted.length > 0 ? sorted.length - 1 : 0;
        return { activeIndex: idx, sortedGoals: sorted };
    }, [goals, totalScore]);

    useEffect(() => {
        let highestCompletedIndex = -1;
        for (let i = sortedGoals.length - 1; i >= 0; i--) {
            if (totalScore >= sortedGoals[i].target_score) {
                highestCompletedIndex = i;
                break;
            }
        }

        // On first mount, just record the current state without celebrating
        if (isFirstMountRef.current) {
            lastCompletedIndexRef.current = highestCompletedIndex;
            isFirstMountRef.current = false;
            // prevScoreRef is already initialized with totalScore, no need to set again
            return;
        }

        if (highestCompletedIndex > lastCompletedIndexRef.current) {
            // Only celebrate if:
            // 1. We have a history of a non-zero score (prev > 0) - filters initial load 0->X
            // 2. The score actually increased (curr > prev) - filters goal metadata updates X->X
            const isRealAchievement = prevScoreRef.current > 0 && totalScore > prevScoreRef.current;

            if (isRealAchievement) {
                triggerCelebration(highestCompletedIndex);
            }
        }
        lastCompletedIndexRef.current = highestCompletedIndex;
        prevScoreRef.current = totalScore; // Update prevScoreRef for the next render
    }, [totalScore, sortedGoals]);

    useEffect(() => {
        if (pathRef.current) {
            setPathLength(pathRef.current.getTotalLength());
        }
    }, [sortedGoals, activeIndex]);

    const triggerCelebration = (indexToCelebrate: number) => {
        setCelebratingGoalIndex(indexToCelebrate);
        setTimeout(() => {
            setCelebratingGoalIndex(null);
        }, 7000);
    };

    const displayIndex = celebratingGoalIndex !== null ? celebratingGoalIndex : activeIndex;
    const displayGoal = sortedGoals[displayIndex] || {
        name: t('common_goal'),
        target_score: legacyTargetScore || 5000,
        image_type: 'upload',
        image_value: legacyImageUrl
    };
    
    const isCelebrationMode = celebratingGoalIndex !== null;

    let progressPct = 0;
    if (isCelebrationMode) {
        progressPct = 1;
    } else if (sortedGoals.length > 0) {
        // Absolute cumulative progress towards current target
        const raw = displayGoal.target_score > 0 ? totalScore / displayGoal.target_score : 0;
        progressPct = Math.min(Math.max(raw, 0), 1);
    } else if (legacyTargetScore) {
        const raw = legacyTargetScore > 0 ? totalScore / legacyTargetScore : 0;
        progressPct = Math.min(Math.max(raw, 0), 1);
    }

    const percentDisplay = Math.floor(progressPct * 100);
    const isCompleted = isCelebrationMode || (totalScore >= displayGoal.target_score && sortedGoals.length > 0);
    const missingPoints = Math.max(0, displayGoal.target_score - totalScore);
    const progressOffset = pathLength > 0 ? pathLength * (1 - progressPct) : 0;

    // Multi-Iris Calibrated Reveal
    const sumWeightsSq = irises.reduce((acc, iris) => acc + iris.weight * iris.weight, 0) || 1;
    const baseK = Math.sqrt(progressPct / (Math.PI * sumWeightsSq));

    // If complete, force full reveal
    const finalK = (isCelebrationMode || progressPct >= 1) ? 2.0 : baseK;

    

    const headerText = sortedGoals.length > 0
        ? `${t('stage')} ${displayIndex + 1}: ${displayGoal.name}`
        : competitionName;

    const celebrationEmoji = useMemo(() => {
        const emojis = ['🏆', '🥇', '👑', '⭐', '✨'];
        return emojis[Math.floor(Math.random() * emojis.length)];
    }, []);

    const shoutoutMessage = useMemo(() => {
        if (!topContributors || topContributors.length === 0) return null;

        const names = topContributors.length > 1
            ? `${topContributors.slice(0, -1).join(', ')} ו-${topContributors[topContributors.length - 1]}`
            : topContributors[0];

        const templates = [
            `כל הכבוד ל${names}!`,
            `שאפו ל${names} שמעלים את הרף!`,
            `${names} מובילים אותנו ליעד!`,
            `תראו את ${names} משקיעים ומצליחים!`,
            `הכוח של ${names} מקדם את כולנו!`
        ];

        return templates[Math.floor(Math.random() * templates.length)];
    }, [topContributors]);

    const containerRef = useRef<HTMLDivElement>(null);

    return (
        <div ref={containerRef} className={`
        glass-panel p-0 relative flex flex-col shadow-2xl border-white/10 h-full min-h-[320px] sm:min-h-[380px] md:min-h-[420px] lg:min-h-[480px] transition-all duration-700 !rounded-[var(--radius-container)] z-20 overflow-hidden
        ${isCelebrationMode
                ? 'bg-gradient-to-br from-yellow-900/40 to-purple-900/40 border-yellow-400/30'
                : 'bg-slate-900/50'
            }
    `}>
            {/* Header */}
            <div className="flex justify-between items-center shrink-0 z-10 w-full px-5 h-11 bg-white/10 border-b border-white/10 backdrop-blur-md">
                <div className="flex items-center min-w-0">
                    <div className={`p-1 rounded-full border ml-2 backdrop-blur-sm transition-all duration-500 shrink-0
                    ${isCelebrationMode
                            ? 'bg-yellow-500 border-yellow-300 shadow-[0_0_20px_rgba(234,179,8,0.8)]'
                            : 'bg-orange-500/10 border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.3)]'
                        }`}>
                        <TargetIcon className={`w-3 h-3 ${isCelebrationMode ? 'text-black' : 'text-orange-400'}`} />
                    </div>
                    <h2 className="text-sm font-black text-white truncate uppercase tracking-tight">
                        {headerText}
                    </h2>
                </div>
                {sortedGoals.length > 1 && (
                    <div className="flex gap-1">
                        {sortedGoals.map((_, idx) => (
                            <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${idx < activeIndex || (idx === activeIndex && isCompleted) ? 'bg-green-500' : idx === activeIndex ? 'bg-yellow-400 scale-125 shadow-[0_0_8px_#facc15]' : 'bg-slate-600'}`} />
                        ))}
                    </div>
                )}
            </div>

            <div className="flex-1 flex flex-col p-3 sm:p-4 lg:p-6 gap-3 sm:gap-4 min-h-0">

                {/* 1. Centered Image (Top) - 60% Height */}
                <div className="flex-[1.5] flex items-center justify-center">
                    <div className="relative h-full aspect-square max-h-full group shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[var(--radius-container)] overflow-hidden border-2 border-white/20 bg-black/60">
                        <div className="absolute inset-0 flex items-center justify-center opacity-10">
                            <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white">?</span>
                        </div>
                        <div className="absolute inset-0" style={{ mask: 'url(#iris-mask)', WebkitMask: 'url(#iris-mask)' }}>
                            {displayGoal.image_type === 'upload' && displayGoal.image_value ? (
                                <img src={displayGoal.image_value} alt={displayGoal.name} className="w-full h-full object-cover transform transition-transform duration-1000 group-hover:scale-110" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-600/30 to-purple-600/30">
                                    <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl filter drop-shadow-2xl brightness-125">
                                        {displayGoal.image_value || '🏆'}
                                    </span>
                                </div>
                            )}
                        </div>
                        <svg width="0" height="0" className="absolute">
                            <defs>
                                <mask id="iris-mask" maskContentUnits="objectBoundingBox">
                                    <rect width="1" height="1" fill="black" />
                                    {irises.map((iris, i) => (
                                        <MotionCircle key={i} cx={iris.cx} cy={iris.cy} fill="white" initial={{ r: 0 }} animate={{ r: finalK * iris.weight }} transition={{ duration: 2.5, ease: [0.34, 1.56, 0.64, 1], delay: isFirstMountRef.current ? 0 : iris.delay }} />
                                    ))}
                                </mask>
                            </defs>
                        </svg>
                    </div>
                </div>

                {/* 2. Stats Section (2 Columns) - 40% Height */}
                <div className="flex-1 grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6 pt-3 sm:pt-4" dir="rtl">

                    {/* Visual Progress Column (Visually Right) */}
                    <div className="flex flex-col items-center justify-center">
                        {/* Higher Visibility Path with Percentage */}
                        <div className="relative w-full h-32 flex flex-col items-center justify-center">
                            <svg viewBox="0 0 160 100" preserveAspectRatio="xMidYMid meet" className="w-full h-24 drop-shadow-[0_0_20px_rgba(34,197,94,0.6)]">
                                <defs>
                                    <linearGradient id="progress-gradient" x1="100%" y1="0%" x2="0%" y2="0%">
                                        <stop offset="0%" stopColor="#4ade80" />
                                        <stop offset="100%" stopColor="#22c55e" />
                                    </linearGradient>
                                </defs>
                                {/* Future Path: Highly Visible Trail */}
                                <path d="M 140 85 C 120 5, 40 95, 20 15" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="16" strokeLinecap="round" strokeDasharray="4 8" />
                                <MotionPath ref={pathRef} d="M 140 85 C 120 5, 40 95, 20 15" fill="none" stroke="url(#progress-gradient)" strokeWidth="16" strokeLinecap="round" strokeDasharray={pathLength || 1000} initial={{ strokeDashoffset: pathLength || 1000 }} animate={{ strokeDashoffset: progressOffset }} transition={{ duration: 2, ease: "easeInOut" }} />
                            </svg>
                            {/* Percentage: Aligned below the path line */}
                            <div className="absolute bottom-2 flex items-center gap-1">
                                <span className="text-base sm:text-lg md:text-xl font-black text-white/90">%</span>
                                <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white leading-none tracking-tighter drop-shadow-2xl">
                                    <AnimatedCounter value={percentDisplay} />
                                </h3>
                            </div>
                        </div>
                    </div>

                    {/* Content Logic Column (Visually Left) */}
                    <div className="flex flex-col justify-center items-start">
                        {isCompleted && displayIndex === sortedGoals.length - 1 ? (
                            <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-black text-white drop-shadow-lg animate-bounce py-2">
                                הגעתם יחד לשיא! {celebrationEmoji}
                            </div>
                        ) : (
                            <>
                                <div className="text-[10px] xs:text-xs sm:text-sm font-black text-white/90 mb-0.5 brightness-125">
                                    {t('more_points')} {missingPoints.toLocaleString()} {t('points_short')}
                                </div>
                                <div className="text-sm xs:text-base sm:text-lg md:text-xl font-black text-white mb-2 drop-shadow-xl">
                                    {t('to_stage')} {displayIndex + 1}!
                                </div>
                            </>
                        )}

                        {shoutoutMessage && (
                            <div className="mt-1 text-[8px] xs:text-[9px] sm:text-[10px] font-bold text-green-300 italic leading-tight border-r-2 border-green-500/40 pr-1 sm:pr-2 drop-shadow-sm max-w-[80px] xs:max-w-[100px] sm:max-w-[120px] animate-in fade-in slide-in-from-right duration-1000">
                                "{shoutoutMessage}"
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

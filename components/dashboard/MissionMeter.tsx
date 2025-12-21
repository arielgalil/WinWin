
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
}

export const MissionMeter: React.FC<MissionMeterProps> = ({
    totalScore,
    goals,
    legacyTargetScore,
    legacyImageUrl,
    competitionName
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
    const prevTarget = displayIndex > 0 ? sortedGoals[displayIndex - 1].target_score : 0;
    const isCelebrationMode = celebratingGoalIndex !== null;

    let progressPct = 0;
    if (isCelebrationMode) {
        progressPct = 1;
    } else if (sortedGoals.length > 0) {
        const stageRange = displayGoal.target_score - prevTarget;
        const scoreInStage = Math.max(0, totalScore - prevTarget);
        const raw = stageRange > 0 ? scoreInStage / stageRange : 0;
        progressPct = Math.min(Math.max(raw, 0), 1);
    } else if (legacyTargetScore) {
        const stageRange = legacyTargetScore;
        const scoreInStage = Math.max(0, totalScore);
        const raw = stageRange > 0 ? scoreInStage / stageRange : 0;
        progressPct = Math.min(Math.max(raw, 0), 1);
    }

    const percentDisplay = Math.floor(progressPct * 100);
    const isCompleted = isCelebrationMode || (totalScore >= displayGoal.target_score && sortedGoals.length > 0);
    const missingPoints = Math.max(0, displayGoal.target_score - totalScore);
    const progressOffset = pathLength > 0 ? pathLength * (1 - progressPct) : 0;

    // Multi-Iris Calibrated Reveal
    // k = sqrt(Progress / (pi * sum(w^2))) * boost
    // using heuristic boost 0.8 to map roughly to unit square area
    const sumWeightsSq = irises.reduce((acc, iris) => acc + iris.weight * iris.weight, 0) || 1;
    // Strict Area: Area = Progress. k = sqrt(Progress / (pi * sum(w^2)))
    const baseK = Math.sqrt(progressPct / (Math.PI * sumWeightsSq));

    // If complete, force full reveal
    const finalK = (isCelebrationMode || progressPct >= 1) ? 2.0 : baseK;

    const rtlPathData = "M 140 90 C 130 10, 20 90, 10 10";

    const headerText = sortedGoals.length > 0
        ? `${t('stage')} ${displayIndex + 1}: ${displayGoal.name}`
        : competitionName;

    const containerRef = useRef<HTMLDivElement>(null);
    const [layout, setLayout] = useState<'row' | 'col'>('row');

    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver(entries => {
            const entry = entries[0];
            if (entry) {
                const { width, height } = entry.contentRect;
                // Switch to column layout if aspect ratio is close to square or portrait
                setLayout(width / height > 1.2 ? 'row' : 'col');
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    const isRow = layout === 'row';

    return (
        <div ref={containerRef} className={`
        glass-panel rounded-[var(--radius-container)] p-0 relative flex flex-col shadow-xl border-white/10 overflow-hidden h-full min-h-[200px] transition-all duration-700 [isolation:isolate]
        ${isCelebrationMode
                ? 'bg-gradient-to-br from-yellow-900/40 to-purple-900/40 border-yellow-400/30'
                : 'bg-slate-900/40'
            }
    `}>
            <div className="flex justify-between items-center shrink-0 z-10 w-full px-5 h-11 bg-white/10 border-b border-white/10 backdrop-blur-md">
                <div className="flex items-center min-w-0">
                    <div className={`p-1 rounded-full border ml-2 backdrop-blur-sm transition-all duration-500 shrink-0
                    ${isCelebrationMode
                            ? 'bg-yellow-500 border-yellow-300 shadow-[0_0_20px_rgba(234,179,8,0.8)]'
                            : 'bg-orange-500/10 border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.3)]'
                        }`}>
                        <TargetIcon className={`w-3 h-3 ${isCelebrationMode ? 'text-black' : 'text-orange-400'}`} />
                    </div>
                    <h2 className="text-xs md:text-sm font-black text-white truncate">
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

            <div className={`flex-1 w-full flex ${isRow ? 'flex-row items-center' : 'flex-col items-stretch'} justify-between gap-4 relative min-h-0 p-4 lg:p-5 overflow-hidden`}>
                {/* Graph & Text Container */}
                <div className={`${isRow ? 'w-1/2 h-full' : 'flex-1'} flex flex-col items-center justify-center text-center overflow-hidden min-h-0 order-2 ${isRow ? '' : 'order-2'}`}>
                    {/* SVG graph takes available space */}
                    <div className="flex-1 w-full min-h-0 flex items-center justify-center relative">
                        <svg viewBox="0 0 150 100" preserveAspectRatio="xMidYMid meet" className="w-full h-full max-h-[160px]">
                            {/* Shifted path down slightly to use more vertical space if needed */}
                            <path d={rtlPathData} fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="12" strokeLinecap="round" />
                            <MotionPath ref={pathRef} d={rtlPathData} fill="none" stroke="#22c55e" strokeWidth="12" strokeLinecap="round" strokeDasharray={pathLength || 1000} initial={{ strokeDashoffset: pathLength || 1000 }} animate={{ strokeDashoffset: progressOffset }} transition={{ duration: 1.5, ease: "easeInOut" }} />
                        </svg>

                        {/* Centered Percentage Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center mt-4 pointer-events-none">
                            <h3 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-none tracking-tighter drop-shadow-lg">
                                <AnimatedCounter value={percentDisplay} suffix="%" />
                            </h3>
                        </div>
                    </div>

                    {/* Bottom Info text - compact */}
                    <div className="shrink-0 mt-2 z-10">
                        <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">{t('progress')}</div>
                        <div className={`text-[10px] sm:text-xs font-bold h-4 truncate w-full ${isCompleted ? 'text-white animate-pulse' : 'text-slate-300'}`}>
                            {isCompleted ? t('goal_achieved') : `${t('more_points')} ${missingPoints.toLocaleString()}`}
                        </div>
                    </div>
                </div>

                {/* Target Image Container */}
                <div className={`${isRow ? 'w-1/2 h-full' : 'flex-[1.2] min-h-0'} flex items-center justify-center order-1 ${isRow ? '' : 'order-1'} overflow-hidden`}>
                    <div className={`relative h-full aspect-square max-h-full ${isRow ? '' : 'w-auto'}`}>
                        <div className="absolute inset-0 bg-black/30 rounded-[var(--radius-main)] border-2 border-dashed border-white/20 flex items-center justify-center shadow-inner">
                            <span className="text-4xl text-white/10 font-black">?</span>
                        </div>
                        <div className="absolute inset-0 rounded-[var(--radius-main)] overflow-hidden" style={{ mask: 'url(#iris-mask)', WebkitMask: 'url(#iris-mask)' }}>
                            {displayGoal.image_type === 'upload' && displayGoal.image_value ? (
                                <img src={displayGoal.image_value} alt={displayGoal.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-black/40">
                                    <span className="text-4xl md:text-6xl filter drop-shadow-xl">{displayGoal.image_value || '🏆'}</span>
                                </div>
                            )}
                        </div>
                        <svg width="0" height="0" className="absolute">
                            <defs>
                                <mask id="iris-mask" maskContentUnits="objectBoundingBox">
                                    <rect width="1" height="1" fill="black" />
                                    {irises.map((iris, i) => (
                                        <MotionCircle
                                            key={i}
                                            cx={iris.cx}
                                            cy={iris.cy}
                                            fill="white"
                                            initial={{ r: 0 }}
                                            animate={{ r: finalK * iris.weight }}
                                            transition={{ duration: 2, ease: 'easeOut', delay: isFirstMountRef.current ? 0 : iris.delay }}
                                        />
                                    ))}
                                </mask>
                            </defs>
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
};

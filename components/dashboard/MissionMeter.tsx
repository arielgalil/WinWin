
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TargetIcon } from '../ui/Icons';
import { CompetitionGoal, ClassRoom } from '../../types';
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
    classes?: ClassRoom[];
}

export const MissionMeter: React.FC<MissionMeterProps> = ({
    totalScore,
    goals,
    legacyTargetScore,
    legacyImageUrl,
    competitionName,
    classes = []
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
        // Get top 2-3 groups by score (not just recent contributors)
        const topGroups = (classes && classes.length > 0) 
            ? classes
                .sort((a: any, b: any) => b.score - a.score)
                .slice(0, 3)
                .map((c: any) => c.name)
            : [];

        if (!topGroups || topGroups.length === 0) return null;

        const names = topGroups.length > 1
            ? `${topGroups.slice(0, -1).join(', ')} ו-${topGroups[topGroups.length - 1]}`
            : topGroups[0];

        // Very short messages for top groups approaching goal
        const templates = [
            `${names} בוערים!`,
            `${names} מובילים!`,
            `${names} קובעים!`,
            `${names} מתקדמים!`,
            `${names} מנצחים!`
        ];

        return templates[Math.floor(Math.random() * templates.length)];
    }, [classes]);

    const containerRef = useRef<HTMLDivElement>(null);

    return (
        <div ref={containerRef} className={`
        glass-panel p-0 relative flex flex-col shadow-2xl border-white/10 h-full min-h-[280px] sm:min-h-[320px] md:min-h-[360px] lg:min-h-[400px] transition-all duration-700 !rounded-[var(--radius-container)] z-20 overflow-hidden
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
                    <h2 className="text-base font-black text-white truncate uppercase tracking-tight" dir="rtl">
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

            <div className="flex-1 flex flex-col p-2 sm:p-3 lg:p-4 gap-3 sm:gap-4 min-h-0">

{/* 1. Centered Image (Top) - 65% Height */}
                <div className="flex flex-col items-center justify-center h-[65%]">
                    <div className="relative w-full max-w-[240px] aspect-square group shadow-[0_15px_40px_rgba(0,0,0,0.4)] rounded-[var(--radius-container)] overflow-hidden border-2 border-white/20 bg-black/60">
                        <div className="absolute inset-0 flex items-center justify-center opacity-10">
                            <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white">?</span>
                        </div>
                        <div className="absolute inset-0" style={{ mask: 'url(#iris-mask)', WebkitMask: 'url(#iris-mask)' }}>
                            {displayGoal.image_type === 'upload' && displayGoal.image_value ? (
                                <img src={displayGoal.image_value} alt={displayGoal.name} className="w-full h-full object-cover transform transition-transform duration-1000 group-hover:scale-110" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-600/30 to-purple-600/30">
                                    <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl filter drop-shadow-2xl brightness-125">
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

                {/* 2. Stats Section (2 Columns) - 50% Height */}
                <div className="flex-1 grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4 pt-0" dir="rtl">

                    {/* Visual Progress Column (Visually Right) */}
                    <div className="flex flex-col items-start justify-start pt-0">
                        <div className="relative w-full h-40 flex flex-col items-center justify-start -mt-4">
                            <svg viewBox="0 0 160 100" preserveAspectRatio="xMidYMid meet" className="w-full h-16 drop-shadow-[0_0_25px_rgba(34,197,94,0.8)]">
                                <defs>
                                    <linearGradient id="progress-gradient" x1="100%" y1="0%" x2="0%" y2="0%">
                                        <stop offset="0%" stopColor="#4ade80" />
                                        <stop offset="100%" stopColor="#22c55e" />
                                    </linearGradient>
                                </defs>
                                {/* Future Path: Highly Visible Trail */}
                                <path d="M 140 85 C 120 5, 40 95, 20 15" fill="none" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="16" strokeLinecap="round" strokeDasharray="4 8" />
                                <MotionPath ref={pathRef} d="M 140 85 C 120 5, 40 95, 20 15" fill="none" stroke="url(#progress-gradient)" strokeWidth="18" strokeLinecap="round" strokeDasharray={pathLength || 1000} initial={{ strokeDashoffset: pathLength || 1000 }} animate={{ strokeDashoffset: progressOffset }} transition={{ duration: 2, ease: "easeInOut" }} />
                            </svg>
{/* Percentage: Aligned below the path line */}
                            <div className="absolute bottom-6 flex items-end gap-1" dir="rtl">
                                <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-black text-white/90">%</span>
                                <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-white leading-none tracking-tighter drop-shadow-2xl">
                                    <AnimatedCounter value={percentDisplay} />
                                </h3>
                                <span className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl font-black text-white/90 pb-1"> משלב {displayIndex + 1}!</span>
</div>
                        </div>
                    </div>

                    {/* Content Logic Column (Visually Left) */}
                    <div className="flex flex-col justify-center items-start text-right">
                        {isCompleted && displayIndex === sortedGoals.length - 1 ? (
                            <div className="text-xs xs:text-xs sm:text-xs md:text-sm lg:text-sm xl:text-base font-black text-white drop-shadow-lg animate-bounce py-2" dir="rtl">
                                הגעתם יחד לשיא! {celebrationEmoji}
                            </div>
                        ) : (
                            <div className="text-xs xs:text-xs sm:text-xs md:text-sm lg:text-sm font-black text-white/90 mb-1 brightness-125" dir="rtl">
                                {t('more_points')} <span className="text-xs xs:text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl">{missingPoints.toLocaleString()}</span> {t('points_short')} ליעד!
                            </div>
                        )}

                        {shoutoutMessage && (
                            <div className="mt-1 text-sm xs:text-xs sm:text-sm md:text-base font-bold text-green-300 leading-tight border-r-2 border-green-500/40 pr-2 sm:pr-3 drop-shadow-sm max-w-[120px] xs:max-w-[150px] sm:max-w-[180px] animate-in fade-in slide-in-from-right duration-1000" dir="rtl">
                                "{shoutoutMessage}"
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

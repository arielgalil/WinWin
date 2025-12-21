
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
    const pathRef = useRef<SVGPathElement>(null);
    const [pathLength, setPathLength] = useState(0);
    const [irises, setIrises] = useState<{ cx: number; cy: number; delay: number }[]>([]);

    useEffect(() => {
        const newIrises = Array.from({ length: 3 }).map(() => ({
            cx: Math.random() * 0.8 + 0.1,
            cy: Math.random() * 0.8 + 0.1,
            delay: Math.random() * 0.5,
        }));
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
        if (highestCompletedIndex > lastCompletedIndexRef.current) {
            triggerCelebration(highestCompletedIndex);
        }
        lastCompletedIndexRef.current = highestCompletedIndex;
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
    const irisRadius = progressPct * 1.0;
    const rtlPathData = "M 140 90 C 130 10, 20 90, 10 10";

    const headerText = sortedGoals.length > 0
        ? `${t('stage')} ${displayIndex + 1}: ${displayGoal.name}`
        : competitionName;

    return (
        <div className={`
        glass-panel rounded-[var(--radius-container)] p-0 relative flex flex-col shadow-xl border-white/10 overflow-hidden h-full min-h-[280px] transition-all duration-700 [isolation:isolate]
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

            <div className="flex-1 w-full flex flex-row items-center justify-between gap-2 relative min-h-0 p-4 lg:p-5 overflow-hidden">
                <div className="w-1/2 flex flex-col items-center justify-center text-center">
                    <div className="w-full h-8 md:h-10 mb-1">
                        <svg viewBox="0 0 150 100" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
                            <path d={rtlPathData} fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="12" strokeLinecap="round" />
                            <MotionPath ref={pathRef} d={rtlPathData} fill="none" stroke="#22c55e" strokeWidth="12" strokeLinecap="round" strokeDasharray={pathLength || 1000} initial={{ strokeDashoffset: pathLength || 1000 }} animate={{ strokeDashoffset: progressOffset }} transition={{ duration: 1.5, ease: "easeInOut" }} />
                        </svg>
                    </div>
                    <h3 className="text-3xl md:text-4xl lg:text-[clamp(2.5rem,4vw,4rem)] font-black text-white leading-none tracking-tighter">
                        <AnimatedCounter value={percentDisplay} suffix="%" />
                    </h3>
                    <div className="text-[9px] md:text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">{t('progress')}</div>
                    <div className={`text-[9px] md:text-[10px] font-bold h-3.5 mt-1 truncate w-full ${isCompleted ? 'text-white animate-pulse' : 'text-slate-300'}`}>
                        {isCompleted ? t('goal_achieved') : `${t('more_points')} ${missingPoints.toLocaleString()}`}
                    </div>
                </div>

                <div className="w-1/2 flex items-center justify-center h-full max-h-full">
                    <div className="h-full aspect-square max-h-[140px] relative">
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
                                        <MotionCircle key={i} cx={iris.cx} cy={iris.cy} fill="white" initial={{ r: 0 }} animate={{ r: irisRadius }} transition={{ duration: 2, ease: 'easeOut', delay: iris.delay }} />
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

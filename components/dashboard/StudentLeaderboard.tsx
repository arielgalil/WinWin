
import React, { useMemo, memo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MedalIcon, TrendUpIcon, StarIcon } from '../ui/Icons';
import { AnimatedCounter } from '../ui/AnimatedCounter';
import { useCompetitionData } from '../../hooks/useCompetitionData';
import { useAutoScroll } from '../../hooks/useAutoScroll';
import { useLanguage } from '../../hooks/useLanguage';

const MotionDiv = motion.div as any;

interface EnrichedStudent {
    id: string;
    name: string;
    score: number;
    className: string;
    classColor: string;
    rankDiff?: number;
    rank: number;
    trend?: 'up' | 'down' | 'same';
}

interface StudentLeaderboardProps {
    topStudents: EnrichedStudent[];
    arenaStudents: EnrichedStudent[];
    spotlightStudent: EnrichedStudent | null;
}

export const StudentLeaderboard: React.FC<StudentLeaderboardProps> = memo(({ topStudents, arenaStudents, spotlightStudent }) => {
    const { t } = useLanguage();
    const { settings } = useCompetitionData();
    const [activeTab, setActiveTab] = useState<'momentum' | 'top'>('momentum');
    const [isPaused, setIsPaused] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const listContainerRef = useRef<HTMLDivElement>(null);

    useAutoScroll(listContainerRef, {
        isHovered,
        activeTab,
        speed: 0.5,
        pauseFrames: 90
    });

    const instType = settings.institution_type || t('yeshiva');

    const momentumList = useMemo(() => {
        const all = [...topStudents, ...arenaStudents];
        const movers = all.filter(s => (s.rankDiff && s.rankDiff > 0) || s.trend === 'up');
        movers.sort((a, b) => (b.rankDiff || 0) - (a.rankDiff || 0));
        return movers.slice(0, 10);
    }, [topStudents, arenaStudents]);

    useEffect(() => {
        if (momentumList.length === 0 || isPaused || isHovered) return;
        const interval = setInterval(() => {
            setActiveTab(prev => prev === 'momentum' ? 'top' : 'momentum');
        }, 10000);
        return () => clearInterval(interval);
    }, [momentumList.length, isPaused, isHovered]);

    const handleTabClick = (tab: 'momentum' | 'top') => {
        setActiveTab(tab);
        setIsPaused(true);
        setTimeout(() => setIsPaused(false), 30000);
    };

    const displayList = activeTab === 'momentum' && momentumList.length > 0 ? momentumList : topStudents;
    const isMomentumMode = activeTab === 'momentum' && momentumList.length > 0;

    return (
        <div className="flex flex-col h-full w-full">
            <div
                className="glass-panel rounded-[var(--radius-container)] p-0 flex flex-col shadow-2xl border-white/10 bg-black/20 flex-1 min-h-[420px] lg:min-h-0 overflow-hidden"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="flex justify-between items-center shrink-0 px-5 h-11 bg-white/5 border-b border-white/5 backdrop-blur-md">
                    <h2 className="text-xs md:text-sm font-bold text-white/90 flex items-center">
                        <div className={`p-1 rounded-[var(--radius-main)] border ml-2.5 transition-all duration-500
                    ${isMomentumMode
                                ? 'bg-yellow-500/10 border-yellow-500/20'
                                : 'bg-pink-500/10 border-pink-500/20'
                            }`}>
                            {isMomentumMode
                                ? <StarIcon className="w-3.5 h-3.5 text-yellow-400" />
                                : <MedalIcon className="w-3.5 h-3.5 text-pink-400" />
                            }
                        </div>
                        <span>{isMomentumMode ? t('stars_momentum') : t('student_stars', { instType })}</span>
                    </h2>
                    <div className="flex items-center gap-1">
                        <button onClick={() => handleTabClick('momentum')} className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'momentum' ? 'bg-cyan-400 scale-125' : 'bg-white/10'}`} />
                        <button onClick={() => handleTabClick('top')} className={`w-1.5 h-1.5 rounded-full transition-all ${activeTab === 'top' ? 'bg-cyan-400 scale-125' : 'bg-white/10'}`} />
                    </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0 p-2 lg:p-2.5 gap-2">
                    <div ref={listContainerRef} className="space-y-1.5 relative flex-1 min-h-0 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} >
                        <AnimatePresence mode="wait">
                            <MotionDiv key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }} className="space-y-1.5 pb-2" >
                                {displayList.map((student, idx) => (
                                    <div key={student.id} className={`relative flex items-center py-1.5 lg:py-2 px-3 lg:px-4 rounded-[var(--radius-main)] border transition-all duration-300 ${isMomentumMode ? 'bg-white/5 border-yellow-500/10' : idx === 0 ? 'bg-white/10 border-pink-500/30 shadow-lg shadow-pink-500/5' : 'bg-white/5 border-white/5 hover:bg-white/10'}`} >
                                        <div className={`w-6 h-6 lg:w-7 lg:h-7 rounded-full flex items-center justify-center font-black text-[10px] lg:text-xs shrink-0 ml-2.5 ${isMomentumMode ? 'bg-yellow-500 text-black' : idx === 0 ? 'bg-pink-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                                            {isMomentumMode ? <TrendUpIcon className="w-3 h-3 lg:w-3.5 lg:h-3.5" /> : student.rank}
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <div className="flex items-center gap-1.5 lg:gap-2 flex-wrap">
                                                <span className="font-bold text-xs md:text-sm lg:text-[clamp(0.8rem,1.1vw,0.95rem)] text-white truncate leading-none">{student.name}</span>
                                                <div className="flex items-center text-[8px] lg:text-[9px] text-white/50 bg-white/5 px-1 py-0.5 rounded-[var(--radius-main)] font-bold whitespace-nowrap">
                                                    {student.className}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="font-black text-sm lg:text-[clamp(0.9rem,1.2vw,1.1rem)] text-white tracking-tighter bg-black/20 rounded-[var(--radius-main)] px-2.5 py-0.5 lg:py-1 shadow-inner">
                                                <AnimatedCounter value={student.score} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </MotionDiv>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
});

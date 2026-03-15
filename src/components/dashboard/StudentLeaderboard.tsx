
import React, { useMemo, memo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MedalIcon, TrendUpIcon, StarIcon } from '../ui/Icons';
import { AnimatedCounter } from '../ui/AnimatedCounter';
import { useAutoScroll } from '../../hooks/useAutoScroll';
import { useLanguage } from '../../hooks/useLanguage';
import { AppSettings, LuckyWheelWinner } from '../../types';
import { DashboardCardHeader } from './DashboardCardHeader';
import { LUCKY_WHEEL_CONSTANTS } from '../../constants';

const MotionDiv = motion.div;

const getPrizeEmoji = (roundNumber: number) => LUCKY_WHEEL_CONSTANTS.PRIZE_EMOJIS[(roundNumber - 1) % LUCKY_WHEEL_CONSTANTS.PRIZE_EMOJIS.length];

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
    settings: AppSettings;
    luckyWheelWinners?: LuckyWheelWinner[];
    momentumCount?: number;
}

type ActiveTab = 'momentum' | 'top' | 'wheel';

export const StudentLeaderboard: React.FC<StudentLeaderboardProps> = memo(({ topStudents, arenaStudents, settings, luckyWheelWinners = [], momentumCount = 10 }) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<ActiveTab>('momentum');
    const [isPaused, setIsPaused] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const listContainerRef = useRef<HTMLDivElement>(null!);

    useAutoScroll(listContainerRef, {
        isHovered,
        activeTab,
        speed: 0.5,
        pauseFrames: 90
    });

    const instType = settings.institution_type || t('yeshiva');

    const momentumList = useMemo(() => {
        const all = [...topStudents, ...arenaStudents];
        const uniqueMovers = new Map<string, EnrichedStudent>();
        all.forEach(s => {
            if ((s.rankDiff && s.rankDiff > 0) || s.trend === 'up') {
                if (!uniqueMovers.has(s.id)) {
                    uniqueMovers.set(s.id, s);
                }
            }
        });
        const movers = Array.from(uniqueMovers.values());
        movers.sort((a, b) => (b.rankDiff || 0) - (a.rankDiff || 0));
        return movers.slice(0, momentumCount);
    }, [topStudents, arenaStudents, momentumCount]);

    // Group winners by wheel_name, preserving insertion order (most recent first)
    const wheelGroups = useMemo(() => {
        const groups = new Map<string, LuckyWheelWinner[]>();
        for (const w of luckyWheelWinners) {
            const key = w.wheel_name || t('lucky_wheel_winners_tab' as any);
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(w);
        }
        return Array.from(groups.entries()); // [[wheelName, winners[]], ...]
    }, [luckyWheelWinners, t]);

    const tabs: ActiveTab[] = useMemo(() => {
        const base: ActiveTab[] = ['momentum', 'top'];
        return [...base, 'wheel'];
    }, []);

    useEffect(() => {
        if (isPaused || isHovered) return;
        const interval = setInterval(() => {
            setActiveTab(prev => {
                const idx = tabs.indexOf(prev);
                return tabs[(idx + 1) % tabs.length];
            });
        }, 10000);
        return () => clearInterval(interval);
    }, [isPaused, isHovered, tabs]);

    const handleTabClick = (tab: ActiveTab) => {
        setActiveTab(tab);
        setIsPaused(true);
        setTimeout(() => setIsPaused(false), 30000);
    };

    const displayList = activeTab === 'momentum' && momentumList.length > 0 ? momentumList : topStudents;
    const isMomentumMode = activeTab === 'momentum' && momentumList.length > 0;
    const isWheelMode = activeTab === 'wheel';

    const headerTitle = isWheelMode
        ? t('lucky_wheel_winners_tab' as any)
        : isMomentumMode
            ? t('stars_momentum')
            : t('student_stars', { instType });

    const headerIcon = isWheelMode
        ? <span className="text-xs">🎡</span>
        : isMomentumMode
            ? <StarIcon className="w-3.5 h-3.5" />
            : <MedalIcon className="w-3.5 h-3.5" />;

    const iconColorClass = isWheelMode ? 'text-purple-400' : isMomentumMode ? 'text-yellow-400' : 'text-pink-400';
    const iconBgClass = isWheelMode ? 'bg-purple-500/10' : isMomentumMode ? 'bg-yellow-500/10' : 'bg-pink-500/10';
    const borderColorClass = isWheelMode ? 'border-purple-500/20' : isMomentumMode ? 'border-yellow-500/20' : 'border-pink-500/20';

    return (
        <div className="flex flex-col h-full w-full">
            <div
                className="glass-panel rounded-[var(--radius-container)] p-0 flex flex-col shadow-[0_25px_50px_rgba(0,0,0,0.7)] border-white/30 bg-black/60 flex-1 min-h-[300px] lg:min-h-0 overflow-hidden [isolation:isolate]"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <DashboardCardHeader
                    title={headerTitle}
                    icon={headerIcon}
                    iconColorClass={iconColorClass}
                    iconBgClass={iconBgClass}
                    borderColorClass={borderColorClass}
                    rightContent={
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => handleTabClick('momentum')}
                                className={`w-1.5 h-1.5 rounded-full transition-all focus:ring-2 focus:ring-cyan-400 focus:outline-none ${activeTab === 'momentum' ? 'bg-cyan-400 scale-125' : 'bg-white/10'}`}
                                role="tab"
                                aria-selected={activeTab === 'momentum'}
                                aria-label={t('stars_momentum')}
                            />
                            <button
                                onClick={() => handleTabClick('top')}
                                className={`w-1.5 h-1.5 rounded-full transition-all focus:ring-2 focus:ring-cyan-400 focus:outline-none ${activeTab === 'top' ? 'bg-cyan-400 scale-125' : 'bg-white/10'}`}
                                role="tab"
                                aria-selected={activeTab === 'top'}
                                aria-label={t('student_stars', { instType })}
                            />
                            <button
                                onClick={() => handleTabClick('wheel')}
                                className={`w-1.5 h-1.5 rounded-full transition-all focus:ring-2 focus:ring-cyan-400 focus:outline-none ${activeTab === 'wheel' ? 'bg-cyan-400 scale-125' : 'bg-white/10'}`}
                                role="tab"
                                aria-selected={activeTab === 'wheel'}
                                aria-label={t('lucky_wheel_winners_tab' as any)}
                            />
                        </div>
                    }
                />

                <div className="flex-1 flex flex-col min-h-0 p-2 lg:p-2.5 gap-2">
                    <div ref={listContainerRef} className="space-y-1.5 relative flex-1 min-h-0 overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} >
                        <AnimatePresence mode="wait">
                            {isWheelMode ? (
                                <MotionDiv key="wheel" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }} className="space-y-2 pb-2">
                                    {wheelGroups.length === 0 ? (
                                        <div className="flex items-center justify-center h-24 text-white/60 text-sm font-bold">
                                            {t('wheel_waiting' as any)}
                                        </div>
                                    ) : (
                                        wheelGroups.map(([wheelName, winners]) => (
                                            <div key={wheelName} className="space-y-1.5">
                                                <div className="text-[10px] font-black text-purple-300/80 uppercase tracking-widest px-1 pt-1">
                                                    🎡 {wheelName}
                                                </div>
                                                {winners.map((winner) => (
                                                    <div
                                                        key={winner.id}
                                                        className="relative flex items-center py-1.5 lg:py-2 px-2.5 lg:px-3.5 rounded-[var(--radius-main)] border bg-white/10 border-purple-500/20 shadow-lg shadow-purple-500/5"
                                                    >
                                                        <div className="w-6 h-6 lg:w-7 lg:h-7 rounded-full flex items-center justify-center font-black text-sm lg:text-base shrink-0 ml-2.5 bg-purple-500 text-white">
                                                            {getPrizeEmoji(winner.round_number)}
                                                        </div>
                                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                            <div className="flex items-center gap-1.5 lg:gap-2 flex-wrap">
                                                                <span className="font-bold text-sm md:text-sm lg:text-[clamp(0.9rem,1.2vw,1rem)] text-white truncate leading-none">{winner.student_name}</span>
                                                                {winner.class_name && (
                                                                    <div className="relative flex items-center text-[10px] text-white px-2 py-0.5 rounded-[var(--radius-main)] font-bold whitespace-nowrap shadow-sm border border-white/20 backdrop-blur-sm overflow-hidden bg-purple-700/50">
                                                                        <span className="relative z-10">{winner.class_name}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-right shrink-0 text-[10px] text-white/40 font-medium px-1">
                                                            #{winner.round_number}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ))
                                    )}
                                </MotionDiv>
                            ) : (
                                <MotionDiv key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }} className="space-y-1.5 pb-2" >
                                    {displayList.map((student, idx) => (
                                        <div
                                            key={student.id}
                                            className={`relative flex items-center py-1.5 lg:py-2 px-2.5 lg:px-3.5 rounded-[var(--radius-main)] border transition-all duration-300 ${
                                                isMomentumMode
                                                    ? 'bg-white/10 border-yellow-500/20 shadow-lg shadow-yellow-500/5'
                                                    : idx === 0
                                                        ? 'bg-white/20 border-pink-500/40 shadow-lg shadow-pink-500/10'
                                                        : 'bg-white/10 border-white/20 hover:bg-white/15'
                                            }`}
                                        >
                                            <div className={`w-6 h-6 lg:w-7 lg:h-7 rounded-full flex items-center justify-center font-black text-sm lg:text-base shrink-0 ml-2.5 ${isMomentumMode ? 'bg-yellow-500 text-black' : idx === 0 ? 'bg-pink-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                                                {isMomentumMode ? <TrendUpIcon className="w-3 h-3 lg:w-3.5 lg:h-3.5" /> : student.rank}
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <div className="flex items-center gap-1.5 lg:gap-2 flex-wrap">
                                                    <span className="font-bold text-sm md:text-sm lg:text-[clamp(0.9rem,1.2vw,1rem)] text-white truncate leading-none">{student.name}</span>
                                                    <div
                                                        className="relative flex items-center text-[10px] text-white px-2 py-0.5 rounded-[var(--radius-main)] font-bold whitespace-nowrap shadow-sm border border-white/20 backdrop-blur-sm overflow-hidden"
                                                    >
                                                        <div
                                                            data-testid="group-tag-bg"
                                                            className={`absolute inset-0 ${student.classColor && student.classColor.startsWith('bg-') ? student.classColor : ''}`}
                                                            style={{
                                                                opacity: 0.5,
                                                                backgroundColor: student.classColor && !student.classColor.startsWith('bg-') ? student.classColor : undefined
                                                            }}
                                                        />
                                                        <span className="relative z-10">{student.className}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="font-black text-sm lg:text-[clamp(1rem,1.3vw,1.1rem)] text-white tracking-tighter bg-black/40 rounded-[var(--radius-main)] px-2.5 py-1 lg:py-1 shadow-inner">
                                                    <AnimatedCounter value={student.score} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </MotionDiv>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
});

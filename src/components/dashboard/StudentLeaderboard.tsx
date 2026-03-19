
import React, { useMemo, memo, useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MedalIcon, TrendUpIcon, StarIcon } from '../ui/Icons';
import { AnimatedCounter } from '../ui/AnimatedCounter';
import { useAutoScroll } from '../../hooks/useAutoScroll';
import { useLanguage } from '../../hooks/useLanguage';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { AppSettings, LuckyWheelWinner } from '../../types';
import { DashboardCardHeader } from './DashboardCardHeader';
import { getRankBadgeClasses } from '../../utils/rankingUtils';

const MotionDiv = motion.div as any;

const PRIZE_EMOJIS = ['🎁', '🎀', '🥇', '🏅', '💎', '👑', '🌟', '🎯', '🎊', '💝'];
function buildPrizeEmojiList(winners: { round_number: number }[]): string[] {
    const result: string[] = [];
    for (let i = 0; i < winners.length; i++) {
        let emoji = PRIZE_EMOJIS[(winners[i].round_number - 1) % PRIZE_EMOJIS.length];
        let offset = 1;
        while (emoji === result[i - 1] && offset < PRIZE_EMOJIS.length) {
            emoji = PRIZE_EMOJIS[(winners[i].round_number - 1 + offset) % PRIZE_EMOJIS.length];
            offset++;
        }
        result.push(emoji);
    }
    return result;
}

// ── Search icon SVG ────────────────────────────────────────────
const SearchSvg = ({ size = 14 }: { size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

interface EnrichedStudent {
    id: string;
    name: string;
    score: number;
    className: string;
    classColor: string;
    rankDiff?: number;
    scoreDiff?: number;
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

// ── Reusable student row ───────────────────────────────────────
const StudentRow = ({
    student,
    badge,
    badgeBg,
    rowBg,
    nameColorClass = 'text-white',
    onClick,
    layoutReady = false,
}: {
    student: EnrichedStudent;
    badge: React.ReactNode;
    badgeBg: string;
    rowBg: string;
    nameColorClass?: string;
    onClick?: () => void;
    layoutReady?: boolean;
}) => (
    <motion.div
        layoutId={layoutReady ? `student-row-${student.id}` : undefined}
        layout={layoutReady ? 'position' : false}
        transition={{ type: 'spring', stiffness: 120, damping: 25, mass: 1 }}
        className={`relative flex items-center py-1.5 lg:py-2 px-2.5 lg:px-3.5 rounded-[var(--radius-main)] border transition-all duration-300 ${rowBg} ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
    >
        <div className={`w-6 h-6 lg:w-7 lg:h-7 rounded-full flex items-center justify-center font-black text-sm lg:text-base shrink-0 ml-2.5 ${badgeBg}`}>
            {badge}
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
            <div className="flex items-center gap-1.5 lg:gap-2 flex-wrap">
                <span className={`font-bold text-sm md:text-sm lg:text-[clamp(0.9rem,1.2vw,1rem)] truncate leading-none ${nameColorClass}`}>{student.name}</span>
                <div className="relative flex items-center text-[10px] text-white px-2 py-0.5 rounded-[var(--radius-main)] font-bold whitespace-nowrap shadow-sm border border-white/20 overflow-hidden">
                    <div
                        data-testid="group-tag-bg"
                        className={`absolute inset-0 ${student.classColor && student.classColor.startsWith('bg-') ? student.classColor : ''}`}
                        style={{ opacity: 0.5, backgroundColor: student.classColor && !student.classColor.startsWith('bg-') ? student.classColor : undefined }}
                    />
                    <span className="relative z-10">{student.className}</span>
                </div>
            </div>
            {student.rankDiff != null && student.rankDiff > 0 ? (
                <span className="text-[11px] lg:text-xs font-bold text-emerald-400 leading-none whitespace-nowrap" dir="rtl">
                    ▲{student.rankDiff} מקומות
                </span>
            ) : student.scoreDiff != null && student.scoreDiff > 0 ? (
                <span className="text-[11px] lg:text-xs font-bold text-emerald-400 leading-none whitespace-nowrap" dir="rtl">
                    {student.scoreDiff}+ נקו'
                </span>
            ) : null}
        </div>
        <div className="text-right shrink-0">
            <div className="font-black text-sm lg:text-[clamp(1rem,1.3vw,1.1rem)] text-white tracking-tighter bg-black/40 rounded-[var(--radius-main)] px-2.5 py-1 lg:py-1 shadow-inner">
                <AnimatedCounter value={student.score} />
            </div>
        </div>
    </motion.div>
);

export const StudentLeaderboard: React.FC<StudentLeaderboardProps> = memo(({ topStudents, arenaStudents, settings, luckyWheelWinners = [], momentumCount = 10 }) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<ActiveTab>('momentum');
    const [isPaused, setIsPaused] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // ── Student search / pin state ─────────────────────────────
    const lsKey = `w2g_pinned_ids_${settings.campaign_id ?? 'default'}`;
    const [pinnedArr, setPinnedArr] = useLocalStorage<string[]>(lsKey, []);
    const pinnedIds = useMemo(() => new Set(pinnedArr), [pinnedArr]);
    const [searchOpen, setSearchOpen] = useState(false);
    const [query, setQuery] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Pulse the search icon for 6 s on first mount, stops once a pin is added
    const [showPulse, setShowPulse] = useState(true);
    useEffect(() => {
        const t = setTimeout(() => setShowPulse(false), 6000);
        return () => clearTimeout(t);
    }, []);
    useEffect(() => { if (pinnedIds.size > 0) setShowPulse(false); }, [pinnedIds.size]);

    const togglePin = useCallback((id: string) => {
        setPinnedArr(prev => {
            const set = new Set(prev);
            if (set.has(id)) set.delete(id); else set.add(id);
            return Array.from(set);
        });
    }, [setPinnedArr]);

    // All students available for search (top + arena, deduplicated)
    const allSearchable = useMemo(() => {
        const map = new Map<string, EnrichedStudent>();
        [...topStudents, ...arenaStudents].forEach(s => { if (!map.has(s.id)) map.set(s.id, s); });
        return Array.from(map.values());
    }, [topStudents, arenaStudents]);

    const searchResults = useMemo(() => {
        if (!query.trim()) return allSearchable;
        const tokens = query.trim().toLowerCase().split(/\s+/);
        return allSearchable.filter(s => {
            const haystack = s.name.toLowerCase();
            return tokens.every(tok => haystack.includes(tok));
        });
    }, [allSearchable, query]);

    const pinnedStudents = useMemo(() =>
        allSearchable.filter(s => pinnedIds.has(s.id)),
    [allSearchable, pinnedIds]);

    // Map student_id → classColor for wheel winners
    const studentColorMap = useMemo(() => {
        const map = new Map<string, string>();
        allSearchable.forEach(s => map.set(s.id, s.classColor));
        return map;
    }, [allSearchable]);

    useEffect(() => {
        if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 50);
        else setQuery('');
    }, [searchOpen]);

    const listContainerRef = useRef<HTMLDivElement>(null!);

    // ── Enable layout animations only after the list has settled ──
    // Prevents animation on initial mount and after tab/screen switches
    const [isLayoutReady, setIsLayoutReady] = useState(false);
    useEffect(() => {
        setIsLayoutReady(false);
        const timer = setTimeout(() => setIsLayoutReady(true), 600);
        return () => clearTimeout(timer);
    }, [activeTab]);

    // ── Pause scroll during rank-change animations ─────────────
    const [isRankAnimating, setIsRankAnimating] = useState(false);
    const rankAnimatingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const prevTopStudentsRef = useRef<EnrichedStudent[]>([]);
    useEffect(() => {
        const prev = prevTopStudentsRef.current;
        if (prev.length > 0) {
            const hasRankChange = topStudents.some(s => {
                const prevS = prev.find(p => p.id === s.id);
                return prevS !== undefined && prevS.rank !== s.rank;
            });
            if (hasRankChange) {
                setIsRankAnimating(true);
                if (rankAnimatingTimeoutRef.current) clearTimeout(rankAnimatingTimeoutRef.current);
                rankAnimatingTimeoutRef.current = setTimeout(() => setIsRankAnimating(false), 2500);
            }
        }
        prevTopStudentsRef.current = topStudents;
    }, [topStudents]);
    useEffect(() => () => {
        if (rankAnimatingTimeoutRef.current) clearTimeout(rankAnimatingTimeoutRef.current);
    }, []);

    // ── FAB visibility — responds only to user touch/scroll ────
    const [isUserActive, setIsUserActive] = useState(false);
    const userActiveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const markUserActive = useCallback(() => {
        setIsUserActive(true);
        if (userActiveTimeoutRef.current) clearTimeout(userActiveTimeoutRef.current);
        userActiveTimeoutRef.current = setTimeout(() => setIsUserActive(false), 2000);
    }, []);
    useEffect(() => {
        window.addEventListener('touchstart', markUserActive, { passive: true });
        window.addEventListener('touchmove', markUserActive, { passive: true });
        window.addEventListener('wheel', markUserActive, { passive: true });
        return () => {
            window.removeEventListener('touchstart', markUserActive);
            window.removeEventListener('touchmove', markUserActive);
            window.removeEventListener('wheel', markUserActive);
            if (userActiveTimeoutRef.current) clearTimeout(userActiveTimeoutRef.current);
        };
    }, [markUserActive]);

    useAutoScroll(listContainerRef, {
        isHovered: isHovered || isRankAnimating,
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
                if (!uniqueMovers.has(s.id)) uniqueMovers.set(s.id, s);
            }
        });
        const movers = Array.from(uniqueMovers.values());
        movers.sort((a, b) => (b.rankDiff || 0) - (a.rankDiff || 0));
        return movers.slice(0, momentumCount);
    }, [topStudents, arenaStudents, momentumCount]);

    // Group winners by wheel_name (pre-compute prize emojis per group)
    const wheelGroups = useMemo(() => {
        const groups = new Map<string, LuckyWheelWinner[]>();
        for (const w of luckyWheelWinners) {
            const key = w.wheel_name || t('lucky_wheel_winners_tab' as any);
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(w);
        }
        return Array.from(groups.entries()).map(([name, winners]) => ({
            name,
            winners,
            prizeEmojis: buildPrizeEmojiList(winners),
        }));
    }, [luckyWheelWinners, t]);

    const tabs: ActiveTab[] = useMemo(() => ['momentum', 'top', 'wheel'], []);

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

    // Students in the scrollable list (pinned ones are shown sticky above)
    const scrollList = useMemo(
        () => displayList.filter(s => !pinnedIds.has(s.id)),
        [displayList, pinnedIds]
    );

    const openSearch = useCallback(() => setSearchOpen(true), []);

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
                        <div className="flex items-center gap-2">
                            {/* Tab dots — right side in RTL */}
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
                            {/* Search button — left side in RTL */}
                            <div className="relative">
                                <button
                                    onClick={() => setSearchOpen(o => !o)}
                                    className={`relative flex items-center justify-center w-8 h-8 rounded-full border transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400
                                        ${searchOpen
                                            ? 'bg-cyan-500/40 border-cyan-400/50 text-cyan-300'
                                            : pinnedIds.size > 0
                                                ? 'bg-cyan-500/20 border-cyan-400/30 text-cyan-400'
                                                : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/15 hover:text-white'
                                        }
                                        ${showPulse ? 'animate-pulse' : ''}
                                    `}
                                    aria-label="חיפוש תלמיד"
                                >
                                    <SearchSvg size={16} />
                                </button>
                                {pinnedIds.size > 0 && (
                                    <span className="pointer-events-none absolute -top-1 -end-1 w-4 h-4 bg-cyan-500 rounded-full text-[9px] font-black text-white flex items-center justify-center leading-none">
                                        {pinnedIds.size}
                                    </span>
                                )}
                            </div>
                        </div>
                    }
                />

                <div className="flex-1 flex flex-col min-h-0 p-2 lg:p-2.5 gap-1.5">
                    {/* ── Sticky pinned zone (above scroll) ─────────────── */}
                    {!isWheelMode && pinnedStudents.length > 0 && (
                        <div className="space-y-1.5 shrink-0">
                            {pinnedStudents.map(student => (
                                <StudentRow
                                    key={`sticky-${student.id}`}
                                    student={student}
                                    badge="📌"
                                    badgeBg="bg-cyan-500 text-white"
                                    rowBg="bg-cyan-500/10 border-cyan-500/30 shadow-lg shadow-cyan-500/5"
                                    onClick={openSearch}
                                    layoutReady={isLayoutReady}
                                />
                            ))}
                            {/* Divider */}
                            <div className="border-t border-white/10 mx-1" />
                        </div>
                    )}

                    {/* ── Scrollable list ────────────────────────────────── */}
                    <div
                        ref={listContainerRef}
                        className="space-y-1.5 relative flex-1 min-h-0 overflow-y-auto [&::-webkit-scrollbar]:hidden max-h-[240px] lg:max-h-none"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        <AnimatePresence mode="wait">
                            {isWheelMode ? (
                                <MotionDiv key="wheel" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }} className="space-y-2 pb-2">
                                    {wheelGroups.length === 0 ? (
                                        <div className="flex items-center justify-center h-24 text-white/60 text-sm font-bold">
                                            {t('wheel_waiting' as any)}
                                        </div>
                                    ) : (
                                        wheelGroups.map(({ name: wheelName, winners, prizeEmojis }) => {
                                            return (
                                            <div key={wheelName} className="space-y-1.5">
                                                {/* Wheel name pill */}
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-black text-white/80 tracking-wide">
                                                    🎡 {wheelName}
                                                </div>
                                                {winners.map((winner, i) => {
                                                    const classColor = (winner.student_id ? studentColorMap.get(winner.student_id) : undefined) ?? '';
                                                    return (
                                                    <div
                                                        key={winner.id}
                                                        className="relative flex items-center py-1.5 lg:py-2 px-2.5 lg:px-3.5 rounded-[var(--radius-main)] border bg-white/10 border-purple-500/20 shadow-lg shadow-purple-500/5"
                                                    >
                                                        <div className="w-6 h-6 lg:w-7 lg:h-7 rounded-full flex items-center justify-center font-black text-sm lg:text-base shrink-0 ml-2.5 bg-gradient-to-br from-amber-400 to-orange-500 shadow-[0_0_8px_rgba(251,191,36,0.5)]">
                                                            {prizeEmojis[i]}
                                                        </div>
                                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                            <div className="flex items-center gap-1.5 lg:gap-2 flex-wrap">
                                                                <span className="font-bold text-sm md:text-sm lg:text-[clamp(0.9rem,1.2vw,1rem)] text-white truncate leading-none">{winner.student_name}</span>
                                                                {winner.class_name && (
                                                                    <div className="relative flex items-center text-[10px] text-white px-2 py-0.5 rounded-[var(--radius-main)] font-bold whitespace-nowrap shadow-sm border border-white/20 overflow-hidden">
                                                                        <div
                                                                            className={`absolute inset-0 ${classColor.startsWith('bg-') ? classColor : ''}`}
                                                                            style={{ opacity: 0.5, backgroundColor: classColor && !classColor.startsWith('bg-') ? classColor : undefined }}
                                                                        />
                                                                        <span className="relative z-10">{winner.class_name}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="w-6 h-6 lg:w-7 lg:h-7 rounded-full flex items-center justify-center font-black text-sm lg:text-base shrink-0 bg-slate-700 text-slate-300">
                                                            {winner.round_number}
                                                        </div>
                                                    </div>
                                                    );
                                                })}
                                            </div>
                                        );})
                                    )}
                                </MotionDiv>
                            ) : (
                                <MotionDiv key={activeTab} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }} className="space-y-1.5 pb-2">
                                    {scrollList.map((student) => (
                                        <StudentRow
                                            key={student.id}
                                            student={student}
                                            badge={isMomentumMode ? <TrendUpIcon className="w-3 h-3 lg:w-3.5 lg:h-3.5" /> : student.rank}
                                            badgeBg={isMomentumMode ? 'bg-yellow-500 text-green-600' : getRankBadgeClasses(student.rank)}
                                            rowBg={
                                                isMomentumMode
                                                    ? 'bg-white/10 border-yellow-500/20 shadow-lg shadow-yellow-500/5'
                                                    : student.rank === 1
                                                        ? 'bg-white/20 border-yellow-500/40 shadow-lg shadow-yellow-500/10'
                                                        : 'bg-white/10 border-white/20 hover:bg-white/15'
                                            }
                                            nameColorClass={
                                                isMomentumMode ? 'text-white' :
                                                student.rank === 1 ? 'text-yellow-300' :
                                                student.rank === 2 ? 'text-slate-300' :
                                                'text-white'
                                            }
                                            layoutReady={isLayoutReady}
                                        />
                                    ))}
                                </MotionDiv>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* ── Mobile FAB (hidden on lg+) ─────────────────────────── */}
            <div
                className="lg:hidden fixed z-30 transition-opacity duration-700"
                style={{
                    bottom: '1.25rem',
                    left: '1rem',
                    transform: 'translateZ(0)',
                    willChange: 'opacity',
                    opacity: searchOpen || pinnedIds.size > 0 || isUserActive || showPulse ? 1 : 0.35,
                }}
            >
                <div className="relative">
                    <button
                        onClick={() => setSearchOpen(o => !o)}
                        className={`w-12 h-12 rounded-full shadow-2xl flex items-center justify-center transition-all
                            ${searchOpen || pinnedIds.size > 0
                                ? 'bg-cyan-500 text-white'
                                : 'bg-slate-800/90 backdrop-blur text-white/70 border border-white/20'
                            }
                            ${showPulse && pinnedIds.size === 0 ? 'animate-pulse' : ''}
                        `}
                        aria-label="חיפוש תלמיד"
                    >
                        <SearchSvg size={20} />
                    </button>
                    {pinnedIds.size > 0 && (
                        <span className="pointer-events-none absolute -top-1 -start-1 w-5 h-5 bg-white rounded-full text-[10px] font-black text-cyan-600 flex items-center justify-center leading-none shadow">
                            {pinnedIds.size}
                        </span>
                    )}
                </div>
            </div>

            {/* ── Search / Pin drawer ────────────────────────────────── */}
            <AnimatePresence>
                {searchOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            key="backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-40"
                            onClick={() => setSearchOpen(false)}
                        />
                        {/* Bottom sheet */}
                        <motion.div
                            key="drawer"
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="fixed bottom-0 inset-x-0 z-50 rounded-t-2xl bg-slate-900/97 backdrop-blur-xl border-t border-white/10"
                            style={{ maxHeight: '65vh', display: 'flex', flexDirection: 'column' }}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Drawer header */}
                            <div className="flex items-center px-4 pt-3 pb-2 shrink-0 gap-3">
                                {/* Drag handle (centered) */}
                                <div className="flex-1 flex justify-center">
                                    <div className="w-10 h-1 bg-white/20 rounded-full" />
                                </div>
                                {/* X close button */}
                                <button
                                    onClick={() => setSearchOpen(false)}
                                    className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors text-lg leading-none"
                                    aria-label="סגור"
                                >
                                    ✕
                                </button>
                            </div>
                            {/* Search input */}
                            <div className="px-4 pb-3 shrink-0">
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    placeholder="חיפוש תלמיד..."
                                    dir="auto"
                                    className="w-full px-4 py-3 text-base bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                                />
                            </div>
                            {/* Results list */}
                            <div className="overflow-y-auto flex-1 px-4 pb-6 space-y-1.5">
                                {/* Pinned students first */}
                                {pinnedStudents.map(s => (
                                    <label key={`pin-${s.id}`} className="flex items-center gap-3 p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked
                                            onChange={() => togglePin(s.id)}
                                            className="w-5 h-5 accent-cyan-400 shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-white text-sm truncate">{s.name}</div>
                                            <div className="text-xs text-white/50">{s.className}</div>
                                        </div>
                                        <span className="text-cyan-400 font-bold text-sm shrink-0">{s.score.toLocaleString()}</span>
                                    </label>
                                ))}
                                {/* Unpinned search results */}
                                {searchResults.filter(s => !pinnedIds.has(s.id)).map(s => (
                                    <label key={`res-${s.id}`} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={false}
                                            onChange={() => togglePin(s.id)}
                                            className="w-5 h-5 accent-cyan-400 shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-white text-sm truncate">{s.name}</div>
                                            <div className="text-xs text-white/50">{s.className}</div>
                                        </div>
                                        <span className="text-white/50 font-bold text-sm shrink-0">{s.score.toLocaleString()}</span>
                                    </label>
                                ))}
                                {searchResults.length === 0 && (
                                    <div className="text-center py-6 text-white/40 text-sm">לא נמצאו תלמידים</div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
});

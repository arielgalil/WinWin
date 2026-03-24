import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Podium } from '@/components/dashboard/Podium';
import { ClassTicker } from '@/components/dashboard/ClassTicker';
import { StudentLeaderboard } from '@/components/dashboard/StudentLeaderboard';
import { MissionMeter } from '@/components/dashboard/MissionMeter';
import { BurstNotification } from '@/components/ui/BurstNotification';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { VersionFooter } from '@/components/ui/VersionFooter';
import { LuckyWheelOverlay } from '@/components/dashboard/LuckyWheelOverlay';
import { useCompetitionEvents } from '@/hooks/useCompetitionEvents';
import { calculateClassStats, calculateStudentStats } from '@/utils/rankingUtils';
import { useDemoContext } from './DemoContext';
import { AppSettings } from '@/types';

const EMPTY_GOALS: AppSettings['goals_config'] = [];

export const DemoDashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const demo = useDemoContext();
    const {
        campaign, settings, classes, updateCommentary,
        forcedBursts, consumeForcedBurst,
        wheel, deactivateWheel,
    } = demo;

    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const spinCompleteTimerRef = useRef<number | undefined>(undefined);

    const { sortedClasses, top3Classes, totalInstitutionScore } = useMemo(
        () => calculateClassStats(classes),
        [classes],
    );

    const { studentsWithStats, arenaStudents } = useMemo(
        () => calculateStudentStats(classes),
        [classes],
    );

    const topNStudents = useMemo(
        () => studentsWithStats.slice(0, settings.leaderboard_top_count ?? 10),
        [studentsWithStats, settings.leaderboard_top_count],
    );

    const { activeBurst, setActiveBurst, highlightClassId } = useCompetitionEvents(
        sortedClasses,
        studentsWithStats,
        totalInstitutionScore,
        settings.goals_config || EMPTY_GOALS,
        settings as AppSettings,
        false,
        updateCommentary,
        campaign,
    );

    // Drain forced bursts into the active burst slot when it's free.
    // Same 3s delay as useCompetitionEvents so the viewer sees the context first.
    useEffect(() => {
        if (forcedBursts.length > 0 && !activeBurst) {
            const timer = setTimeout(() => {
                setActiveBurst(forcedBursts[0]);
                consumeForcedBurst();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [forcedBursts, activeBurst, setActiveBurst, consumeForcedBurst]);

    const handleDismissBurst = useCallback(() => setActiveBurst(null), [setActiveBurst]);
    const handleAdminClick = useCallback(() => navigate('/demo/admin'), [navigate]);
    const handleMusicToggle = useCallback(() => setIsMusicPlaying(p => !p), []);

    // Auto-deactivate wheel 8s after spin completes (winner celebration)
    const handleSpinComplete = useCallback(() => {
        if (spinCompleteTimerRef.current !== undefined) window.clearTimeout(spinCompleteTimerRef.current);
        spinCompleteTimerRef.current = window.setTimeout(() => deactivateWheel(), 8000);
    }, [deactivateWheel]);
    useEffect(() => () => { if (spinCompleteTimerRef.current !== undefined) window.clearTimeout(spinCompleteTimerRef.current); }, []);

    return (
        <div className="dashboard-view flex flex-col h-screen w-full overflow-hidden bg-black relative">
            <div className="flex-1 relative min-h-0">
                <GradientBackground
                    primaryColor={settings.primary_color}
                    secondaryColor={settings.secondary_color}
                    brightness={settings.background_brightness}
                >
                    <div className="flex flex-col h-full w-full overflow-hidden relative z-10 px-3 pt-3 md:px-4 md:pt-4 pb-3 md:pb-4">
                        {/* Demo mode banner */}
                        <div className="shrink-0 mb-2 flex items-center justify-center gap-3">
                            <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 backdrop-blur-sm">
                                מצב הדגמה - נתוני אימון בלבד
                            </span>
                            <button
                                onClick={handleAdminClick}
                                className="px-4 py-1.5 rounded-full text-xs font-black text-yellow-900 bg-yellow-400 hover:bg-yellow-300 shadow-[0_0_16px_rgba(250,204,21,0.5)] hover:shadow-[0_0_24px_rgba(250,204,21,0.8)] transition-all duration-300 animate-[pulse_3s_ease-in-out_infinite] [text-shadow:none]"
                            >
                                ניהול הדמו ↗
                            </button>
                        </div>

                        <BurstNotification
                            data={activeBurst}
                            onDismiss={handleDismissBurst}
                            volume={settings.burst_volume}
                            soundsEnabled={settings.burst_sounds_enabled}
                        />

                        {/* Lucky Wheel Overlay */}
                        <LuckyWheelOverlay
                            isActive={wheel.isActive}
                            participants={wheel.participants}
                            winnerIndex={wheel.winnerIndex}
                            winnerName={wheel.winnerName}
                            primaryColor={settings.primary_color}
                            secondaryColor={settings.secondary_color}
                            logoUrl={settings.logo_url ?? undefined}
                            wheelName="גלגל המזל"
                            startAtMs={wheel.startAtMs}
                            durationMs={wheel.durationMs}
                            onSpinComplete={handleSpinComplete}
                        />

                        <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden flex flex-col gap-3 max-w-[1920px] mx-auto w-full custom-scrollbar">
                            <div className="shrink-0 z-20">
                                <DashboardHeader
                                    settings={settings}
                                    commentary={settings.current_commentary || ''}
                                    customMessages={[]}
                                    totalInstitutionScore={totalInstitutionScore}
                                    sortedClasses={sortedClasses}
                                    topStudents={topNStudents}
                                    lastWheelWinner={undefined}
                                    onCapture={undefined}
                                    aiEnabled={false}
                                />
                            </div>

                            <div className="flex flex-col gap-3 flex-1 min-h-0">
                                <div className="flex flex-col lg:grid lg:grid-cols-3 gap-3 flex-1 lg:min-h-0 lg:overflow-hidden">
                                    <div className="order-1 lg:order-2 flex flex-col min-h-[230px] lg:min-h-0 lg:overflow-hidden">
                                        <Podium top3Classes={top3Classes} />
                                    </div>

                                    <div className="order-2 lg:order-1 flex flex-col min-h-[260px] lg:overflow-hidden">
                                        <MissionMeter
                                            totalScore={totalInstitutionScore}
                                            goals={settings.goals_config || EMPTY_GOALS}
                                            legacyTargetScore={settings.target_score}
                                            legacyImageUrl={settings.logo_url}
                                            competitionName={settings.competition_name}
                                            classes={classes}
                                            settings={settings}
                                            campaignId={campaign.id}
                                            aiEnabled={false}
                                        />
                                    </div>

                                    <div className="order-3 flex flex-col min-h-[300px] lg:min-h-0 lg:overflow-hidden">
                                        <StudentLeaderboard
                                            topStudents={topNStudents}
                                            arenaStudents={arenaStudents}
                                            settings={settings}
                                            luckyWheelWinners={[]}
                                            momentumCount={settings.leaderboard_momentum_count ?? 10}
                                        />
                                    </div>
                                </div>

                                <div className="shrink-0 h-[144px]">
                                    <ClassTicker
                                        otherClasses={sortedClasses}
                                        highlightClassId={highlightClassId}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </GradientBackground>
            </div>

            <div className="shrink-0 z-[60] border-t border-[var(--border-subtle)]/20 overflow-hidden">
                <VersionFooter
                    musicState={{ isPlaying: isMusicPlaying, onToggle: handleMusicToggle }}
                    onAdminClick={handleAdminClick}
                    viewerCount={0}
                />
            </div>
        </div>
    );
};

import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { Podium } from './dashboard/Podium';
import { ClassTicker } from './dashboard/ClassTicker';
import { StudentLeaderboard } from './dashboard/StudentLeaderboard';
import { MissionMeter } from './dashboard/MissionMeter';
import { FrozenOverlay } from './ui/FrozenOverlay';
import { BurstNotification } from './ui/BurstNotification';
import { GradientBackground } from './ui/GradientBackground';
import { BackgroundMusic } from './dashboard/BackgroundMusic';
import { useCompetitionEvents } from '../hooks/useCompetitionEvents';
import { calculateClassStats, calculateStudentStats } from '../utils/rankingUtils';
import { ShareableLeaderboard } from './dashboard/ShareableLeaderboard';
import { VersionFooter } from './ui/VersionFooter';
import { DashboardErrorBoundary } from './ui/ErrorBoundaries';
import { useCampaign } from '../hooks/useCampaign';
import { useClasses } from '../hooks/useClasses';
import { useTicker } from '../hooks/useTicker';
import { useCompetitionMutations } from '../hooks/useCompetitionMutations';
import { useAuth } from '../hooks/useAuth';
import { useCampaignRole } from '../hooks/useCampaignRole';
import { useLanguage } from '../hooks/useLanguage';
import { isSuperUser as checkIsSuperUser } from '../config';
import { KioskRotator } from './dashboard/KioskRotator';
import { KioskStartOverlay } from './dashboard/KioskStartOverlay';
import { useStore } from '../services/store';

export const Dashboard: React.FC = () => {
    const { campaign, settings } = useCampaign();
    const { classes } = useClasses(campaign?.id);
    const { tickerMessages } = useTicker(campaign?.id);
    const { updateCommentary } = useCompetitionMutations(campaign?.id);
    const { user } = useAuth();
    const { campaignRole } = useCampaignRole(campaign?.id, user?.id);
    const { slug } = useParams();
    const navigate = useNavigate();
    const setPersistentSession = useStore(state => state.setPersistentSession);
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const [isKioskStarted, setIsKioskStarted] = useState(() => {
        return sessionStorage.getItem('kiosk_started') === 'true';
    });

    React.useEffect(() => {
        // After 5 seconds (completion of initial animations), mark session as persistent
        const timer = setTimeout(() => {
            setPersistentSession(true);
        }, 5000);
        return () => clearTimeout(timer);
    }, [setPersistentSession]);

    const handleStartKiosk = () => {
        console.log("[Kiosk] Starting kiosk mode...");
        setIsKioskStarted(true);
        sessionStorage.setItem('kiosk_started', 'true');
        setIsMusicPlaying(true);
    };

    // Auto-dismiss if no click after 15 seconds
    React.useEffect(() => {
        if (settings?.rotation_enabled && !isKioskStarted) {
            console.log("[Kiosk] Overlay visible. Settings:", settings);
            const timer = setTimeout(() => {
                console.log("[Kiosk] Auto-dismissing overlay (interaction may be lost)");
                handleStartKiosk();
            }, 15000);
            return () => clearTimeout(timer);
        }
    }, [settings?.rotation_enabled, isKioskStarted]);

    const { sortedClasses, top3Classes, totalInstitutionScore } = useMemo(() =>
        calculateClassStats(classes || []),
        [classes]);

    const { studentsWithStats, top10Students, arenaStudents } = useMemo(() =>
        calculateStudentStats(classes || []),
        [classes]);

    const isSuperUser = checkIsSuperUser(user?.role);
    const isCampaignActive = campaign?.is_active ?? false;
    const isFrozen = (!isCampaignActive || !!settings?.is_frozen) && !isSuperUser;
    
    const { activeBurst, setActiveBurst, highlightClassId } = useCompetitionEvents(
        sortedClasses,
        studentsWithStats,
        totalInstitutionScore,
        settings?.goals_config || [],
        settings || {} as any,
        isFrozen,
        updateCommentary
    );

    if (!settings || !campaign) return null;

    const commentary = settings.current_commentary || '';

    return (
        <DashboardErrorBoundary>
            <KioskStartOverlay 
                isVisible={!!settings?.rotation_enabled && !isKioskStarted} 
                onStart={handleStartKiosk} 
            />
            <KioskRotator settings={settings} isStarted={isKioskStarted}>
                <GradientBackground
                    primaryColor={settings.primary_color}
                    secondaryColor={settings.secondary_color}
                    brightness={settings.background_brightness}
                >
                    <div className="flex flex-col h-screen w-full overflow-hidden relative z-10 px-2 pt-2 md:px-3 md:pt-3 pb-0">
                        <FrozenOverlay isFrozen={isFrozen} />
                        <BackgroundMusic
                            url={settings.background_music_url}
                            mode={settings.background_music_mode}
                            volume={settings.background_music_volume}
                            isPlaying={isMusicPlaying}
                        />

                        <ShareableLeaderboard id="share-leaderboard-capture" settings={settings} topClasses={sortedClasses} top10Students={top10Students} />

                        {!isFrozen && (
                            <BurstNotification
                                data={activeBurst}
                                onDismiss={() => setActiveBurst(null)}
                            />
                        )}

                        <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden flex flex-col gap-2 max-w-[1920px] mx-auto w-full custom-scrollbar">
                            <div className="shrink-0 z-20">
                                <DashboardHeader
                                    settings={settings}
                                    commentary={commentary}
                                    customMessages={tickerMessages}
                                    totalInstitutionScore={totalInstitutionScore}
                                    sortedClasses={sortedClasses}
                                    topStudents={top10Students}
                                />
                            </div>

                            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-3 lg:min-h-0 lg:overflow-hidden pb-0 flex-1 lg:flex-grow">
                                <div className="order-1 lg:order-2 flex flex-col min-h-[280px] lg:min-h-0 lg:overflow-hidden">
                                    <Podium top3Classes={top3Classes} />
                                </div>

                                <div className="order-2 lg:order-1 flex flex-col min-h-[320px] lg:overflow-hidden">
                                    <MissionMeter
                                        totalScore={totalInstitutionScore}
                                        goals={settings.goals_config || []}
                                        legacyTargetScore={settings.target_score}
                                        legacyImageUrl={settings.logo_url}
                                        competitionName={settings.competition_name}
                                        classes={classes || []}
                                    />
                                </div>

                                <div className="order-3 flex flex-col min-h-[300px] lg:min-h-0 lg:overflow-hidden">
                                    <StudentLeaderboard
                                        topStudents={top10Students}
                                        arenaStudents={arenaStudents}
                                        settings={settings}
                                    />
                                </div>

                                <div className="order-4 lg:col-span-3 shrink-0 min-h-[144px] lg:min-h-0 lg:overflow-hidden">
                                    <ClassTicker
                                        otherClasses={sortedClasses}
                                        highlightClassId={highlightClassId}
                                    />
                                </div>
                            </div>
                        </div>
                        <VersionFooter 
                            musicState={{ isPlaying: isMusicPlaying, onToggle: () => setIsMusicPlaying(!isMusicPlaying) }} 
                            onAdminClick={() => navigate(`/login/${slug}`)}
                        />
                    </div>
                </GradientBackground>
            </KioskRotator>
        </DashboardErrorBoundary>
    );
};
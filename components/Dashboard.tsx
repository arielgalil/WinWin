
import React, { useMemo, useState } from 'react';
import { ClassRoom, AppSettings, TickerMessage, UserProfile } from '../types';
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
import { useLanguage } from '../hooks/useLanguage';

interface DashboardProps {
    classes: ClassRoom[];
    commentary: string;
    tickerMessages: TickerMessage[];
    settings: AppSettings;
    onLoginClick: () => void;
    user?: UserProfile | null;
    userRole?: 'admin' | 'teacher' | 'superuser' | null;
    isSuperUser?: boolean;
    onSuperUserClick?: () => void;
    onSwitchCampaign?: () => void;
    isCampaignActive?: boolean;
    onManagePoints?: () => void;
    onManageSchool?: () => void;
    onUpdateCommentary?: (text: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
    classes,
    commentary,
    tickerMessages,
    settings,
    isSuperUser,
    isCampaignActive = true,
    onUpdateCommentary
}) => {
    const { t } = useLanguage();

    const [isSharing, setIsSharing] = useState(false);
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);

    const { sortedClasses, top3Classes, totalInstitutionScore } = useMemo(() =>
        calculateClassStats(classes),
        [classes]);

    const { studentsWithStats, top10Students, arenaStudents } = useMemo(() =>
        calculateStudentStats(classes),
        [classes]);

    const { activeBurst, setActiveBurst, spotlightStudent, highlightClassId } = useCompetitionEvents(
        sortedClasses,
        studentsWithStats,
        totalInstitutionScore,
        settings.goals_config || [],
        studentsWithStats.slice(0, 5),
        settings,
        onUpdateCommentary
    );

    const isFrozen = !isCampaignActive && !isSuperUser;

    const handleShare = async () => {
        setIsSharing(true);
        const element = document.getElementById('share-leaderboard-capture');
        if (!element) { setIsSharing(false); return; }
        try {
            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(element, { useCORS: true, backgroundColor: '#0f172a', scale: 1, width: 1080 });
            canvas.toBlob(async (blob) => {
                if (!blob) { setIsSharing(false); return; }
                const file = new File([blob], 'leaderboard.png', { type: 'image/png' });
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({ title: settings.competition_name, files: [file] });
                } else {
                    const link = document.createElement('a');
                    link.download = 'leaderboard.png';
                    link.href = canvas.toDataURL();
                    link.click();
                }
                setIsSharing(false);
            }, 'image/png');
        } catch (err) {
            console.error("Sharing failed", err);
            setIsSharing(false);
        }
    };

    return (
        <GradientBackground
            primaryColor={settings.primary_color}
            secondaryColor={settings.secondary_color}
            brightness={settings.background_brightness}
        >
            <div className="flex flex-col h-full w-full overflow-hidden relative z-10 p-2 md:p-3">
                <FrozenOverlay isFrozen={isFrozen} />
                <BackgroundMusic
                    url={settings.background_music_url}
                    mode={settings.background_music_mode}
                    volume={settings.background_music_volume}
                    isPlaying={isMusicPlaying}
                />

                <ShareableLeaderboard id="share-leaderboard-capture" settings={settings} topClasses={sortedClasses} top10Students={top10Students} />

                <BurstNotification
                    data={activeBurst}
                    onDismiss={() => setActiveBurst(null)}
                />

                <div className="flex-1 overflow-y-auto lg:overflow-hidden flex flex-col gap-4 max-w-[1920px] mx-auto w-full custom-scrollbar">
                    <div className="shrink-0 z-20">
                        <DashboardHeader
                            settings={settings}
                            commentary={commentary}
                            customMessages={tickerMessages}
                            totalInstitutionScore={totalInstitutionScore}
                            isMusicPlaying={isMusicPlaying}
                            setIsMusicPlaying={setIsMusicPlaying}
                        />
                    </div>

                    <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:flex-1 min-h-0 lg:overflow-hidden pb-4">
                        <div className="order-1 lg:order-2 flex flex-col min-h-[340px] lg:min-h-0 lg:overflow-hidden">
                            <Podium top3Classes={top3Classes} />
                        </div>

                        <div className="order-2 lg:order-1 flex flex-col min-h-[280px] lg:min-h-0 lg:overflow-hidden">
                            <MissionMeter
                                totalScore={totalInstitutionScore}
                                goals={settings.goals_config || []}
                                legacyTargetScore={settings.target_score}
                                legacyImageUrl={settings.logo_url}
                                competitionName={settings.competition_name}
                            />
                        </div>

                        <div className="order-3 flex flex-col min-h-[420px] lg:min-h-0 lg:overflow-hidden">
                            <StudentLeaderboard
                                topStudents={top10Students}
                                arenaStudents={arenaStudents}
                                spotlightStudent={spotlightStudent}
                            />
                        </div>

                        <div className="order-4 lg:col-span-3 shrink-0 min-h-[140px] lg:min-h-0 lg:overflow-hidden">
                            <ClassTicker
                                otherClasses={sortedClasses}
                                totalRankOffset={0}
                                highlightClassId={highlightClassId}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </GradientBackground>
    );
};

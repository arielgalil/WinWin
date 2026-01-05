import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { KIOSK_CONSTANTS } from "../constants";
import { DashboardHeader } from "./dashboard/DashboardHeader";
import { Podium } from "./dashboard/Podium";
import { ClassTicker } from "./dashboard/ClassTicker";
import { StudentLeaderboard } from "./dashboard/StudentLeaderboard";
import { MissionMeter } from "./dashboard/MissionMeter";
import { FrozenOverlay } from "./ui/FrozenOverlay";
import { BurstNotification } from "./ui/BurstNotification";
import { GradientBackground } from "./ui/GradientBackground";
import { BackgroundMusic } from "./dashboard/BackgroundMusic";
import { useCompetitionEvents } from "../hooks/useCompetitionEvents";
import {
    calculateClassStats,
    calculateStudentStats,
} from "../utils/rankingUtils";
import { ShareableLeaderboard } from "./dashboard/ShareableLeaderboard";
import { VersionFooter } from "./ui/VersionFooter";
import { DashboardErrorBoundary } from "./ui/ErrorBoundaries";
import { loadHtml2Canvas } from "../utils/dynamicLibraries";
import { useCampaign } from "../hooks/useCampaign";
import { useClasses } from "../hooks/useClasses";
import { useTicker } from "../hooks/useTicker";
import { useCompetitionMutations } from "../hooks/useCompetitionMutations";
import { useAuth } from "../hooks/useAuth";
import { useCampaignRole } from "../hooks/useCampaignRole";
import { useLanguage } from "../hooks/useLanguage";
import { isSuperUser as checkIsSuperUser } from "../config";
import { KioskRotator } from "./dashboard/KioskRotator";
import { KioskStartOverlay } from "./dashboard/KioskStartOverlay";
import { useStore } from "../services/store";
import { useIdleMode } from "../hooks/useIdleMode";
import { usePersistedBoolean } from "../hooks/usePersistedBoolean";
import { useKioskRotation } from "../hooks/useKioskRotation";
import { useToast } from "../hooks/useToast";
import { logger } from "../utils/logger";
import { AppSettings } from "../types";

// Default settings to avoid `as any` cast
const DEFAULT_SETTINGS: Partial<AppSettings> = {
    burst_notifications_enabled: false,
    enabled_burst_types: [],
    burst_student_threshold: 50,
    burst_class_threshold: 100,
    goals_config: [],
};

export const Dashboard: React.FC = () => {
    useIdleMode(5000); // 5s idle to hide cursor/interactions
    const { campaign, settings } = useCampaign();
    const { classes } = useClasses(campaign?.id);
    const { tickerMessages } = useTicker(campaign?.id);
    const { updateCommentary } = useCompetitionMutations(campaign?.id);
    const { user } = useAuth();
    const { campaignRole } = useCampaignRole(campaign?.id, user?.id);
    const { slug } = useParams();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const setPersistentSession = useStore((state) =>
        state.setPersistentSession
    );
    const { showToast } = useToast();

    // State - using new persisted boolean hook
    const [isKioskStarted, setIsKioskStarted] = usePersistedBoolean(
        "kiosk_started",
    );
    const [isMusicPlaying, setIsMusicPlaying] = useState(isKioskStarted);
    const [isSharing, setIsSharing] = useState(false);

    // Auto-start timer ref for cleanup
    const autoStartTimerRef = useRef<number | undefined>(undefined);

    // Use the extracted kiosk rotation hook
    const { kioskIndex, isHiddenByKiosk } = useKioskRotation({
        settings,
        isKioskStarted,
    });

    // Mark session as persistent after initial animations
    useEffect(() => {
        const timer = window.setTimeout(() => {
            setPersistentSession(true);
        }, 5000);
        return () => clearTimeout(timer);
    }, [setPersistentSession]);

    // Memoized handler for starting kiosk
    const handleStartKiosk = useCallback(() => {
        setIsKioskStarted(true);
        setIsMusicPlaying(true);
    }, [setIsKioskStarted]);

    // Auto-start kiosk if rotation is enabled and user doesn't click
    useEffect(() => {
        if (settings?.rotation_enabled && !isKioskStarted) {
            autoStartTimerRef.current = window.setTimeout(() => {
                handleStartKiosk();
            }, KIOSK_CONSTANTS.AUTO_START_DELAY_MS);

            return () => {
                if (autoStartTimerRef.current) {
                    clearTimeout(autoStartTimerRef.current);
                    autoStartTimerRef.current = undefined;
                }
            };
        }
    }, [settings?.rotation_enabled, isKioskStarted, handleStartKiosk]);

    // Memoized capture handler
    const handleCapture = useCallback(async () => {
        setIsSharing(true);
        // Give React time to render the off-screen component
        setTimeout(async () => {
            try {
                const html2canvas = await loadHtml2Canvas();
                const element = document.getElementById(
                    "share-leaderboard-capture",
                );
                if (element) {
                    const canvas = await html2canvas(element, {
                        useCORS: true,
                        scale: 2,
                        backgroundColor: "#0f172a",
                    });
                    const dataUrl = canvas.toDataURL("image/png");
                    const link = document.createElement("a");
                    link.download = `winwin-leaderboard-${
                        new Date().toISOString().split("T")[0]
                    }.png`;
                    link.href = dataUrl;
                    link.click();
                }
            } catch (err) {
                logger.error("Capture failed:", err);
                showToast(
                    t("capture_failed" as any) || "Capture failed",
                    "error",
                );
            } finally {
                setIsSharing(false);
            }
        }, 500);
    }, [showToast, t]);

    // Memoized music toggle
    const handleMusicToggle = useCallback(() => {
        setIsMusicPlaying((prev) => !prev);
    }, []);

    // Memoized admin click
    const handleAdminClick = useCallback(() => {
        navigate(`/login/${slug}`);
    }, [navigate, slug]);

    const { sortedClasses, top3Classes, totalInstitutionScore } = useMemo(
        () => calculateClassStats(classes || []),
        [classes],
    );

    const { studentsWithStats, top10Students, arenaStudents } = useMemo(
        () => calculateStudentStats(classes || []),
        [classes],
    );

    const isSuperUser = checkIsSuperUser(user?.role);
    const isCampaignActive = campaign?.is_active ?? false;

    // "Frozen" logically means: Data stops updating OR we are hidden by Kiosk
    const isFrozen = (!isCampaignActive || !!settings?.is_frozen) &&
        !isSuperUser;
    const effectiveIsFrozen = isFrozen || isHiddenByKiosk;

    // Use merged settings with defaults to avoid `as any`
    const mergedSettings = useMemo(() => ({
        ...DEFAULT_SETTINGS,
        ...settings,
    }), [settings]);

    const { activeBurst, setActiveBurst, highlightClassId } =
        useCompetitionEvents(
            sortedClasses,
            studentsWithStats,
            totalInstitutionScore,
            mergedSettings.goals_config || [],
            mergedSettings as AppSettings,
            effectiveIsFrozen,
            updateCommentary,
        );

    // Memoized burst dismiss handler
    const handleDismissBurst = useCallback(() => {
        setActiveBurst(null);
    }, [setActiveBurst]);

    if (!settings || !campaign) return null;

    const commentary = settings.current_commentary || "";

    return (
        <DashboardErrorBoundary>
            <KioskStartOverlay
                isVisible={!!settings?.rotation_enabled && !isKioskStarted}
                onStart={handleStartKiosk}
                autoStartSeconds={Math.floor(
                    KIOSK_CONSTANTS.AUTO_START_DELAY_MS / 1000,
                )}
            />

            <div className="flex flex-col h-screen w-full overflow-hidden bg-black relative">
                <BackgroundMusic
                    url={settings.background_music_url}
                    mode={settings.background_music_mode}
                    volume={settings.background_music_volume}
                    isPlaying={isMusicPlaying && !isHiddenByKiosk}
                />

                <div className="flex-1 relative min-h-0">
                    <KioskRotator
                        settings={settings}
                        currentIndex={kioskIndex}
                    >
                        <GradientBackground
                            primaryColor={settings.primary_color}
                            secondaryColor={settings.secondary_color}
                            brightness={settings.background_brightness}
                        >
                            <div className="flex flex-col h-full w-full overflow-hidden relative z-10 px-2 pt-2 md:px-3 md:pt-3 pb-0">
                                <FrozenOverlay isFrozen={isFrozen} />

                                {/* Optimization: ShareableLeaderboard is heavy (off-screen render). Only render if requested. */}
                                {isSharing && (
                                    <ShareableLeaderboard
                                        id="share-leaderboard-capture"
                                        settings={settings}
                                        topClasses={sortedClasses}
                                        top10Students={top10Students}
                                    />
                                )}

                                {!effectiveIsFrozen && (
                                    <BurstNotification
                                        data={activeBurst}
                                        onDismiss={handleDismissBurst}
                                        volume={settings.burst_volume}
                                        soundsEnabled={settings
                                            .burst_sounds_enabled}
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
                                            onCapture={handleCapture}
                                        />
                                    </div>

                                    <div className="flex flex-col lg:grid lg:grid-cols-3 gap-3 lg:min-h-0 lg:overflow-hidden pb-0 flex-1 lg:flex-grow">
                                        <div className="order-1 lg:order-2 flex flex-col min-h-[280px] lg:min-h-0 lg:overflow-hidden">
                                            <Podium top3Classes={top3Classes} />
                                        </div>

                                        <div className="order-2 lg:order-1 flex flex-col min-h-[320px] lg:overflow-hidden">
                                            <MissionMeter
                                                totalScore={totalInstitutionScore}
                                                goals={settings.goals_config ||
                                                    []}
                                                legacyTargetScore={settings
                                                    .target_score}
                                                legacyImageUrl={settings
                                                    .logo_url}
                                                competitionName={settings
                                                    .competition_name}
                                                classes={classes || []}
                                                settings={settings}
                                                campaignId={campaign?.id}
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
                            </div>
                        </GradientBackground>
                    </KioskRotator>
                </div>

                <div className="shrink-0 z-[60] bg-[var(--bg-card)]/40 backdrop-blur-xl border-t border-[var(--border-subtle)]/30 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] overflow-hidden">
                    <VersionFooter
                        musicState={{
                            isPlaying: isMusicPlaying,
                            onToggle: handleMusicToggle,
                        }}
                        onAdminClick={handleAdminClick}
                    />
                </div>
            </div>
        </DashboardErrorBoundary>
    );
};

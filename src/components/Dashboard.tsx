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
import { AppSettings, ClassRoom, CompetitionGoal, LuckyWheelWinner, WheelFilterCriteria } from "../types";
import { useQuery } from "@tanstack/react-query";
import { useLuckyWheelListener } from "../hooks/useLuckyWheelControl";
import { LuckyWheelOverlay } from "./dashboard/LuckyWheelOverlay";
import { supabase } from "../supabaseClient";
import { usePagePresence } from "../hooks/usePagePresence";
import { useRealtimeSubscriptions } from "../hooks/useRealtimeSubscriptions";

// Default settings to avoid `as any` cast
const DEFAULT_SETTINGS: Partial<AppSettings> = {
    burst_notifications_enabled: false,
    enabled_burst_types: [],
    burst_student_threshold: 50,
    burst_class_threshold: 100,
    goals_config: [],
};

const EMPTY_CLASSES: ClassRoom[] = [];
const EMPTY_GOALS: CompetitionGoal[] = [];

export const Dashboard: React.FC = () => {
    useIdleMode(5000); // 5s idle to hide cursor/interactions
    const { campaign, settings } = useCampaign();
    const { classes } = useClasses(campaign?.id);
    const { tickerMessages } = useTicker(campaign?.id);
    const { updateCommentary } = useCompetitionMutations(campaign?.id);
    const { user } = useAuth();
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

    // Lucky Wheel remote control
    const { wheelState } = useLuckyWheelListener(campaign?.id);
    const [wheelParticipants, setWheelParticipants] = useState<string[]>([]);
    const [wheelWinnerIndex, setWheelWinnerIndex] = useState<number | null>(
        null,
    );
    const [wheelWinnerName, setWheelWinnerName] = useState<
        string | undefined
    >();
    const [wheelWinnerClass, setWheelWinnerClass] = useState<string | undefined>();
    const [wheelName, setWheelName] = useState<string | undefined>();
    const [wheelRound, setWheelRound] = useState(1);
    const [wheelPlaceNumber, setWheelPlaceNumber] = useState<number | null | undefined>(undefined);
    const [wheelTotalRounds, setWheelTotalRounds] = useState<number | undefined>(undefined);
    const [wheelStartAtMs, setWheelStartAtMs] = useState<number | undefined>();
    const [wheelDurationMs, setWheelDurationMs] = useState<number | undefined>();
    const [wheelFilterCriteria, setWheelFilterCriteria] = useState<WheelFilterCriteria | undefined>();
    const [wheelClassNames, setWheelClassNames] = useState<string[] | undefined>();
    const [wheelPrizeEmoji, setWheelPrizeEmoji] = useState<string | undefined>();

    // Single source of truth for "is the wheel open?"
    const wheelActive = !!settings?.active_lucky_wheel_id;

    // Critical: Winner Lock prevents ACTIVATE from clearing the screen while winner is still being celebrated
    const isWinnerAnnouncedRef = useRef(false);

    // Auto-start timer ref for cleanup
    const autoStartTimerRef = useRef<number | undefined>(undefined);

    // Use the extracted kiosk rotation hook
    const { kioskIndex, isHiddenByKiosk } = useKioskRotation({
        settings,
        isKioskStarted,
        paused: wheelActive,
    });

    // Track presence on the dashboard
    const { viewerCount } = usePagePresence(campaign?.id, "dashboard");
    
    // Subscribe to realtime updates for settings, logs, etc.
    useRealtimeSubscriptions(campaign?.id);

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
                    link.download = `win2grow-leaderboard-${
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

    const { studentsWithStats, arenaStudents } = useMemo(
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

    const topNStudents = useMemo(
        () => studentsWithStats.slice(0, mergedSettings.leaderboard_top_count ?? 10),
        [studentsWithStats, mergedSettings.leaderboard_top_count],
    );

    const { data: luckyWheelWinners = [] } = useQuery<LuckyWheelWinner[]>({
        queryKey: ["wheel-winners-dashboard", campaign?.id],
        queryFn: async () => {
            if (!campaign?.id) return [];
            const { data, error } = await supabase
                .from("lucky_wheel_winners")
                .select("*")
                .eq("campaign_id", campaign.id)
                .order("won_at", { ascending: false })
                .limit(200);
            if (error) throw error;
            return data ?? [];
        },
        enabled: !!campaign?.id,
        staleTime: 30000,
        refetchInterval: 60000,
    });

    const { activeBurst, setActiveBurst, highlightClassId } =
        useCompetitionEvents(
            sortedClasses,
            studentsWithStats,
            totalInstitutionScore,
            mergedSettings.goals_config || [],
            mergedSettings as AppSettings,
            effectiveIsFrozen,
            updateCommentary,
            campaign,
        );

    // Memoized burst dismiss handler
    const handleDismissBurst = useCallback(() => {
        setActiveBurst(null);
    }, [setActiveBurst]);

    // Handle spin complete from the wheel
    const handleWheelSpinComplete = useCallback(
        (index: number, name: string) => {
            logger.info(
                `[WheelSync] Spin complete: ${name} (index ${index})`,
            );
            isWinnerAnnouncedRef.current = true;

            // Show celebratory toast
            showToast(
                settings?.language === "he"
                    ? `מזל טוב ל${name}! 🎉`
                    : `Congratulations to ${name}! 🎉`,
                "success",
            );
            // Winner screen stays open until the next spin or admin deactivates the wheel
        },
        [showToast, settings?.language],
    );

    // Handle wheel broadcast commands
    useEffect(() => {
        if (!wheelState) return;

        logger.debug(`[WheelSync] Command: ${wheelState.action}`, wheelState);

        switch (wheelState.action) {
            case "ACTIVATE":
                // If we are currently celebrating a winner, don't clear the screen yet
                if (isWinnerAnnouncedRef.current) {
                    logger.warn(
                        "[WheelSync] Ignoring ACTIVATE during winner celebration",
                    );
                    return;
                }
                setWheelParticipants(wheelState.participant_names || []);
                setWheelWinnerIndex(null);
                setWheelWinnerName(undefined);
                setWheelWinnerClass(undefined);
                setWheelName(wheelState.wheel_name);
                setWheelRound(wheelState.round_number || 1);
                setWheelStartAtMs(undefined);
                setWheelDurationMs(undefined);
                if (wheelState.filter_criteria) setWheelFilterCriteria(wheelState.filter_criteria);
                if (wheelState.class_names !== undefined) setWheelClassNames(wheelState.class_names);
                if (wheelState.total_rounds != null) setWheelTotalRounds(wheelState.total_rounds);
                break;
            case "SPIN":
                isWinnerAnnouncedRef.current = false;
                if (wheelState.participant_names?.length) {
                    setWheelParticipants(wheelState.participant_names);
                }
                setWheelWinnerIndex(wheelState.winner_index ?? null);
                setWheelWinnerName(wheelState.winner_name);
                setWheelWinnerClass(wheelState.winner_class);
                setWheelRound(wheelState.round_number || wheelRound);
                setWheelPlaceNumber(wheelState.place_number);
                if (wheelState.total_rounds != null) setWheelTotalRounds(wheelState.total_rounds);
                setWheelStartAtMs(wheelState.start_at_ms);
                setWheelDurationMs(wheelState.duration_ms);
                if (wheelState.prize_emoji) setWheelPrizeEmoji(wheelState.prize_emoji);
                break;
            case "RESET":
                setWheelWinnerIndex(null);
                setWheelWinnerName(undefined);
                setWheelWinnerClass(undefined);
                isWinnerAnnouncedRef.current = false;
                break;
            case "DEACTIVATE":
                // Handled primarily by settings update (Single Source of Truth)
                setWheelWinnerIndex(null);
                setWheelWinnerName(undefined);
                setWheelWinnerClass(undefined);
                isWinnerAnnouncedRef.current = false;
                break;
        }
    }, [wheelState, wheelRound]);

    // Initialize/Restore wheel participants from DB if not received via broadcast
    // Also restores an active spin for users who join mid-spin.
    useEffect(() => {
        const activeWheelId = settings?.active_lucky_wheel_id;
        const activeSpin = settings?.active_spin;

        if (activeWheelId && wheelParticipants.length === 0) {
            const restoreWheel = async () => {
                try {
                    const { data } = await supabase
                        .from("lucky_wheel_templates")
                        .select("*")
                        .eq("id", activeWheelId)
                        .maybeSingle();
                    if (data) {
                        setWheelParticipants(data.participant_names || []);
                        setWheelName(data.name);
                    }
                } catch (err) {
                    logger.error("[WheelSync] Restoration error:", err);
                }
            };
            restoreWheel();
        }

        // Late-joiner: resume a spin that is still in progress
        if (
            activeSpin &&
            Date.now() < activeSpin.start_at_ms + activeSpin.duration_ms
        ) {
            logger.info("[WheelSync] Restoring active spin for late joiner", activeSpin);
            if (activeSpin.participant_names?.length) {
                setWheelParticipants(activeSpin.participant_names);
            }
            setWheelWinnerIndex(activeSpin.winner_index ?? null);
            setWheelWinnerName(activeSpin.winner_name);
            setWheelRound(activeSpin.round_number || 1);
            setWheelStartAtMs(activeSpin.start_at_ms);
            setWheelDurationMs(activeSpin.duration_ms);
        }
    }, [settings?.active_lucky_wheel_id, settings?.active_spin, wheelParticipants.length]);

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

            {/* Lucky Wheel Overlay */}
            <LuckyWheelOverlay
                isActive={wheelActive}
                participants={wheelParticipants}
                winnerIndex={wheelWinnerIndex}
                winnerName={wheelWinnerName}
                winnerClass={wheelWinnerClass}
                primaryColor={settings.primary_color}
                secondaryColor={settings.secondary_color}
                logoUrl={settings.logo_url ?? campaign.logo_url ?? undefined}
                wheelName={wheelName}
                roundNumber={wheelRound}
                placeNumber={wheelPlaceNumber}
                totalRounds={wheelTotalRounds}
                startAtMs={wheelStartAtMs}
                durationMs={wheelDurationMs}
                filterCriteria={wheelFilterCriteria}
                classNames={wheelClassNames}
                prizeEmoji={wheelPrizeEmoji}
                onSpinComplete={handleWheelSpinComplete}
            />

            <div className="dashboard-view flex flex-col h-screen w-full overflow-hidden bg-black relative">
                <BackgroundMusic
                    url={settings.background_music_url}
                    mode={settings.background_music_mode}
                    volume={settings.background_music_volume}
                    isPlaying={isMusicPlaying && !isHiddenByKiosk &&
                        !wheelActive}
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
                            <div className="flex flex-col h-full w-full overflow-hidden relative z-10 px-3 pt-3 md:px-4 md:pt-4 pb-3 md:pb-4">
                                <FrozenOverlay isFrozen={isFrozen} />

                                {/* Optimization: ShareableLeaderboard is heavy (off-screen render). Only render if requested. */}
                                {isSharing && (
                                    <ShareableLeaderboard
                                        id="share-leaderboard-capture"
                                        settings={settings}
                                        topClasses={sortedClasses}
                                        top10Students={topNStudents}
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

                                <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden flex flex-col gap-3 max-w-[1920px] mx-auto w-full custom-scrollbar">
                                    <div className="shrink-0 z-20">
                                        <DashboardHeader
                                            settings={settings}
                                            commentary={commentary}
                                            customMessages={tickerMessages}
                                            totalInstitutionScore={totalInstitutionScore}
                                            sortedClasses={sortedClasses}
                                            topStudents={topNStudents}
                                            lastWheelWinner={luckyWheelWinners[0]?.student_name}
                                            onCapture={handleCapture}
                                            aiEnabled={campaign?.ai_enabled !== false}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-3 flex-1 min-h-0">
                                        {/* Top row: 3 panels share all available space */}
                                        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-3 flex-1 lg:min-h-0 lg:overflow-hidden">
                                            <div className="order-1 lg:order-2 flex flex-col min-h-[230px] lg:min-h-0 lg:overflow-hidden">
                                                <Podium top3Classes={top3Classes} />
                                            </div>

                                            <div className="order-2 lg:order-1 flex flex-col min-h-[260px] lg:overflow-hidden">
                                                <MissionMeter
                                                    totalScore={totalInstitutionScore}
                                                    goals={mergedSettings.goals_config || EMPTY_GOALS}
                                                    legacyTargetScore={settings.target_score}
                                                    legacyImageUrl={settings.logo_url}
                                                    competitionName={settings.competition_name}
                                                    classes={classes || EMPTY_CLASSES}
                                                    settings={settings}
                                                    campaignId={campaign?.id}
                                                    aiEnabled={campaign?.ai_enabled !== false}
                                                />
                                            </div>

                                            <div className="order-3 flex flex-col min-h-[300px] lg:min-h-0 lg:overflow-hidden">
                                                <StudentLeaderboard
                                                    topStudents={topNStudents}
                                                    arenaStudents={arenaStudents}
                                                    settings={settings}
                                                    luckyWheelWinners={luckyWheelWinners}
                                                    momentumCount={mergedSettings.leaderboard_momentum_count ?? 10}
                                                />
                                            </div>
                                        </div>

                                        {/* Bottom row: ClassTicker — fixed height, never grows/shrinks */}
                                        <div className="shrink-0 h-[clamp(144px,16vh,240px)]">
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

            <div className="shrink-0 z-[60] border-t border-[var(--border-subtle)]/20 overflow-hidden">
                    <VersionFooter
                        musicState={{
                            isPlaying: isMusicPlaying,
                            onToggle: handleMusicToggle,
                        }}
                        onAdminClick={handleAdminClick}
                        viewerCount={viewerCount}
                    />
                </div>
            </div>
        </DashboardErrorBoundary>
    );
};

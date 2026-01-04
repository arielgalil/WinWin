import { useCallback, useEffect, useRef, useState } from "react";
import {
    AppSettings,
    BurstNotificationData,
    ClassRoom,
    CompetitionGoal,
} from "../types";
import { generateCompetitionCommentary } from "../services/geminiService";
import { useLanguage } from "./useLanguage";
import { AI_CONSTANTS, EVENT_CONSTANTS } from "../constants";

export const useCompetitionEvents = (
    sortedClasses: ClassRoom[],
    studentsWithStats: any[],
    totalInstitutionScore: number,
    goals: CompetitionGoal[],
    settings: AppSettings,
    isFrozen: boolean,
    onUpdateCommentary?: (text: string) => void,
) => {
    const { t, language } = useLanguage();
    const [burstQueue, setBurstQueue] = useState<BurstNotificationData[]>([]);
    const [activeBurst, setActiveBurst] = useState<
        BurstNotificationData | null
    >(null);
    const [highlightClassId, setHighlightClassId] = useState<string | null>(
        null,
    );

    const prevTotalScoreRef = useRef(totalInstitutionScore);
    const prevTopClassIdRef = useRef<string | null>(null);
    const prevScoresRef = useRef<Map<string, number>>(new Map());
    const isFirstRender = useRef(true);
    const isGeneratingAi = useRef(false);
    const lastJumpTime = useRef(0);

    // Debounced AI Commentary Trigger logic
    const triggerAiCommentary = useCallback(
        async (eventDesc: string, note?: string, contributors?: string[]) => {
            if (!onUpdateCommentary || isGeneratingAi.current) return;
            isGeneratingAi.current = true;
            try {
                const commentary = await generateCompetitionCommentary(
                    sortedClasses,
                    eventDesc,
                    settings,
                    totalInstitutionScore,
                    note,
                    language,
                    contributors,
                );
                if (commentary) onUpdateCommentary(commentary);
            } catch (e) {
                console.error("AI automated commentary failed", e);
            } finally {
                setTimeout(() => {
                    isGeneratingAi.current = false;
                }, AI_CONSTANTS.COMMENTARY_THROTTLE_MS);
            }
        },
        [
            onUpdateCommentary,
            sortedClasses,
            settings,
            totalInstitutionScore,
            language,
        ],
    );

    useEffect(() => {
        if (!activeBurst && burstQueue.length > 0) {
            const next = burstQueue[0];
            setActiveBurst(next);
            setBurstQueue((prev) => prev.slice(1));
        }
    }, [activeBurst, burstQueue]);

    // ------------------------------------------------------------------------
    // Effect 0: Initialization & "First Render" / "Frozen" Ref Updates
    // ------------------------------------------------------------------------
    useEffect(() => {
        if (isFirstRender.current) {
            prevTotalScoreRef.current = totalInstitutionScore;
            prevTopClassIdRef.current = sortedClasses.length > 0
                ? sortedClasses[0].id
                : null;
            studentsWithStats.forEach((s) =>
                prevScoresRef.current.set(s.id, s.score || 0)
            );
            sortedClasses.forEach((c) =>
                prevScoresRef.current.set(c.id, c.score || 0)
            );
            isFirstRender.current = false;
            return;
        }

        if (isFrozen) {
            prevTotalScoreRef.current = totalInstitutionScore;
            prevTopClassIdRef.current = sortedClasses.length > 0
                ? sortedClasses[0].id
                : null;
            studentsWithStats.forEach((s) =>
                prevScoresRef.current.set(s.id, s.score || 0)
            );
            sortedClasses.forEach((c) =>
                prevScoresRef.current.set(c.id, c.score || 0)
            );
            return;
        }
    }, [totalInstitutionScore, sortedClasses, studentsWithStats, isFrozen]);

    // ------------------------------------------------------------------------
    // Effect 1: Goal Detection (Depends ONLY on totalInstitutionScore + Goals)
    // ------------------------------------------------------------------------
    useEffect(() => {
        if (isFrozen || isFirstRender.current) return;

        // Skip if total score hasn't increased or check if we crossed a goal
        if (totalInstitutionScore <= prevTotalScoreRef.current) {
            return;
        }

        const currentGoal = goals.find((g) =>
            prevTotalScoreRef.current < g.target_score &&
            totalInstitutionScore >= g.target_score
        );

        if (currentGoal) {
            const burstId = `goal-${currentGoal.id}-${Date.now()}`;
            setBurstQueue((prev) => [...prev, {
                id: burstId,
                type: "GOAL_REACHED",
                title: t("shared_goal_reached"),
                subTitle: currentGoal.name,
                value: `${
                    t("total_label")
                } ${totalInstitutionScore.toLocaleString()}`,
            }]);

            // Get contributors for AI context if needed
            const deltas = sortedClasses.map((c) => {
                const prev = prevScoresRef.current.get(c.id) || 0;
                return { name: c.name, delta: c.score - prev };
            }).filter((d) => d.delta > 0).sort((a, b) => b.delta - a.delta);
            const contributors = deltas.slice(0, 3).map((d) => d.name);

            triggerAiCommentary(
                t("ai_event_goal_reached", { goalName: currentGoal.name }),
                undefined,
                contributors,
            );
        }

        prevTotalScoreRef.current = totalInstitutionScore;
    }, [
        totalInstitutionScore,
        goals,
        isFrozen,
        t,
        triggerAiCommentary,
        sortedClasses,
    ]);

    // ------------------------------------------------------------------------
    // Effect 2: Leader Change Detection (Depends on Top Class ID)
    // ------------------------------------------------------------------------
    useEffect(() => {
        if (isFrozen || isFirstRender.current || sortedClasses.length === 0) {
            return;
        }

        const currentTopClass = sortedClasses[0];

        // If we have a top class, and it's different from the last one (and we had a previous one)
        if (
            currentTopClass && currentTopClass.score > 0 &&
            prevTopClassIdRef.current &&
            prevTopClassIdRef.current !== currentTopClass.id
        ) {
            setBurstQueue((prev) => [...prev, {
                id: `leader-${currentTopClass.id}-${Date.now()}`,
                type: "LEADER_CHANGE",
                title: t("leaderboard_overtake"),
                subTitle: currentTopClass.name,
                value: t("rising_to_first"),
            }]);
            triggerAiCommentary(
                t("ai_event_leader_change", {
                    className: currentTopClass.name,
                }),
                undefined,
                [currentTopClass.name],
            );
        }

        prevTopClassIdRef.current = currentTopClass?.id || null;
    }, [sortedClasses, isFrozen, t, triggerAiCommentary]);

    // ------------------------------------------------------------------------
    // Effect 3: Score Jumps & Bursts (Iterates all students/classes)
    // ------------------------------------------------------------------------
    useEffect(() => {
        if (isFrozen || isFirstRender.current) return;

        const currentTime = Date.now();
        let foundSignificantJump = false;
        let hasAnyScoreIncrease = false;

        // Check Students
        studentsWithStats.forEach((s) => {
            const prev = prevScoresRef.current.get(s.id);
            if (prev !== undefined && s.score > prev) {
                const diff = s.score - prev;
                if (
                    diff >= EVENT_CONSTANTS.STUDENT_JUMP_THRESHOLD &&
                    !foundSignificantJump &&
                    currentTime - lastJumpTime.current >
                        EVENT_CONSTANTS.STUDENT_JUMP_THROTTLE_MS
                ) {
                    foundSignificantJump = true;
                    lastJumpTime.current = currentTime;
                    setBurstQueue((queue) => [...queue, {
                        id: `star-${s.id}-${Date.now()}`,
                        type: "STAR_STUDENT",
                        title: t("rising_star"),
                        subTitle: s.name,
                        value: diff,
                    }]);
                    triggerAiCommentary(
                        t("ai_event_student_jump", { studentName: s.name }),
                        `${diff} ${t("points_plural")}`,
                        [s.name],
                    );
                }
            }
            prevScoresRef.current.set(s.id, s.score || 0);
        });

        // Check Classes
        sortedClasses.forEach((c) => {
            const prev = prevScoresRef.current.get(c.id);
            if (prev !== undefined && c.score > prev) {
                hasAnyScoreIncrease = true;
                const diff = c.score - prev;

                // Class Boost
                if (
                    diff >= EVENT_CONSTANTS.CLASS_BOOST_THRESHOLD &&
                    currentTime - lastJumpTime.current >
                        EVENT_CONSTANTS.CLASS_BOOST_THROTTLE_MS
                ) {
                    setBurstQueue((queue) => [...queue, {
                        id: `boost-${c.id}-${Date.now()}`,
                        type: "CLASS_BOOST",
                        title: t("rising_group"),
                        subTitle: c.name,
                        value: diff,
                    }]);
                    triggerAiCommentary(
                        t("ai_event_class_jump", { className: c.name }),
                        `${diff} ${t("points_plural")}`,
                        [c.name],
                    );
                }

                // Highlight Logic
                if (diff > 0) {
                    setHighlightClassId(c.id);
                    setTimeout(
                        () => setHighlightClassId(null),
                        EVENT_CONSTANTS.CLASS_HIGHLIGHT_DURATION_MS,
                    );
                }
            }
            prevScoresRef.current.set(c.id, c.score || 0);
        });

        // General Score Increase Commentary (Fail-safe for small consistent updates)
        if (hasAnyScoreIncrease && !foundSignificantJump) {
            // Logic for general updates if needed
        }
    }, [studentsWithStats, sortedClasses, isFrozen, t, triggerAiCommentary]);

    return {
        activeBurst,
        setActiveBurst,
        highlightClassId,
    };
};

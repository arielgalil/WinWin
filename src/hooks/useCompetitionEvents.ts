import { useState, useRef, useEffect, useCallback } from 'react';
import { BurstNotificationData, ClassRoom, CompetitionGoal, AppSettings } from '../types';
import { generateCompetitionCommentary } from '../services/geminiService';
import { useLanguage } from './useLanguage';
import { AI_CONSTANTS, EVENT_CONSTANTS } from '../constants';

export const useCompetitionEvents = (
    sortedClasses: ClassRoom[],
    studentsWithStats: any[],
    totalInstitutionScore: number,
    goals: CompetitionGoal[],
    settings: AppSettings,
    isFrozen: boolean,
    onUpdateCommentary?: (text: string) => void
) => {
    const { t, language } = useLanguage();
    const [burstQueue, setBurstQueue] = useState<BurstNotificationData[]>([]);
    const [activeBurst, setActiveBurst] = useState<BurstNotificationData | null>(null);
    const [spotlightQueue, setSpotlightQueue] = useState<string[]>([]);
    const [highlightClassId, setHighlightClassId] = useState<string | null>(null);
    const [topContributors, setTopContributors] = useState<string[]>([]);

    const prevTotalScoreRef = useRef(totalInstitutionScore);
    const prevTopClassIdRef = useRef<string | null>(null);
    const prevScoresRef = useRef<Map<string, number>>(new Map());
    const isFirstRender = useRef(true);
    const isGeneratingAi = useRef(false);
    const lastJumpTime = useRef(0);
    

    // Debounced AI Commentary Trigger logic
    const triggerAiCommentary = useCallback(async (eventDesc: string, note?: string, contributors?: string[]) => {
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
                contributors
            );
            if (commentary) onUpdateCommentary(commentary);
        } catch (e) {
            console.error("AI automated commentary failed", e);
        } finally {
            setTimeout(() => { isGeneratingAi.current = false; }, AI_CONSTANTS.COMMENTARY_THROTTLE_MS);
        }
    }, [onUpdateCommentary, sortedClasses, settings, totalInstitutionScore, language]);

    useEffect(() => {
        if (!activeBurst && burstQueue.length > 0) {
            const next = burstQueue[0];
            setActiveBurst(next);
            setBurstQueue(prev => prev.slice(1));
        }
    }, [activeBurst, burstQueue]);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (spotlightQueue.length > 0) {
            timer = setTimeout(() => {
                setSpotlightQueue(prev => prev.slice(1)); 
            }, 3000);
        }
        return () => clearTimeout(timer);
    }, [spotlightQueue]); 

    useEffect(() => {
        if (isFirstRender.current) {
            prevTotalScoreRef.current = totalInstitutionScore;
            prevTopClassIdRef.current = sortedClasses.length > 0 ? sortedClasses[0].id : null;
            studentsWithStats.forEach(s => prevScoresRef.current.set(s.id, s.score || 0));
            sortedClasses.forEach(c => prevScoresRef.current.set(c.id, c.score || 0));
            isFirstRender.current = false;
            return;
        }

        if (isFrozen) {
            // Update refs even when frozen to avoid "bursting" when unfreezing
            prevTotalScoreRef.current = totalInstitutionScore;
            prevTopClassIdRef.current = sortedClasses.length > 0 ? sortedClasses[0].id : null;
            studentsWithStats.forEach(s => prevScoresRef.current.set(s.id, s.score || 0));
            sortedClasses.forEach(c => prevScoresRef.current.set(c.id, c.score || 0));
            return;
        }

        const deltas = sortedClasses.map(c => {
            const prev = prevScoresRef.current.get(c.id) || 0;
            return { name: c.name, delta: c.score - prev };
        }).filter(d => d.delta > 0).sort((a,b) => b.delta - a.delta);
        
        const currentTopContributors = deltas.slice(0, 3).map(d => d.name);
        if (currentTopContributors.length > 0) {
            setTopContributors(currentTopContributors);
        }
        const hasScoreIncrease = totalInstitutionScore > prevTotalScoreRef.current;

        // 1. Goal Detection
        const currentGoal = goals.find(g => prevTotalScoreRef.current < g.target_score && totalInstitutionScore >= g.target_score);
        if (currentGoal) {
            const burstId = `goal-${currentGoal.id}-${Date.now()}`;
            setBurstQueue(prev => [...prev, {
                id: burstId,
                type: 'GOAL_REACHED',
                title: t('shared_goal_reached'),
                subTitle: currentGoal.name,
                value: `${t('total_label')} ${totalInstitutionScore.toLocaleString()}`
            }]);
            triggerAiCommentary(t('ai_event_goal_reached', { goalName: currentGoal.name }), undefined, currentTopContributors);
        }
        prevTotalScoreRef.current = totalInstitutionScore;

        // 2. Podium Leader Change
        const currentTopClass = sortedClasses[0];
        if (currentTopClass && currentTopClass.score > 0 && prevTopClassIdRef.current !== currentTopClass.id) {
            if (prevTopClassIdRef.current) {
                setBurstQueue(prev => [...prev, {
                    id: `leader-${currentTopClass.id}-${Date.now()}`,
                    type: 'LEADER_CHANGE',
                    title: t('leaderboard_overtake'),
                    subTitle: currentTopClass.name,
                    value: t('rising_to_first')
                }]);
                triggerAiCommentary(t('ai_event_leader_change', { className: currentTopClass.name }), undefined, currentTopContributors);
            }
            prevTopClassIdRef.current = currentTopClass.id;
        }

        // 3. Jumps (reduced frequency, higher threshold)
        let foundSignificantJump = false;
        const currentTime = Date.now();
        
        studentsWithStats.forEach(s => {
            const prev = prevScoresRef.current.get(s.id);
            if (prev !== undefined && s.score > prev) {
                const diff = s.score - prev;
                // Increased threshold and added time-based throttling
                if (diff >= EVENT_CONSTANTS.STUDENT_JUMP_THRESHOLD && !foundSignificantJump && currentTime - lastJumpTime.current > EVENT_CONSTANTS.STUDENT_JUMP_THROTTLE_MS) {
                    foundSignificantJump = true;
                    lastJumpTime.current = currentTime;
                    setBurstQueue(queue => [...queue, {
                        id: `star-${s.id}-${Date.now()}`,
                        type: 'STAR_STUDENT',
                        title: t('rising_star'),
                        subTitle: s.name,
                        value: diff
                    }]);
                    triggerAiCommentary(t('ai_event_student_jump', { studentName: s.name }), `${diff} ${t('points_plural')}`, currentTopContributors);
                }
            }
            prevScoresRef.current.set(s.id, s.score || 0);
        });

        sortedClasses.forEach(c => {
            const prev = prevScoresRef.current.get(c.id);
            if (prev !== undefined && c.score > prev) {
                const diff = c.score - prev;
                
                // 4. Significant Group Jump (Class Boost) - increased threshold and added throttling
                if (diff >= EVENT_CONSTANTS.CLASS_BOOST_THRESHOLD && currentTime - lastJumpTime.current > EVENT_CONSTANTS.CLASS_BOOST_THROTTLE_MS) {
                    setBurstQueue(queue => [...queue, {
                        id: `boost-${c.id}-${Date.now()}`,
                        type: 'CLASS_BOOST',
                        title: t('rising_group'),
                        subTitle: c.name,
                        value: diff
                    }]);
                    triggerAiCommentary(t('ai_event_class_jump', { className: c.name }), `${diff} ${t('points_plural')}`, currentTopContributors);
                }

                // Highlight class with reduced duration
                setHighlightClassId(c.id);
                setTimeout(() => setHighlightClassId(null), EVENT_CONSTANTS.CLASS_HIGHLIGHT_DURATION_MS);
            }
            prevScoresRef.current.set(c.id, c.score || 0);
        });

        // Trigger AI Commentary for general score increase if no other event fired
        if (hasScoreIncrease && currentTopContributors.length > 0 && !currentGoal && !foundSignificantJump && deltas[0].delta < 50 && prevTopClassIdRef.current === sortedClasses[0]?.id) {
            triggerAiCommentary("General Score Increase", undefined, currentTopContributors);
        }

    }, [sortedClasses, totalInstitutionScore, goals, studentsWithStats, isFrozen, t, triggerAiCommentary]); 

    const spotlightStudent = spotlightQueue.length > 0 
        ? studentsWithStats.find(s => s.id === spotlightQueue[0]) || null 
        : null;

    return { activeBurst, setActiveBurst, spotlightStudent, highlightClassId, topContributors };
};

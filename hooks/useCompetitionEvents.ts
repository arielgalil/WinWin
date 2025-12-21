import { useState, useRef, useEffect } from 'react';
import { BurstNotificationData, ClassRoom, CompetitionGoal, AppSettings } from '../types';
import { generateCompetitionCommentary } from '../services/geminiService';
import { useLanguage } from './useLanguage';

export const useCompetitionEvents = (
    sortedClasses: ClassRoom[],
    studentsWithStats: any[],
    totalInstitutionScore: number,
    goals: CompetitionGoal[],
    top5Students: any[],
    settings: AppSettings,
    onUpdateCommentary?: (text: string) => void
) => {
    const { t, language } = useLanguage();
    const [burstQueue, setBurstQueue] = useState<BurstNotificationData[]>([]);
    const [activeBurst, setActiveBurst] = useState<BurstNotificationData | null>(null);
    const [spotlightQueue, setSpotlightQueue] = useState<string[]>([]);
    const [highlightClassId, setHighlightClassId] = useState<string | null>(null);

    const prevTotalScoreRef = useRef(totalInstitutionScore);
    const prevTopClassIdRef = useRef<string | null>(null);
    const prevScoresRef = useRef<Map<string, number>>(new Map());
    const isFirstRender = useRef(true);
    const isGeneratingAi = useRef(false);

    // AI Commentary Trigger logic
    const triggerAiCommentary = async (eventDesc: string, note?: string) => {
        if (!onUpdateCommentary || isGeneratingAi.current) return;
        isGeneratingAi.current = true;
        try {
            const commentary = await generateCompetitionCommentary(
                sortedClasses,
                eventDesc,
                settings,
                totalInstitutionScore,
                note,
                language
            );
            if (commentary) onUpdateCommentary(commentary);
        } catch (e) {
            console.error("AI automated commentary failed", e);
        } finally {
            setTimeout(() => { isGeneratingAi.current = false; }, 10000); // Throttling
        }
    };

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
            triggerAiCommentary(t('ai_event_goal_reached', { goalName: currentGoal.name }));
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
                triggerAiCommentary(t('ai_event_leader_change', { className: currentTopClass.name }));
            }
            prevTopClassIdRef.current = currentTopClass.id;
        }

        // 3. Jumps
        let foundSignificantJump = false;
        studentsWithStats.forEach(s => {
            const prev = prevScoresRef.current.get(s.id);
            if (prev !== undefined && s.score > prev) {
                const diff = s.score - prev;
                if (diff >= 25 && !foundSignificantJump) {
                    foundSignificantJump = true;
                    setBurstQueue(queue => [...queue, {
                        id: `star-${s.id}-${Date.now()}`,
                        type: 'STAR_STUDENT',
                        title: t('rising_star'),
                        subTitle: s.name,
                        value: diff
                    }]);
                    triggerAiCommentary(t('ai_event_student_jump', { studentName: s.name }), `${diff} ${t('points_plural')}`);
                }
            }
            prevScoresRef.current.set(s.id, s.score || 0);
        });

        sortedClasses.forEach(c => {
            const prev = prevScoresRef.current.get(c.id);
            if (prev !== undefined && c.score > prev) {
                const diff = c.score - prev;
                
                // 4. Significant Group Jump (Class Boost)
                if (diff >= 100) {
                    setBurstQueue(queue => [...queue, {
                        id: `boost-${c.id}-${Date.now()}`,
                        type: 'CLASS_BOOST',
                        title: t('rising_group'),
                        subTitle: c.name,
                        value: diff
                    }]);
                    triggerAiCommentary(t('ai_event_class_jump', { className: c.name }), `${diff} ${t('points_plural')}`);
                }

                setHighlightClassId(c.id);
                setTimeout(() => setHighlightClassId(null), 5000);
            }
            prevScoresRef.current.set(c.id, c.score || 0);
        });

    }, [sortedClasses, totalInstitutionScore, goals, studentsWithStats, t]); 

    const spotlightStudent = spotlightQueue.length > 0 
        ? studentsWithStats.find(s => s.id === spotlightQueue[0]) || null 
        : null;

    return { activeBurst, setActiveBurst, spotlightStudent, highlightClassId };
};

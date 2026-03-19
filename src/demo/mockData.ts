import { Campaign, AppSettings, ClassRoom } from '@/types';

export const DEMO_CAMPAIGN: Campaign = {
    id: 'demo-campaign-id',
    name: 'הדגמה - בית ספר לדוגמה',
    slug: 'demo',
    is_active: true,
    ai_enabled: false,
};

export const DEMO_SETTINGS: AppSettings = {
    school_name: 'בית ספר לדוגמה',
    competition_name: 'תחרות מצמיחה',
    logo_url: null,
    primary_color: '#7c3aed',
    secondary_color: '#0f172a',
    background_brightness: 60,
    current_commentary: 'ברוכים הבאים לדגמה!',
    burst_notifications_enabled: true,
    enabled_burst_types: ['GOAL_REACHED', 'LEADER_CHANGE', 'STAR_STUDENT', 'CLASS_BOOST'],
    burst_student_threshold: 20,
    burst_class_threshold: 50,
    burst_sounds_enabled: false,
    burst_volume: 0.5,
    score_presets: [
        { label: '+5', value: 5 },
        { label: '+10', value: 10 },
        { label: '+25', value: 25 },
        { label: '+50', value: 50 },
    ],
    goals_config: [
        {
            id: 'goal-1',
            name: 'יעד ראשון',
            target_score: 200,
            image_type: 'emoji',
            image_value: '🌱',
        },
        {
            id: 'goal-2',
            name: 'יעד שני',
            target_score: 500,
            image_type: 'emoji',
            image_value: '🌿',
        },
        {
            id: 'goal-3',
            name: 'יעד שלישי',
            target_score: 1000,
            image_type: 'emoji',
            image_value: '🌳',
        },
    ],
    language: 'he',
    leaderboard_top_count: 10,
    leaderboard_momentum_count: 10,
};

const CLASS_CONFIGS = [
    { id: 'class-d1', name: 'ד1', color: '#7c3aed' },
    { id: 'class-d2', name: 'ד2', color: '#0891b2' },
    { id: 'class-h1', name: 'ה1', color: '#059669' },
    { id: 'class-h2', name: 'ה2', color: '#dc2626' },
] as const;

const STUDENT_NAMES = [
    ['נועה כהן', 'יוסף לוי', 'מיכל אברהם', 'דניאל גולן', 'שירה פרץ', 'אורי שפירא'],
    ['יעל מזרחי', 'עידו כץ', 'רותם שמש', 'אבי ברק', 'טל רוזן', 'ספיר דוד'],
    ['לירון חסן', 'עמית פרידמן', 'גל ישראלי', 'נדב שטיין', 'מור אלון', 'ראם גרוס'],
    ['חן בן-דוד', 'רון אוחיון', 'אלה נחמני', 'איתי חיון', 'שני בוגוסלבסקי', 'בן שלום'],
];

/** Creates initial classes with slightly randomized scores so each demo session feels different. */
export function createInitialClasses(): ClassRoom[] {
    return CLASS_CONFIGS.map((cfg, classIdx) => {
        // Random base score per student: 10-22 pts, varies by class
        const basePerStudent = 10 + Math.floor(Math.random() * 12);
        const students = STUDENT_NAMES[classIdx].map((name, j) => {
            const variance = Math.floor(Math.random() * 10) - 4;
            const score = Math.max(3, basePerStudent + variance);
            return {
                id: `std-${cfg.id.replace('class-', '')}-${j + 1}`,
                name,
                score,
                prev_score: score,
                trend: 'same' as const,
                class_id: cfg.id,
            };
        });
        const classScore = students.reduce((sum, s) => sum + s.score, 0);
        return { ...cfg, score: classScore, students };
    });
}

// Keep INITIAL_CLASSES export for backward compat (will be replaced by createInitialClasses in provider)
export const INITIAL_CLASSES: ClassRoom[] = createInitialClasses();

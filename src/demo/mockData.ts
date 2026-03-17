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

export const INITIAL_CLASSES: ClassRoom[] = [
    {
        id: 'class-d1',
        name: 'ד1',
        color: '#7c3aed',
        score: 85,
        students: [
            { id: 'std-d1-1', name: 'נועה כהן', score: 22, prev_score: 22, trend: 'same', class_id: 'class-d1' },
            { id: 'std-d1-2', name: 'יוסף לוי', score: 18, prev_score: 18, trend: 'same', class_id: 'class-d1' },
            { id: 'std-d1-3', name: 'מיכל אברהם', score: 15, prev_score: 15, trend: 'same', class_id: 'class-d1' },
            { id: 'std-d1-4', name: 'דניאל גולן', score: 12, prev_score: 12, trend: 'same', class_id: 'class-d1' },
            { id: 'std-d1-5', name: 'שירה פרץ', score: 10, prev_score: 10, trend: 'same', class_id: 'class-d1' },
            { id: 'std-d1-6', name: 'אורי שפירא', score: 8, prev_score: 8, trend: 'same', class_id: 'class-d1' },
        ],
    },
    {
        id: 'class-d2',
        name: 'ד2',
        color: '#0891b2',
        score: 78,
        students: [
            { id: 'std-d2-1', name: 'יעל מזרחי', score: 20, prev_score: 20, trend: 'same', class_id: 'class-d2' },
            { id: 'std-d2-2', name: 'עידו כץ', score: 17, prev_score: 17, trend: 'same', class_id: 'class-d2' },
            { id: 'std-d2-3', name: 'רותם שמש', score: 14, prev_score: 14, trend: 'same', class_id: 'class-d2' },
            { id: 'std-d2-4', name: 'אבי ברק', score: 11, prev_score: 11, trend: 'same', class_id: 'class-d2' },
            { id: 'std-d2-5', name: 'טל רוזן', score: 9, prev_score: 9, trend: 'same', class_id: 'class-d2' },
            { id: 'std-d2-6', name: 'ספיר דוד', score: 7, prev_score: 7, trend: 'same', class_id: 'class-d2' },
        ],
    },
    {
        id: 'class-h1',
        name: 'ה1',
        color: '#059669',
        score: 92,
        students: [
            { id: 'std-h1-1', name: 'לירון חסן', score: 24, prev_score: 24, trend: 'same', class_id: 'class-h1' },
            { id: 'std-h1-2', name: 'עמית פרידמן', score: 21, prev_score: 21, trend: 'same', class_id: 'class-h1' },
            { id: 'std-h1-3', name: 'גל ישראלי', score: 16, prev_score: 16, trend: 'same', class_id: 'class-h1' },
            { id: 'std-h1-4', name: 'נדב שטיין', score: 13, prev_score: 13, trend: 'same', class_id: 'class-h1' },
            { id: 'std-h1-5', name: 'מור אלון', score: 11, prev_score: 11, trend: 'same', class_id: 'class-h1' },
            { id: 'std-h1-6', name: 'ראם גרוס', score: 7, prev_score: 7, trend: 'same', class_id: 'class-h1' },
        ],
    },
    {
        id: 'class-h2',
        name: 'ה2',
        color: '#dc2626',
        score: 71,
        students: [
            { id: 'std-h2-1', name: 'חן בן-דוד', score: 19, prev_score: 19, trend: 'same', class_id: 'class-h2' },
            { id: 'std-h2-2', name: 'רון אוחיון', score: 16, prev_score: 16, trend: 'same', class_id: 'class-h2' },
            { id: 'std-h2-3', name: 'אלה נחמני', score: 13, prev_score: 13, trend: 'same', class_id: 'class-h2' },
            { id: 'std-h2-4', name: 'איתי חיון', score: 10, prev_score: 10, trend: 'same', class_id: 'class-h2' },
            { id: 'std-h2-5', name: 'שני בוגוסלבסקי', score: 8, prev_score: 8, trend: 'same', class_id: 'class-h2' },
            { id: 'std-h2-6', name: 'בן שלום', score: 5, prev_score: 5, trend: 'same', class_id: 'class-h2' },
        ],
    },
];

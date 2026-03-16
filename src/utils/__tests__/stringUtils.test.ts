import { describe, it, expect } from 'vitest';
import { replaceSmartTags } from '../stringUtils';
import { AppSettings, ClassRoom, Student } from '../../types';

describe('replaceSmartTags', () => {
    const mockSettings: AppSettings = {
        school_name: 'בית ספר בדיקה',
        competition_name: 'מבצע חנוכה',
        logo_url: null,
        goals_config: [
            { id: '1', name: 'יעד ראשון', target_score: 1000, image_type: 'emoji', image_value: '🚀' },
            { id: '2', name: 'יעד שני', target_score: 5000, image_type: 'emoji', image_value: '🔥' }
        ]
    };

    const mockClasses: (ClassRoom & { rank: number })[] = [
        { id: 'c1', name: 'כיתה א', score: 1200, rank: 1, color: 'red', students: [] },
        { id: 'c2', name: 'כיתה ב', score: 800, rank: 2, color: 'blue', students: [] },
        { id: 'c3', name: 'כיתה ג', score: 500, rank: 3, color: 'green', students: [] }
    ];

    const mockStudents: (Student & { rank: number })[] = [
        { id: 's1', name: 'ישראל ישראלי', score: 300, rank: 1, class_id: 'c1', trend: 'up', prev_score: 200 },
        { id: 's2', name: 'דני דין', score: 250, rank: 2, class_id: 'c1', trend: 'up', prev_score: 200 },
        { id: 's3', name: 'דינה ברזילי', score: 200, rank: 3, class_id: 'c2', trend: 'same', prev_score: 200 }
    ];

    it('replaces static tags', () => {
        const text = 'ברוכים הבאים ל[שם המוסד] למבצע [שם המבצע]';
        const result = replaceSmartTags(text, mockSettings, 2000, mockClasses, mockStudents);
        expect(result).toBe('ברוכים הבאים לבית ספר בדיקה למבצע מבצע חנוכה');
    });

    it('replaces institution score', () => {
        const text = 'צברנו עד כה [ניקוד מוסדי] נקודות!';
        const result = replaceSmartTags(text, mockSettings, 2000, mockClasses, mockStudents);
        expect(result).toBe('צברנו עד כה 2,000 נקודות!');
    });

    it('replaces goal tags based on current score', () => {
        const text = 'היעד הבא: [שם היעד] ב-[ניקוד היעד] נקודות. חסר לנו רק [מרחק מהיעד]';
        // Score is 1200, so next goal is 'יעד שני' (5000)
        const result = replaceSmartTags(text, mockSettings, 1200, mockClasses, mockStudents);
        expect(result).toBe('היעד הבא: יעד שני ב-5,000 נקודות. חסר לנו רק 3,800');
    });

    it('replaces group ranking tags', () => {
        const text = 'במקום הראשון: [קבוצה ראשונה], במקום השני: [קבוצה שניה], ובשלישי: [קבוצה שלישית]';
        const result = replaceSmartTags(text, mockSettings, 2000, mockClasses, mockStudents);
        expect(result).toBe('במקום הראשון: כיתה א, במקום השני: כיתה ב, ובשלישי: כיתה ג');
    });

    it('replaces student ranking tags', () => {
        const text = 'כל הכבוד ל[מקום ראשון] שמוביל את הטבלה, ואחריו [מקום שני] ו[מקום שלישי]';
        const result = replaceSmartTags(text, mockSettings, 2000, mockClasses, mockStudents);
        expect(result).toBe('כל הכבוד לישראל ישראלי שמוביל את הטבלה, ואחריו דני דין ודינה ברזילי');
    });

    it('replaces random participant and random group tags using pre-computed indices', () => {
        const text = 'פרגון ל[משתתף אקראי] מ[קבוצה אקראית]!';
        const result = replaceSmartTags(text, mockSettings, 2000, mockClasses, mockStudents, { studentIdx: 1, classIdx: 2 });
        // studentIdx 1 -> mockStudents[1] (דני דין), classIdx 2 -> mockClasses[2] (כיתה ג)
        expect(result).toContain('דני דין');
        expect(result).toContain('כיתה ג');
    });

    it('replaces random tags with fallback random when no indices provided', () => {
        const text = 'פרגון ל[משתתף אקראי] מ[קבוצה אקראית]!';
        const result = replaceSmartTags(text, mockSettings, 2000, mockClasses, mockStudents);
        expect(result).not.toContain('[משתתף אקראי]');
        expect(result).not.toContain('[קבוצה אקראית]');
    });

    it('handles missing data gracefully', () => {
        const text = '[קבוצה שלישית] ו[מקום שלישי] ו[משתתף אקראי]';
        const result = replaceSmartTags(text, mockSettings, 2000, [], []);
        expect(result).toBe('ו ו');
    });
});

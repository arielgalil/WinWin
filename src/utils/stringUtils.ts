
import { AppSettings, ClassRoom, Student } from '../types';

/**
 * Trims a string and optionally converts it to lowercase.
 */
export const normalizeString = (val: any, toLower = false): string => {
    if (!val) return '';
    const str = String(val).trim();
    return toLower ? str.toLowerCase() : str;
};

/**
 * Standardizes email format (trim, lowercase, no whitespace).
 */
export const cleanEmail = (email: any): string => {
    if (!email) return '';
    return String(email).trim().toLowerCase().replace(/\s/g, '');
};

/**
 * Capitalizes the first letter of each word in a string.
 */
export const capitalizeWords = (val: string): string => {
    if (!val) return '';
    return val.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

/**
 * Formats a number with thousands separators for display in input fields.
 */
export const formatNumberWithCommas = (value: string | number): string => {
    if (!value && value !== 0) return '';
    const num = typeof value === 'string' ? parseFloat(value) || 0 : value;
    return num.toLocaleString('en-US');
};

/**
 * Parses a formatted number string back to a number.
 */
export const parseFormattedNumber = (value: string): number => {
    if (!value) return 0;
    // Remove commas and convert to number
    const cleaned = value.replace(/,/g, '');
    return parseFloat(cleaned) || 0;
};

/**
 * Replaces smart tags in a string with actual competition data.
 */
export const replaceSmartTags = (
    text: string,
    settings: AppSettings,
    totalScore: number,
    sortedClasses: (ClassRoom & { rank: number })[],
    topStudents: (Student & { rank: number })[],
    randomIndices?: { studentIdx: number; classIdx: number },
    lastWheelWinner?: string
): string => {
    if (!text) return '';

    // 1. Basic Info
    let result = text
        .replace(/\[שם המוסד\]/g, settings.school_name || '')
        .replace(/\[שם המבצע\]/g, settings.competition_name || '')
        .replace(/\[ניקוד מוסדי\]/g, formatNumberWithCommas(totalScore));

    // 2. Goals Info
    const goals = settings.goals_config || [];
    const nextGoal = goals.find(g => g.target_score > totalScore) || goals[goals.length - 1];

    if (nextGoal) {
        const remaining = Math.max(0, nextGoal.target_score - totalScore);
        result = result
            .replace(/\[שם היעד\]/g, nextGoal.name)
            .replace(/\[ניקוד היעד\]/g, formatNumberWithCommas(nextGoal.target_score))
            .replace(/\[מרחק מהיעד\]/g, formatNumberWithCommas(remaining));
    }

    // 3. Group Rankings — positional (index-based) so rank gaps never cause empty results
    const getClassName = (pos: number) => sortedClasses[pos]?.name || '';
    result = result
        .replace(/\[קבוצה ראשונה\]/g, getClassName(0))
        .replace(/\[קבוצה שניה\]/g, getClassName(1))
        .replace(/\[קבוצה שלישית\]/g, getClassName(2));

    // 4. Student Rankings — positional
    const getStudentName = (pos: number) => topStudents[pos]?.name || '';
    result = result
        .replace(/\[מקום ראשון\]/g, getStudentName(0))
        .replace(/\[מקום שני\]/g, getStudentName(1))
        .replace(/\[מקום שלישי\]/g, getStudentName(2));

    // 5. Random Content
    if (result.includes('[משתתף אקראי]')) {
        if (topStudents.length > 0) {
            const idx = randomIndices?.studentIdx ?? Math.floor(Math.random() * topStudents.length);
            result = result.replace(/\[משתתף אקראי\]/g, topStudents[idx].name);
        } else {
            result = result.replace(/\[משתתף אקראי\]/g, '');
        }
    }

    if (result.includes('[קבוצה אקראית]')) {
        if (sortedClasses.length > 0) {
            const idx = randomIndices?.classIdx ?? Math.floor(Math.random() * sortedClasses.length);
            result = result.replace(/\[קבוצה אקראית\]/g, sortedClasses[idx].name);
        } else {
            result = result.replace(/\[קבוצה אקראית\]/g, '');
        }
    }

    // 6. Lucky wheel last winner
    result = result.replace(/\[זוכה אחרון בגלגל\]/g, lastWheelWinner || '');

    // Clean up multiple spaces left by empty tag replacements
    result = result.replace(/ {2,}/g, ' ').trim();

    return result;
};

/**
 * Formats the round label shown in the wheel overlay and winner card.
 * e.g. "🏆 סבב 1 • הגרלת מקום 2 🏆" or "🎁 סבב 4 • הגרלת בונוס 1 🎁"
 */
export function formatRoundLabel(
    roundNumber: number,
    placeNumber: number | null | undefined,
    totalRounds: number | undefined,
    isRTL: boolean,
): string {
    const bonusNum = totalRounds != null ? roundNumber - totalRounds : roundNumber;
    if (placeNumber != null && placeNumber > 0) {
        return isRTL
            ? `🏆 סבב ${roundNumber} • הגרלת מקום ${placeNumber} 🏆`
            : `🏆 Round ${roundNumber} • Place ${placeNumber} 🏆`;
    }
    if (placeNumber === null) {
        return isRTL
            ? `🎁 סבב ${roundNumber} • הגרלת בונוס ${bonusNum} 🎁`
            : `🎁 Round ${roundNumber} • Bonus Draw ${bonusNum} 🎁`;
    }
    return isRTL ? `🎡 סבב ${roundNumber}` : `🎡 Round ${roundNumber}`;
}

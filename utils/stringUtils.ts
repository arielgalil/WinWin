
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
    randomSeed?: number
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

    // 3. Group Rankings
    const getClassName = (rank: number) => sortedClasses.find(c => c.rank === rank)?.name || '---';
    result = result
        .replace(/\[קבוצה ראשונה\]/g, getClassName(1))
        .replace(/\[קבוצה שניה\]/g, getClassName(2))
        .replace(/\[קבוצה שלישית\]/g, getClassName(3));

    // 4. Student Rankings
    const getStudentName = (rank: number) => topStudents.find(s => s.rank === rank)?.name || '---';
    result = result
        .replace(/\[מקום ראשון\]/g, getStudentName(1))
        .replace(/\[מקום שני\]/g, getStudentName(2))
        .replace(/\[מקום שלישי\]/g, getStudentName(3));

    // 5. Random Place
    if (result.includes('[מקום אקראי]')) {
        const pool = [...sortedClasses.map(c => c.name), ...topStudents.map(s => s.name)];
        if (pool.length > 0) {
            const seed = randomSeed ?? Math.floor(Date.now() / 1000);
            const randomIndex = seed % pool.length;
            result = result.replace(/\[מקום אקראי\]/g, pool[randomIndex]);
        } else {
            result = result.replace(/\[מקום אקראי\]/g, '---');
        }
    }

    return result;
};

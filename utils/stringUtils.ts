
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

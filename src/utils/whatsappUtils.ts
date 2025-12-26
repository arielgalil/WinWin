
/**
 * Utility to format text for WhatsApp.
 * Converts Markdown bold (**word**) to WhatsApp bold (*word*).
 * Special handling for Hebrew prefixes:
 * - ל**אריאל** -> *לאריאל*
 * - ב**ירושלים** -> *בירושלים*
 */
export const formatForWhatsApp = (text: string): string => {
    if (!text) return "";

    // 1. Convert Markdown bold (**...**) to WhatsApp bold (*...*)
    // We handle the prefix issue by searching for patterns like [prefix]**[text]**
    // Hebrew prefixes: ל, ב, ו, כ, מ, ש, ה
    
    // This regex looks for a Hebrew prefix letter followed by **
    // It handles the prefix correctly by moving it inside the WhatsApp bold marks.
    const prefixRegex = /(^|[^א-תa-zA-Z0-9])([לב וכמש ה])\*\*(.*?)\*\*/g;
    let formatted = text.replace(prefixRegex, (match, before, prefix, content) => {
        return `${before}*${prefix}${content}*`;
    });

    // 2. Handle standard **bold** without prefixes
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '*$1*');

    return formatted;
};

/**
 * Utility to parse formatted text (Markdown/WhatsApp) for React rendering.
 * Supports both **bold** and *bold* for bolding.
 */
export const parseFormattedText = (text: string) => {
    if (!text) return [];
    
    // Split by both ** and * patterns
    // We prioritize ** first, then *
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    
    return parts;
};

import { he } from './translations/he';
import { en } from './translations/en';

export type Language = 'he' | 'en';

export const translations = {
    he,
    en
};

export type TranslationKey = keyof typeof translations.he;

/**
 * Utility function to translate a key into the given language.
 * Supports parameter substitution using %{key} syntax.
 */
export const t = (key: TranslationKey, lang: Language = 'he', params?: Record<string, any>): string => {
    let text = (translations[lang] as any)[key] || (translations['he'] as any)[key] || key;
    
    if (params) {
        Object.entries(params).forEach(([k, v]) => {
            text = text.replace(new RegExp(`%\\{${k}\\}`, 'g'), String(v));
        });
    }
    
    return text;
};

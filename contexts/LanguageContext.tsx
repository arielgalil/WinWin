import React, { createContext, useState, useEffect, useCallback } from 'react';
import { Language, TranslationKey, t } from '../utils/i18n';

export interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: TranslationKey, params?: Record<string, any>) => string;
    isRTL: boolean;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode, initialLanguage?: Language }> = ({ children, initialLanguage = 'he' }) => {
    const [language, setLangState] = useState<Language>(initialLanguage);

    const setLanguage = useCallback((lang: Language) => {
        setLangState(lang);
        localStorage.setItem('winwin_preferred_language', lang);
    }, []);

    const isRTL = language === 'he';

    useEffect(() => {
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
        document.documentElement.lang = language;

        if (isRTL) {
            document.body.classList.add('rtl');
            document.body.classList.remove('ltr');
        } else {
            document.body.classList.add('ltr');
            document.body.classList.remove('rtl');
        }
    }, [language, isRTL]);

    const translate = useCallback((key: TranslationKey, params?: Record<string, any>) => t(key, language, params), [language]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t: translate, isRTL }}>
            {children}
        </LanguageContext.Provider>
    );
};

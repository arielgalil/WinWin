import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
const [theme, setThemeState] = useState<Theme>(() => {
        const saved = localStorage.getItem('app-theme');
        if (saved === 'light' || saved === 'dark') return saved;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; // Default to light for WCAG compliance
    });

    useEffect(() => {
        console.log('[ThemeContext] Applying theme:', theme);
        const root = window.document.documentElement;
        const body = window.document.body;
        
        // Remove all possible theme indicators
        const classesToRemove = ['light', 'dark', 'light-mode', 'dark-mode'];
        root.classList.remove(...classesToRemove);
        body.classList.remove(...classesToRemove);
        
        // Add current theme class
        root.classList.add(theme);
        body.classList.add(theme);
        
        // Force update for Tailwind v4 manual dark mode if needed
        // (Tailwind v4 usually just needs the class on any parent)
        
        localStorage.setItem('app-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        console.log('[ThemeContext] Toggling theme. Current:', theme);
        setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

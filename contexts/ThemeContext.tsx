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
        return 'light'; // Ignore system preference and default to light
    });

    useEffect(() => {
        console.log('[ThemeContext] Applying theme:', theme);
        const root = window.document.documentElement;
        
        // Use only the standard dark/light classes on the html element
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        
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

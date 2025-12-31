import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface AppState {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
    persistent_session: boolean;
    setPersistentSession: (val: boolean) => void;
}

export const useStore = create<AppState>()(
    devtools(
        persist(
            (set) => ({
                theme: 'light',
                persistent_session: false,
                setPersistentSession: (val) => set({ persistent_session: val }),
                toggleTheme: () => set((state) => {
                    const newTheme = state.theme === 'light' ? 'dark' : 'light';
                    // Side effect for theme application (similar to original Context)
                    const root = window.document.documentElement;
                    root.classList.remove('light', 'dark');
                    root.classList.add(newTheme);
                    return { theme: newTheme };
                }),
                setTheme: (newTheme) => set(() => {
                    // Side effect for theme application
                    const root = window.document.documentElement;
                    root.classList.remove('light', 'dark');
                    root.classList.add(newTheme);
                    return { theme: newTheme };
                }),
            }),
            {
                name: 'app-storage',
                partialize: (state) => ({ theme: state.theme }),
                onRehydrateStorage: () => (state) => {
                    // Ensure theme is applied on rehydration
                    if (state) {
                        const root = window.document.documentElement;
                        root.classList.remove('light', 'dark');
                        root.classList.add(state.theme);
                    }
                }
            }
        )
    )
);

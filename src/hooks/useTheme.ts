import { useStore } from '../services/store';

export const useTheme = () => {
    const theme = useStore((state) => state.theme);
    const toggleTheme = useStore((state) => state.toggleTheme);
    const setTheme = useStore((state) => state.setTheme);

    return { theme, toggleTheme, setTheme };
};

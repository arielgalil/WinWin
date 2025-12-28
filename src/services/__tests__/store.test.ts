import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../store';

describe('Zustand Store', () => {
    beforeEach(() => {
        useStore.setState({ theme: 'light' });
        localStorage.clear();
    });

    it('should initialize with default theme', () => {
        const { theme } = useStore.getState();
        expect(theme).toBe('light');
    });

    it('should toggle theme', () => {
        const { toggleTheme } = useStore.getState();
        
        toggleTheme();
        expect(useStore.getState().theme).toBe('dark');
        
        toggleTheme();
        expect(useStore.getState().theme).toBe('light');
    });

    it('should set theme explicitly', () => {
        const { setTheme } = useStore.getState();
        
        setTheme('dark');
        expect(useStore.getState().theme).toBe('dark');
        
        setTheme('light');
        expect(useStore.getState().theme).toBe('light');
    });
});

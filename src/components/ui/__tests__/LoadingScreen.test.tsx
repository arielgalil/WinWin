import { render, screen, fireEvent, act } from '@testing-library/react';
import { LoadingScreen } from '../LoadingScreen';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

// Mock hooks used in LoadingScreen
vi.mock('../../../hooks/useLanguage', () => ({
    useLanguage: () => ({
        t: (key: string) => key,
    }),
}));

vi.mock('../../../hooks/useAuth', () => ({
    useAuth: () => ({
        setAuthLoading: vi.fn(),
        hardReset: vi.fn(),
    }),
}));

describe('LoadingScreen', () => {
    it('renders with default message when no message is provided', () => {
        render(<LoadingScreen />);
        expect(screen.getByText('loading_data')).toBeInTheDocument();
    });

    it('renders with custom message when provided', () => {
        render(<LoadingScreen message="Custom Loading Message" />);
        expect(screen.getByText('Custom Loading Message')).toBeInTheDocument();
    });

    it('shows help options after timeout', async () => {
        vi.useFakeTimers();
        render(<LoadingScreen />);
        
        // Options should not be visible initially
        expect(screen.queryByText('stuck_skip')).not.toBeInTheDocument();
        
        // Fast-forward 4 seconds
        await act(async () => {
            vi.advanceTimersByTime(4000);
        });
        
        expect(screen.getByText('stuck_skip')).toBeInTheDocument();
        expect(screen.getByText('hard_reset')).toBeInTheDocument();
        vi.useRealTimers();
    });
});

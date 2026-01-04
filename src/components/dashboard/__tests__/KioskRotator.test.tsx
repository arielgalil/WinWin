import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KioskRotator } from '../KioskRotator';
import { AppSettings } from '../../../types';
import React from 'react';

describe('KioskRotator', () => {
    const mockSettings: AppSettings = {
        rotation_enabled: true,
        rotation_interval: 1, // 1 second for fast testing
        rotation_config: [
            { url: '__DASHBOARD__', duration: 1 },
            { url: 'https://example1.com', duration: 1 },
            { url: 'https://example2.com', duration: 1 }
        ]
    } as AppSettings;

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should render children when rotation is disabled', () => {
        const settings = { ...mockSettings, rotation_enabled: false };
        render(
            <KioskRotator settings={settings}>
                <div data-testid="board">Game Board</div>
            </KioskRotator>
        );
        expect(screen.getByTestId('board')).toBeDefined();
    });

    it('should show board and preload next item when rotation is enabled', () => {
        render(
            <KioskRotator settings={mockSettings} currentIndex={0}>
                <div data-testid="board">Game Board</div>
            </KioskRotator>
        );
        
        // Dashboard is active, Site 1 is next (preloading)
        expect(screen.getByTestId('board')).toBeDefined();
        expect(screen.getByTitle(/Kiosk Content 1/i)).toBeDefined();
    });

    it('should show board initially (currentIndex = 0)', () => {
        render(
            <KioskRotator settings={mockSettings} currentIndex={0}>
                <div data-testid="board">Game Board</div>
            </KioskRotator>
        );

        expect(screen.getByTestId('board')).toBeDefined();
    });

    it('should rotate through sites while keeping a 3-item sliding window', () => {
        const { rerender } = render(
            <KioskRotator settings={mockSettings} currentIndex={0}>
                <div data-testid="board">Game Board</div>
            </KioskRotator>
        );

        // Initially: Dashboard (0) active, Site 1 (1) is next (preloading)
        // Site 2 (2) is outside window and should NOT be mounted
        expect(screen.getByTestId('board')).toBeDefined();
        expect(screen.getByTitle(/Kiosk Content 1/i)).toBeDefined();
        expect(screen.queryByTitle(/Kiosk Content 2/i)).toBeNull();

        // Rotate to Site 1 (currentIndex = 1)
        rerender(
            <KioskRotator settings={mockSettings} currentIndex={1}>
                <div data-testid="board">Game Board</div>
            </KioskRotator>
        );

        // Advance timers so board (idx 0) becomes previousIndex
        vi.advanceTimersByTime(2000);

        // Window: Board (0) is previous, Site 1 (1) is active, Site 2 (2) is next
        // All 3 should be mounted
        expect(screen.getByTestId('board')).toBeDefined();
        expect(screen.getByTitle(/Kiosk Content 1/i)).toBeDefined();
        expect(screen.getByTitle(/Kiosk Content 2/i)).toBeDefined();

        // Rotate to Site 2 (currentIndex = 2)
        rerender(
            <KioskRotator settings={mockSettings} currentIndex = {2}>
                <div data-testid="board">Game Board</div>
            </KioskRotator>
        );
        
        // Advance timers so Site 1 (idx 1) becomes previousIndex
        vi.advanceTimersByTime(2000);

        // Window: Site 1 (1) is previous, Site 2 (2) is active, Dashboard (0) is next
        // Optimization: Dashboard (0) is unmounted when only preloading to save resources.
        expect(screen.queryByTestId('board')).toBeNull();
        expect(screen.getByTitle(/Kiosk Content 1/i)).toBeDefined();
        expect(screen.getByTitle(/Kiosk Content 2/i)).toBeDefined();

        // Advance to Dashboard (currentIndex = 0)
        rerender(
            <KioskRotator settings={mockSettings} currentIndex = {0}>
                <div data-testid="board">Game Board</div>
            </KioskRotator>
        );

        // Advance timers so Site 2 (idx 2) becomes previousIndex
        vi.advanceTimersByTime(2000);

        // Window: Site 2 (2) is previous, Dashboard (0) is active, Site 1 (1) is next
        expect(screen.getByTestId('board')).toBeDefined();
        expect(screen.getByTitle(/Kiosk Content 1/i)).toBeDefined();
        expect(screen.getByTitle(/Kiosk Content 2/i)).toBeDefined();
    });
});

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

    it('should render children and iframes when rotation is enabled (Stack Approach)', () => {
        render(
            <KioskRotator settings={mockSettings}>
                <div data-testid="board">Game Board</div>
            </KioskRotator>
        );
        
        // Stack approach keeps everything in DOM
        expect(screen.getByTestId('board')).toBeDefined();
        expect(screen.getAllByTitle(/Kiosk Content/i)).toHaveLength(2);
    });

    it('should show board initially (currentIndex = -1)', () => {
        render(
            <KioskRotator settings={mockSettings}>
                <div data-testid="board">Game Board</div>
            </KioskRotator>
        );

        const boardContainer = screen.getByTestId('board').parentElement;
        expect(boardContainer?.style.opacity).toBe('1');
    });

    it('should rotate through sites', () => {
        render(
            <KioskRotator settings={mockSettings}>
                <div data-testid="board">Game Board</div>
            </KioskRotator>
        );

        const boardContainer = screen.getByTestId('board').parentElement;
        const iframes = screen.getAllByTitle(/Kiosk Content/i).map(el => el.parentElement);

        // Initially board is visible
        expect(boardContainer?.style.opacity).toBe('1');
        expect(iframes[0]?.style.opacity).toBe('0');

        // Advance timers by 1 second
        vi.advanceTimersByTime(1000);

        // Now first site should be visible
        expect(boardContainer?.style.opacity).toBe('0');
        expect(iframes[0]?.style.opacity).toBe('1');

        // Advance timers by another 1 second
        vi.advanceTimersByTime(1000);

        // Now second site should be visible
        expect(iframes[0]?.style.opacity).toBe('0');
        expect(iframes[1]?.style.opacity).toBe('1');

        // Advance timers by another 1 second
        vi.advanceTimersByTime(1000);

        // Should return to board
        expect(iframes[1]?.style.opacity).toBe('0');
        expect(boardContainer?.style.opacity).toBe('1');
    });
});

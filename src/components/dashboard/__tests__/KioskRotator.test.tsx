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

    it('should permanently mount all items to preserve state', () => {
        const { rerender } = render(
            <KioskRotator settings={mockSettings} currentIndex={0}>
                <div data-testid="board">Game Board</div>
            </KioskRotator>
        );

        // ALL items should be mounted at all times for state preservation
        expect(screen.getByTestId('board')).toBeDefined();
        expect(screen.getByTitle(/Kiosk Content 1/i)).toBeDefined();
        expect(screen.getByTitle(/Kiosk Content 2/i)).toBeDefined();

        // Rotate to Site 1 (currentIndex = 1)
        rerender(
            <KioskRotator settings={mockSettings} currentIndex={1}>
                <div data-testid="board">Game Board</div>
            </KioskRotator>
        );

        // All items still mounted
        expect(screen.getByTestId('board')).toBeDefined();
        expect(screen.getByTitle(/Kiosk Content 1/i)).toBeDefined();
        expect(screen.getByTitle(/Kiosk Content 2/i)).toBeDefined();

        // Rotate to Site 2 (currentIndex = 2)
        rerender(
            <KioskRotator settings={mockSettings} currentIndex = {2}>
                <div data-testid="board">Game Board</div>
            </KioskRotator>
        );

        // All items still mounted
        expect(screen.getByTestId('board')).toBeDefined();
        expect(screen.getByTitle(/Kiosk Content 1/i)).toBeDefined();
        expect(screen.getByTitle(/Kiosk Content 2/i)).toBeDefined();
    });
});

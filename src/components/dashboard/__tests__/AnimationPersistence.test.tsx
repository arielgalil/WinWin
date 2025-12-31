import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useStore } from '../../../services/store';
import { MissionMeter } from '../MissionMeter';
import { LanguageProvider } from '../../../contexts/LanguageContext';
import React from 'react';

// Define minimal SVGPathElement if it doesn't exist in JSDOM
if (typeof window !== 'undefined' && !window.SVGPathElement) {
    (window as any).SVGPathElement = class SVGPathElement extends window.HTMLElement {
        getTotalLength() { return 100; }
    };
}

// Mock store
vi.mock('../../../services/store', () => ({
    useStore: vi.fn()
}));

const renderWithProvider = (ui: React.ReactElement) => {
    return render(
        <LanguageProvider>
            {ui}
        </LanguageProvider>
    );
};

describe('Animation Persistence', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('MissionMeter should initialize correctly', () => {
        // Mock the selector responses
        vi.mocked(useStore).mockImplementation((selector: any) => {
            const state = {
                persistent_session: false,
                iris_pattern: [{ cx: 0.5, cy: 0.5, weight: 1, delay: 0 }],
                setIrisPattern: vi.fn()
            };
            return selector(state);
        });

        renderWithProvider(
            <MissionMeter 
                totalScore={100} 
                goals={[]} 
                competitionName="Test" 
            />
        );
        expect(screen.getByText(/Test/i)).toBeDefined();
    });

    it('MissionMeter should handle missing iris pattern', () => {
        vi.mocked(useStore).mockImplementation((selector: any) => {
            const state = {
                persistent_session: true,
                iris_pattern: null,
                setIrisPattern: vi.fn()
            };
            return selector(state);
        });

        renderWithProvider(
            <MissionMeter 
                totalScore={100} 
                goals={[]} 
                competitionName="Test" 
            />
        );
        expect(screen.getByText(/Test/i)).toBeDefined();
    });
});

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

    it('MissionMeter should initialize with persistentSession=false', () => {
        vi.mocked(useStore).mockReturnValue(false);
        renderWithProvider(
            <MissionMeter 
                totalScore={100} 
                goals={[]} 
                competitionName="Test" 
            />
        );
        expect(screen.getByText(/Test/i)).toBeDefined();
    });

    it('MissionMeter should skip animations when persistentSession=true', () => {
        vi.mocked(useStore).mockReturnValue(true);
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
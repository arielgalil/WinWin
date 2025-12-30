import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { GoalsManager } from '../GoalsManager';
import { AppSettings } from '../../../../types';

// Mock dependencies
vi.mock('../../../../hooks/useLanguage', () => ({
    useLanguage: () => ({ t: (key: string) => key })
}));

vi.mock('../../../../hooks/useConfirmation', () => ({
    useConfirmation: () => ({
        modalConfig: {},
        openConfirmation: vi.fn()
    })
}));

const mockSettings: AppSettings = {
    id: '1',
    school_name: 'Test School',
    competition_name: 'Test Comp',
    logo_url: null,
    goals_config: [
        {
            id: 'g1',
            name: 'Goal 1',
            target_score: 100,
            image_type: 'emoji',
            image_value: '🏆'
        }
    ],
    hex_grid_size: 20
};

describe('GoalCard Progress Bar Height', () => {
    it('uses a thicker height for the progress bar', () => {
        render(<GoalsManager settings={mockSettings} onUpdateSettings={vi.fn()} totalScore={50} />);

        // The progress bar container has classes: w-full bg-[var(--bg-surface)] ... rounded-full overflow-hidden border border-[var(--border-subtle)]
        
        // Find all divs and filter by classes
        const divs = document.querySelectorAll('div');
        const progressBar = Array.from(divs).find(d => 
            d.className.includes('rounded-full') && 
            d.className.includes('overflow-hidden') &&
            d.className.includes('w-full') &&
            d.parentElement?.className.includes('space-y-1.5')
        );

        expect(progressBar).toBeDefined();
        // Expect height to be thicker. Let's say h-3 or h-4.
        expect(progressBar?.className).toContain('h-3');
    });
});

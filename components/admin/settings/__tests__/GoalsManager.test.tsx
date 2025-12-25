import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
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

vi.mock('../../../../supabaseClient', () => ({
    supabase: {
        storage: {
            from: () => ({
                upload: vi.fn(),
                getPublicUrl: vi.fn()
            })
        }
    }
}));

// Mock scrollIntoView
const scrollIntoViewMock = vi.fn();

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

describe('GoalsManager', () => {
    beforeEach(() => {
        window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should have a green edit button and scroll to form on click', async () => {
        const onUpdateSettings = vi.fn();
        render(<GoalsManager settings={mockSettings} onUpdateSettings={onUpdateSettings} totalScore={50} />);

        // Find the edit button (using title as defined in the component)
        const editButton = screen.getByTitle('edit_stage_title');

        // Check for green class - expected to pass now
        expect(editButton.className).toContain('text-green-600');
        expect(editButton.className).toContain('bg-green-50');

        // Click and verify scroll
        fireEvent.click(editButton);
        
        // Check if scrollIntoView was called - wait for timeout
        await waitFor(() => {
            expect(scrollIntoViewMock).toHaveBeenCalled();
        });
        expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    });
});

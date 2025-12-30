import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { SchoolSettings } from '../SchoolSettings';
import { AppSettings } from '../../../types';

// Mock dependencies
vi.mock('../../../hooks/useLanguage', () => ({
    useLanguage: () => ({ t: (key: string) => key })
}));

vi.mock('../../../hooks/useToast', () => ({
    useToast: () => ({ showToast: vi.fn() })
}));

vi.mock('../../../hooks/useConfirmation', () => ({
    useConfirmation: () => ({
        modalConfig: {},
        openConfirmation: vi.fn()
    })
}));

vi.mock('../../../contexts/SaveNotificationContext', () => ({
    useSaveNotification: () => ({ triggerSave: vi.fn() })
}));

const mockSettings: AppSettings = {
    id: '1',
    school_name: 'Test School',
    competition_name: 'Test Comp',
    background_music_url: 'https://youtube.com/watch?v=123',
    background_music_volume: 50,
    background_music_mode: 'loop',
    campaign_id: 'comp1'
} as any;

describe('SchoolSettings Music Preview', () => {
    it('shows a preview button when a youtube link is present', () => {
        render(<SchoolSettings settings={mockSettings} totalScore={0} />);

        // We expect a button with a preview or play/pause functionality
        // Let's look for a button with "preview" or "play" related title/text
        const previewButton = screen.queryByTitle(/play|pause|preview/i) || 
                            screen.queryAllByRole('button').find(b => b.textContent?.toLowerCase().includes('preview'));
        
        expect(previewButton).toBeDefined();
        expect(previewButton).toBeInTheDocument();
    });
});

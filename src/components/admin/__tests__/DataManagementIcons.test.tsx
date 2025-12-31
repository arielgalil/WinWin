import React from 'react';
import { render } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { DataManagement } from '../DataManagement';

// Mock dependencies
vi.mock('@/hooks/useLanguage', () => ({
    useLanguage: vi.fn(() => ({
        t: (key: string) => key,
        dir: 'rtl',
        language: 'he'
    }))
}));

vi.mock('../../hooks/useConfirmation', () => ({
    useConfirmation: () => ({ modalConfig: {}, openConfirmation: vi.fn() })
}));

vi.mock('@/contexts/SaveNotificationContext', () => ({
    useSaveNotification: () => ({ triggerSave: vi.fn() })
}));

const mockSettings = {
    campaign_id: 'comp1',
    competition_name: 'Test Comp'
} as any;

describe('DataManagement Icon Frames', () => {
    it('uses square dimensions for icon frames', () => {
        const { container } = render(
            <DataManagement 
                settings={mockSettings} 
                onRefresh={vi.fn()} 
            />
        );

        // Check for w-8 h-8 frames
        const smallFrames = container.querySelectorAll('.w-8.h-8');
        expect(smallFrames.length).toBeGreaterThanOrEqual(3); // Export, Restore, Danger Zone
        smallFrames.forEach(frame => {
            expect(frame.className).toContain('flex');
            expect(frame.className).toContain('items-center');
            expect(frame.className).toContain('justify-center');
        });

        // Check for w-12 h-12 frames
        const largeFrames = container.querySelectorAll('.w-12.h-12');
        expect(largeFrames.length).toBeGreaterThanOrEqual(2); // Main Header, Restore Dropzone
        largeFrames.forEach(frame => {
            expect(frame.className).toContain('flex');
            expect(frame.className).toContain('items-center');
            expect(frame.className).toContain('justify-center');
        });
    });
});

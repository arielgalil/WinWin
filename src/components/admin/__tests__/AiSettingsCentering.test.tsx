import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { AiSettings } from '../AiSettings';

// Mock hooks
vi.mock('../../../hooks/useLanguage', () => ({
    useLanguage: () => ({ t: (key: string) => key, isRTL: true })
}));

vi.mock('../../../hooks/useConfirmation', () => ({
    useConfirmation: () => ({ modalConfig: {}, openConfirmation: vi.fn(), closeConfirmation: vi.fn() })
}));

vi.mock('../../../contexts/SaveNotificationContext', () => ({
    useSaveNotification: () => ({ triggerSave: vi.fn() })
}));

describe('AiSettings Keyword Button Centering', () => {
    it('add keyword button centers the icon', () => {
        const mockSettings: any = {
            ai_keywords: [],
            campaign_id: '1'
        };

        render(<AiSettings settings={mockSettings} />);

        // The add keyword button is the one with PlusIcon (mocked as svg or found by type submit)
        const addButton = screen.getByRole('button', { name: '' }); // It has no text, only icon
        // Filter by the one inside the form or with bg-indigo-600
        const submitButton = document.querySelector('button[type="submit"]');

        expect(submitButton?.className).toContain('flex');
        expect(submitButton?.className).toContain('items-center');
        expect(submitButton?.className).toContain('justify-center');
    });
});

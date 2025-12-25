import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { SchoolSettings } from '../SchoolSettings';
import { AppSettings } from '../../../types';

// Mocks
vi.mock('../../../hooks/useLanguage', () => ({
    useLanguage: () => ({ t: (key: string) => key })
}));
vi.mock('../../../hooks/useToast', () => ({
    useToast: () => ({ showToast: vi.fn() })
}));
vi.mock('../../../hooks/useConfirmation', () => ({
    useConfirmation: () => ({
        modalConfig: {},
        openConfirmation: vi.fn(),
        closeConfirmation: vi.fn()
    })
}));
vi.mock('../../../contexts/SaveNotificationContext', () => ({
    useSaveNotification: () => ({ triggerSave: vi.fn() })
}));
vi.mock('../../../supabaseClient', () => ({
    supabase: {
        from: vi.fn(),
        storage: { from: vi.fn() }
    }
}));
vi.mock('../../../contexts/ThemeContext', () => ({
    useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() })
}));

const mockSettings: AppSettings = {
    school_name: 'Test',
    competition_name: 'Test Comp',
    logo_url: null
};

describe('SchoolSettings Tabs', () => {
    it('should have unified width for language toggle buttons', () => {
        render(<SchoolSettings settings={mockSettings} totalScore={0} />);
        
        const hebrewBtn = screen.getByText('hebrew').closest('button');
        const englishBtn = screen.getByText('english').closest('button');

        expect(hebrewBtn).toHaveClass('flex-1');
        expect(englishBtn).toHaveClass('flex-1');
    });

    it('should have unified width for music mode toggle buttons', () => {
        render(<SchoolSettings settings={mockSettings} totalScore={0} />);
        
        const loopBtn = screen.getByText('loop').closest('button');
        const onceBtn = screen.getByText('once').closest('button');

        expect(loopBtn).toHaveClass('flex-1');
        expect(onceBtn).toHaveClass('flex-1');
    });
});

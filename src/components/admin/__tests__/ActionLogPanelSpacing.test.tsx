import React from 'react';
import { render } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { ActionLogPanel } from '../ActionLogPanel';
import { AppSettings } from '../../../types';

// Mock IntersectionObserver
const IntersectionObserverMock = vi.fn(function () {
  return {
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  };
});
vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);

// Mock hooks
vi.mock('../../../hooks/useLanguage', () => ({
    useLanguage: () => ({ t: (key: string) => key, isRTL: true, language: 'he' })
}));

vi.mock('../../../contexts/SaveNotificationContext', () => ({
    useSaveNotification: () => ({ triggerSave: vi.fn() })
}));

vi.mock('../../../hooks/useConfirmation', () => ({
    useConfirmation: () => ({
        modalConfig: { isOpen: false },
        openConfirmation: vi.fn(),
    }),
}));

const mockSettings: AppSettings = {
  school_name: 'Test School',
  competition_name: 'Test Comp',
  logo_url: null,
  ai_summary: null,
  ai_summary_updated_at: null,
  campaign_id: 'campaign-id-123',
};

describe('ActionLogPanel Spacing', () => {
    it('Action History card does not have !p-0 and table wrapper has negative margins', () => {
        const { container } = render(
            <ActionLogPanel 
                logs={[]} 
                onLoadMore={vi.fn()} 
                onDelete={vi.fn()} 
                onUpdate={vi.fn()} 
                settings={mockSettings}
                isAdmin={true}
            />
        );

        // Find the "Action History" card - it should be an AdminSectionCard
        // We look for the one containing the text "activity_history_title"
        const historyCard = container.querySelector('.lg\\:col-span-2 > div');
        expect(historyCard).not.toBeNull();
        
        // 1. Verify it DOES NOT have !p-0 (Restoring header padding)
        expect(historyCard?.className).not.toContain('!p-0');

        // 2. Verify the table wrapper has negative margins (Edge-to-edge table)
        // In ActionLogPanel.tsx, the table is inside a div with 'custom-scrollbar overflow-x-auto'
        const tableWrapper = historyCard?.querySelector('.overflow-x-auto');
        expect(tableWrapper).not.toBeNull();
        expect(tableWrapper?.className).toContain('-mx-4');
        expect(tableWrapper?.className).toContain('sm:-mx-6');
    });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { ActionLogPanel } from '../ActionLogPanel';

// Mock dependencies
vi.mock('../../../hooks/useLanguage', () => ({
    useLanguage: () => ({ t: (key: string) => key, isRTL: true, language: 'he' })
}));

vi.mock('../../../hooks/useConfirmation', () => ({
    useConfirmation: () => ({ modalConfig: {}, openConfirmation: vi.fn() })
}));

vi.mock('../../../contexts/SaveNotificationContext', () => ({
    useSaveNotification: () => ({ triggerSave: vi.fn() })
}));

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.prototype.observe = vi.fn();
mockIntersectionObserver.prototype.disconnect = vi.fn();
mockIntersectionObserver.prototype.unobserve = vi.fn();
vi.stubGlobal('IntersectionObserver', mockIntersectionObserver);

const mockSettings = {
    ai_summary: 'Long AI summary that should expand the box.',
    campaign_id: 'comp1'
} as any;

describe('ActionLogPanel AI Summary Box', () => {
    it('AI summary box does not have fixed height or overflow-y-auto', () => {
        render(
            <ActionLogPanel 
                logs={[]} 
                onLoadMore={vi.fn()} 
                onDelete={vi.fn()} 
                onUpdate={vi.fn()} 
                settings={mockSettings} 
                isAdmin={true} 
            />
        );

        // Find the summary text container
        const summaryText = screen.getByText(/Long AI summary/i);
        // Find by partial class match to avoid selector escaping issues
        const container = Array.from(document.querySelectorAll('div')).find(d => 
            d.className.includes('bg-[var(--bg-surface)]') && d.contains(summaryText)
        );

        expect(container).toBeDefined();
        // It should NOT have overflow-y-auto anymore
        expect(container?.className).not.toContain('overflow-y-auto');
        // And the parent card should not have h-[600px]
        const card = container?.closest('.flex-col');
        expect(card?.className).not.toContain('h-[600px]');
    });
});

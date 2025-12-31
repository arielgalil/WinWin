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
    ai_summary: 'Some summary',
    campaign_id: 'comp1'
} as any;

describe('ActionLogPanel Buttons', () => {
    it('contains a wrapping container for generate and copy buttons', () => {
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

        const generateBtn = screen.getByText('generate_new_analysis');
        const copyBtn = screen.getByText('copy');

        // Check if they share a common parent with flex-wrap
        const parent = generateBtn.closest('.flex-wrap');
        expect(parent).toBeDefined();
        expect(parent?.className).toContain('justify-end');
        expect(parent?.contains(copyBtn)).toBe(true);
    });
});

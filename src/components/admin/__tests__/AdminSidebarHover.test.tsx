import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { AdminSidebar } from '../AdminSidebar';

// Mock hooks
vi.mock('../../../hooks/useLanguage', () => ({
    useLanguage: () => ({ t: (key: string) => key })
}));

vi.mock('../../../hooks/useTheme', () => ({
    useTheme: () => ({ theme: 'dark', toggleTheme: vi.fn() })
}));

describe('AdminSidebar Hover Effect', () => {
    it('navigation items have a hover scale or translate effect', () => {
        const mockNavItems = [
            { id: 'settings', icon: () => <div />, colorVar: '--primary' }
        ];

        render(
            <AdminSidebar 
                visibleNavItems={mockNavItems}
                activeTab="dashboard"
                onTabChange={vi.fn()}
                onViewDashboard={vi.fn()}
                onManualRefresh={vi.fn(async () => true)}
                isRefreshing={false}
                onLogout={vi.fn()}
            />
        );

        const navButton = screen.getByRole('button', { name: /tab_settings/i });
        
        // We expect a scale effect now as per user feedback
        expect(navButton.className).toContain('hover:scale-105');
    });
});

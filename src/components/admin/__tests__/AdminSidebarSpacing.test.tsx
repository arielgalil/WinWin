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

describe('AdminSidebar Footer Spacing', () => {
    it('uses reduced vertical padding for footer buttons', () => {
        const props = {
            visibleNavItems: [],
            activeTab: 'test',
            onTabChange: vi.fn(),
            onViewDashboard: vi.fn(),
            onManualRefresh: vi.fn(async () => true),
            isRefreshing: false,
            onLogout: vi.fn()
        };

        render(<AdminSidebar {...props} />);

        // The footer buttons are Logout, Theme Toggle, View Leaderboard
        const buttons = screen.getAllByRole('button');
        const logoutButton = buttons.find(b => b.textContent?.includes('logout'));
        const themeButton = buttons.find(b => b.textContent?.includes('light_mode') || b.textContent?.includes('dark_mode'));

        // Current: p-2.5 (10px all around)
        // Proposed: py-1.5 px-2.5 (6px top/bottom, 10px left/right)
        expect(logoutButton?.className).toContain('py-1.5');
        expect(logoutButton?.className).not.toContain('p-2.5');
        
        expect(themeButton?.className).toContain('py-1.5');
    });
});

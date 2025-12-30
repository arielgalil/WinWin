import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { AdminLayout } from '../AdminLayout';

// Mock hooks
vi.mock('@/hooks/useLanguage', () => ({
    useLanguage: () => ({ t: (key: string) => key, dir: 'rtl', language: 'he' })
}));

vi.mock('@/hooks/useTheme', () => ({
    useTheme: () => ({ theme: 'dark', toggleTheme: vi.fn() })
}));

vi.mock('@/hooks/useAuth', () => ({
    useAuth: () => ({ user: { role: 'admin' }, logout: vi.fn() })
}));

vi.mock('@/hooks/useCampaign', () => ({
    useCampaign: () => ({ campaignId: '1', campaign: { id: '1' }, settings: {} })
}));

vi.mock('@/hooks/useCampaignRole', () => ({
    useCampaignRole: () => ({ campaignRole: 'admin' })
}));

describe('AdminLayout Header Buttons Hover', () => {
    it('header buttons have a hover scale effect', () => {
        const props: any = {
            children: <div />,
            user: { full_name: 'Test User' },
            activeTab: 'settings',
            onTabChange: vi.fn(),
            onViewDashboard: vi.fn(),
            onLogout: vi.fn(),
            onShare: vi.fn(),
            onManualRefresh: vi.fn(),
            isRefreshing: false,
            headerConfig: { icon: () => <div />, colorVar: '--primary', title: 'Title', desc: 'Desc' }
        };

        render(<AdminLayout {...props} />);

        // The buttons are Refresh, Share, Theme Toggle
        const buttons = screen.getAllByRole('button');
        const refreshButton = buttons.find(b => b.getAttribute('title') === 'refresh' && b.closest('header.hidden.md\\:flex'));
        const shareButton = buttons.find(b => b.getAttribute('title') === 'copy_link' && b.closest('header.hidden.md\\:flex'));
        const themeButton = buttons.find(b => b.getAttribute('title') === 'toggle_theme' && b.closest('header.hidden.md\\:flex'));

        expect(refreshButton?.className).toContain('hover:scale-110');
        expect(shareButton?.className).toContain('hover:scale-110');
        expect(themeButton?.className).toContain('hover:scale-110');
    });
});

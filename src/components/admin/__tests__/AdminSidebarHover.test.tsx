import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { AdminLayout } from '../../AdminLayout';

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

describe('AdminLayout Sidebar Hover', () => {
    it('navigation items have a hover scale effect', () => {
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

        // Navigation items in AdminLayout use t('tab_settings') etc.
        // tab_points is visible to all roles
        const navButton = screen.getByText('tab_points').closest('button');
        
        expect(navButton?.className).toContain('hover:scale-105');
        expect(navButton?.className).toContain('hover:bg-accent');
    });
});

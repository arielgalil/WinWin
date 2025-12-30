import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { AdminLayout } from '../AdminLayout';

// Mock hooks
vi.mock('@/hooks/useLanguage', () => ({
    useLanguage: () => ({ t: (key: string) => key, dir: 'rtl', language: 'he' })
}));

vi.mock('@/hooks/useTheme', () => ({
    useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() })
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

describe('AdminLayout Avatar Visibility', () => {
    it('avatar has visible border and background in light mode', () => {
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

        // The initials for "Test User" should be "TU"
        const avatar = screen.getByText('TU');

        expect(avatar.className).toContain('ring-2');
        expect(avatar.className).toContain('ring-primary');
        expect(avatar.className).toContain('border-2');
        
        // Ensure it has a background that is visible
        expect(avatar.className).toContain('bg-gradient-to-br');
    });
});

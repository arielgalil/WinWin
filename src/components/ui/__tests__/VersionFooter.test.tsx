import { render, screen } from '@testing-library/react';
import { VersionFooter } from '../VersionFooter';
import { useAuth } from '../../../hooks/useAuth';
import { useCampaign } from '../../../hooks/useCampaign';
import { useCampaignRole } from '../../../hooks/useCampaignRole';
import { useLanguage } from '../../../hooks/useLanguage';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('../../../hooks/useAuth');
vi.mock('../../../hooks/useCampaign');
vi.mock('../../../hooks/useCampaignRole');
vi.mock('../../../hooks/useLanguage');
vi.mock('../Icons', () => ({
    CrownIcon: () => <div data-testid="crown-icon" />,
    CalculatorIcon: () => <div data-testid="calculator-icon" />,
    SproutIcon: () => <div data-testid="sprout-icon" />,
    TrophyIcon: () => <div data-testid="trophy-icon" />,
    Volume2Icon: () => <div data-testid="volume2-icon" />,
    VolumeXIcon: () => <div data-testid="volumex-icon" />,
    ZapIcon: () => <div data-testid="zap-icon" />,
    ShieldAlertIcon: () => <div data-testid="shield-icon" />,
    LockIcon: () => <div data-testid="lock-icon" />,
    SettingsIcon: () => <div data-testid="settings-icon" />,
    LogoutIcon: () => <div data-testid="logout-icon" />,
    XIcon: () => <div data-testid="x-icon" />
}));
vi.mock('../DebugConsole', () => ({
    DebugConsole: () => <div data-testid="debug-console" />
}));

describe('VersionFooter Layout', () => {
    beforeEach(() => {
        vi.mocked(useAuth).mockReturnValue({
            user: null,
            logout: vi.fn(),
            login: vi.fn(),
            loading: false
        } as any);
        vi.mocked(useCampaign).mockReturnValue({ campaignId: 'test-camp' } as any);
        vi.mocked(useCampaignRole).mockReturnValue({ campaignRole: 'user' } as any);
        vi.mocked(useLanguage).mockReturnValue({ t: (key: string) => key } as any);
    });

    it('renders the footer container', () => {
        render(<VersionFooter />);
        const footer = screen.getByRole('contentinfo');
        expect(footer).toBeDefined();
    });

    it('does not contain decorative lines (Red Phase - Expected to fail if lines exist)', () => {
        render(<VersionFooter />);
        const footer = screen.getByRole('contentinfo');
        
        // Check for common line-related classes
        const lines = footer.querySelectorAll('.border-l, .border-r, .w-px');
        expect(lines.length).toBe(0);
    });

    it('uses uniform spacing (Red Phase - Expected to fail if uneven gaps exist)', () => {
        const { container } = render(<VersionFooter />);
        const nav = container.querySelector('nav');
        
        // In the current implementation, it uses various gap-X and margin classes
        // A uniform layout should ideally use a consistent gap on the container
        const navClasses = nav?.className || '';
        expect(navClasses).toContain('gap-4'); // Or whatever uniform gap we choose
        expect(navClasses).not.toContain('ml-3');
        expect(navClasses).not.toContain('mr-2');
    });
});

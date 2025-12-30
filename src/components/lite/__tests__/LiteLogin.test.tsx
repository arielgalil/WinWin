import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LiteLogin } from '../LiteLogin';
import { AppSettings } from '../../../types';
import { AuthProvider } from '../../../contexts/AuthContext';

vi.mock('../../../hooks/useLanguage', () => ({
  useLanguage: () => ({
    t: (key: string, params?: any) => {
      if (key === 'login_platform_title') return `Login to ${params.app_name}`;
      return key;
    },
  }),
}));

vi.mock('../../ui/VersionFooter', () => ({
    VersionFooter: () => <div data-testid="version-footer" />
}));

vi.mock('../../ui/Logo', () => ({
    Logo: ({ src, className }: { src?: string; className?: string }) => (
        <div className={className}>
            <img src={src} alt="logo" />
        </div>
    )
}));

const mockSettings: AppSettings = {
    id: '1',
    school_name: 'Test School',
    competition_name: 'Test Competition',
    logo_url: 'http://example.com/logo.png',
};

const renderWithProviders = (ui: React.ReactNode) => {
    return render(<AuthProvider>{ui}</AuthProvider>);
}

describe('LiteLogin with Campaign Context', () => {
    it('should display campaign-specific branding when settings are provided', () => {
        renderWithProviders(<LiteLogin onLogin={vi.fn()} loading={false} settings={mockSettings} />);
        
        expect(screen.getByText('Test Competition')).toBeInTheDocument();
        
        const logo = screen.getByRole('img', { name: /logo/i });
        expect(logo).toHaveAttribute('src', 'http://example.com/logo.png');
        
        const logoContainer = logo.parentElement;
        expect(logoContainer).toHaveClass('bg-white');
    });

    it('should display campaign name even if logo is missing', () => {
        const settingsWithoutLogo = { ...mockSettings, logo_url: undefined };
        renderWithProviders(<LiteLogin onLogin={vi.fn()} loading={false} settings={settingsWithoutLogo} />);

        expect(screen.getByText('Test Competition')).toBeInTheDocument();
        const logo = screen.getByRole('img', { name: /logo/i });
        expect(logo).not.toHaveAttribute('src');
    });
});

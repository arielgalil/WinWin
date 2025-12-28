import { render, screen } from '@testing-library/react';
import { AdminPanel } from '../AdminPanel';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { ToastProvider } from '../../hooks/useToast';

// Mock dependencies
vi.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: vi.fn(), setTheme: vi.fn() })
}));

vi.mock('../../hooks/useLanguage', () => ({
  useLanguage: () => ({ 
    t: (key: string) => key, 
    language: 'he', 
    dir: 'rtl',
    isRTL: true 
  })
}));

vi.mock('../../hooks/useCampaign', () => ({
  useCampaign: () => ({
    campaign: { 
      id: 'test-camp', 
      name: 'תחרות בדיקה', 
      is_active: true,
      institution: {
        logo_url: 'institution-logo.png',
        name: 'מוסד בדיקה'
      }
    },
    settings: { school_name: 'בית ספר בדיקה', logo_url: 'test-logo.png' },
    isLoadingCampaign: false
  })
}));

vi.mock('../../hooks/useClasses', () => ({
  useClasses: () => ({ classes: [], isLoading: false })
}));

vi.mock('../../hooks/useTicker', () => ({
  useTicker: () => ({ tickerMessages: [], isLoading: false })
}));

vi.mock('../../hooks/useLogs', () => ({
  useLogs: () => ({ logs: [], isLoading: false, fetchNextPage: vi.fn() })
}));

vi.mock('../../hooks/useCompetitionMutations', () => ({
  useCompetitionMutations: () => ({
    deleteLog: vi.fn(),
    updateLog: vi.fn(),
    updateClassTarget: vi.fn(),
    updateSettingsGoals: vi.fn(),
    updateTabTimestamp: vi.fn(),
    refreshData: vi.fn()
  })
}));

vi.mock('../admin/AdminMobileMenu', () => ({
  AdminMobileMenu: () => <div data-testid="mobile-menu" />
}));

vi.mock('../admin/AdminSidebar', () => ({
  AdminSidebar: () => <div data-testid="sidebar" />
}));

vi.mock('../ui/VersionFooter', () => ({
  VersionFooter: () => <div data-testid="footer" />
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ slug: 'test-slug', tab: 'settings' }),
    useNavigate: () => vi.fn(),
  };
});

const mockUser = {
  id: '1',
  full_name: 'מנהל תחרות',
  role: 'admin',
};

describe('AdminPanel Header Improvements', () => {
  const defaultProps = {
    user: mockUser as any,
    onLogout: vi.fn(),
    onViewDashboard: vi.fn(),
    isAdmin: true,
  };

  it('displays "מנהל תחרות" instead of "Administrator"', () => {
    render(
      <BrowserRouter>
        <ToastProvider>
          <LanguageProvider>
            <AdminPanel {...defaultProps} />
          </LanguageProvider>
        </ToastProvider>
      </BrowserRouter>
    );
    // Should find Hebrew version
    expect(screen.getAllByText('מנהל תחרות').length).toBeGreaterThan(0);
    // Should NOT find English version "Administrator"
    expect(screen.queryByText('Administrator')).toBeNull();
  });

  it('displays the competition name instead of "Admin Console"', () => {
    render(
      <BrowserRouter>
        <ToastProvider>
          <LanguageProvider>
            <AdminPanel {...defaultProps} />
          </LanguageProvider>
        </ToastProvider>
      </BrowserRouter>
    );
    // "תחרות בדיקה" comes from currentCampaign.name
    expect(screen.getByText('תחרות בדיקה')).toBeDefined();
    expect(screen.queryByText('Admin Console')).toBeNull();
  });

  it('renders the institution logo when available', () => {
    render(
      <BrowserRouter>
        <ToastProvider>
          <LanguageProvider>
            <AdminPanel {...defaultProps} />
          </LanguageProvider>
        </ToastProvider>
      </BrowserRouter>
    );
    
    // The Logo component should be called with institution-logo.png
    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toBe('institution-logo.png');
  });

  it('renders the User Profile with Name and Role', () => {
    render(
      <BrowserRouter>
        <ToastProvider>
          <LanguageProvider>
            <AdminPanel {...defaultProps} />
          </LanguageProvider>
        </ToastProvider>
      </BrowserRouter>
    );
    
    // Should display full name
    expect(screen.getByText('מנהל תחרות')).toBeDefined();
    
    // Should display role (role_admin translation is "role_admin" in mock)
    expect(screen.getByText('role_admin')).toBeDefined();
  });

  it('renders a non-clickable logo in the header', () => {
    const { container } = render(
      <BrowserRouter>
        <ToastProvider>
          <LanguageProvider>
            <AdminPanel {...defaultProps} />
          </LanguageProvider>
        </ToastProvider>
      </BrowserRouter>
    );
    
    // Find the logo container (the one with the primary-base background)
    const logoContainer = Array.from(container.querySelectorAll('div')).find(el => 
      el.className.includes('bg-[var(--primary-base)]')
    );
    expect(logoContainer).toBeDefined();
    
    // It should not have cursor-pointer or onClick if it's static
    expect(logoContainer?.classList.contains('cursor-pointer')).toBe(false);
  });
});

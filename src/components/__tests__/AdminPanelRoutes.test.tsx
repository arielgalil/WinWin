import { render, screen } from '@testing-library/react';
import { AdminPanel } from '../AdminPanel';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
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
    campaign: { id: 'test-camp', name: 'תחרות בדיקה', is_active: true },
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

const mockUser = {
  id: '1',
  full_name: 'מנהל תחרות',
  role: 'admin',
};

describe('AdminPanel Route Mapping', () => {
  const defaultProps = {
    user: mockUser as any,
    onLogout: vi.fn(),
    onViewDashboard: vi.fn(),
    isAdmin: true,
  };

  it('maps legacy "school" tab to "settings"', () => {
    render(
      <MemoryRouter initialEntries={['/admin/test-slug/school']}>
        <ToastProvider>
          <LanguageProvider>
            <Routes>
              <Route path="/admin/:slug/:tab" element={<AdminPanel {...defaultProps} />} />
            </Routes>
          </LanguageProvider>
        </ToastProvider>
      </MemoryRouter>
    );
    
    // Header should show settings title
    expect(screen.getByText('tab_settings')).toBeDefined();
  });

  it('uses "settings" directly', () => {
    render(
      <MemoryRouter initialEntries={['/admin/test-slug/settings']}>
        <ToastProvider>
          <LanguageProvider>
            <Routes>
              <Route path="/admin/:slug/:tab" element={<AdminPanel {...defaultProps} />} />
            </Routes>
          </LanguageProvider>
        </ToastProvider>
      </MemoryRouter>
    );
    
    expect(screen.getByText('tab_settings')).toBeDefined();
  });
});

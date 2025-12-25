import { render, screen } from '@testing-library/react';
import { AdminPanel } from '../AdminPanel';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider } from '../../contexts/LanguageContext';

// Mock dependencies

vi.mock('../../hooks/useLanguage', () => ({

  useLanguage: () => ({ 

    t: (key: string) => key, 

    language: 'he', 

    dir: 'rtl',

    isRTL: true 

  })

}));



vi.mock('../../hooks/useCompetitionData', () => ({

  useCompetitionData: () => ({

    logs: [],

    loadMoreLogs: vi.fn(),

    deleteLog: vi.fn(),

    updateLog: vi.fn(),

    currentCampaign: { is_active: true, name: 'תחרות בדיקה' },

    updateClassTarget: vi.fn(),

    updateSettingsGoals: vi.fn(),

    updateTabTimestamp: vi.fn(),

    refreshData: vi.fn(),

    tickerMessages: [],

    addTickerMessage: vi.fn(),

    deleteTickerMessage: vi.fn(),

    updateTickerMessage: vi.fn(),

  })

}));



vi.mock('../../hooks/useCompetitionDataNew', () => ({



  useCompetitionData: () => ({})



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

const mockSettings = {
  school_name: 'בית ספר בדיקה',
  logo_url: 'test-logo.png',
};

describe('AdminPanel Header Improvements', () => {
  const defaultProps = {
    user: mockUser as any,
    classes: [],
    settings: mockSettings as any,
    onAddPoints: vi.fn(),
    onLogout: vi.fn(),
    onRefreshData: vi.fn(),
    onViewDashboard: vi.fn(),
    isAdmin: true,
  };

  it('displays "מנהל תחרות" instead of "Administrator"', () => {
    render(
      <BrowserRouter>
        <LanguageProvider>
          <AdminPanel {...defaultProps} />
        </LanguageProvider>
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
        <LanguageProvider>
          <AdminPanel {...defaultProps} />
        </LanguageProvider>
      </BrowserRouter>
    );
    // "תחרות בדיקה" comes from currentCampaign.name
    expect(screen.getByText('תחרות בדיקה')).toBeDefined();
    expect(screen.queryByText('Admin Console')).toBeNull();
  });

  it('renders a non-clickable logo', () => {
    const { container } = render(
      <BrowserRouter>
        <LanguageProvider>
          <AdminPanel {...defaultProps} />
        </LanguageProvider>
      </BrowserRouter>
    );
    
    // Find the logo container (the one with the gradient)
    const logoContainer = Array.from(container.querySelectorAll('div')).find(el => 
      el.className.includes('shadow-indigo-500/20')
    );
    expect(logoContainer).toBeDefined();
    
    // It should not have cursor-pointer or onClick if it's static
    // (Wait, the spec says "remove the 'back to competition' button functionality")
    expect(logoContainer?.classList.contains('cursor-pointer')).toBe(false);
  });
});

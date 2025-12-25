import { render, screen } from '@testing-library/react';
import { AdminPanel } from '../AdminPanel';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider } from '../../contexts/LanguageContext';
import * as ReactRouterDOM from 'react-router-dom';

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
    currentCampaign: { is_active: true, name: 'תחרות בדיקה' },
    refreshData: vi.fn(),
    tickerMessages: [],
    updateTickerMessage: vi.fn(),
  })
}));

vi.mock('../admin/AdminSidebar', () => ({
  AdminSidebar: ({ activeTab }: any) => <div data-testid="sidebar" data-active-tab={activeTab} />
}));

vi.mock('../admin/AdminMobileMenu', () => ({
  AdminMobileMenu: () => <div data-testid="mobile-menu" />
}));

vi.mock('../ui/VersionFooter', () => ({
  VersionFooter: () => <div data-testid="footer" />
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(),
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
};

describe('AdminPanel Route Mapping', () => {
  const defaultProps = {
    user: mockUser as any,
    classes: [],
    settings: mockSettings as any,
    onAddPoints: vi.fn(),
    onLogout: vi.fn(),
    onRefreshData: vi.fn(),
    onViewDashboard: vi.fn(),
  };

  it('does NOT map "school" tab to "settings" anymore', () => {
    vi.mocked(ReactRouterDOM.useParams).mockReturnValue({ slug: 'test-slug', tab: 'school' });
    
    render(
      <BrowserRouter>
        <LanguageProvider>
          <AdminPanel {...defaultProps} />
        </LanguageProvider>
      </BrowserRouter>
    );
    
    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar.getAttribute('data-active-tab')).not.toBe('settings');
    expect(sidebar.getAttribute('data-active-tab')).toBe('school');
  });

  it('uses "settings" directly', () => {
    vi.mocked(ReactRouterDOM.useParams).mockReturnValue({ slug: 'test-slug', tab: 'settings' });
    
    render(
      <BrowserRouter>
        <LanguageProvider>
          <AdminPanel {...defaultProps} />
        </LanguageProvider>
      </BrowserRouter>
    );
    
    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar.getAttribute('data-active-tab')).toBe('settings');
  });
});

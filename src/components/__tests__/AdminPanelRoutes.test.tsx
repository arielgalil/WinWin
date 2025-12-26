import { render, screen } from '@testing-library/react';
import { AdminPanel } from '../AdminPanel';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { ToastProvider } from '../../hooks/useToast';
import { ThemeProvider } from '../../contexts/ThemeContext';

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

const mockSettings = {
  school_name: 'בית ספר בדיקה',
  logo_url: 'test-logo.png',
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
    isAdmin: true,
  };

  it('maps legacy "school" tab to "settings"', () => {
    render(
      <MemoryRouter initialEntries={['/admin/test-slug/school']}>
        <ThemeProvider>
          <ToastProvider>
            <LanguageProvider>
              <Routes>
                <Route path="/admin/:slug/:tab" element={<AdminPanel {...defaultProps} />} />
              </Routes>
            </LanguageProvider>
          </ToastProvider>
        </ThemeProvider>
      </MemoryRouter>
    );
    
    // Header should show settings title
    expect(screen.getByText('tab_settings')).toBeDefined();
  });

  it('uses "settings" directly', () => {
    render(
      <MemoryRouter initialEntries={['/admin/test-slug/settings']}>
        <ThemeProvider>
          <ToastProvider>
            <LanguageProvider>
              <Routes>
                <Route path="/admin/:slug/:tab" element={<AdminPanel {...defaultProps} />} />
              </Routes>
            </LanguageProvider>
          </ToastProvider>
        </ThemeProvider>
      </MemoryRouter>
    );
    
    expect(screen.getByText('tab_settings')).toBeDefined();
  });
});
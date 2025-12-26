import { render, screen, fireEvent } from '@testing-library/react';
import { AdminPanel } from '../AdminPanel';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider } from '../../contexts/LanguageContext';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { ToastProvider } from '../../hooks/useToast';
import * as sharingUtils from '../../utils/sharingUtils';

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
    currentCampaign: { id: 'camp1', name: 'תחרות בדיקה', slug: 'test-slug', is_active: true },
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

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ slug: 'test-slug', tab: 'settings' }),
    useNavigate: () => vi.fn(),
  };
});

// Mock clipboard
const writeTextMock = vi.fn().mockResolvedValue(undefined);
Object.assign(navigator, {
  clipboard: {
    writeText: writeTextMock,
  },
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

describe('AdminPanel Sharing', () => {
  const defaultProps = {
    user: mockUser as any,
    classes: [],
    settings: mockSettings as any,
    onAddPoints: vi.fn(),
    onLogout: vi.fn(),
    onRefreshData: vi.fn(),
    onViewDashboard: vi.fn(),
    isAdmin: true,
    campaignRole: 'admin' as any
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a share button in the header', () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <ToastProvider>
            <LanguageProvider>
              <AdminPanel {...defaultProps} />
            </LanguageProvider>
          </ToastProvider>
        </ThemeProvider>
      </BrowserRouter>
    );
    
    const shareButton = screen.getByTitle('copy_link');
    expect(shareButton).toBeDefined();
  });

  it('calls clipboard.writeText with role-based message when clicked', async () => {
    const spy = vi.spyOn(sharingUtils, 'generateRoleBasedShareMessage').mockReturnValue('Mocked Share Message');
    
    render(
      <BrowserRouter>
        <ThemeProvider>
          <ToastProvider>
            <LanguageProvider>
              <AdminPanel {...defaultProps} />
            </LanguageProvider>
          </ToastProvider>
        </ThemeProvider>
      </BrowserRouter>
    );
    
    const shareButton = screen.getByTitle('copy_link');
    fireEvent.click(shareButton);
    
    expect(spy).toHaveBeenCalled();
    expect(writeTextMock).toHaveBeenCalledWith('Mocked Share Message');
  });
});
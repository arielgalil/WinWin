import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, test, vi, beforeEach } from 'vitest';
import React from 'react';
import { Settings, Users, Target, CalculatorIcon, ClockIcon, Share2, RefreshCw, Sun, Moon, ArrowLeft, LogOut } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { VersionFooter } from '../ui/VersionFooter';
import { SaveNotificationBadge, useSaveNotification } from '@/contexts/SaveNotificationContext';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils'; // Import cn directly for testing

// Mock hooks and components BEFORE importing AdminLayout
vi.mock('@/lib/utils', () => ({
  cn: vi.fn((...args) => args.filter(Boolean).join(' ')), // Mock cn
}));

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: vi.fn(() => ({
    dir: 'ltr',
    t: (key: string) => {
      if (key === 'toggle_light_mode') return 'Toggle Light Mode';
      if (key === 'toggle_dark_mode') return 'Toggle Dark Mode';
      if (key === 'return_to_dashboard') return 'Return to Dashboard';
      if (key === 'logout') return 'Logout';
      if (key === 'refresh') return 'Refresh';
      if (key === 'copy_link') return 'Copy Link';
      if (key === 'tab_settings') return 'Settings';
      if (key === 'tab_data_management') return 'Data Management';
      if (key === 'tab_goals') return 'Goals';
      if (key === 'tab_points') return 'Points';
      if (key === 'tab_logs') return 'Logs';
      return key;
    },
    language: 'en'
  })),
}));

vi.mock('@/hooks/useTheme', () => ({
  useTheme: vi.fn(() => ({ theme: 'light', toggleTheme: vi.fn() })),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({ user: mockUser, loading: false, isAuthenticated: true })),
}));

vi.mock('../ui/Logo', () => ({
  Logo: vi.fn(({ src, className, fallbackIcon, padding }) => (
    <div data-testid="mock-logo" data-src={src || 'default_logo.png'} data-class={className} data-fallback={fallbackIcon} data-padding={padding}>Mock Logo</div>
  )),
}));

vi.mock('../ui/VersionFooter', () => ({
  VersionFooter: vi.fn(() => <div data-testid="mock-version-footer">Mock Version Footer</div>),
}));

vi.mock('@/contexts/SaveNotificationContext', () => ({
  SaveNotificationBadge: vi.fn(() => null),
  useSaveNotification: vi.fn(() => ({ notifications: new Map(), dismiss: vi.fn() })),
}));

// NOW import AdminLayout after all mocks are set up
import { AdminLayout } from '../AdminLayout';

const mockNavItems = [
  { id: 'settings', label: 'Settings', icon: Settings, adminOnly: true },
  { id: 'data-management', label: 'Data Management', icon: Users, adminOnly: true },
  { id: 'divider-1', divider: true, label: '', icon: () => null, adminOnly: false },
  { id: 'goals', label: 'Goals', icon: Target, adminOnly: true },
  { id: 'points', label: 'Points', icon: CalculatorIcon, adminOnly: false },
  { id: 'divider-2', divider: true, label: '', icon: () => null, adminOnly: false },
  { id: 'logs', label: 'Logs', icon: ClockIcon, adminOnly: false },
];

const mockUser = {
  id: '1',
  full_name: 'Test User',
  email: 'test@example.com',
  role: 'admin',
  campaign_id: '1',
  created_at: '',
};

const mockCampaign = {
  id: '1',
  name: 'Test Campaign',
  is_active: true,
  institution: { logo_url: 'logo.png' },
};

const mockSettings = {
  id: '1',
  school_name: 'Test School',
  logo_url: 'school_logo.png',
};

const mockHeaderConfig = {
  icon: Settings,
  colorVar: 'blue',
  title: 'Settings',
  desc: 'Manage settings',
};

// beforeEach to reset individual mock return values if needed for specific tests
beforeEach(() => {
  (useLanguage as any).mockReturnValue({
    dir: 'ltr',
    t: (key: string) => {
      if (key === 'toggle_light_mode') return 'Toggle Light Mode';
      if (key === 'toggle_dark_mode') return 'Toggle Dark Mode';
      if (key === 'return_to_dashboard') return 'Return to Dashboard';
      if (key === 'logout') return 'Logout';
      if (key === 'refresh') return 'Refresh';
      if (key === 'copy_link') return 'Copy Link';
      if (key === 'tab_settings') return 'Settings';
      if (key === 'tab_data_management') return 'Data Management';
      if (key === 'tab_goals') return 'Goals';
      if (key === 'tab_points') return 'Points';
      if (key === 'tab_logs') return 'Logs';
      return key;
    },
    language: 'en'
  });
  (useTheme as any).mockReturnValue({ theme: 'light', toggleTheme: vi.fn() });
  (useAuth as any).mockReturnValue({ user: mockUser, loading: false, isAuthenticated: true });
  (useSaveNotification as any).mockReturnValue({ notifications: new Map(), dismiss: vi.fn() });
  Logo.mockClear();
  VersionFooter.mockClear();
  SaveNotificationBadge.mockClear();
  (cn as any).mockClear();
});

test('AdminLayout renders children and desktop sidebar', () => {
  render(
    <AdminLayout
      user={mockUser}
      campaignRole="admin"
      activeTab="settings"
      onTabChange={vi.fn()}
      onViewDashboard={vi.fn()}
      onLogout={vi.fn()}
      onShare={vi.fn()}
      onManualRefresh={vi.fn()}
      isRefreshing={false}
      campaign={mockCampaign}
      settings={mockSettings}
      headerConfig={mockHeaderConfig}
      activeNotification={null}
      dismissNotification={vi.fn()}
    >
      <div data-testid="child-content">Test Child Content</div>
    </AdminLayout>
  );
  
  expect(screen.getByTestId('child-content')).toBeDefined();
  expect(screen.getByRole('heading', { name: 'WinWin Admin', level: 1 })).toBeDefined();
  expect(screen.getByText('Test User')).toBeDefined();
  expect(screen.getByRole('button', { name: 'Settings' })).toBeDefined(); // NavLink from sidebar
  expect(screen.getByRole('heading', { name: 'Test School', level: 1 })).toBeDefined(); // Header School Name
});

test('AdminLayout mobile header opens and closes sidebar', async () => {
  (useLanguage as any).mockReturnValue({ dir: 'ltr', t: (key: string) => key, language: 'en' });
  render(
    <AdminLayout
      user={mockUser}
      campaignRole="admin"
      activeTab="settings"
      onTabChange={vi.fn()}
      onViewDashboard={vi.fn()}
      onLogout={vi.fn()}
      onShare={vi.fn()}
      onManualRefresh={vi.fn()}
      isRefreshing={false}
      campaign={mockCampaign}
      settings={mockSettings}
      headerConfig={mockHeaderConfig}
      activeNotification={null}
      dismissNotification={vi.fn()}
    >
      <div data-testid="child-content">Test Child Content</div>
    </AdminLayout>
  );

  // Mobile menu trigger button should be visible on small screens (lg:hidden)
  const menuButton = screen.getByRole('button', { name: 'Open sidebar' });
  fireEvent.click(menuButton);

  await waitFor(() => {
    expect(screen.getByRole('heading', { name: 'WinWin Admin', level: 2 })).toBeVisible(); // Sidebar content
  });
  
  const closeButton = screen.getByRole('button', { name: 'Close' });
  fireEvent.click(closeButton);

  await waitFor(() => {
    expect(screen.queryByRole('heading', { name: 'WinWin Admin', level: 2 })).not.toBeInTheDocument();
  });
});

test('AdminLayout mobile header handles theme toggle', () => {
  const toggleTheme = vi.fn();
  (useTheme as any).mockReturnValue({ theme: 'light', toggleTheme });
  render(
    <AdminLayout
      user={mockUser}
      campaignRole="admin"
      activeTab="settings"
      onTabChange={vi.fn()}
      onViewDashboard={vi.fn()}
      onLogout={vi.fn()}
      onShare={vi.fn()}
      onManualRefresh={vi.fn()}
      isRefreshing={false}
      campaign={mockCampaign}
      settings={mockSettings}
      headerConfig={mockHeaderConfig}
      activeNotification={null}
      dismissNotification={vi.fn()}
    >
      <div data-testid="child-content">Test Child Content</div>
    </AdminLayout>
  );

  const themeToggleButton = screen.getByRole('button', { name: 'toggle_theme' }); // Uses the mocked t() value
  fireEvent.click(themeToggleButton);
  expect(toggleTheme).toHaveBeenCalled();
});

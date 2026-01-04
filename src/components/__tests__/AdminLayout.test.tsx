import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, test, vi, beforeEach } from 'vitest';
import { AdminLayout } from '../AdminLayout';
import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { Settings, Users, Target, CalculatorIcon, ClockIcon } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { VersionFooter } from '../ui/VersionFooter';
import { SaveNotificationBadge } from '@/components/ui/SaveNotificationBadge';
import { useSaveNotification } from '@/contexts/SaveNotificationContext';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

// Mock hooks and components
vi.mock('@/lib/utils', () => ({
  cn: vi.fn((...args) => args.filter(Boolean).join(' ')),
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
      if (key === 'toggle_theme') return 'Toggle theme';
      if (key === 'admin_panel') return 'Admin Panel';
      if (key === 'collapse') return 'collapse';
      if (key === 'expand') return 'expand';
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
vi.mock('@/components/ui/SaveNotificationBadge', () => ({
  SaveNotificationBadge: vi.fn(() => null),
}));
vi.mock('@/contexts/SaveNotificationContext', () => ({
  useSaveNotification: vi.fn(() => ({ notifications: new Map(), dismiss: vi.fn() })),
}));

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
      if (key === 'toggle_theme') return 'Toggle theme';
      if (key === 'admin_panel') return 'Admin Panel';
      if (key === 'collapse') return 'collapse';
      if (key === 'expand') return 'expand';
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
  expect(screen.getByRole('heading', { name: /Admin Panel|admin_panel/i, level: 1 })).toBeDefined();
  expect(screen.getByText('Test User')).toBeDefined();
  expect(screen.getByRole('button', { name: 'Settings' })).toBeDefined();
  expect(screen.getByRole('heading', { name: 'Test School' })).toBeDefined();
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

  const menuButton = screen.getByRole('button', { name: 'Open sidebar' });
  fireEvent.click(menuButton);

  await waitFor(() => {
    expect(screen.getByRole('heading', { name: /Admin Panel|admin_panel/i })).toBeVisible();
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

  const themeToggleButtons = screen.getAllByRole('button', { name: 'Toggle theme' });
  fireEvent.click(themeToggleButtons[0]);
  expect(toggleTheme).toHaveBeenCalled();
});

test('AdminLayout main content area has high-energy gradient class', () => {
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
  
  const mainContent = screen.getByRole('main');
  expect(mainContent.className).toContain('bg-gradient-high-energy');
});

test('AdminLayout desktop sidebar collapses and expands', async () => {
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

  // Initially visible
  expect(screen.getByText(/Admin Panel|admin_panel/i)).toBeVisible();

  // Find toggle button - now in the header with a Menu icon
  // It has a title derived from t('collapse') which we mocked
  const toggleBtn = screen.getByTitle('collapse');
  fireEvent.click(toggleBtn);

  // After click, "Admin Panel" should be hidden or removed from the DOM
  await waitFor(() => {
    expect(screen.queryByText(/Admin Panel|admin_panel/i)).not.toBeInTheDocument();
  });

  // Click again to expand (title should now be 'expand')
  const expandBtn = screen.getByTitle('expand');
  fireEvent.click(expandBtn);

  await waitFor(() => {
    expect(screen.getByText(/Admin Panel|admin_panel/i)).toBeVisible();
  });
});
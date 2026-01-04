import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test, vi, beforeEach } from 'vitest';
import { WorkspaceLayout } from '../WorkspaceLayout';
import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { Settings, Users, Target } from 'lucide-react';

// Mock hooks and components
vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: vi.fn(() => ({
    dir: 'ltr',
    t: (key: string) => key,
    language: 'en'
  })),
}));

vi.mock('@/hooks/useTheme', () => ({
  useTheme: vi.fn(() => ({ theme: 'light', toggleTheme: vi.fn() })),
}));

vi.mock('@/hooks/useLocalStorage', () => ({
  useLocalStorage: vi.fn((key, initialValue) => [initialValue, vi.fn()]),
}));

vi.mock('../../ui/Logo', () => ({
  Logo: vi.fn(({ src }) => <div data-testid="mock-logo">{src}</div>),
}));

vi.mock('../../ui/VersionFooter', () => ({
  VersionFooter: vi.fn(() => <div data-testid="mock-version-footer">Mock Version Footer</div>),
}));

const mockUser = {
  full_name: 'Test User',
  initials: 'TU',
  roleLabel: 'Admin',
};

const mockInstitution = {
  name: 'Test School',
  logoUrl: 'logo.png',
};

const mockNavItems = [
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'users', label: 'Users', icon: Users },
  { divider: true, id: 'div-1', label: '', icon: () => null },
  { id: 'goals', label: 'Goals', icon: Target },
];

const mockBreadcrumbs = [
  { label: 'Breadcrumb-Admin', href: '/admin' },
  { label: 'Breadcrumb-Settings' },
];

beforeEach(() => {
  vi.clearAllMocks();
});

test('WorkspaceLayout renders children and navigation', () => {
  render(
    <WorkspaceLayout
      user={mockUser}
      institution={mockInstitution}
      navItems={mockNavItems}
      activeTab="settings"
      onTabChange={vi.fn()}
      onViewDashboard={vi.fn()}
      onLogout={vi.fn()}
    >
      <div data-testid="child-content">Test Content</div>
    </WorkspaceLayout>
  );

  expect(screen.getByTestId('child-content')).toBeDefined();
  expect(screen.getByText('Test Content')).toBeDefined();
  expect(screen.getByText('Test School')).toBeDefined();
  expect(screen.getByText('Test User')).toBeDefined();
  // Multiple "Settings" might exist (sidebar and breadcrumbs if added)
  // In this test, it's just the nav item.
  expect(screen.getByText('Settings')).toBeDefined();
});

test('WorkspaceLayout renders dynamic header and breadcrumbs', () => {
  render(
    <WorkspaceLayout
      user={mockUser}
      institution={mockInstitution}
      navItems={mockNavItems}
      activeTab="settings"
      onTabChange={vi.fn()}
      onViewDashboard={vi.fn()}
      onLogout={vi.fn()}
      headerTitle="Page Title"
      headerDescription="Page Description"
      headerIcon={Settings}
      breadcrumbs={mockBreadcrumbs}
    >
      <div />
    </WorkspaceLayout>
  );

  expect(screen.getByText('Page Title')).toBeDefined();
  expect(screen.getByText('Page Description')).toBeDefined();
  expect(screen.getByText('Breadcrumb-Admin')).toBeDefined();
  expect(screen.getByText('Breadcrumb-Settings')).toBeDefined();
});

test('WorkspaceLayout handles theme toggle', () => {
  const toggleTheme = vi.fn();
  (useTheme as any).mockReturnValue({ theme: 'light', toggleTheme });

  render(
    <WorkspaceLayout
      user={mockUser}
      institution={mockInstitution}
      navItems={mockNavItems}
      activeTab="settings"
      onTabChange={vi.fn()}
      onViewDashboard={vi.fn()}
      onLogout={vi.fn()}
    >
      <div />
    </WorkspaceLayout>
  );

  const themeToggle = screen.getByRole('button', { name: 'toggle_theme' });
  fireEvent.click(themeToggle);
  expect(toggleTheme).toHaveBeenCalled();
});

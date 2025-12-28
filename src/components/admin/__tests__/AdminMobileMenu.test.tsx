import { render, screen, fireEvent } from '@testing-library/react';
import { AdminMobileMenu } from '../AdminMobileMenu';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

// Mock requirements
vi.mock('../../../hooks/useLanguage', () => ({
  useLanguage: () => ({ t: (key: string) => key, dir: 'rtl' })
}));

const mockToggleTheme = vi.fn();
vi.mock('../../../hooks/useTheme', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: mockToggleTheme })
}));

describe('AdminMobileMenu Theme Toggle', () => {
  const defaultProps = {
    isOpen: true,
    setIsOpen: vi.fn(),
    user: { full_name: 'Test User', role: 'admin' } as any,
    visibleNavItems: [],
    activeTab: 'test',
    onTabChange: vi.fn(),
    onViewDashboard: vi.fn(),
    onManualRefresh: vi.fn(),
    isRefreshing: false,
    onLogout: vi.fn(),
  };

  it('renders theme toggle and calls toggleTheme', () => {
    // This test is expected to fail initially as the toggle is missing in Mobile Menu
    render(<AdminMobileMenu {...defaultProps} />);
    const toggleButton = screen.getByRole('button', { name: /dark_mode/i });
    fireEvent.click(toggleButton);
    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });
});

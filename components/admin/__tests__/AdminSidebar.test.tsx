import { render, screen, fireEvent } from '@testing-library/react';
import { AdminSidebar } from '../AdminSidebar';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

// Mock requirements
vi.mock('../../../hooks/useLanguage', () => ({
  useLanguage: () => ({ t: (key: string) => key, dir: 'rtl' })
}));

const mockToggleTheme = vi.fn();
vi.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'dark', toggleTheme: mockToggleTheme })
}));

describe('AdminSidebar Theme Toggle', () => {
  const defaultProps = {
    visibleNavItems: [],
    activeTab: 'test',
    onTabChange: vi.fn(),
    onViewDashboard: vi.fn(),
    onManualRefresh: vi.fn(),
    isRefreshing: false,
    onLogout: vi.fn(),
  };

  it('calls toggleTheme when theme button is clicked', () => {
    render(<AdminSidebar {...defaultProps} />);
    // In dark mode, it shows SunIcon and "light_mode" text
    const toggleButton = screen.getByText('light_mode');
    fireEvent.click(toggleButton);
    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });
});

import { render, screen } from '@testing-library/react';
import { AdminTable } from '../AdminTable';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

// Mock useLanguage
vi.mock('../../../hooks/useLanguage', () => ({
  useLanguage: () => ({ t: (key: string) => key, dir: 'rtl' })
}));

describe('AdminTable', () => {
  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'role', header: 'Role' },
  ];

  const data = [
    { id: '1', name: 'John Doe', role: 'Admin' },
    { id: '2', name: 'Jane Smith', role: 'User' },
  ];

  it('renders table headers and data correctly on desktop', () => {
    render(<AdminTable columns={columns} data={data} keyField="id" />);
    // Expect multiple because it renders for both desktop (table) and mobile (card) views
    expect(screen.getAllByText('Name').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Role').length).toBeGreaterThan(0);
    expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Admin').length).toBeGreaterThan(0);
  });

  it('renders mobile card view elements', () => {
    // We can't easily test media queries in jsdom, but we can check if the markup for mobile cards exists.
    // Ideally, the component renders both (hiding one via CSS) or uses a resize listener.
    // For this test, we assume the component renders a structure that includes mobile-friendly elements
    // usually hidden by `md:hidden` or similar classes.
    render(<AdminTable columns={columns} data={data} keyField="id" />);
    
    // In mobile card view, labels often appear alongside values
    // We expect to find elements that represent the mobile view structure
    const mobileCards = screen.getAllByRole('article'); // Assuming cards use article tag or similar logic
    expect(mobileCards.length).toBeGreaterThan(0);
  });

  it('handles empty data state', () => {
    render(<AdminTable columns={columns} data={[]} keyField="id" />);
    expect(screen.getByText('no_data_available')).toBeInTheDocument(); // Assuming translation key
  });
});

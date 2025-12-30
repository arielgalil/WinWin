import { render } from '@testing-library/react';
import { ClassTicker } from '../ClassTicker';
import { vi, describe, it, expect } from 'vitest';
import React from 'react';

// Mock Icons
vi.mock('../../ui/Icons', () => ({
  TrophyIcon: (props: any) => <div data-testid="icon" {...props} />,
  CompassIcon: (props: any) => <div data-testid="icon" {...props} />,
  FootprintsIcon: (props: any) => <div data-testid="icon" {...props} />,
  MapIcon: (props: any) => <div data-testid="icon" {...props} />,
  TargetIcon: (props: any) => <div data-testid="icon" {...props} />,
  ListIcon: (props: any) => <div data-testid="icon" {...props} />,
}));

// Mock Language
vi.mock('../../../hooks/useLanguage', () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

// Mock DashboardCardHeader
vi.mock('../DashboardCardHeader', () => ({
    DashboardCardHeader: () => <div data-testid="dashboard-header" />
}));

describe('ClassTicker Icons', () => {
  const mockClasses = [
    { 
        id: '1', 
        name: 'Class A', 
        score: 100, 
        target_score: 200, 
        rank: 1, 
        color: 'bg-red-500',
        uuid: '1',
        institution_id: 1
    },
  ] as any[];

  it('renders icons with updated sizing wrappers (w-8 h-8)', () => {
    const { container } = render(<ClassTicker otherClasses={mockClasses} highlightClassId={null} />);

    // We expect the status icon wrapper to have w-8 h-8.
    // The current implementation uses w-5 h-5.
    const largeWrappers = container.querySelectorAll('.w-8.h-8.rounded-full');
    
    // This expects the fix to be implemented
    expect(largeWrappers.length).toBeGreaterThan(0);
  });
});

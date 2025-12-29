import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StudentLeaderboard } from '../StudentLeaderboard';
import { useAutoScroll } from '../../../hooks/useAutoScroll';
import { useLanguage } from '../../../hooks/useLanguage';
import { AppSettings } from '../../../types';

// Mock the hooks
vi.mock('../../../hooks/useAutoScroll');
vi.mock('../../../hooks/useLanguage');

// Mock components
vi.mock('../../ui/Icons', () => ({
    MedalIcon: () => <div data-testid="medal-icon" />,
    TrendUpIcon: () => <div data-testid="trend-up-icon" />,
    StarIcon: () => <div data-testid="star-icon" />
}));

vi.mock('../../ui/AnimatedCounter', () => ({
    AnimatedCounter: ({ value }: { value: number }) => <span>{value}</span>
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>
    },
    AnimatePresence: ({ children }: any) => <>{children}</>
}));

describe('StudentLeaderboard Group Coloring', () => {
    const mockSettings = {
        institution_type: 'School'
    } as AppSettings;

    const mockTopStudents = [
        { id: '1', name: 'Student 1', score: 100, className: 'Class A', classColor: '#ff0000', rank: 1, trend: 'same' as const }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        (useLanguage as any).mockReturnValue({ t: (key: string) => key });
        (useAutoScroll as any).mockReturnValue({});
    });

    it('applies the group color as background to the group name', () => {
        render(
            <StudentLeaderboard 
                topStudents={mockTopStudents} 
                arenaStudents={[]} 
                settings={mockSettings}
            />
        );

        const groupBadge = screen.getByText('Class A');
        // We expect the style to have backgroundColor: #ff0000
        // Currently it has bg-white/5.
        expect(groupBadge).toHaveStyle({ backgroundColor: '#ff0000' });
    });
});

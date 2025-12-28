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

describe('StudentLeaderboard Component', () => {
    const mockSettings = {
        institution_type: 'School'
    } as AppSettings;

    const mockTopStudents = [
        { id: '1', name: 'Student 1', score: 100, className: 'Class A', classColor: 'red', rank: 1, trend: 'same' as const },
        { id: '2', name: 'Student 2', score: 90, className: 'Class B', classColor: 'blue', rank: 2, trend: 'down' as const }
    ];

    const mockArenaStudents = [
        { id: '3', name: 'Student 3', score: 80, className: 'Class A', classColor: 'red', rank: 3, trend: 'up' as const }
    ];

    beforeEach(() => {
        vi.clearAllMocks();

        (useLanguage as any).mockReturnValue({
            t: (key: string) => key,
        });

        (useAutoScroll as any).mockReturnValue({});
    });

    it('renders correctly with initial data (momentum mode)', () => {
        render(
            <StudentLeaderboard 
                topStudents={mockTopStudents} 
                arenaStudents={mockArenaStudents} 
                settings={mockSettings}
            />
        );

        // Expect momentum title
        expect(screen.getByText('stars_momentum')).toBeInTheDocument();
        
        // Momentum list should show Student 3 (trend up)
        expect(screen.getByText('Student 3')).toBeInTheDocument();
        expect(screen.getByText('80')).toBeInTheDocument();

        // Student 1 and 2 are not in momentum list
        expect(screen.queryByText('Student 1')).not.toBeInTheDocument();
    });

    it('renders top students when momentum list is empty', () => {
        // Only provide students without upward trend
        const staticStudents = [
             { id: '1', name: 'Student 1', score: 100, className: 'Class A', classColor: 'red', rank: 1, trend: 'same' as const }
        ];

        render(
            <StudentLeaderboard 
                topStudents={staticStudents} 
                arenaStudents={[]} 
                settings={mockSettings}
            />
        );

        // Should fall back to top students even in momentum tab because list is empty?
        // Logic: const displayList = activeTab === 'momentum' && momentumList.length > 0 ? momentumList : topStudents;
        // const isMomentumMode = activeTab === 'momentum' && momentumList.length > 0;
        
        // If momentumList is empty, isMomentumMode is false.
        // Header should be 'student_stars'
        expect(screen.getByText('student_stars')).toBeInTheDocument();

        expect(screen.getByText('Student 1')).toBeInTheDocument();
    });
});
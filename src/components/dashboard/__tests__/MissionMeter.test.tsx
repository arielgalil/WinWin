import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MissionMeter } from '../MissionMeter';
import { LanguageProvider } from '../../../contexts/LanguageContext';

// Mock imports
vi.mock('../../../utils/i18n', () => ({
    t: (key: string) => key,
    Language: 'he'
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
    motion: {
        path: React.forwardRef((props: any, ref: any) => {
             // Mock the ref to have getTotalLength
             React.useImperativeHandle(ref, () => ({
                 getTotalLength: () => 100
             }));
             return <path {...props} ref={ref} />;
        }),
        circle: 'circle',
        div: 'div'
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
    useSpring: (value: any) => ({
        on: (event: any, callback: any) => {
            if (event === 'change') callback(value);
            return () => {};
        },
        get: () => value,
        set: (newValue: any) => {} 
    })
}));

describe('MissionMeter', () => {
    it('renders without crashing', () => {
        const mockGoals = [
            {
                id: '1',
                name: 'Goal 1',
                target_score: 100,
                image_type: 'emoji',
                image_value: '🏆',
                order_index: 0,
                competition_id: 'comp1'
            }
        ];

        render(
            <LanguageProvider>
                <MissionMeter
                    totalScore={50}
                    goals={mockGoals as any}
                    competitionName="Test Competition"
                    classes={[{ id: 'c1', name: 'Class A', score: 20 } as any]}
                />
            </LanguageProvider>
        );

        expect(screen.getByText(/Goal 1/i)).toBeInTheDocument();
    });
});

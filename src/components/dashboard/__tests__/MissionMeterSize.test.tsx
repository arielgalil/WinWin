import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MissionMeter } from '../MissionMeter';
import { LanguageProvider } from '../../../contexts/LanguageContext';

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

describe('MissionMeter Emoji Size', () => {
    it('uses large font sizes for prize emoji', () => {
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
                />
            </LanguageProvider>
        );

        const emojiSpan = screen.getByText('🏆');
        // We expect larger sizes than the current ones: text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl
        // Proposed new sizes: text-6xl sm:text-7xl md:text-8xl lg:text-9xl
        expect(emojiSpan.className).toContain('text-6xl');
        expect(emojiSpan.className).toContain('sm:text-7xl');
        expect(emojiSpan.className).toContain('md:text-8xl');
        expect(emojiSpan.className).toContain('lg:text-9xl');
    });
});

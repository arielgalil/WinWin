
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { GoalsManagement } from '../GoalsManagement';
import { AppSettings } from '../../../types';
import React from 'react';
import { LanguageProvider } from '../../../contexts/LanguageContext';
import { SaveNotificationProvider } from '../../../contexts/SaveNotificationContext';

const mockSettings: AppSettings = {
    competition_name: 'Test Competition',
    school_name: 'Test School',
    primary_color: '#1877F2',
    secondary_color: '#050505',
    background_brightness: 1,
    goals_config: []
};

const AllProviders = ({ children }: { children: React.ReactNode }) => (
    <LanguageProvider>
        <SaveNotificationProvider>
            {children}
        </SaveNotificationProvider>
    </LanguageProvider>
);

describe('Radius Unification', () => {
    it('GoalsManagement sections should use radius-container variable', () => {
        const { container } = render(
            <AllProviders>
                <GoalsManagement 
                    settings={mockSettings} 
                    classes={[]} 
                    totalInstitutionScore={0} 
                    onUpdateSettings={async () => {}} 
                    onUpdateClassTarget={async () => {}} 
                />
            </AllProviders>
        );
        
        const sections = container.querySelectorAll('section');
        sections.forEach(section => {
            expect(section.className).toContain('rounded-[var(--radius-container)]');
        });
    });
});

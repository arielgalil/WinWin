
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ClassesManager } from '../ClassesManager';
import { UsersManager } from '../UsersManager';
import { PointsManager } from '../PointsManager';
import { LanguageProvider } from '../../../contexts/LanguageContext';
import { SaveNotificationProvider } from '../../../contexts/SaveNotificationContext';
import { AdminActionButton } from '../../ui/AdminActionButton';

// Mock Hooks
vi.mock('../../../hooks/useLanguage', () => ({
    useLanguage: () => ({ t: (key: string) => key, language: 'he', dir: 'rtl' }),
}));

vi.mock('../../../hooks/useToast', () => ({
    useToast: () => ({ showToast: vi.fn(), toast: null }),
}));

vi.mock('../../../hooks/useConfirmation', () => ({
    useConfirmation: () => ({
        openConfirmation: vi.fn(),
        closeConfirmation: vi.fn(),
        modalConfig: { isOpen: false, title: '', message: '' }
    }),
}));

vi.mock('../../../hooks/useScoreEntry', () => ({
    useScoreEntry: () => ({
        selectedClassId: null,
        classes: [],
        filteredStudents: [],
        isProcessing: false,
        submitPoints: vi.fn(),
        selectedStudentIds: new Set(),
        searchTerm: '',
        setSearchTerm: vi.fn(),
        settings: { score_presets: [] },
        selectionLabel: ''
    }),
}));

vi.mock('../../../utils/errorUtils', () => ({
    useErrorFormatter: () => ({ getErrorMessage: (e: any) => 'error' }),
}));

vi.mock('../../../supabaseClient', () => ({
    supabase: {
        from: () => ({
            select: () => ({
                eq: () => ({
                    single: () => Promise.resolve({ data: null, error: null })
                })
            })
        }),
        auth: {
            admin: {
                createUser: vi.fn()
            }
        },
        rpc: vi.fn()
    },
    createTempClient: () => ({
        auth: { signUp: vi.fn() }
    })
}));

// Mock Data
const mockSettings = {
    competition_name: 'Test Comp',
    school_name: 'Test School',
    primary_color: '#000000',
    secondary_color: '#ffffff'
};

const mockUser = {
    id: 'user-1',
    email: 'test@test.com',
    role: 'admin',
    name: 'Admin User'
};

const mockClasses = [
    { id: 'c1', name: 'Class A', students: [] },
    { id: 'c2', name: 'Class B', students: [] }
];

const AllProviders = ({ children }: { children: React.ReactNode }) => (
    <LanguageProvider>
        <SaveNotificationProvider>
            {children}
        </SaveNotificationProvider>
    </LanguageProvider>
);

describe('UI Consistency Checks', () => {
    
    describe('Touch Targets', () => {
        it('AdminActionButton should have minimum touch target size', () => {
            render(
                <AdminActionButton onClick={() => {}}>
                    Test
                </AdminActionButton>
            );
            const button = screen.getByRole('button');
            expect(button.className).toContain('min-h-[44px]');
            expect(button.className).toContain('min-w-[44px]');
        });
    });

    describe('ClassesManager UI', () => {
        it('should render without crashing', () => {
            render(
                <AllProviders>
                    <ClassesManager 
                        classes={mockClasses as any} 
                        settings={mockSettings}
                        user={mockUser as any}
                        onRefresh={async () => {}}
                    />
                </AllProviders>
            );
            // Check for some text or element
            // Since we mocked t => key, we expect keys.
            // But components might hardcode text or use t('key').
            // Let's just check it rendered a button, which implies it didn't crash.
            const buttons = screen.getAllByRole('button');
            expect(buttons.length).toBeGreaterThan(0);
        });
    });

    describe('UsersManager UI', () => {
        it('should render without crashing', () => {
            render(
                <AllProviders>
                    <UsersManager 
                        classes={mockClasses as any} 
                        settings={mockSettings}
                        currentUser={mockUser as any}
                        onRefresh={async () => {}}
                    />
                </AllProviders>
            );
            const buttons = screen.getAllByRole('button');
            expect(buttons.length).toBeGreaterThan(0);
        });
    });

    describe('PointsManager UI', () => {
        it('should render without crashing', () => {
            render(
                <AllProviders>
                    <PointsManager 
                        user={mockUser as any}
                        campaignRole="admin"
                    />
                </AllProviders>
            );
            // PointsManager might be empty if no class selected, but should have search or filter.
            // It has 'LiteActionDock' which has buttons.
            // Or at least a container.
            const container = screen.queryByText('no_students_found'); // If mocked useScoreEntry returns empty students
            // or we can check for main container
        });
    });
});

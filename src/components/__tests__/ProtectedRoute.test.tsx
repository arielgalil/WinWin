import { render, screen } from '@testing-library/react';
import { ProtectedRoute } from '../ProtectedRoute';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAuthPermissions } from '../../services/useAuthPermissions';

// Mock dependencies
vi.mock('../../hooks/useAuth', () => ({
    useAuth: vi.fn(),
}));

vi.mock('../../services/useAuthPermissions', () => ({
    useAuthPermissions: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
    Navigate: vi.fn(({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />),
}));

// Mock ErrorScreen
vi.mock('../ui/ErrorScreen', () => ({
    ErrorScreen: vi.fn(({ message }: { message: string }) => <div data-testid="error-screen">{message}</div>),
}));

// Mock useLanguage
vi.mock('../../hooks/useLanguage', () => ({
    useLanguage: () => ({
        t: (key: string) => key,
    }),
}));

describe('ProtectedRoute', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('redirects to login if user is not authenticated', () => {
        vi.mocked(useAuth).mockReturnValue({ user: null } as any);
        vi.mocked(useAuthPermissions).mockReturnValue({} as any);

        render(
            <ProtectedRoute allowedRoles={['admin']}>
                <div data-testid="protected-content">Content</div>
            </ProtectedRoute>
        );

        expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login');
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('renders ErrorScreen if user is authenticated but unauthorized', () => {
        vi.mocked(useAuth).mockReturnValue({ user: { id: '1' } } as any);
        vi.mocked(useAuthPermissions).mockReturnValue({
            canAccessAdmin: false,
            canAccessVote: false,
            isTeacher: true,
            isAdmin: false,
            isSuper: false
        } as any);

        render(
            <ProtectedRoute allowedRoles={['admin']}>
                <div data-testid="protected-content">Content</div>
            </ProtectedRoute>
        );

        expect(screen.getByTestId('error-screen')).toBeInTheDocument();
        expect(screen.getByText('competition_access_denied')).toBeInTheDocument();
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('renders children if user is authenticated and authorized', () => {
        vi.mocked(useAuth).mockReturnValue({ user: { id: '1' } } as any);
        vi.mocked(useAuthPermissions).mockReturnValue({
            canAccessAdmin: true,
            isAdmin: true
        } as any);

        render(
            <ProtectedRoute allowedRoles={['admin']}>
                <div data-testid="protected-content">Content</div>
            </ProtectedRoute>
        );

        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
        expect(screen.queryByTestId('error-screen')).not.toBeInTheDocument();
    });
});

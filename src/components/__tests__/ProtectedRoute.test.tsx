import { render, screen } from '@testing-library/react';
import { ProtectedRoute } from '../ProtectedRoute';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAuthPermissions } from '../../services/useAuthPermissions';
import { useCampaign } from '../../hooks/useCampaign';
import { useParams } from 'react-router-dom';

// Mock dependencies
vi.mock('../../hooks/useAuth', () => ({
    useAuth: vi.fn(),
}));

vi.mock('../../services/useAuthPermissions', () => ({
    useAuthPermissions: vi.fn(),
}));

vi.mock('../../hooks/useCampaign', () => ({
    useCampaign: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
    Navigate: vi.fn(({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />),
    useParams: vi.fn(),
}));

// Mock ErrorScreen
vi.mock('../ui/ErrorScreen', () => ({
    ErrorScreen: vi.fn(({ message }: { message: string }) => <div data-testid="error-screen">{message}</div>),
}));

// Mock LoadingScreen
vi.mock('../ui/LoadingScreen', () => ({
    LoadingScreen: vi.fn(({ message }: { message: string }) => <div data-testid="loading-screen">{message}</div>),
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

    it('renders LoadingScreen if campaign data is loading', () => {
        vi.mocked(useAuth).mockReturnValue({ user: { id: '1' } } as any);
        vi.mocked(useAuthPermissions).mockReturnValue({} as any);
        vi.mocked(useCampaign).mockReturnValue({ isLoadingCampaign: true } as any);
        vi.mocked(useParams).mockReturnValue({ slug: 'test-campaign' } as any);

        render(
            <ProtectedRoute allowedRoles={['admin']}>
                <div data-testid="protected-content">Content</div>
            </ProtectedRoute>
        );

        expect(screen.getByTestId('loading-screen')).toBeInTheDocument();
        expect(screen.getByText('identifying_permissions')).toBeInTheDocument();
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('redirects to login if user is not authenticated', () => {
        vi.mocked(useAuth).mockReturnValue({ user: null } as any);
        vi.mocked(useAuthPermissions).mockReturnValue({} as any);
        vi.mocked(useCampaign).mockReturnValue({ isLoadingCampaign: false } as any);
        vi.mocked(useParams).mockReturnValue({ slug: 'test-campaign' } as any);

        render(
            <ProtectedRoute allowedRoles={['admin']}>
                <div data-testid="navigate" data-to="/login" />
            </ProtectedRoute>
        );

        expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login');
    });

    it('renders ErrorScreen if user is authenticated but unauthorized', () => {
        vi.mocked(useAuth).mockReturnValue({ user: { id: '1' } } as any);
        vi.mocked(useAuthPermissions).mockReturnValue({
            canAccessAdmin: false,
            canAccessVote: false,
        } as any);
        vi.mocked(useCampaign).mockReturnValue({ isLoadingCampaign: false } as any);
        vi.mocked(useParams).mockReturnValue({ slug: 'test-campaign' } as any);

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
        } as any);
        vi.mocked(useCampaign).mockReturnValue({ isLoadingCampaign: false } as any);
        vi.mocked(useParams).mockReturnValue({ slug: 'test-campaign' } as any);

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
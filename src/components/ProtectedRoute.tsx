import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAuthPermissions } from '../services/useAuthPermissions';
import { ErrorScreen } from './ui/ErrorScreen';
import { PageSkeleton } from './ui/PageSkeleton';
import { useLanguage } from '../hooks/useLanguage';

import { useParams } from 'react-router-dom';
import { useCampaign } from '../hooks/useCampaign';

interface ProtectedRouteProps {
    allowedRoles: string[];
    children: React.ReactNode;
    fallbackPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    allowedRoles,
    children,
    fallbackPath = '/login'
}) => {
    const { user, authLoading } = useAuth();
    const { slug } = useParams();
    const { isLoadingCampaign } = useCampaign();
    const { canAccessAdmin, canAccessVote } = useAuthPermissions();
    const { t } = useLanguage();
    const location = useLocation();

    // Determine skeleton type based on route
    const skeletonType = allowedRoles.includes('teacher') && !allowedRoles.includes('admin') 
        ? 'vote' 
        : 'admin';

    // Show skeleton while auth or campaign is still loading
    // This provides immediate visual feedback instead of blocking
    if (authLoading || (slug && isLoadingCampaign)) {
        return <PageSkeleton type={skeletonType} message={t('identifying_permissions')} />;
    }

    // Only redirect if auth is settled AND user is not logged in
    if (!user) {
        if (slug) {
            return <Navigate to={`/login/${slug}`} state={location.state} replace />;
        }
        return <Navigate to={fallbackPath} replace />;
    }

    // Determine authorization based on allowedRoles
    let isAuthorized = false;

    if (allowedRoles.includes('admin') || allowedRoles.includes('superuser')) {
        isAuthorized = canAccessAdmin;
    } else if (allowedRoles.includes('teacher')) {
        isAuthorized = canAccessVote;
    }

    if (!isAuthorized) {
        return <ErrorScreen message={t('competition_access_denied')} />;
    }

    return <>{children}</>;
};


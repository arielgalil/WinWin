import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAuthPermissions } from '../services/useAuthPermissions';
import { ErrorScreen } from './ui/ErrorScreen';
import { useLanguage } from '../hooks/useLanguage';

import { LoadingScreen } from './ui/LoadingScreen';
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
    const { user } = useAuth();
    const { slug } = useParams();
    const { isLoadingCampaign } = useCampaign();
    const { canAccessAdmin, canAccessVote } = useAuthPermissions();
    const { t } = useLanguage();
    const location = useLocation();

    if (slug && isLoadingCampaign) {
        return <LoadingScreen message={t('identifying_permissions')} />;
    }

    if (!user) {
        if (slug) {
            return <Navigate to={`/login/${slug}`} state={location.state} replace />;
        }
        return <Navigate to={fallbackPath} replace />;
    }

    // Determine authorization based on allowedRoles
    // For now, we use the pre-calculated flags from useAuthPermissions
    // tailored to the specific routes they were intended for.

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

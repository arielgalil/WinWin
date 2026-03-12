import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAuthPermissions } from '../services/useAuthPermissions';
import { ErrorScreen } from './ui/ErrorScreen';
import { PageSkeleton } from './ui/PageSkeleton';
import { useLanguage } from '../hooks/useLanguage';

import { useParams } from 'react-router-dom';
import { useCampaign } from '../hooks/useCampaign';
import { useCampaignRole } from '../hooks/useCampaignRole';

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
    const { campaign, isLoadingCampaign, isCampaignError } = useCampaign();
    const { campaignRole, isLoadingRole, isFetchingRole, isError: isRoleError } = useCampaignRole(campaign?.id, user?.id);
    const { canAccessAdmin, canAccessVote } = useAuthPermissions();
    const { t } = useLanguage();
    const location = useLocation();

    // Determine skeleton type based on route
    const skeletonType = allowedRoles.includes('teacher') && !allowedRoles.includes('admin') 
        ? 'vote' 
        : 'admin';

    // Show skeleton while auth or campaign is still loading - ONLY if we don't have data yet
    // If we have a cached user and campaign, we render immediately!
    const isActuallyLoading = (authLoading && !user) || (slug && isLoadingCampaign && !campaign) || (isLoadingRole && !campaignRole) || (isFetchingRole && !campaignRole);

    if (isActuallyLoading) {
        return <PageSkeleton type={skeletonType} message={t('identifying_permissions')} />;
    }

    // Only redirect if auth is settled AND user is not logged in
    if (!user && !authLoading) {
        if (slug) {
            return <Navigate to={`/login/${slug}`} state={location.state} replace />;
        }
        return <Navigate to={fallbackPath} replace />;
    }

    // If we have a user but auth is still verifying in background, we let them through if we have cache
    if (!user) return null; // Safety check

    // Determine authorization based on allowedRoles
    let isAuthorized = false;

    // Check if user has ANY of the permissions required by the allowedRoles
    const hasAdminReq = allowedRoles.includes('admin') || allowedRoles.includes('superuser');
    const hasTeacherReq = allowedRoles.includes('teacher');

    if (hasAdminReq && hasTeacherReq) {
        // If both are allowed, user needs EITHER permission
        isAuthorized = canAccessAdmin || canAccessVote;
    } else if (hasAdminReq) {
        isAuthorized = canAccessAdmin;
    } else if (hasTeacherReq) {
        isAuthorized = canAccessVote;
    }

    // If we are still loading/fetching the role in the background, don't show "Access Denied" yet
    if (!isAuthorized && (isLoadingRole || isFetchingRole)) {
        return <PageSkeleton type={skeletonType} message={t('identifying_permissions')} />;
    }

    // Network error fetching role or campaign — don't show "Access Denied", show connection error
    if (!isAuthorized && (isRoleError || (isCampaignError && !campaign))) {
        return <ErrorScreen message={t('database_connection_error')} />;
    }

    if (!isAuthorized) {
        return <ErrorScreen message={t('competition_access_denied')} />;
    }

    return <>{children}</>;
};


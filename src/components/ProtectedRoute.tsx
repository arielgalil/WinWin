import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAuthPermissions } from '../services/useAuthPermissions';
import { ErrorScreen } from './ui/ErrorScreen';
import { useLanguage } from '../hooks/useLanguage';

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
    const { canAccessAdmin, canAccessVote, campaignRole } = useAuthPermissions();
    const { t } = useLanguage();

    if (!user) {
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

import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate, useParams } from 'react-router-dom';
import { Dashboard } from './components/Dashboard';
import { AdminPanel } from './components/AdminPanel';
import { CampaignSelector } from './components/CampaignSelector';
import { SuperAdminPanel } from './components/SuperAdminPanel';
import { LiteTeacherView } from './components/lite/LiteTeacherView';
import { LiteLogin } from './components/lite/LiteLogin';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { ErrorScreen } from './components/ui/ErrorScreen';
import { ProtectedRoute } from './components/ProtectedRoute';

import { DynamicTitle } from './components/ui/DynamicTitle';
import { useAuth } from './hooks/useAuth';
import { useCompetitionData } from './hooks/useCompetitionData';
import { useAuthPermissions } from './services/useAuthPermissions';
import { useLanguage } from './hooks/useLanguage';
import { isSuperUser } from './config';
import { useTheme } from './contexts/ThemeContext';

const LanguageSync: React.FC = () => {
    const { settings } = useCompetitionData();
    const { setLanguage, language } = useLanguage();

    useEffect(() => {
        if (settings?.language && settings.language !== language) {
            setLanguage(settings.language);
        }
    }, [settings?.language, language, setLanguage]);

    return null;
};

const CampaignContext: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { t } = useLanguage();
    const { isLoadingCampaign, isCampaignError, campaignFetchError, currentCampaign } = useCompetitionData();

    if (isLoadingCampaign) return <LoadingScreen message={t('loading_campaign_data')} />;
    if (isCampaignError || !currentCampaign) return <ErrorScreen message={campaignFetchError instanceof Error ? campaignFetchError.message : t('campaign_not_found')} />;

    return (
        <>
            <LanguageSync />
            {children}
        </>
    );
};

const DashboardRoute = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { slug } = useParams();
    const { classes, settings, tickerMessages, currentCampaign, campaignRole, updateCommentary } = useCompetitionData();

    // Dashboard is public - anyone can view the leaderboard
    // Management functions are protected within the Dashboard component

    return (
        <CampaignContext>
            <DynamicTitle settings={settings} campaign={currentCampaign} pageName={t('score_board')} />
            <Dashboard
                classes={classes}
                commentary={settings.current_commentary || ''}
                tickerMessages={tickerMessages}
                settings={settings}
                onLoginClick={() => navigate(`/login/${slug}`)}
                user={user}
                userRole={campaignRole}
                isSuperUser={isSuperUser(user?.role)}
                isCampaignActive={currentCampaign?.is_active}
                onSwitchCampaign={() => navigate('/')}
                onManagePoints={() => navigate(`/vote/${slug}`)}
                onManageSchool={() => navigate(`/admin/${slug}`)}
                onUpdateCommentary={updateCommentary}
            />
        </CampaignContext>
    );
};

const AdminRoute = () => {
    const { t } = useLanguage();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { slug } = useParams();
    const { classes, settings, currentCampaign, addPoints, refreshData, campaignRole } = useCompetitionData();
    const { isCampaignSuper, isSuper } = useAuthPermissions();

    if (!user) return <Navigate to={`/login/${slug}`} replace />;

    return (
        <CampaignContext>
            <DynamicTitle settings={settings} campaign={currentCampaign} pageName={t('manage')} />
            <AdminPanel
                user={user}
                classes={classes}
                settings={settings}
                onAddPoints={addPoints}
                onLogout={async () => { await logout(); navigate('/'); }}
                onRefreshData={refreshData}
                onViewDashboard={() => navigate(`/comp/${slug}`)}
                isSuperAdmin={isSuper || isCampaignSuper}
                campaignRole={campaignRole}
            />
        </CampaignContext>
    );
};

const VoteRoute = () => {
    const { t } = useLanguage();
    const { user, logout } = useAuth();
    const { slug } = useParams();
    const navigate = useNavigate();
    const { settings, currentCampaign, campaignRole } = useCompetitionData();

    if (!user) return <Navigate to={`/login/${slug}`} replace />;

    return (
        <CampaignContext>
            <DynamicTitle settings={settings} campaign={currentCampaign} pageName={t('enter_points')} />
            <LiteTeacherView
                user={user}
                userRole={campaignRole}
                onLogout={async () => { await logout(); navigate('/'); }}
            />
        </CampaignContext>
    );
};

const LoginRoute = () => {
    const { t } = useLanguage();
    const { user, login, authLoading, loginError, savedEmail } = useAuth();
    const { slug } = useParams();
    const navigate = useNavigate();
    const { settings, isLoadingCampaign, currentCampaign } = useCompetitionData();
    const { canAccessAdmin, isTeacher, isSuper, campaignRole } = useAuthPermissions();

    useEffect(() => {
        if (user && !authLoading) {
            if (slug) {
                if (campaignRole) {
                    // User has access to this campaign
                    if (canAccessAdmin) navigate(`/admin/${slug}`, { replace: true });
                    else if (isTeacher) navigate(`/vote/${slug}`, { replace: true });
                    else navigate(`/comp/${slug}`, { replace: true });
                } else if (campaignRole === null) {
                    // User is confirmed to not have access to this campaign
                    // Let them see the error on login page
                }
                // campaignRole === undefined means still loading, useEffect will run again when it resolves
            } else {
                if (isSuper) navigate('/super', { replace: true });
                else navigate('/', { replace: true });
            }
        }
    }, [user, authLoading, slug, navigate, campaignRole, canAccessAdmin, isTeacher, isSuper]);

    if (slug && (isLoadingCampaign || (user && campaignRole === undefined))) return <LoadingScreen message={t('identifying_permissions')} />;

    // Show access denied message if user is logged in but not authorized for this campaign
    if (slug && user && campaignRole === null) {
        return (
            <>
                <DynamicTitle settings={settings} campaign={currentCampaign} pageName={t('error')} />
                <ErrorScreen message={t('competition_access_denied')} />
            </>
        );
    }

    return (
        <>
            <DynamicTitle settings={settings} campaign={currentCampaign} pageName={t('login_title')} />
            <LiteLogin
                onLogin={login}
                loading={authLoading}
                error={loginError}
                savedEmail={savedEmail}
                settings={slug ? settings : undefined}
                onBack={() => {
                    // Smart back navigation based on referrer or current path context
                    const referrer = document.referrer;
                    const currentPath = window.location.hash || window.location.pathname;

                    // Check if coming from a competition page
                    if (referrer.includes('/comp/') || currentPath.includes('/login/') && currentPath !== '/login' && currentPath !== '#/login') {
                        // Extract slug from current path and navigate back to competition
                        const slugMatch = currentPath.match(/\/login\/([^\/]+)/);
                        if (slugMatch && slugMatch[1]) {
                            navigate(`/comp/${slugMatch[1]}`);
                            return;
                        }
                    }

                    // Default to campaigns page
                    navigate('/');
                }}
            />
        </>
    );
};

import { RouteErrorBoundary } from './components/ui/RouteErrorBoundary';

const App: React.FC = () => {
    const { t } = useLanguage();
    const { authLoading } = useAuth();
    const { theme } = useTheme();

    return (
        <RouteErrorBoundary>
            <div className="flex flex-col h-screen selection:bg-cyan-500/30 overflow-hidden transition-colors duration-300 bg-[var(--bg-page)]">
                {authLoading ? (
                    <LoadingScreen message={t('loading_system')} />
                ) : (
                    <div className="flex-1 flex flex-col min-h-0 relative">
                        <Routes>
                            <Route path="/" element={<><DynamicTitle /><CampaignSelector user={null} /></>} />
                            <Route path="/super" element={<><DynamicTitle pageName={t('system_admin')} /><SuperAdminPanel user={null} onLogout={() => { }} onSelectCampaign={() => { }} /></>} />
                                                            <Route path="/login" element={<LoginRoute />} />
                                                            <Route path="/login/:slug" element={<LoginRoute />} />
                                                            <Route path="/comp/:slug" element={<DashboardRoute />} />
                                                            <Route 
                                                                path="/admin/:slug" 
                                                                element={
                                                                    <ProtectedRoute allowedRoles={['admin', 'superuser']}>
                                                                        <AdminRoute />
                                                                    </ProtectedRoute>
                                                                } 
                                                            />
                                                            <Route 
                                                                path="/admin/:slug/:tab" 
                                                                element={
                                                                    <ProtectedRoute allowedRoles={['admin', 'superuser']}>
                                                                        <AdminRoute />
                                                                    </ProtectedRoute>
                                                                } 
                                                            />
                                                            <Route 
                                                                path="/vote/:slug" 
                                                                element={
                                                                    <ProtectedRoute allowedRoles={['teacher', 'admin', 'superuser']}>
                                                                        <VoteRoute />
                                                                    </ProtectedRoute>
                                                                } 
                                                            />
                                                            <Route path="*" element={<Navigate to="/" replace />} />                        </Routes>
                    </div>
                )}
            </div>
        </RouteErrorBoundary>
    );
};

export default App;

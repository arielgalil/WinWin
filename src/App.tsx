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
import { useCampaign } from './hooks/useCampaign';
import { useClasses } from './hooks/useClasses';
import { useTicker } from './hooks/useTicker';
import { useLogs } from './hooks/useLogs';
import { useCampaignRole } from './hooks/useCampaignRole';
import { useCompetitionMutations } from './hooks/useCompetitionMutations';
import { useAuthPermissions } from './services/useAuthPermissions';
import { useLanguage } from './hooks/useLanguage';
import { isSuperUser } from './config';
import { useTheme } from './hooks/useTheme';
import { OfflineIndicator } from './components/ui/OfflineIndicator';
import { PwaReloadPrompt } from './components/ui/PwaReloadPrompt';
import { useAutoUpdate } from './hooks/useAutoUpdate';

const LanguageSync: React.FC = () => {
    const { settings: campaignLanguage } = useCampaign({
        settingsSelector: s => s.language
    });
    const { setLanguage, language } = useLanguage();

    useEffect(() => {
        if (campaignLanguage && campaignLanguage !== language) {
            setLanguage(campaignLanguage);
        }
    }, [campaignLanguage, language, setLanguage]);

    return null;
};

const CampaignContext: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { t } = useLanguage();
    const { campaign, isLoadingCampaign, isCampaignError, campaignFetchError } = useCampaign();

    if (isLoadingCampaign) return <LoadingScreen message={t('loading_campaign_data')} />;
    if (isCampaignError || !campaign) return <ErrorScreen message={campaignFetchError instanceof Error ? campaignFetchError.message : t('campaign_not_found')} />;

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
    
    const { campaign, settings } = useCampaign();
    const { campaignRole } = useCampaignRole(campaign?.id, user?.id);
    const { classes } = useClasses(campaign?.id);
    const { tickerMessages } = useTicker(campaign?.id);
    const { updateCommentary } = useCompetitionMutations(campaign?.id);

    return (
        <CampaignContext>
            <DynamicTitle settings={settings || undefined} campaign={campaign} pageName={t('score_board')} />
            {settings && (
                <Dashboard
                    classes={classes}
                    commentary={settings.current_commentary || ''}
                    tickerMessages={tickerMessages}
                    settings={settings}
                    onLoginClick={() => navigate(`/login/${slug}`)}
                    user={user}
                    userRole={campaignRole}
                    isSuperUser={isSuperUser(user?.role)}
                    isCampaignActive={campaign?.is_active}
                    onSwitchCampaign={() => navigate('/')}
                    onManagePoints={() => navigate(`/vote/${slug}`)}
                    onManageSchool={() => navigate(`/admin/${slug}`)}
                    onUpdateCommentary={updateCommentary}
                />
            )}
        </CampaignContext>
    );
};

const AdminRoute = () => {
    const { t } = useLanguage();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { slug } = useParams();
    
    const { campaign, settings } = useCampaign();
    const { campaignRole } = useCampaignRole(campaign?.id, user?.id);
    const { isCampaignSuper, isSuper } = useAuthPermissions();

    if (!user) return <Navigate to={`/login/${slug}`} replace />;

    return (
        <CampaignContext>
            <DynamicTitle settings={settings || undefined} campaign={campaign} pageName={t('manage')} />
            {settings && (
                <AdminPanel
                    user={user}
                    onLogout={async () => { await logout(); navigate('/'); }}
                    onViewDashboard={() => navigate(`/comp/${slug}`)}
                    isSuperAdmin={isSuper || isCampaignSuper}
                    campaignRole={campaignRole}
                />
            )}
        </CampaignContext>
    );
};

const VoteRoute = () => {
    const { t } = useLanguage();
    const { user, logout } = useAuth();
    const { slug } = useParams();
    const navigate = useNavigate();
    
    const { campaign, settings } = useCampaign();
    const { campaignRole } = useCampaignRole(campaign?.id, user?.id);

    if (!user) return <Navigate to={`/login/${slug}`} replace />;

    return (
        <CampaignContext>
            <DynamicTitle settings={settings || undefined} campaign={campaign} pageName={t('enter_points')} />
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
    
    const { campaign, settings, isLoadingCampaign } = useCampaign();
    const { campaignRole } = useCampaignRole(campaign?.id, user?.id);
    const { canAccessAdmin, isTeacher, isSuper } = useAuthPermissions();

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
                <DynamicTitle settings={settings || undefined} campaign={campaign} pageName={t('error')} />
                <ErrorScreen message={t('competition_access_denied')} />
            </>
        );
    }

    return (
        <>
            <DynamicTitle settings={slug ? settings : undefined} campaign={campaign} pageName={t('login_title')} />
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
    useAutoUpdate();

    return (
        <RouteErrorBoundary>
            <OfflineIndicator />
            <PwaReloadPrompt />
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

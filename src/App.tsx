import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate, useParams, useLocation } from 'react-router-dom';
const Dashboard = React.lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const AdminPanel = React.lazy(() => import('./components/AdminPanel').then(m => ({ default: m.AdminPanel })));
const CampaignSelector = React.lazy(() => import('./components/CampaignSelector').then(m => ({ default: m.CampaignSelector })));
const SuperAdminPanel = React.lazy(() => import('./components/SuperAdminPanel').then(m => ({ default: m.SuperAdminPanel })));
const LiteTeacherView = React.lazy(() => import('./components/lite/LiteTeacherView').then(m => ({ default: m.LiteTeacherView })));
const LiteLogin = React.lazy(() => import('./components/lite/LiteLogin').then(m => ({ default: m.LiteLogin })));
const AboutPage = React.lazy(() => import('./components/AboutPage').then(m => ({ default: m.AboutPage })));

import { LoadingScreen } from './components/ui/LoadingScreen';
import { PageSkeleton } from './components/ui/PageSkeleton';
import { ErrorScreen } from './components/ui/ErrorScreen';
import { ProtectedRoute } from './components/ProtectedRoute';

import { DynamicTitle } from './components/ui/DynamicTitle';
import { useAuth } from './hooks/useAuth';
import { useCampaign } from './hooks/useCampaign';
import { useCampaignRole } from './hooks/useCampaignRole';
import { useAuthPermissions } from './services/useAuthPermissions';
import { useLanguage } from './hooks/useLanguage';
import { OfflineIndicator } from './components/ui/OfflineIndicator';
import { prewarmKioskAssets } from './utils/pwaUtils';

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

const CampaignContext: React.FC<{ children: React.ReactNode; skeletonType?: 'dashboard' | 'admin' | 'vote' | 'generic' }> = ({ children, skeletonType = 'generic' }) => {
    const { t } = useLanguage();
    const { campaign, settings, isLoadingCampaign, isLoadingSettings, isCampaignError, campaignFetchError } = useCampaign();

    // Show skeleton while loading - ONLY if we don't have data at all
    if ((isLoadingCampaign || isLoadingSettings) && !campaign) {
        return <PageSkeleton type={skeletonType} message={t('loading_campaign_data')} />;
    }

    // Show error only if loading is complete and there's an error
    if (!isLoadingCampaign && !isLoadingSettings && (isCampaignError || !campaign || !settings)) {
        return <ErrorScreen message={campaignFetchError instanceof Error ? campaignFetchError.message : t('campaign_not_found')} />;
    }

    return (
        <>
            <LanguageSync />
            {children}
        </>
    );
};

const DashboardRoute = () => {
    const { t } = useLanguage();
    const { settings, campaign } = useCampaign();

    return (
        <CampaignContext skeletonType="dashboard">
            <DynamicTitle settings={settings || undefined} campaign={campaign} pageName={t('score_board')} />
            <Dashboard />
        </CampaignContext>
    );
};

const AdminRoute = () => {
    const { t } = useLanguage();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { slug } = useParams();

    // ProtectedRoute handles !user check
    // However, we still need to derive campaign data for the title and props
    const { campaign, settings } = useCampaign();
    const { campaignRole } = useCampaignRole(campaign?.id, user?.id);
    const { isCampaignSuper, isSuper } = useAuthPermissions();

    return (
        <CampaignContext skeletonType="admin">
            <DynamicTitle settings={settings || undefined} campaign={campaign} pageName={t('manage')} />
            {settings && user && (
                <AdminPanel
                    user={user}
                    onLogout={async () => { await logout(); navigate('/'); }}
                    onViewDashboard={() => navigate(`/comp/${slug}`)}
                    isSuperAdmin={isSuper || isCampaignSuper}
                    campaignRole={campaignRole as any}
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

    // ProtectedRoute handles !user check
    const { campaign, settings } = useCampaign();
    const { campaignRole } = useCampaignRole(campaign?.id, user?.id);

    return (
        <CampaignContext skeletonType="vote">
            <DynamicTitle settings={settings || undefined} campaign={campaign} pageName={t('enter_points')} />
            {user && (
                <LiteTeacherView
                    user={user}
                    userRole={campaignRole as any}
                    onLogout={async () => { await logout(); navigate('/'); }}
                    onViewDashboard={() => navigate(`/comp/${slug}`)}
                />
            )}
        </CampaignContext>
    );
};

const LoginRoute = () => {
    const { t } = useLanguage();
    const { user, login, authLoading, loginError, savedEmail } = useAuth();
    const { slug } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // We use useCampaign to ensure we have data even if navigating directly or via redirect
    // We pass location.state?.campaign as initialData to avoid refetch if available.
    // NOTE: This hook is only meaningful if 'slug' is present.
    const { campaign, settings, isLoadingCampaign, isLoadingSettings, isFetchingCampaign, isFetchingSettings } = useCampaign({
        slugOverride: slug,
        settingsSelector: (s: any) => s,
        initialData: location.state?.campaign ? {
            campaign: location.state.campaign as any,
            settings: location.state.campaign.app_settings?.[0] as any
        } : undefined
    });

    // Determine if we should show a branded or generic login
    const isBranded = !!slug;

    // Fallback for settings if manual construction is needed (legacy support for state shape)
    const activeSettings = settings || (campaign ? { campaign_id: (campaign as any).id, competition_name: (campaign as any).name, logo_url: (campaign as any).logo_url } : undefined) as any;

    const { campaignRole, isLoadingRole } = useCampaignRole(campaign?.id, user?.id);
    const { canAccessAdmin, isTeacher, isSuper } = useAuthPermissions();

    // If it's a branded route, we MUST wait for the data to avoid generic flash or false "Access Denied".
    // We wait if:
    // 1. We are still performing the initial loading (no data at all)
    // 2. OR we have partial data (missing colors) AND a fetch is still happening in background
    const isActuallyFetching = isLoadingCampaign || isLoadingSettings || isFetchingCampaign || isFetchingSettings;
    const hasBrandingData = !!activeSettings?.primary_color;

    // IMPORTANT: We also need to know if the role is still being loaded to avoid false "Access Denied"
    const isRoleLoading = isLoadingRole && !!user && !!campaign;

    useEffect(() => {
        if (user && !authLoading && !isActuallyFetching && !isRoleLoading) {
            if (slug) {
                // If we have a role, or we are super user, redirect accordingly
                if (campaignRole || isSuper) {
                    if (canAccessAdmin) {
                        if (location.pathname !== `/admin/${slug}`) navigate(`/admin/${slug}`, { replace: true });
                    }
                    else if (isTeacher) {
                        if (location.pathname !== `/vote/${slug}`) navigate(`/vote/${slug}`, { replace: true });
                    }
                    else {
                        if (location.pathname !== `/comp/${slug}`) navigate(`/comp/${slug}`, { replace: true });
                    }
                }
            } else {
                if (isSuper) {
                    if (location.pathname !== '/super') navigate('/super', { replace: true });
                }
                else {
                    if (location.pathname !== '/') navigate('/', { replace: true });
                }
            }
        }
    }, [user, authLoading, slug, navigate, campaignRole, canAccessAdmin, isTeacher, isSuper, isActuallyFetching, isRoleLoading, location.pathname]);

    if (isBranded && (isActuallyFetching || isRoleLoading) && !hasBrandingData) {
        return <LoadingScreen message={t('loading_campaign_data')} />;
    }

    // Only show access denied if we ARE NOT loading anything, we HAVE a user, but we definitely HAVE NO role
    if (slug && user && !isActuallyFetching && !isRoleLoading && !campaignRole && !isSuper) {
        return (
            <>
                <DynamicTitle settings={activeSettings} campaign={campaign} pageName={t('error')} />
                <ErrorScreen message={t('competition_access_denied')} />
            </>
        );
    }

    return (
        <>
            <DynamicTitle settings={activeSettings} campaign={campaign} pageName={t('login_title')} />
            <LiteLogin
                onLogin={login}
                loading={authLoading}
                error={loginError}
                savedEmail={savedEmail}
                settings={isBranded ? activeSettings : undefined}
                onBack={() => navigate('/')}
            />
        </>
    );
};

import { RouteErrorBoundary } from './components/ui/RouteErrorBoundary';

import { ServiceWorkerManager } from './components/ui/ServiceWorkerManager';
import { useRealtimeUpdate } from './hooks/useRealtimeUpdate';

const App: React.FC = () => {
    const { t, dir } = useLanguage();
    const { user, authLoading, authStatus, isSlowConnection } = useAuth();
    const [showSW, setShowSW] = React.useState(false);

    // Subscribe to system updates via Supabase Realtime
    useRealtimeUpdate();

    useEffect(() => {
        // Delay Service Worker registration by 2 seconds to give priority to main app logic and auth
        const timer = setTimeout(() => {
            setShowSW(true);
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        // Delay pre-warming even further
        const timer = setTimeout(() => {
            prewarmKioskAssets();
        }, 5000);
        return () => clearTimeout(timer);
    }, []);

    // Initial Loading State - ONLY show full skeleton if we have no user found yet in cache
    if (authLoading && !user && (authStatus === 'checking-session' || authStatus === 'fetching-profile' || authStatus === 'idle')) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-[var(--bg-page)]" dir={dir}>
                <PageSkeleton type="generic" message={t('loading_system')} />
                {isSlowConnection && (
                    <div className="fixed bottom-12 left-0 right-0 flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-700 px-6">
                        <div className="bg-[var(--bg-card)]/90 backdrop-blur-sm border border-[var(--border-default)] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                            <span className="text-[var(--text-secondary)] text-sm font-medium tracking-wide">
                                {t('optimizing_connection')}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <RouteErrorBoundary>
            <OfflineIndicator />
            {showSW && <ServiceWorkerManager />}
            <div className="flex flex-col h-screen selection:bg-cyan-500/30 overflow-hidden transition-colors duration-300 bg-[var(--bg-page)]" dir={dir}>
                <div className="flex-1 flex flex-col min-h-0 relative">
                    <React.Suspense fallback={<PageSkeleton type="generic" message={t('loading_system')} />}>
                        <Routes>
                            <Route path="/" element={<><DynamicTitle /><CampaignSelector /></>} />
                            <Route path="/about" element={<><DynamicTitle pageName="מהי תחרות מצמיחה?" /><AboutPage /></>} />
                            <Route path="/super" element={
                                <ProtectedRoute allowedRoles={['superuser']}>
                                    <><DynamicTitle pageName={t('system_admin')} /><SuperAdminPanel /></>
                                </ProtectedRoute>
                            } />
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
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </React.Suspense>
                </div>
            </div>
        </RouteErrorBoundary>
    );
};

export default App;

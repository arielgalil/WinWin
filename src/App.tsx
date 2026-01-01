import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate, useParams, useLocation } from 'react-router-dom';
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
import { useCampaignRole } from './hooks/useCampaignRole';
import { useAuthPermissions } from './services/useAuthPermissions';
import { useLanguage } from './hooks/useLanguage';
import { useTheme } from './hooks/useTheme';
import { OfflineIndicator } from './components/ui/OfflineIndicator';
import { PwaReloadPrompt } from './components/ui/PwaReloadPrompt';
import { useAutoUpdate } from './hooks/useAutoUpdate';
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
    const { settings, campaign } = useCampaign();

    return (
        <CampaignContext>
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
    const location = useLocation();

    // ProtectedRoute handles !user check
    // However, we still need to derive campaign data for the title and props
    const { campaign, settings } = useCampaign();
    const { campaignRole } = useCampaignRole(campaign?.id, user?.id);
    const { isCampaignSuper, isSuper } = useAuthPermissions();

    return (
        <CampaignContext>
            <DynamicTitle settings={settings || undefined} campaign={campaign} pageName={t('manage')} />
            {settings && (
                <AdminPanel
                    user={user}
                    onLogout={async () => { await logout(); navigate('/'); }}
                    onViewDashboard={() => navigate(`/comp/${slug}`)}
                    isSuperAdmin={isSuper || isCampaignSuper}
                    campaignRole={campaignRole || undefined}
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
    const location = useLocation();

    // ProtectedRoute handles !user check
    const { campaign, settings } = useCampaign();
    const { campaignRole } = useCampaignRole(campaign?.id, user?.id);

    return (
        <CampaignContext>
            <DynamicTitle settings={settings || undefined} campaign={campaign} pageName={t('enter_points')} />
            <LiteTeacherView
                user={user}
                userRole={campaignRole || undefined}
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
    const location = useLocation();

    // We use useCampaign to ensure we have data even if navigating directly or via redirect
    // We pass location.state?.campaign as initialData to avoid refetch if available.
    // NOTE: This hook is only meaningful if 'slug' is present.
    const { campaign, settings, isLoadingCampaign, isLoadingSettings, isFetchingCampaign, isFetchingSettings } = useCampaign({
        slugOverride: slug,
        settingsSelector: (s) => s,
        initialData: location.state?.campaign ? {
            campaign: location.state.campaign,
            settings: location.state.campaign.app_settings?.[0]
        } : undefined
    });

    // Determine if we should show a branded or generic login
    const isBranded = !!slug;

    // Fallback for settings if manual construction is needed (legacy support for state shape)
    const activeSettings = settings || (campaign ? { campaign_id: campaign.id, competition_name: campaign.name, logo_url: campaign.logo_url } : undefined);

    const { campaignRole } = useCampaignRole(campaign?.id, user?.id);
    const { canAccessAdmin, isTeacher, isSuper } = useAuthPermissions();

    useEffect(() => {
        if (user && !authLoading) {
            if (slug) {
                if (campaignRole) {
                    if (canAccessAdmin) navigate(`/admin/${slug}`, { replace: true });
                    else if (isTeacher) navigate(`/vote/${slug}`, { replace: true });
                    else navigate(`/comp/${slug}`, { replace: true });
                }
            } else {
                if (isSuper) navigate('/super', { replace: true });
                else navigate('/', { replace: true });
            }
        }
    }, [user, authLoading, slug, navigate, campaignRole, canAccessAdmin, isTeacher, isSuper]);

    if (slug && user && campaignRole === null) {
        return (
            <>
                <>
                    {slug && isLoadingCampaign ? (
                        <LoadingScreen message={t('loading_campaign_data')} />
                    ) : (
                        <>
                            <DynamicTitle settings={activeSettings} campaign={campaign} pageName={t('error')} />
                            <ErrorScreen message={t('competition_access_denied')} />
                        </>
                    )}
                </>
            </>
        );
    }

    // If it's a branded route, we MUST wait for the data to avoid generic flash.
    // We wait if:
    // 1. We are still performing the initial loading (no data at all)
    // 2. OR we have partial data (missing colors) AND a fetch is still happening in background
    const isActuallyFetching = isLoadingCampaign || isLoadingSettings || isFetchingCampaign || isFetchingSettings;
    const hasBrandingData = !!activeSettings?.primary_color;

    if (isBranded && isActuallyFetching && !hasBrandingData) {
        return <LoadingScreen message={t('loading_campaign_data')} />;
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

const App: React.FC = () => {
    const { t, dir } = useLanguage();
    const { authLoading } = useAuth();
    const { theme } = useTheme();
    useAutoUpdate();

    useEffect(() => {
        prewarmKioskAssets();
    }, []);

    return (
        <RouteErrorBoundary>
            <OfflineIndicator />
            <PwaReloadPrompt />
            <div className="flex flex-col h-screen selection:bg-cyan-500/30 overflow-hidden transition-colors duration-300 bg-[var(--bg-page)]" dir={dir}>
                {authLoading ? (
                    <LoadingScreen message={t('loading_system')} />
                ) : (
                    <div className="flex-1 flex flex-col min-h-0 relative">
                        <Routes>
                            <Route path="/" element={<><DynamicTitle /><CampaignSelector user={null} /></>} />
                            <Route path="/super" element={<><DynamicTitle pageName={t('system_admin')} /><SuperAdminPanel onLogout={() => { }} /></>} />
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

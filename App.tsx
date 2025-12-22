import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate, useParams } from 'react-router-dom';
import { Dashboard } from './components/Dashboard';
import { AdminPanel } from './components/AdminPanel';
import { CampaignSelector } from './components/CampaignSelector';
import { SuperAdminPanel } from './components/SuperAdminPanel';
import { LiteTeacherView } from './components/lite/LiteTeacherView';
import { LiteLogin } from './components/lite/LiteLogin';
import { SproutIcon, AlertIcon, HomeIcon, TrashIcon } from './components/ui/Icons';

import { DynamicTitle } from './components/ui/DynamicTitle';
import { useAuth } from './hooks/useAuth';
import { useCompetitionData } from './hooks/useCompetitionData';
import { useLanguage } from './hooks/useLanguage';
import { isSuperUser } from './config';

const LoadingScreen = ({ message }: { message?: string }) => {
    const { t } = useLanguage();
    const [showOptions, setShowOptions] = useState(false);
    const { setAuthLoading, hardReset } = useAuth();

    const displayMessage = message || t('loading_data');

    useEffect(() => {
        const timer = setTimeout(() => setShowOptions(true), 4000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="flex-1 flex items-center justify-center flex-col gap-8 p-4 text-center bg-[#020617] relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-500/10 via-transparent to-transparent opacity-50" />

            <div className="relative">
                <div className="w-24 h-24 bg-green-500/20 rounded-full absolute inset-0 blur-3xl animate-pulse" />
                <SproutIcon className="w-24 h-24 text-green-500 animate-bounce relative z-10" />
            </div>

            <div className="space-y-3 relative z-10">
                <h2 className="text-3xl font-black text-white tracking-tight">{displayMessage}</h2>
                <p className="text-slate-500 text-sm font-medium">{t('loading_wait')}</p>
            </div>

            {showOptions && (
                <div className="flex flex-col gap-3 mt-8 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <button
                        onClick={() => setAuthLoading(false)}
                        className="bg-white/5 hover:bg-white/10 text-slate-300 px-6 py-2.5 rounded-xl border border-white/10 text-xs font-black transition-all"
                    >
                        {t('stuck_skip')}
                    </button>

                    <button
                        onClick={hardReset}
                        className="text-red-400/60 hover:text-red-400 text-[10px] font-bold flex items-center gap-2 mx-auto transition-all bg-red-500/5 hover:bg-red-500/10 px-4 py-1.5 rounded-full border border-red-500/10"
                    >
                        <TrashIcon className="w-3 h-3" />
                        {t('hard_reset')}
                    </button>
                </div>
            )}
        </div>
    );
};

const ErrorScreen = ({ message }: { message: string }) => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    return (
        <div className="flex-1 flex items-center justify-center p-6 text-center">
            <div className="bg-slate-900 border border-white/10 p-10 rounded-[3rem] max-w-md w-full shadow-2xl">
                <AlertIcon className="w-16 h-16 text-red-500 mx-auto mb-6" />
                <h2 className="text-2xl font-black text-white mb-4">{t('load_error')}</h2>
                <p className="text-slate-400 mb-8 font-medium">{message}</p>
                <button onClick={() => navigate('/')} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all">
                    <HomeIcon className="w-5 h-5" /> {t('back_to_selection')}
                </button>
            </div>
        </div>
    );
};

const LanguageSync: React.FC = () => {
    const { settings } = useCompetitionData();
    const { setLanguage, language } = useLanguage();

    useEffect(() => {
        if (settings?.language && settings.language !== language) {
            setLanguage(settings.language as any);
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
    const { campaignRole, classes, settings, currentCampaign, addPoints, refreshData } = useCompetitionData();

    if (!user) return <Navigate to={`/login/${slug}`} replace />;

    // Enhanced security: Explicit role checking with fallback to deny
    const userRole = user.role?.toLowerCase().trim();
    const campaignRoleClean = campaignRole?.toLowerCase().trim();
    
    const isSuper = isSuperUser(userRole);
    const isAdmin = userRole === 'admin' || campaignRoleClean === 'admin' || campaignRoleClean === 'competition_admin';
    const isCampaignSuper = campaignRoleClean === 'superuser' || campaignRoleClean === 'super_user';
    
    const canAccess = isSuper || isAdmin || isCampaignSuper;

    // Security: Explicit deny if role is null/undefined or not authorized
    if (!canAccess) {
      if (campaignRoleClean === 'teacher') {
        return <Navigate to={`/vote/${slug}`} replace />;
      }
      return <Navigate to={`/comp/${slug}`} replace />;
    }

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
                isSuperAdmin={isSuperUser(user.role) || campaignRole === 'superuser'}
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
    const { campaignRole, settings, currentCampaign } = useCompetitionData();

    if (!user) return <Navigate to={`/login/${slug}`} replace />;
    
    // Enhanced security: Explicit role checking
    const userRole = user.role?.toLowerCase().trim();
    const campaignRoleClean = campaignRole?.toLowerCase().trim();
    
    const isSuper = isSuperUser(userRole);
    const isAdmin = userRole === 'admin' || campaignRoleClean === 'admin' || campaignRoleClean === 'competition_admin';
    const isTeacher = campaignRoleClean === 'teacher';
    
    // Security: Explicit deny if user has no role in campaign and is not superuser
    if (!isSuper && !isAdmin && !isTeacher) {
        return <ErrorScreen message={t('competition_access_denied')} />;
    }

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
    const { settings, isLoadingCampaign, campaignRole, currentCampaign } = useCompetitionData();

    useEffect(() => {
        if (user && !authLoading) {
            if (slug) {
                if (campaignRole) {
                    // User has access to this campaign
                    if (campaignRole === 'admin' || campaignRole === 'superuser' || isSuperUser(user.role)) navigate(`/admin/${slug}`, { replace: true });
                    else if (campaignRole === 'teacher') navigate(`/vote/${slug}`, { replace: true });
                    else navigate(`/comp/${slug}`, { replace: true });
                } else if (campaignRole === null) {
                    // User is confirmed to not have access to this campaign
                    // Let them see the error on login page
                }
                // campaignRole === undefined means still loading, useEffect will run again when it resolves
            } else {
                if (isSuperUser(user.role)) navigate('/super', { replace: true });
                else navigate('/', { replace: true });
            }
        }
    }, [user, authLoading, slug, navigate, campaignRole]);

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

import { ToastProvider } from './hooks/useToast';
import { RouteErrorBoundary } from './components/ui/RouteErrorBoundary';

const App: React.FC = () => {
    const { t } = useLanguage();
    const { authLoading } = useAuth();

    return (
        <ToastProvider>
            <RouteErrorBoundary>
                <div className="flex flex-col h-screen bg-[#020617] selection:bg-cyan-500/30 overflow-hidden">
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
                                <Route path="/admin/:slug" element={<AdminRoute />} />
                                <Route path="/admin/:slug/:tab" element={<AdminRoute />} />
                                <Route path="/vote/:slug" element={<VoteRoute />} />
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </div>
                    )}

                </div>
            </RouteErrorBoundary>
        </ToastProvider>
    );
};


export default App;

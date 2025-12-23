import React, { useState, useMemo, Suspense } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { ClassRoom, UserProfile, AppSettings, TickerMessage } from '../types';
import { SettingsIcon, UsersIcon, TargetIcon, RefreshIcon, CalculatorIcon, ClockIcon } from './ui/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from './ui/Logo';
import { AdminSidebar } from './admin/AdminSidebar';
import { useCompetitionData } from '../hooks/useCompetitionData';
import { GradientBackground } from './ui/GradientBackground';
import { FrozenOverlay } from './ui/FrozenOverlay';
import { isAdmin as checkIsAdmin, isSuperUser as checkIsSuperUser } from '../config';
import { VersionFooter } from './ui/VersionFooter';
import { SaveNotificationProvider, useSaveNotification } from '../contexts/SaveNotificationContext';
import { SaveNotificationBadge } from './ui/SaveNotificationBadge';
import { formatLastSaved } from '../utils/dateUtils';
import { useLanguage } from '../hooks/useLanguage';

const { useParams, useNavigate } = ReactRouterDOM as any;
const MotionDiv = motion.div as any;

const PointsManager = React.lazy(() => import('./admin/PointsManager').then(m => ({ default: m.PointsManager })));
const UsersManager = React.lazy(() => import('./admin/UsersManager').then(m => ({ default: m.UsersManager })));
const SchoolSettings = React.lazy(() => import('./admin/SchoolSettings').then(m => ({ default: m.SchoolSettings })));
const ClassesManager = React.lazy(() => import('./admin/ClassesManager').then(m => ({ default: m.ClassesManager })));
const ActionLogPanel = React.lazy(() => import('./admin/ActionLogPanel').then(m => ({ default: m.ActionLogPanel })));

const MyClassStatus = React.lazy(() => import('./admin/MyClassStatus').then(m => ({ default: m.MyClassStatus })));
const DataManagement = React.lazy(() => import('./admin/DataManagement').then(m => ({ default: m.DataManagement })));
const GoalsManagement = React.lazy(() => import('./admin/GoalsManagement').then(m => ({ default: m.GoalsManagement })));
const AiSettings = React.lazy(() => import('./admin/AiSettings').then(m => ({ default: m.AiSettings })));
const MessagesManager = React.lazy(() => import('./admin/MessagesManager').then(m => ({ default: m.MessagesManager })));

// Preload components
const preloadComponent = (importFunc: () => Promise<any>) => {
  importFunc();
};

interface AdminPanelProps {
  user: UserProfile;
  classes: ClassRoom[];
  settings: AppSettings;
  onAddPoints: (payload: any) => Promise<any>;
  onLogout: () => void;
  onRefreshData: () => void;
  onViewDashboard: () => void;
  isSuperAdmin?: boolean;
  initialTab?: 'points' | 'school';
  campaignRole?: 'admin' | 'teacher' | 'superuser' | null;
}

type TabType = 'settings' | 'points' | 'goals' | 'data-management' | 'logs';

const LoadingTab = () => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-[var(--text-secondary)]/50">
      <RefreshIcon className="w-10 h-10 animate-spin" />
      <span className="font-bold text-sm">{t('loading')}</span>
    </div>
  );
};

const AdminPanelInner: React.FC<AdminPanelProps> = ({
  user, classes, settings, onLogout, onViewDashboard, isSuperAdmin, initialTab, campaignRole
}) => {
  const { t, language } = useLanguage();
  const { slug, tab: activeTabFromUrl } = useParams();
  const navigate = useNavigate();
  const { notifications, dismiss } = useSaveNotification();

  const isAdmin = checkIsAdmin(user.role, campaignRole);
  const isSuper = checkIsSuperUser(user.role) || checkIsSuperUser(campaignRole);

  const activeTab = useMemo(() => {
    if (activeTabFromUrl === 'school') return 'settings';
    if (activeTabFromUrl) return activeTabFromUrl as TabType;
    if (initialTab === 'school') return 'settings';
    if (initialTab) return initialTab as TabType;
    return isSuper || isAdmin ? 'settings' : 'points';
  }, [activeTabFromUrl, initialTab, isSuper, isAdmin]);

  const activeNotification = notifications.get(activeTab);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const { logs, loadMoreLogs, deleteLog, updateLog, currentCampaign, updateClassTarget, updateSettingsGoals, updateTabTimestamp, refreshData, tickerMessages, addTickerMessage, deleteTickerMessage, updateTickerMessage } = useCompetitionData();

  const handleUpdateTickerMessage = async (id: string, updates: Partial<TickerMessage>) => {
    await updateTickerMessage({ id, ...updates });
  };

  const totalInstitutionScore = useMemo(() => classes.reduce((sum, cls) => sum + (cls.score || 0), 0), [classes]);

  const handleTabChange = (tab: TabType) => {
    navigate(`/admin/${slug}/${tab}`);
  };

  const handleTabHover = (tab: TabType) => {
    if (tab === 'settings') preloadComponent(() => import('./admin/SchoolSettings'));
    if (tab === 'points') preloadComponent(() => import('./admin/PointsManager'));
    if (tab === 'goals') preloadComponent(() => import('./admin/GoalsManagement'));
    if (tab === 'data-management') preloadComponent(() => import('./admin/DataManagement'));
    if (tab === 'logs') preloadComponent(() => import('./admin/ActionLogPanel'));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      return true;
    } catch (err) {
      console.error("Refresh failed:", err);
      return false;
    } finally {
      setIsRefreshing(false);
    }
  };

  const headerConfig = useMemo(() => {
    const configs: Record<TabType, { icon: any; color: string; title: string; desc: string; updatedAt?: string }> = {
      'settings': { icon: SettingsIcon, color: 'text-green-400', title: t('tab_settings' as any), desc: t('settings_title' as any), updatedAt: settings?.settings_updated_at },
      'points': { icon: CalculatorIcon, color: 'text-orange-400', title: t('tab_points' as any), desc: t('points_mgmt_desc' as any), updatedAt: settings?.logs_updated_at },
      'goals': { icon: TargetIcon, color: 'text-purple-400', title: t('tab_goals' as any), desc: t('goals_mgmt_desc' as any), updatedAt: settings?.goals_updated_at },
      'data-management': { icon: UsersIcon, color: 'text-blue-400', title: t('tab_data_management' as any), desc: t('classes_management_desc' as any), updatedAt: settings?.classes_updated_at },
      'logs': { icon: ClockIcon, color: 'text-yellow-400', title: t('tab_logs' as any), desc: t('activity_log_description' as any), updatedAt: settings?.logs_updated_at },
    };
    return configs[activeTab] || configs['points'];
  }, [activeTab, settings, t]);

  const navItems = [
    { id: 'settings', label: t('tab_settings' as any), icon: SettingsIcon, color: 'border-green-500', adminOnly: true },
    { id: 'data-management', label: t('tab_data_management' as any), icon: UsersIcon, color: 'border-blue-500', adminOnly: true },
    { divider: true },
    { id: 'goals', label: t('tab_goals' as any), icon: TargetIcon, color: 'border-purple-500', adminOnly: true },
    { id: 'points', label: t('tab_points' as any), icon: CalculatorIcon, color: 'border-orange-400', adminOnly: false },
    { divider: true },
    { id: 'logs', label: t('tab_logs' as any), icon: ClockIcon, color: 'border-yellow-500', adminOnly: false },
  ];

  const visibleNavItems = navItems.filter(item => {
    if (item.divider) return true; // Keep dividers
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });

  return (
    <GradientBackground primaryColor={settings.primary_color} secondaryColor={settings.secondary_color} brightness={settings.background_brightness}>
      <FrozenOverlay isFrozen={!currentCampaign?.is_active && !isSuperAdmin} />
      <div className="flex flex-col h-full w-full overflow-hidden relative z-10 admin-view">
        <header className="h-16 bg-white/80 dark:bg-[#1e1e2e]/80 border-b border-gray-200 dark:border-white/10 flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-50 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20 cursor-pointer hover:scale-105 transition-transform" onClick={onViewDashboard}>
              <Logo src={settings.logo_url} className="w-6 h-6 invert brightness-0 text-white" fallbackIcon="school" padding="p-0" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-none tracking-tight">{settings.school_name}</h1>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium tracking-widest uppercase mt-1">Admin Console</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Actions or Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-gray-500 dark:text-gray-400"
              title={t('refresh')}
            >
              <RefreshIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            <div className="w-px h-6 bg-gray-200 dark:bg-white/10" />

            {/* Profile Section */}
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none">{user.full_name}</p>
                <p className="text-[10px] font-medium text-indigo-500 dark:text-indigo-400 uppercase tracking-wide mt-1">
                  {isSuper ? 'Super Admin' : isAdmin ? 'Administrator' : 'Teacher'}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md text-sm ring-2 ring-white dark:ring-white/10 bg-gradient-to-br ${isSuper ? 'from-amber-400 to-orange-500' : 'from-indigo-500 to-purple-600'}`}>
                {user.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 flex pt-16 overflow-hidden bg-gray-50/50 dark:bg-[#0f0f13]/50">
          <AdminSidebar
            visibleNavItems={visibleNavItems}
            activeTab={activeTab}
            onTabChange={handleTabChange as any}
            onTabHover={handleTabHover as any}
            onViewDashboard={onViewDashboard}
            onManualRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            onLogout={onLogout}
          />
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <main className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10">
              <div className="max-w-6xl mx-auto space-y-8">
                {/* Modern Content Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pb-6 border-b border-gray-200 dark:border-white/10">
                  <div className="flex items-center gap-5">
                    <div className={`p-3.5 rounded-2xl bg-white dark:bg-white/5 shadow-sm border border-gray-100 dark:border-white/5 text-${headerConfig?.color?.split('-')[1]}-500`}>
                      {headerConfig && <headerConfig.icon className="w-8 h-8" />}
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{headerConfig?.title}</h2>
                      <p className="text-gray-500 dark:text-gray-400 font-medium text-base mt-1">{headerConfig?.desc}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {activeNotification && (
                      <SaveNotificationBadge
                        notification={activeNotification}
                        onDismiss={() => dismiss(activeTab)}
                      />
                    )}

                    {!activeNotification && headerConfig?.updatedAt && (
                      <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 font-medium bg-gray-100 dark:bg-white/5 px-3 py-1.5 rounded-full">
                        <ClockIcon className="w-3.5 h-3.5" />
                        <span>{(language === 'he' ? 'נשמר ' : 'Saved ')} {formatLastSaved(headerConfig.updatedAt, language)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Suspense fallback={<LoadingTab />}>
                  <AnimatePresence mode='wait'>
                    <MotionDiv key={activeTab} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 5 }} transition={{ duration: 0.1 }} className="min-h-full">
                      {activeTab === 'settings' && isAdmin && (
                        <div className="space-y-8">
                          <SchoolSettings settings={settings} onRefresh={refreshData as any} totalScore={totalInstitutionScore} />
                          <MessagesManager
                            messages={tickerMessages || []}
                            onAdd={addTickerMessage}
                            onDelete={deleteTickerMessage}
                            onUpdate={handleUpdateTickerMessage}
                          />
                          <AiSettings settings={settings} onRefresh={refreshData as any} />
                        </div>
                      )}
                      {activeTab === 'points' && (
                        <div className="space-y-8">
                          <PointsManager user={user} campaignRole={campaignRole} onSave={() => updateTabTimestamp('logs')} />
                          <MyClassStatus
                            classId={user.class_id || (classes.length > 0 ? classes[0].id : '')}
                            classes={classes}
                            isAdmin={isAdmin}
                          />
                        </div>
                      )}
                      {activeTab === 'goals' && isAdmin && (
                        <GoalsManagement settings={settings} classes={classes} totalInstitutionScore={totalInstitutionScore} onUpdateSettings={updateSettingsGoals as any} onUpdateClassTarget={updateClassTarget as any} />
                      )}

                      {activeTab === 'data-management' && isAdmin && (
                        <div className="space-y-8">
                          <UsersManager classes={classes} currentCampaign={currentCampaign} currentUser={user} onRefresh={refreshData as any} settings={settings} onSave={() => updateTabTimestamp('users')} />
                          <ClassesManager classes={classes} settings={settings} user={user} onRefresh={refreshData as any} onSave={() => updateTabTimestamp('classes')} />
                          <DataManagement settings={settings} onSave={() => updateTabTimestamp('settings')} />
                        </div>
                      )}
                      {activeTab === 'logs' && (
                        <ActionLogPanel logs={logs} onLoadMore={loadMoreLogs} onDelete={deleteLog} onUpdate={(id, description, points) => updateLog({ id, description, points })} currentUser={user} settings={settings} isAdmin={isAdmin} onSave={() => updateTabTimestamp('logs')} />
                      )}
                    </MotionDiv>
                  </AnimatePresence>
                </Suspense>
              </div>
            </main>
          </div>
        </div>
        <VersionFooter />
      </div>
    </GradientBackground>
  );
};

export const AdminPanel: React.FC<AdminPanelProps> = (props) => {
  return (
    <SaveNotificationProvider>
      <AdminPanelInner {...props} />
    </SaveNotificationProvider>
  );
};

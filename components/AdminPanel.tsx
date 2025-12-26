import React, { useState, useMemo, Suspense } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { ClassRoom, UserProfile, AppSettings, TickerMessage } from '../types';
import { SettingsIcon, UsersIcon, TargetIcon, RefreshIcon, CalculatorIcon, ClockIcon } from './ui/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from './ui/Logo';
import { AdminSidebar } from './admin/AdminSidebar';
import { AdminMobileMenu } from './admin/AdminMobileMenu';
import { useCompetitionData } from '../hooks/useCompetitionData';
import { FrozenOverlay } from './ui/FrozenOverlay';
import { isAdmin as checkIsAdmin, isSuperUser as checkIsSuperUser } from '../config';
import { VersionFooter } from './ui/VersionFooter';
import { SaveNotificationProvider, useSaveNotification } from '../contexts/SaveNotificationContext';
import { SaveNotificationBadge } from './ui/SaveNotificationBadge';
import { formatLastSaved } from '../utils/dateUtils';
import { useLanguage } from '../hooks/useLanguage';

const { useParams, useNavigate } = ReactRouterDOM as any;
const MotionDiv = motion.div as any;

const PointsManager = React.lazy(() => import('./admin/PointsManager').then(m => ({ default: m.PointsManager })).catch(err => { console.error('PointsManager load error:', err); return { default: () => <div>Error loading PointsManager</div> }; }));
const UsersManager = React.lazy(() => import('./admin/UsersManager').then(m => ({ default: m.UsersManager })).catch(err => { console.error('UsersManager load error:', err); return { default: () => <div>Error loading UsersManager</div> }; }));
const SchoolSettings = React.lazy(() => import('./admin/SchoolSettings').then(m => ({ default: m.SchoolSettings })).catch(err => { console.error('SchoolSettings load error:', err); return { default: () => <div>Error loading SchoolSettings</div> }; }));
const ClassesManager = React.lazy(() => import('./admin/ClassesManager').then(m => ({ default: m.ClassesManager })).catch(err => { console.error('ClassesManager load error:', err); return { default: () => <div>Error loading ClassesManager</div> }; }));
const ActionLogPanel = React.lazy(() => import('./admin/ActionLogPanel').then(m => ({ default: m.ActionLogPanel })).catch(err => { console.error('ActionLogPanel load error:', err); return { default: () => <div>Error loading ActionLogPanel</div> }; }));

const MyClassStatus = React.lazy(() => import('./admin/MyClassStatus').then(m => ({ default: m.MyClassStatus })).catch(err => { console.error('MyClassStatus load error:', err); return { default: () => <div>Error loading MyClassStatus</div> }; }));
const DataManagement = React.lazy(() => import('./admin/DataManagement').then(m => ({ default: m.DataManagement })).catch(err => { console.error('DataManagement load error:', err); return { default: () => <div>Error loading DataManagement</div> }; }));
const GoalsManagement = React.lazy(() => import('./admin/GoalsManagement').then(m => ({ default: m.GoalsManagement })).catch(err => { console.error('GoalsManagement load error:', err); return { default: () => <div>Error loading GoalsManagement</div> }; }));
const AiSettings = React.lazy(() => import('./admin/AiSettings').then(m => ({ default: m.AiSettings })).catch(err => { console.error('AiSettings load error:', err); return { default: () => <div>Error loading AiSettings</div> }; }));
const MessagesManager = React.lazy(() => import('./admin/MessagesManager').then(m => ({ default: m.MessagesManager })).catch(err => { console.error('MessagesManager load error:', err); return { default: () => <div>Error loading MessagesManager</div> }; }));

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
  initialTab?: 'points' | 'settings';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = checkIsAdmin(user.role, campaignRole);
  const isSuper = checkIsSuperUser(user.role) || checkIsSuperUser(campaignRole);

  const activeTab = useMemo(() => {
    if (activeTabFromUrl === 'school') return 'settings';
    if (activeTabFromUrl) return activeTabFromUrl as TabType;
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
    const configs: Record<TabType, { icon: any; colorVar: string; title: string; desc: string; updatedAt?: string }> = {
      'settings': { icon: SettingsIcon, colorVar: 'var(--acc-settings)', title: t('tab_settings' as any), desc: t('settings_title' as any), updatedAt: settings?.settings_updated_at },
      'points': { icon: CalculatorIcon, colorVar: 'var(--acc-points)', title: t('tab_points' as any), desc: t('points_mgmt_desc' as any), updatedAt: settings?.logs_updated_at },
      'goals': { icon: TargetIcon, colorVar: 'var(--acc-goals)', title: t('tab_goals' as any), desc: t('goals_mgmt_desc' as any), updatedAt: settings?.goals_updated_at },
      'data-management': { icon: UsersIcon, colorVar: 'var(--acc-data)', title: t('tab_data_management' as any), desc: t('classes_management_desc' as any), updatedAt: settings?.classes_updated_at },
      'logs': { icon: ClockIcon, colorVar: 'var(--acc-logs)', title: t('tab_logs' as any), desc: t('activity_log_description' as any), updatedAt: settings?.logs_updated_at },
    };
    return configs[activeTab] || configs['points'];
  }, [activeTab, settings, t]);

  const navItems = [
    { id: 'settings', label: t('tab_settings' as any), icon: SettingsIcon, colorVar: 'var(--acc-settings)', adminOnly: true },
    { id: 'data-management', label: t('tab_data_management' as any), icon: UsersIcon, colorVar: 'var(--acc-data)', adminOnly: true },
    { divider: true },
    { id: 'goals', label: t('tab_goals' as any), icon: TargetIcon, colorVar: 'var(--acc-goals)', adminOnly: true },
    { id: 'points', label: t('tab_points' as any), icon: CalculatorIcon, colorVar: 'var(--acc-points)', adminOnly: false },
    { divider: true },
    { id: 'logs', label: t('tab_logs' as any), icon: ClockIcon, colorVar: 'var(--acc-logs)', adminOnly: false },
  ];

  const visibleNavItems = navItems.filter(item => {
    if (item.divider) return true; // Keep dividers
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });

  return (
    <div className="relative h-screen w-full bg-[var(--bg-page)] text-[var(--text-main)] transition-colors duration-300 overflow-hidden">
      <FrozenOverlay isFrozen={!currentCampaign?.is_active && !isSuperAdmin} />
      <div className="flex flex-col h-full w-full overflow-hidden relative z-10 admin-view bg-[var(--bg-page)]">
        <AdminMobileMenu
          isOpen={isMobileMenuOpen}
          setIsOpen={setIsMobileMenuOpen}
          user={user}
          userClassName={isSuper ? t('role_super_user' as any) : isAdmin ? t('role_admin' as any) : t('role_teacher' as any)}
          visibleNavItems={visibleNavItems}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onViewDashboard={onViewDashboard}
          onManualRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          onLogout={onLogout}
          campaignRole={campaignRole}
        />
        <header className="hidden md:flex h-16 bg-[var(--bg-card)]/80 border-b border-[var(--border-main)] items-center justify-between px-6 fixed top-0 left-0 right-0 z-50 backdrop-blur-md transition-colors duration-300">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-[var(--primary-base)] rounded-xl shadow-lg">
              <Logo src={settings.logo_url} className="w-6 h-6 invert brightness-0 text-white" fallbackIcon="school" padding="p-0" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-[var(--text-main)] leading-none tracking-tight">{settings.school_name}</h1>
              <p className="text-[10px] text-[var(--text-muted)] font-medium tracking-widest uppercase mt-1">{currentCampaign?.name || 'Admin Console'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Actions or Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-full hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-secondary)]"
              title={t('refresh')}
            >
              <RefreshIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            <div className="w-px h-6 bg-[var(--border-main)]" />

            {/* Profile Section */}
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-[var(--text-main)] leading-none">{user.full_name}</p>
                <p className="text-[10px] font-medium text-indigo-500 dark:text-indigo-400 uppercase tracking-wide mt-1">
                  {isSuper ? t('role_super_user' as any) : isAdmin ? t('role_admin' as any) : t('role_teacher' as any)}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md text-sm ring-2 ring-[var(--bg-card)] bg-gradient-to-br ${isSuper ? 'from-amber-400 to-orange-500' : 'from-indigo-500 to-purple-600'}`}>
                {user.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 flex md:pt-16 overflow-hidden bg-transparent">
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
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pb-6 border-b border-[var(--border-main)]">
                  <div className="flex items-center gap-5">
                    <div 
                      className="p-3.5 rounded-2xl bg-[var(--bg-surface)] shadow-sm border border-[var(--border-main)] transition-colors"
                      style={{ color: headerConfig?.colorVar }}
                    >
                      {headerConfig && <headerConfig.icon className="w-8 h-8" />}
                    </div>
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-main)] tracking-tight">{headerConfig?.title}</h2>
                      <p className="text-[var(--text-secondary)] font-medium text-base mt-1">{headerConfig?.desc}</p>
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
                      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-medium bg-[var(--bg-surface)] px-3 py-1.5 rounded-full border border-[var(--border-main)]">
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
    </div>
  );
};

export const AdminPanel: React.FC<AdminPanelProps> = (props) => {
  return (
    <SaveNotificationProvider>
      <AdminPanelInner {...props} />
    </SaveNotificationProvider>
  );
};

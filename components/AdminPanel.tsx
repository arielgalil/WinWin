import React, { useState, useMemo, Suspense } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { ClassRoom, UserProfile, AppSettings, TickerMessage } from '../types';
import { SettingsIcon, UsersIcon, TargetIcon, RefreshIcon, CalculatorIcon, ClockIcon } from './ui/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminMobileMenu } from './admin/AdminMobileMenu';
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
    <div className="flex flex-col items-center justify-center h-full gap-4 text-white/50">
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

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { logs, loadMoreLogs, deleteLog, updateLog, currentCampaign, updateClassTarget, updateSettingsGoals, updateTabTimestamp, refreshData, tickerMessages, addTickerMessage, deleteTickerMessage, updateTickerMessage } = useCompetitionData();

  const handleUpdateTickerMessage = async (id: string, updates: Partial<TickerMessage>) => {
    await updateTickerMessage({ id, ...updates });
  };

  const totalInstitutionScore = useMemo(() => classes.reduce((sum, cls) => sum + (cls.score || 0), 0), [classes]);
  const userClassName = user.class_id ? classes.find(c => c.id === user.class_id)?.name || null : null;

  const handleTabChange = (tab: TabType) => {
    navigate(`/admin/${slug}/${tab}`);
    setMobileMenuOpen(false);
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
      <div className="flex flex-col h-full w-full overflow-hidden relative z-10 px-4 pt-4">
        <MotionDiv
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 w-full max-w-[2560px] mx-auto bg-black/60 backdrop-blur-3xl border border-white/20 rounded-[var(--radius-container)] shadow-[0_25px_50px_rgba(0,0,0,0.5)] flex flex-col md:flex-row overflow-hidden relative"
        >
          <AdminMobileMenu
            isOpen={mobileMenuOpen}
            setIsOpen={setMobileMenuOpen}
            user={user}
            userClassName={userClassName}
            visibleNavItems={visibleNavItems}
            activeTab={activeTab}
            onTabChange={handleTabChange as any}
            onViewDashboard={onViewDashboard}
            onManualRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            onLogout={onLogout}
            campaignRole={campaignRole}
          />
          <AdminSidebar
            user={user}
            settings={settings}
            userClassName={userClassName}
            visibleNavItems={visibleNavItems}
            activeTab={activeTab}
            onTabChange={handleTabChange as any}
            onTabHover={handleTabHover as any}
            onViewDashboard={onViewDashboard}
            onManualRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            onLogout={onLogout}
            campaignRole={campaignRole || undefined}
          />
          <div className="flex-1 flex flex-col min-h-0 bg-white/5 overflow-hidden">
            <main className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 lg:p-10 max-w-none">
              <div className="max-w-5xl mx-auto mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl bg-white/5 border border-white/10 shadow-inner`}>
                       {headerConfig && <headerConfig.icon className={`w-8 h-8 ${headerConfig.color}`} />}
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-white">{headerConfig?.title}</h2>
                      <p className="text-slate-400 font-medium text-sm">{headerConfig?.desc}</p>
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
                          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-[11px] text-white/70 shadow-sm">
                            <ClockIcon className="w-3.5 h-3.5 text-orange-400" />
                            <span className="font-bold whitespace-nowrap">{(language === 'he' ? 'נשמר לארחונה:' : 'Last saved')}: {formatLastSaved(headerConfig.updatedAt, language)}</span>
                          </div>
                        )}

                    {!activeNotification && !headerConfig?.updatedAt && (
                        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-[11px] text-white/70 shadow-sm opacity-50">
                            <ClockIcon className="w-3.5 h-3.5 text-slate-500" />
                            <span className="font-bold whitespace-nowrap">{language === 'he' ? 'לא נשמר לארחונה' : 'Not saved recently'}</span>
                        </div>
                    )}
                  </div>
                </div>
                <div className="h-px bg-white/10 w-full mt-4" />
              </div>

              <Suspense fallback={<LoadingTab />}>
                <AnimatePresence mode='wait'>
                  <MotionDiv key={activeTab} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 5 }} transition={{ duration: 0.1 }} className="min-h-full">
                    {activeTab === 'settings' && isAdmin && (
                      <div className="space-y-6">
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
            </main>
          </div>
        </MotionDiv>
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

import React, { useMemo, Suspense } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { UserProfile, TickerMessage } from '../types';
import { SettingsIcon, UsersIcon, TargetIcon, RefreshIcon, CalculatorIcon, ClockIcon } from './ui/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useCampaign } from '../hooks/useCampaign';
import { useClasses } from '../hooks/useClasses';
import { useTicker } from '../hooks/useTicker';
import { useLogs } from '../hooks/useLogs';
import { useCompetitionMutations } from '../hooks/useCompetitionMutations';
import { FrozenOverlay } from './ui/FrozenOverlay';
import { isAdmin as checkIsAdmin, isSuperUser as checkIsSuperUser } from '../config';
import { SaveNotificationProvider, useSaveNotification } from '../contexts/SaveNotificationContext';
import { useLanguage } from '../hooks/useLanguage';
import { useToast } from '../hooks/useToast';
import { generateRoleBasedShareMessage } from '../utils/sharingUtils';
import { WorkspaceLayout, NavItem } from './layouts/WorkspaceLayout';
import { Settings, Users, Target } from 'lucide-react';
import { SaveNotificationBadge } from './ui/SaveNotificationBadge';

const { useParams, useNavigate } = ReactRouterDOM as any;
const MotionDiv = motion.div as any;

const PointsManager = React.lazy(() => import('./admin/PointsManager').then(module => ({ default: module.PointsManager })));
const UsersManager = React.lazy(() => import('./admin/UsersManager').then(module => ({ default: module.UsersManager })));
const SchoolSettings = React.lazy(() => import('./admin/SchoolSettings').then(module => ({ default: module.SchoolSettings })));
const ClassesManager = React.lazy(() => import('./admin/ClassesManager').then(module => ({ default: module.ClassesManager })));
const ActionLogPanel = React.lazy(() => import('./admin/ActionLogPanel').then(module => ({ default: module.ActionLogPanel })));
const DataManagement = React.lazy(() => import('./admin/DataManagement').then(module => ({ default: module.DataManagement })));
const GoalsManagement = React.lazy(() => import('./admin/GoalsManagement').then(module => ({ default: module.GoalsManagement })));
const AiSettings = React.lazy(() => import('./admin/AiSettings').then(module => ({ default: module.AiSettings })));
const MessagesManager = React.lazy(() => import('./admin/MessagesManager').then(module => ({ default: module.MessagesManager })));


interface AdminPanelProps {
  user: UserProfile;
  onLogout: () => void;
  onViewDashboard: () => void;
  isSuperAdmin?: boolean; // This will come from useAuth usually
  initialTab?: 'points' | 'settings';
  campaignRole?: 'admin' | 'teacher' | 'superuser' | null;
}

type TabType = 'settings' | 'points' | 'goals' | 'data-management' | 'logs';

const LoadingTab = () => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-secondary/50">
      <RefreshIcon className="w-10 h-10 animate-spin" />
      <span className="font-bold text-sm">{t('loading')}</span>
    </div>
  );
};


const AdminPanelInner: React.FC<AdminPanelProps> = ({
  user, onLogout, onViewDashboard, isSuperAdmin, campaignRole
}) => {
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const { slug, tab: activeTabFromUrl } = useParams();
  const navigate = useNavigate();
  const { notifications, dismiss } = useSaveNotification();

  const { campaign, settings } = useCampaign();
  const { classes } = useClasses(campaign?.id);
  const { tickerMessages, addTickerMessage, deleteTickerMessage, updateTickerMessage } = useTicker(campaign?.id);
  const { logs, fetchNextPage: loadMoreLogs } = useLogs(campaign?.id);
  const { deleteLog, updateLog, updateClassTarget, updateSettingsGoals, updateTabTimestamp, refreshData, updateAiSummary } = useCompetitionMutations(campaign?.id);

  const isAdmin = checkIsAdmin(user.role, campaignRole);
  const isSuper = checkIsSuperUser(user.role) || isSuperAdmin;

  const activeTab = useMemo(() => {
    if (activeTabFromUrl === 'school') return 'settings';
    if (['settings', 'points', 'goals', 'data-management', 'logs'].includes(activeTabFromUrl)) {
      return activeTabFromUrl as TabType;
    }
    return isSuper || isAdmin ? 'settings' : 'points';
  }, [activeTabFromUrl, isSuper, isAdmin]);

  const activeNotification = notifications.get(activeTab);

  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleUpdateTickerMessage = async (id: string, updates: Partial<TickerMessage>) => {
    await updateTickerMessage({ id, ...updates });
  };

  const totalInstitutionScore = useMemo(() => (classes || []).reduce((sum, cls) => sum + (cls.score || 0), 0), [classes]);

  const handleTabChange = (tab: string) => {
    navigate(`/admin/${slug}/${tab}`);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      return true;
    } catch (err) {
      console.error('Refresh failed:', err);
      return false;
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleShare = async () => {
    if (!campaign) return;

    try {
      const message = generateRoleBasedShareMessage({
        role: campaignRole || 'teacher',
        campaign: campaign,
        institutionName: settings?.school_name || t('educational_institution'),
        origin: window.location.origin,
        language: language
      });
      await navigator.clipboard.writeText(message);
      showToast(t('copied_to_clipboard'), 'success');
    } catch (err) {
      console.error('Share failed:', err);
      showToast(t('copy_error'), 'error');
    }
  };

  const navItems: NavItem[] = useMemo(() => [
    { id: 'settings', label: t('tab_settings' as any), icon: Settings, adminOnly: true },
    { id: 'data-management', label: t('tab_data_management' as any), icon: Users, adminOnly: true },
    { divider: true, id: 'divider-1', label: '', icon: () => null },
    { id: 'goals', label: t('tab_goals' as any), icon: Target, adminOnly: true },
    { id: 'points', label: t('tab_points' as any), icon: CalculatorIcon, adminOnly: false },
    { divider: true, id: 'divider-2', label: '', icon: () => null },
    { id: 'logs', label: t('tab_logs' as any), icon: ClockIcon, adminOnly: false },
  ].filter(item => {
    if (item.divider) return true;
    if (item.adminOnly && !isAdmin) return false;
    return true;
  }), [isAdmin, t]);

  const userRoleLabel = useMemo(() => {
    if (campaignRole === 'superuser') return t('role_super_user');
    if (campaignRole === 'admin') return t('role_admin');
    return t('role_teacher');
  }, [campaignRole, t]);

  const userInitials = useMemo(() => {
    const name = user.full_name?.trim() || 'U';
    const parts = name.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }, [user.full_name]);

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

  const breadcrumbs = useMemo(() => [
    { label: t('admin_panel'), href: `/admin/${slug}` },
    { label: headerConfig.title }
  ], [slug, headerConfig.title, t]);

  if (!settings || !campaign) return <LoadingTab />;

  return (
    <WorkspaceLayout
      user={{
        full_name: user.full_name || '',
        initials: userInitials,
        roleLabel: userRoleLabel
      }}
      institution={{
        name: settings.school_name || "WinWin",
        logoUrl: settings.logo_url
      }}
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onLogout={onLogout}
      onViewDashboard={onViewDashboard}
      headerTitle={headerConfig.title}
      headerDescription={headerConfig.desc}
      headerIcon={headerConfig.icon}
      headerColorVar={headerConfig.colorVar}
      breadcrumbs={breadcrumbs}
      lastSavedAt={headerConfig.updatedAt}
      isRefreshing={isRefreshing}
      onRefresh={handleRefresh}
      onShare={handleShare}
      headerActions={
        activeNotification && (
          <SaveNotificationBadge
            notification={activeNotification}
            onDismiss={() => dismiss(activeTab)}
          />
        )
      }
    >
      <FrozenOverlay isFrozen={!campaign?.is_active && !isSuper} />
      <Suspense fallback={<LoadingTab />}>
        <AnimatePresence mode='wait'>
          <MotionDiv key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            {activeTab === 'settings' && isAdmin && (
              <div className="space-y-[var(--admin-section-gap)] pb-12">
                <SchoolSettings settings={settings} onRefresh={refreshData} totalScore={totalInstitutionScore} />
                <MessagesManager
                  messages={tickerMessages || []}
                  onAdd={addTickerMessage}
                  onDelete={deleteTickerMessage}
                  onUpdate={handleUpdateTickerMessage}
                />
                <AiSettings settings={settings} onRefresh={refreshData} />
              </div>
            )}
            {activeTab === 'points' && (
              <div className="space-y-[var(--admin-section-gap)] pb-12">
                <PointsManager user={user} campaignRole={campaignRole} onSave={() => updateTabTimestamp('logs')} />
              </div>
            )}
            {activeTab === 'goals' && isAdmin && (
              <div className="pb-12">
                <GoalsManagement settings={settings} classes={classes || []} totalScore={totalInstitutionScore} onUpdateSettings={updateSettingsGoals} onUpdateClassTarget={updateClassTarget} />
              </div>
            )}

            {activeTab === 'data-management' && isAdmin && (
              <div className="space-y-[var(--admin-section-gap)] pb-12">
                <UsersManager classes={classes || []} currentCampaign={campaign} currentUser={user} onRefresh={refreshData} onSave={() => updateTabTimestamp('users')} />
                <ClassesManager classes={classes || []} settings={settings} onRefresh={refreshData} onSave={() => updateTabTimestamp('classes')} />
                <DataManagement settings={settings} onSave={() => updateTabTimestamp('settings')} onRefresh={refreshData} />
              </div>
            )}
            {activeTab === 'logs' && (
              <div className="pb-12 h-full">
                <ActionLogPanel
                logs={logs}
                onLoadMore={loadMoreLogs}
                onDelete={deleteLog}
                onUpdate={(id, description, points) => updateLog({ id, description, points })}
                onUpdateSummary={updateAiSummary}
                currentUser={user}
                settings={settings}
                isAdmin={isAdmin}
                onSave={() => updateTabTimestamp('logs')}
              />
              </div>
            )}
          </MotionDiv>
        </AnimatePresence>
      </Suspense>
    </WorkspaceLayout>
  );
};

export const AdminPanel: React.FC<AdminPanelProps> = (props) => {
  return (
    <SaveNotificationProvider>
      <AdminPanelInner {...props} />
    </SaveNotificationProvider>
  );
};
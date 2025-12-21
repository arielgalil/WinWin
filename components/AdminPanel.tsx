
import React, { useState, useMemo, Suspense } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { ClassRoom, UserProfile, AppSettings } from '../types';
import { AwardIcon, SchoolIcon, UsersIcon, SparklesIcon, LayersIcon, ListIcon, DatabaseIcon, TargetIcon, RefreshIcon, LockIcon } from './ui/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminMobileMenu } from './admin/AdminMobileMenu';
import { AdminSidebar } from './admin/AdminSidebar';
import { useCompetitionData } from '../hooks/useCompetitionData';
import { GradientBackground } from './ui/GradientBackground';
import { FrozenOverlay } from './ui/FrozenOverlay';
import { useLanguage } from '../hooks/useLanguage';
import { isAdmin as checkIsAdmin, isSuperUser as checkIsSuperUser } from '../config';

const { useParams, useNavigate } = ReactRouterDOM as any;
const MotionDiv = motion.div as any;

const PointsManager = React.lazy(() => import('./admin/PointsManager').then(m => ({ default: m.PointsManager })));
const UsersManager = React.lazy(() => import('./admin/UsersManager').then(m => ({ default: m.UsersManager })));
const SchoolSettings = React.lazy(() => import('./admin/SchoolSettings').then(m => ({ default: m.SchoolSettings })));
const ClassesManager = React.lazy(() => import('./admin/ClassesManager').then(m => ({ default: m.ClassesManager })));
const ActionLogPanel = React.lazy(() => import('./admin/ActionLogPanel').then(m => ({ default: m.ActionLogPanel })));
const MessagesManager = React.lazy(() => import('./admin/MessagesManager').then(m => ({ default: m.MessagesManager })));
const MyClassStatus = React.lazy(() => import('./admin/MyClassStatus').then(m => ({ default: m.MyClassStatus })));
const DataManagement = React.lazy(() => import('./admin/DataManagement').then(m => ({ default: m.DataManagement })));
const GoalsManagement = React.lazy(() => import('./admin/GoalsManagement').then(m => ({ default: m.GoalsManagement })));
const AiSettings = React.lazy(() => import('./admin/AiSettings').then(m => ({ default: m.AiSettings })));

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

type TabType = 'points' | 'users' | 'school' | 'goals' | 'classes' | 'logs' | 'messages' | 'my-class' | 'data' | 'ai';

const LoadingTab = () => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-white/50">
      <RefreshIcon className="w-10 h-10 animate-spin" />
      <span className="font-bold text-sm">{t('loading')}</span>
    </div>
  );
};

export const AdminPanel: React.FC<AdminPanelProps> = ({
  user, classes, settings, onLogout, onRefreshData, onViewDashboard, isSuperAdmin, initialTab, campaignRole
}) => {
  const { t } = useLanguage();
  const { slug, tab: activeTabFromUrl } = useParams();
  const navigate = useNavigate();
  const isAdmin = checkIsAdmin(user.role, campaignRole);
  const isSuper = checkIsSuperUser(user.role) || checkIsSuperUser(campaignRole);

  const activeTab = useMemo(() => {
    if (activeTabFromUrl) return activeTabFromUrl as TabType;
    if (initialTab) return initialTab;
    return isSuper || isAdmin ? 'school' : 'points';
  }, [activeTabFromUrl, initialTab, isSuper, isAdmin]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { logs, loadMoreLogs, deleteLog, updateLog, tickerMessages, addTickerMessage, deleteTickerMessage, updateTickerMessage, currentCampaign, updateClassTarget, updateSettingsGoals, refreshData } = useCompetitionData();

  const totalInstitutionScore = useMemo(() => classes.reduce((sum, cls) => sum + (cls.score || 0), 0), [classes]);
  const userClassName = user.class_id ? classes.find(c => c.id === user.class_id)?.name : null;

  const handleTabChange = (tab: TabType) => {
    navigate(`/admin/${slug}/${tab}`);
    setMobileMenuOpen(false);
  };

  const navItems = [
    { id: 'school', label: t('tab_school'), icon: SchoolIcon, color: 'border-green-500', adminOnly: true },
    { id: 'ai', label: t('tab_ai'), icon: SparklesIcon, color: 'border-cyan-400', adminOnly: true },
    { id: 'goals', label: t('tab_goals'), icon: TargetIcon, color: 'border-orange-400', adminOnly: true },
    { id: 'users', label: t('tab_users'), icon: UsersIcon, color: 'border-blue-500', adminOnly: true },
    { id: 'classes', label: t('tab_classes'), icon: ListIcon, color: 'border-purple-500', adminOnly: true },
    { id: 'messages', label: t('tab_messages'), icon: LayersIcon, color: 'border-cyan-500', adminOnly: true },
    { id: 'logs', label: t('tab_logs'), icon: SparklesIcon, color: 'border-yellow-500', adminOnly: false },
    { id: 'points', label: t('tab_points'), icon: AwardIcon, color: 'border-yellow-500', adminOnly: false },
    { id: 'my-class', label: t('tab_my_class'), icon: ListIcon, color: 'border-blue-400', adminOnly: false, requiresClass: true },
    { id: 'data', label: t('tab_data'), icon: DatabaseIcon, color: 'border-orange-500', adminOnly: true },
  ];

  const visibleNavItems = navItems.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.requiresClass && !user.class_id && !isAdmin) return false;
    return true;
  });

  return (
    <GradientBackground primaryColor={settings.primary_color} secondaryColor={settings.secondary_color} brightness={settings.background_brightness}>
      <FrozenOverlay isFrozen={!currentCampaign?.is_active && !isSuperAdmin} />
      <div className="flex flex-col h-full w-full overflow-hidden relative z-10 p-2 md:p-4 pb-0">
        <MotionDiv
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 w-full max-w-[1920px] mx-auto bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden relative"
        >
          <AdminMobileMenu isOpen={mobileMenuOpen} setIsOpen={setMobileMenuOpen} user={user} userClassName={userClassName} visibleNavItems={visibleNavItems} activeTab={activeTab} onTabChange={handleTabChange as any} onViewDashboard={onViewDashboard} onManualRefresh={refreshData as any} isRefreshing={false} onLogout={onLogout} campaignRole={campaignRole} />
          <AdminSidebar user={user} settings={settings} userClassName={userClassName} visibleNavItems={visibleNavItems} activeTab={activeTab} onTabChange={handleTabChange as any} onViewDashboard={onViewDashboard} onManualRefresh={refreshData as any} isRefreshing={false} onLogout={onLogout} campaignRole={campaignRole} />
          <div className="flex-1 flex flex-col min-h-0 bg-white/5 overflow-hidden">
            <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-10">
              <Suspense fallback={<LoadingTab />}>
                <AnimatePresence mode='wait'>
                  <MotionDiv key={activeTab} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="min-h-full">
                    {activeTab === 'points' && (<PointsManager user={user} campaignRole={campaignRole} />)}
                    {activeTab === 'my-class' && (
                      <MyClassStatus
                        classId={user.class_id || (classes.length > 0 ? classes[0].id : '')}
                        classes={classes}
                        isAdmin={isAdmin}
                      />
                    )}
                    {activeTab === 'users' && isAdmin && (<UsersManager classes={classes} currentCampaign={currentCampaign} currentUser={user} onRefresh={refreshData as any} />)}
                    {activeTab === 'school' && isAdmin && (<SchoolSettings settings={settings} onRefresh={refreshData as any} totalScore={totalInstitutionScore} />)}
                    {activeTab === 'ai' && isAdmin && (<AiSettings settings={settings} onRefresh={refreshData as any} />)}
                    {activeTab === 'goals' && isAdmin && (<GoalsManagement settings={settings} classes={classes} totalInstitutionScore={totalInstitutionScore} onUpdateSettings={updateSettingsGoals as any} onUpdateClassTarget={updateClassTarget as any} />)}
                    {activeTab === 'data' && isAdmin && (<DataManagement settings={settings} classes={classes} user={user} />)}
                    {activeTab === 'classes' && isAdmin && (<ClassesManager classes={classes} settings={settings} user={user} onRefresh={refreshData as any} />)}
                    {activeTab === 'messages' && isAdmin && (<MessagesManager messages={tickerMessages} onAdd={addTickerMessage as any} onDelete={deleteTickerMessage as any} onUpdate={updateTickerMessage as any} />)}
                    {activeTab === 'logs' && (<ActionLogPanel logs={logs} onLoadMore={loadMoreLogs} onDelete={(id) => deleteLog(id)} onUpdate={(id, description, points) => updateLog({ id, description, points })} currentUser={user} settings={settings} isAdmin={isAdmin} />)}
                  </MotionDiv>
                </AnimatePresence>
              </Suspense>
            </main>
          </div>
        </MotionDiv>
      </div>
    </GradientBackground>
  );
};

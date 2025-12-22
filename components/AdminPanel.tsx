
import React, { useState, useMemo, Suspense } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { ClassRoom, UserProfile, AppSettings } from '../types';
import { SchoolIcon, SparklesIcon, DatabaseIcon, TargetIcon, RefreshIcon } from './ui/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminMobileMenu } from './admin/AdminMobileMenu';
import { AdminSidebar } from './admin/AdminSidebar';
import { useCompetitionData } from '../hooks/useCompetitionData';
import { GradientBackground } from './ui/GradientBackground';
import { FrozenOverlay } from './ui/FrozenOverlay';
import { useLanguage } from '../hooks/useLanguage';
import { isAdmin as checkIsAdmin, isSuperUser as checkIsSuperUser } from '../config';
import { VersionFooter } from './ui/VersionFooter';

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

export const AdminPanel: React.FC<AdminPanelProps> = ({
  user, classes, settings, onLogout, onViewDashboard, isSuperAdmin, initialTab, campaignRole
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
  const { logs, loadMoreLogs, deleteLog, updateLog, currentCampaign, updateClassTarget, updateSettingsGoals, refreshData } = useCompetitionData();

  const totalInstitutionScore = useMemo(() => classes.reduce((sum, cls) => sum + (cls.score || 0), 0), [classes]);
  const userClassName = user.class_id ? classes.find(c => c.id === user.class_id)?.name : null;

  const handleTabChange = (tab: TabType) => {
    navigate(`/admin/${slug}/${tab}`);
    setMobileMenuOpen(false);
  };

  const navItems = [
    { id: 'settings', label: 'הגדרות', icon: SchoolIcon, color: 'border-green-500', adminOnly: true },
    { id: 'points', label: 'ניקוד ומצב קבוצתי', icon: TargetIcon, color: 'border-orange-400', adminOnly: false },
    { id: 'goals', label: 'ניהול יעדים', icon: TargetIcon, color: 'border-purple-500', adminOnly: true },
    { id: 'data-management', label: 'ניהול מידע', icon: DatabaseIcon, color: 'border-blue-500', adminOnly: true },
    { id: 'logs', label: 'יומן', icon: SparklesIcon, color: 'border-yellow-500', adminOnly: false },
  ];

  const visibleNavItems = navItems.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    return true;
  });

  return (
    <GradientBackground primaryColor={settings.primary_color} secondaryColor={settings.secondary_color} brightness={settings.background_brightness}>
      <FrozenOverlay isFrozen={!currentCampaign?.is_active && !isSuperAdmin} />
      <div className="flex flex-col h-full w-full overflow-hidden relative z-10 p-4 md:p-6 lg:p-8">
        <MotionDiv
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 w-full max-w-[2560px] mx-auto bg-black/60 backdrop-blur-3xl border border-white/20 rounded-[var(--radius-container)] shadow-[0_25px_50px_rgba(0,0,0,0.5)] flex flex-col md:flex-row overflow-hidden relative min-h-[800px]"
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
            onManualRefresh={refreshData as any}
            isRefreshing={false}
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
            onViewDashboard={onViewDashboard}
            onManualRefresh={refreshData as any}
            isRefreshing={false}
            onLogout={onLogout}
            campaignRole={campaignRole || undefined}
          />
          <div className="flex-1 flex flex-col min-h-0 bg-white/5 overflow-hidden">
            <main className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12 lg:p-16 xl:p-20 max-w-none">
              <Suspense fallback={<LoadingTab />}>
                <AnimatePresence mode='wait'>
                  <MotionDiv key={activeTab} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="min-h-full">
                    {activeTab === 'settings' && isAdmin && (
                      <div className="space-y-8">
                        <SchoolSettings settings={settings} onRefresh={refreshData as any} totalScore={totalInstitutionScore} />
                        <AiSettings settings={settings} onRefresh={refreshData as any} />
                      </div>
                    )}
                    {activeTab === 'points' && (
                      <div className="space-y-8">
                        <PointsManager user={user} campaignRole={campaignRole} />
                        <MyClassStatus
                          classId={user.class_id || (classes.length > 0 ? classes[0].id : '')}
                          classes={classes}
                          isAdmin={isAdmin}
                        />
                      </div>
                    )}
                    {activeTab === 'goals' && isAdmin && (
                      <div className="px-6">
                        <GoalsManagement settings={settings} classes={classes} totalInstitutionScore={totalInstitutionScore} onUpdateSettings={updateSettingsGoals as any} onUpdateClassTarget={updateClassTarget as any} />
                      </div>
                    )}
                    {activeTab === 'data-management' && isAdmin && (
                      <div className="space-y-8">
                        <UsersManager classes={classes} currentCampaign={currentCampaign} currentUser={user} onRefresh={refreshData as any} />
                        <ClassesManager classes={classes} settings={settings} user={user} onRefresh={refreshData as any} />
                        <DataManagement settings={settings} classes={classes} user={user} />
                      </div>
                    )}
                    {activeTab === 'logs' && (<ActionLogPanel logs={logs} onLoadMore={loadMoreLogs} onDelete={(id) => deleteLog(id)} onUpdate={(id, description, points) => updateLog({ id, description, points })} currentUser={user} settings={settings} isAdmin={isAdmin} />)}
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

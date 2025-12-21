import React from 'react';
import { UserProfile, AppSettings } from '../../types';
import { TrophyIcon, SchoolIcon, RefreshIcon, LogoutIcon, UserIcon, TargetIcon, SparklesIcon, ListIcon, DatabaseIcon, LayersIcon, AwardIcon } from '../ui/Icons';
import { Logo } from '../ui/Logo';
import { isSuperUser } from '../../config';
import { useLanguage } from '../../hooks/useLanguage';

interface AdminSidebarProps {
  user: UserProfile;
  settings: AppSettings;
  userClassName?: string | null;
  visibleNavItems: any[];
  activeTab: string;
  onTabChange: (id: string) => void;
  onViewDashboard: () => void;
  onManualRefresh: () => void;
  isRefreshing: boolean;
  onLogout: () => void;
  campaignRole?: string;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  user,
  settings,
  userClassName,
  visibleNavItems,
  activeTab,
  onTabChange,
  onViewDashboard,
  onManualRefresh,
  isRefreshing,
  onLogout,
  campaignRole
}) => {
  const { t } = useLanguage();

  // Determine Role Label with clearer text
  const getRoleLabel = () => {
    if (isSuperUser(user.role) || isSuperUser(campaignRole)) return t('role_super_user');
    if (campaignRole === 'admin' || user.role === 'admin') return t('role_admin');
    return t('role_teacher');
  };

  const isAnySuperUser = isSuperUser(user.role) || isSuperUser(campaignRole);

  return (
    <div className="hidden md:flex bg-[var(--bg-card)]/40 p-4 w-72 flex-col justify-between border-l border-[var(--border-main)] shrink-0 h-full overflow-y-auto custom-scrollbar">
      <div>
        <div className="mb-6 p-4 bg-black/5 rounded-2xl border border-[var(--border-main)] shadow-inner">
          <div className="flex items-center gap-3 mb-3">
            <Logo
              src={settings.logo_url}
              className="w-12 h-12 shadow-lg"
              fallbackIcon="school"
              padding="p-1"
            />
            <div className="min-w-0">
              <h2 className="text-[var(--text-main)] font-black text-sm truncate leading-tight">{settings.school_name}</h2>
              <p className="text-blue-500 text-[11px] font-black truncate">{settings.competition_name}</p>
            </div>
          </div>
          <div className="h-px bg-[var(--border-main)] mb-3" />
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white shadow-lg text-sm shrink-0 ring-2 ${isAnySuperUser ? 'bg-amber-500 ring-amber-400/40' : 'bg-pink-500 ring-pink-400/40'}`}>
              {user.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-[var(--text-main)] font-black text-xs truncate">{user.full_name}</p>
              <p className={`${isAnySuperUser ? 'text-amber-500' : 'text-pink-500'} text-[10px] uppercase font-black tracking-widest truncate`}>
                {getRoleLabel()}
                {userClassName && <span className="text-[var(--text-muted)]"> | {userClassName}</span>}
              </p>
            </div>
          </div>
        </div>

        <nav className="space-y-1.5" aria-label={t('tab_school')}>
          {visibleNavItems.map(item => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              aria-current={activeTab === item.id ? 'page' : undefined}
              className={`w-full text-right py-3 px-4 rounded-xl flex items-center gap-3 transition-all duration-200 outline-none focus:ring-2 focus:ring-blue-500/50 ${activeTab === item.id
                ? `bg-blue-600 text-white font-black border-r-4 shadow-lg ${item.color}`
                : 'text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-black/5 border-r-4 border-transparent'
                }`}
            >
              <item.icon className={`w-5 h-5 shrink-0 ${activeTab === item.id ? 'opacity-100' : 'opacity-70'}`} />
              <div className="flex flex-col text-right leading-tight">
                <span className="text-sm font-bold">{t(`tab_${item.id.replace(/-/g, '_')}` as any)}</span>
                {item.subtitle && <span className="text-[10px] font-bold opacity-70">{item.subtitle}</span>}
              </div>
            </button>
          ))}
        </nav>
      </div>

      <div className="space-y-1.5 mt-4 pt-4 border-t border-[var(--border-main)]">
        <button onClick={onViewDashboard} className="w-full text-right py-2 px-3 rounded-lg flex items-center gap-3 text-yellow-500 hover:text-yellow-600 hover:bg-yellow-500/10 transition-all font-black text-sm outline-none focus:ring-2 focus:ring-yellow-500/50">
          <TrophyIcon className="w-4 h-4 shrink-0" />
          <span>{t('view_leaderboard')}</span>
        </button>
        <button onClick={onManualRefresh} className="w-full text-right py-2 px-3 rounded-lg flex items-center gap-3 text-cyan-500 hover:text-cyan-600 hover:bg-cyan-500/10 transition-all font-black text-sm outline-none focus:ring-2 focus:ring-cyan-500/50">
          <RefreshIcon className={`w-4 h-4 shrink-0 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{t('refresh')}</span>
        </button>
        <button onClick={onLogout} className="w-full text-right py-2 px-3 rounded-lg flex items-center gap-3 text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-all font-black text-sm outline-none focus:ring-2 focus:ring-red-500/50">
          <LogoutIcon className="w-4 h-4 shrink-0" />
          <span>{t('logout')}</span>
        </button>
      </div>

    </div>
  );
};

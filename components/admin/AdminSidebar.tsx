import React, { useState } from 'react';
import { UserProfile, AppSettings } from '../../types';
import { TrophyIcon, RefreshIcon, LogoutIcon, PauseIcon, CheckIcon, AlertCircleIcon } from '../ui/Icons';
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
  onTabHover?: (id: string) => void;
  onViewDashboard: () => void;
  onManualRefresh: () => Promise<boolean>;
  isRefreshing: boolean;
  onLogout: () => void;
  campaignRole?: string;
  isFrozen?: boolean;
  onToggleFreeze?: (val: boolean) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  user,
  settings,
  userClassName,
  visibleNavItems,
  activeTab,
  onTabChange,
  onTabHover,
  onViewDashboard,
  onManualRefresh,
  onLogout,
  campaignRole,
  isFrozen,
  onToggleFreeze
}) => {
  const { t } = useLanguage();
  const [localRefreshStatus, setLocalRefreshStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleRefreshClick = async () => {
    setLocalRefreshStatus('loading');
    const success = await onManualRefresh();
    if (success) {
      setLocalRefreshStatus('success');
      setTimeout(() => setLocalRefreshStatus('idle'), 2000);
    } else {
      setLocalRefreshStatus('error');
      setTimeout(() => setLocalRefreshStatus('idle'), 3000);
    }
  };

  // Determine Role Label with clearer text
  const getRoleLabel = () => {
    if (isSuperUser(user.role) || isSuperUser(campaignRole)) return t('role_super_user');
    if (campaignRole === 'admin' || user.role === 'admin') return t('role_admin');
    return t('role_teacher');
  };

  const isAnySuperUser = isSuperUser(user.role) || isSuperUser(campaignRole);

  return (
    <div className="hidden md:flex bg-[var(--bg-card)]/40 p-4 w-64 flex-col justify-between border-l border-[var(--border-main)] shrink-0 h-full overflow-y-auto custom-scrollbar max-h-screen">
      <div>
        <div className="mb-8 p-6 bg-black/5 rounded-[var(--radius-main)] border border-[var(--border-main)] shadow-inner">
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

        <nav className="space-y-1 mt-2" aria-label="תפריט ניהול">
          {visibleNavItems.map((item, index) => 
            item.divider ? (
              <div key={`divider-${index}`} className="my-4 border-t border-[var(--border-main)] opacity-50" />
            ) : (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                onMouseEnter={() => onTabHover?.(item.id)}
                aria-current={activeTab === item.id ? 'page' : undefined}
                className={`w-full text-right py-4 px-6 rounded-[var(--radius-main)] flex items-center gap-4 transition-all duration-200 outline-none focus:ring-2 focus:ring-white/20 text-base ${activeTab === item.id
                  ? `bg-white/20 text-white font-black border-r-4 shadow-lg backdrop-blur-sm border-white/40`
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-black/5 border-r-4 border-transparent'
                  }`}
              >
                <item.icon className={`w-6 h-6 shrink-0 ${activeTab === item.id ? 'opacity-100' : 'opacity-70'}`} />
                <div className="flex flex-col text-right leading-tight">
                  <span className="text-sm font-bold">{t(`tab_${item.id.replace(/-/g, '_')}` as any)}</span>
                  {item.subtitle && <span className="text-[10px] font-bold opacity-70">{item.subtitle}</span>}
                </div>
              </button>
            )
          )}
        </nav>
      </div>

      <div className="mt-6 pt-6 border-t border-[var(--border-main)]">
        <div className="flex items-center justify-between gap-2">
          <button onClick={onLogout} className="p-3 rounded-[var(--radius-main)] flex items-center justify-center text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-all outline-none focus:ring-2 focus:ring-red-500/50" title={t('logout')}>
            <LogoutIcon className="w-5 h-5 shrink-0" />
          </button>

          <div className="flex items-center gap-2">
            <button onClick={onViewDashboard} className="p-3 rounded-[var(--radius-main)] flex items-center justify-center text-yellow-500 hover:text-yellow-600 hover:bg-yellow-500/10 transition-all outline-none focus:ring-2 focus:ring-yellow-500/50" title={t('view_leaderboard')}>
              <TrophyIcon className="w-5 h-5 shrink-0" />
            </button>

            <button 
              onClick={handleRefreshClick} 
              className={`p-3 transition-all outline-none 
                ${localRefreshStatus === 'loading' ? 'text-blue-400' : 
                  localRefreshStatus === 'success' ? 'text-green-500' : 
                  localRefreshStatus === 'error' ? 'text-red-500' : 
                  'text-cyan-500 hover:text-cyan-600 hover:bg-cyan-500/10 rounded-[var(--radius-main)]'
                }`} 
              title={t('refresh')}
            >
              {localRefreshStatus === 'success' ? (
                <CheckIcon className="w-5 h-5 shrink-0" />
              ) : localRefreshStatus === 'error' ? (
                <AlertCircleIcon className="w-5 h-5 shrink-0" />
              ) : (
                <RefreshIcon className={`w-5 h-5 shrink-0 ${localRefreshStatus === 'loading' ? 'animate-spin' : ''}`} />
              )}
            </button>

            {onToggleFreeze && (
              <button
                onClick={() => onToggleFreeze(!isFrozen)}
                className={`p-3 rounded-[var(--radius-main)] flex items-center justify-center transition-all outline-none focus:ring-2 ${isFrozen
                  ? 'text-green-500 hover:text-green-600 hover:bg-green-500/10 focus:ring-green-500/50'
                  : 'text-red-500 hover:text-red-600 hover:bg-red-500/10 focus:ring-red-500/50'
                  }`}
                title={isFrozen ? t('unfreeze_board') : t('freeze_board')}
              >
                {isFrozen ? (
                  <RefreshIcon className="w-5 h-5 shrink-0" />
                ) : (
                  <PauseIcon className="w-5 h-5 shrink-0" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

import React, { useState } from 'react';
import { TrophyIcon, RefreshIcon, LogoutIcon, PauseIcon, SunIcon, MoonIcon } from '../ui/Icons';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../contexts/ThemeContext';

interface AdminSidebarProps {
  visibleNavItems: any[];
  activeTab: string;
  onTabChange: (id: string) => void;
  onTabHover?: (id: string) => void;
  onViewDashboard: () => void;
  onManualRefresh: () => Promise<boolean>;
  isRefreshing: boolean;
  onLogout: () => void;
  isFrozen?: boolean;
  onToggleFreeze?: (val: boolean) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  visibleNavItems,
  activeTab,
  onTabChange,
  onTabHover,
  onViewDashboard,
  onManualRefresh,
  onLogout,
  isFrozen,
  onToggleFreeze
}) => {
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
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


  return (
    <div className="hidden md:flex bg-white/50 dark:bg-[#0f0f13]/50 border-r border-gray-200 dark:border-white/10 p-4 w-72 flex-col justify-between shrink-0 h-full overflow-y-auto custom-scrollbar max-h-screen relative z-20 backdrop-blur-md">
      <div className="space-y-6">
        {/* Navigation Section */}
        <nav className="space-y-1" aria-label="Admin Navigation">
          {visibleNavItems.map((item, index) =>
            item.divider ? (
              <div key={`divider-${index}`} className="my-4 mx-2 h-px bg-gray-200 dark:bg-white/10" />
            ) : (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                onMouseEnter={() => onTabHover?.(item.id)}
                aria-current={activeTab === item.id ? 'page' : undefined}
                className={`w-full text-right py-2.5 px-3 rounded-lg flex items-center gap-3 transition-all duration-200 group relative ${activeTab === item.id
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 font-medium'
                  }`}
              >
                <item.icon className={`w-5 h-5 transition-colors ${activeTab === item.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`} />
                <div className="flex flex-col text-right leading-tight">
                  <span className="text-sm">{t(`tab_${item.id.replace(/-/g, '_')}` as any)}</span>
                  {item.subtitle && <span className="text-[10px] opacity-60 font-normal">{item.subtitle}</span>}
                </div>
                {activeTab === item.id && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full" />
                )}
              </button>
            )
          )}
        </nav>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-white/10 space-y-1">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-all text-gray-600 dark:text-gray-400 font-medium text-sm"
        >
          {theme === 'dark' ? <SunIcon className="w-5 h-5 text-amber-500" /> : <MoonIcon className="w-5 h-5 text-indigo-500" />}
          <span>{theme === 'dark' ? t('light_mode' as any) : t('dark_mode' as any)}</span>
        </button>

        <button
          onClick={onViewDashboard}
          className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-all text-gray-600 dark:text-gray-400 font-medium text-sm"
        >
          <TrophyIcon className="w-5 h-5 text-amber-500" />
          <span>{t('view_leaderboard')}</span>
        </button>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-all text-red-500 font-medium text-sm"
        >
          <LogoutIcon className="w-5 h-5" />
          <span>{t('logout')}</span>
        </button>

        <div className="mt-4 flex items-center justify-between px-2 pt-2 border-t border-gray-100 dark:border-white/5 opacity-60">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">WinWin v2.0</span>
          <div className="flex items-center gap-2">
            {onToggleFreeze && (
              <button
                onClick={() => onToggleFreeze(!isFrozen)}
                className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${isFrozen ? 'bg-emerald-500 text-white shadow-sm' : 'bg-gray-200 dark:bg-white/10 text-gray-500 hover:bg-rose-500 hover:text-white'}`}
                title={isFrozen ? t('unfreeze_board') : t('freeze_board')}
              >
                {isFrozen ? <RefreshIcon className="w-3 h-3" /> : <PauseIcon className="w-3 h-3" />}
              </button>
            )}
            <button onClick={handleRefreshClick} className={`w-5 h-5 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 text-gray-500 flex items-center justify-center transition-colors ${localRefreshStatus === 'loading' ? 'animate-spin' : ''}`}>
              <RefreshIcon className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

    </div >
  );
};

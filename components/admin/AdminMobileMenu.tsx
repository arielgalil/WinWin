import React, { useEffect } from 'react';
import { UserProfile } from '../../types';
import { MenuIcon, XIcon, TrophyIcon, RefreshIcon, LogoutIcon, PauseIcon, SunIcon, MoonIcon } from '../ui/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { isSuperUser } from '../../config';
import { useLanguage } from '../../hooks/useLanguage';
import { useCompetitionData } from '../../hooks/useCompetitionData';
import { useTheme } from '../../contexts/ThemeContext';

const MotionDiv = motion.div as any;

interface AdminMobileMenuProps {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  user: UserProfile;
  userClassName?: string | null;
  visibleNavItems: any[];
  activeTab: string;
  onTabChange: (id: string) => void;
  onViewDashboard: () => void;
  onManualRefresh: () => void;
  isRefreshing: boolean;
  onLogout: () => void;
  campaignRole?: 'admin' | 'teacher' | 'superuser' | null;
  isFrozen?: boolean;
  onToggleFreeze?: (val: boolean) => void;
}

export const AdminMobileMenu: React.FC<AdminMobileMenuProps> = ({
  isOpen,
  setIsOpen,
  user,
  userClassName,
  visibleNavItems,
  activeTab,
  onTabChange,
  onViewDashboard,
  onManualRefresh,
  isRefreshing,
  onLogout,
  campaignRole: propRole,
  isFrozen,
  onToggleFreeze
}) => {
  const { t, dir } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { campaignRole: hookRole } = useCompetitionData();
  const campaignRole = propRole || hookRole;
  const isAnySuperUser = isSuperUser(user.role) || isSuperUser(campaignRole);
  const isRTL = dir === 'rtl';

  const getRoleLabel = () => {
    if (isAnySuperUser) return t('role_super_user');
    if (campaignRole === 'admin' || user.role === 'admin') return t('role_admin');
    return t('role_teacher');
  };

  // Lock body scroll and prevent pull-to-refresh when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isOpen]);

  const handleLinkClick = (id: string) => {
    onTabChange(id);
    setIsOpen(false);
  };

      return (
          <div className="md:hidden sticky top-0 z-[100] bg-[var(--bg-card)] shadow-sm w-full border-b border-[var(--border-subtle)] shrink-0">
              <div className="flex items-center justify-between p-4 relative z-[120]">
                  <div className="flex items-center gap-3">
                      <button
                          onClick={() => setIsOpen(!isOpen)}
                          className="p-2 bg-[var(--bg-hover)] text-[var(--text-main)] rounded-[var(--radius-main)] active:scale-95 transition-transform hover:bg-[var(--bg-active)]"
                      >
                          {isOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                      </button>
                  </div>
  
                  <div className="flex items-center gap-3 dir-rtl">
                      <div className="text-left">
                          <p className="text-[var(--text-main)] font-bold text-base leading-tight">{user.full_name}</p>
                          <p className="text-indigo-600 dark:text-indigo-400 text-[10px] uppercase font-bold tracking-wide">
                              {getRoleLabel()}
                              {userClassName && ` | ${userClassName}`}
                          </p>
                      </div>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md border border-[var(--border-subtle)] text-sm ${isAnySuperUser ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gradient-to-br from-indigo-500 to-purple-600'}`}>
                          {user.full_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                  </div>
              </div>
  
              <AnimatePresence>
                  {isOpen && (
                      <MotionDiv
                          initial={{ opacity: 0, x: isRTL ? '100%' : '-100%' }}
                          animate={{ opacity: 1, x: '0%' }}
                          exit={{ opacity: 0, x: isRTL ? '100%' : '-100%' }}
                          transition={{ duration: 0.2 }}
                          className="fixed inset-0 bg-[var(--bg-page)] z-[110] flex flex-col overflow-hidden"
                          style={{ height: '100dvh', width: '100vw' }}
                      >
                          {/* Spacer for sticky header */}
                          <div className="h-[76px] shrink-0" />
  
                          <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col">
                              <div className="space-y-4 pb-12">
                                  <p className="text-[var(--text-muted)] text-[11px] font-bold uppercase tracking-widest mb-6 px-2">{t('app_name')}</p>
  
                                  {visibleNavItems.map((item, index) => (
                                      item.divider ? (
                                        <div key={`divider-${index}`} className="h-px bg-[var(--border-subtle)] my-4" />
                                      ) : (
                                      <button
                                          key={item.id}
                                          onClick={() => handleLinkClick(item.id)}
                                          className={`w-full text-right py-3 px-5 rounded-[var(--radius-main)] flex items-center gap-4 transition-all active:scale-[0.98] border border-transparent
                                              ${activeTab === item.id
                                                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold shadow-sm'
                                                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] font-medium'
                                              }`}
                                      >
                                          <item.icon className={`w-6 h-6 shrink-0 ${activeTab === item.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-[var(--text-muted)]'}`} />
                                          <span className="text-lg font-bold">{t(`tab_${item.id.replace(/-/g, '_')}` as any)}</span>
                                      </button>
                                      )
                                  ))}
  
                                  <div className="h-px bg-[var(--border-subtle)] my-8" />
  
                                  <div className={`grid ${onToggleFreeze ? 'grid-cols-2' : 'grid-cols-1'} gap-4 mb-4`}>
                                      <button
                                          onClick={() => { onViewDashboard(); setIsOpen(false); }}
                                          className="flex flex-col items-center justify-center p-4 rounded-[var(--radius-container)] bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 active:bg-amber-100 dark:active:bg-amber-500/20 gap-2 shadow-sm transition-all"
                                      >
                                          <TrophyIcon className="w-6 h-6" />
                                          <span className="text-xs font-bold">{t('view_leaderboard')}</span>
                                      </button>
                                      {onToggleFreeze && (
                                          <button
                                              onClick={() => { onToggleFreeze(!isFrozen); setIsOpen(false); }}
                                              className={`flex flex-col items-center justify-center p-4 rounded-[var(--radius-container)] border gap-2 shadow-sm transition-all ${isFrozen
                                                  ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20 text-green-600 dark:text-green-400 active:bg-green-100 dark:active:bg-green-500/20'
                                                  : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 active:bg-red-100 dark:active:bg-red-500/20'
                                                  }`}
                                          >
                                              {isFrozen ? <RefreshIcon className="w-6 h-6" /> : <PauseIcon className="w-6 h-6" />}
                                              <span className="text-xs font-bold">{isFrozen ? t('unfreeze_board') : t('freeze_board')}</span>
                                          </button>
                                      )}
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                      <button
                                          onClick={() => { toggleTheme(); setIsOpen(false); }}
                                          className="flex flex-col items-center justify-center p-4 rounded-[var(--radius-container)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] gap-2 shadow-sm transition-all"
                                      >
                                          {theme === 'dark' ? <SunIcon className="w-6 h-6 text-amber-500" /> : <MoonIcon className="w-6 h-6 text-indigo-500" />}
                                          <span className="text-xs font-bold">{theme === 'dark' ? t('light_mode' as any) : t('dark_mode' as any)}</span>
                                      </button>
                                      <button
                                          onClick={() => { onManualRefresh(); setIsOpen(false); }}
                                          className="flex flex-col items-center justify-center p-4 rounded-[var(--radius-container)] bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 text-cyan-600 dark:text-cyan-400 active:bg-cyan-100 dark:active:bg-cyan-500/20 gap-2 shadow-sm transition-all"
                                      >
                                          <RefreshIcon className={`w-6 h-6 ${isRefreshing ? 'animate-spin' : ''}`} />
                                          <span className="text-xs font-bold">{t('refresh')}</span>
                                      </button>
                                  </div>
  
                                  <button
                                      onClick={onLogout}
                                      className="w-full mt-8 py-4 rounded-[var(--radius-main)] flex items-center justify-center gap-4 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 font-bold text-lg shadow-sm transition-all active:scale-95 hover:bg-red-100 dark:hover:bg-red-500/20"
                                  >
                                      <LogoutIcon className="w-6 h-6" />
                                      <span>{t('logout')}</span>
                                  </button>
                              </div>
                          </div>
                      </MotionDiv>
                  )}
              </AnimatePresence>
          </div>
      );};
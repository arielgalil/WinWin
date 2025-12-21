import React, { useEffect } from 'react';
import { UserProfile } from '../../types';
import { MenuIcon, XIcon, TrophyIcon, RefreshIcon, LogoutIcon, PauseIcon } from '../ui/Icons';
import { motion, AnimatePresence } from 'framer-motion';
import { isSuperUser } from '../../config';
import { useLanguage } from '../../hooks/useLanguage';
import { useCompetitionData } from '../../hooks/useCompetitionData';

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
  const { t } = useLanguage();
  const { campaignRole: hookRole } = useCompetitionData();
  const campaignRole = propRole || hookRole;
  const isAnySuperUser = isSuperUser(user.role) || isSuperUser(campaignRole);

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
    <div className="md:hidden sticky top-0 z-[100] bg-slate-900 shadow-2xl w-full border-b border-white/10 shrink-0">
      <div className="flex items-center justify-between p-3 relative z-[120]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-3 bg-white/10 text-white rounded-[var(--radius-main)] active:scale-95 transition-transform"
          >
            {isOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </button>
        </div>

        <div className="flex items-center gap-3 dir-rtl">
          <div className="text-left">
            <p className="text-white font-black text-sm leading-tight">{user.full_name}</p>
            <p className="text-blue-400 text-[10px] uppercase font-black tracking-widest">
              {getRoleLabel()}
              {userClassName && ` | ${userClassName}`}
            </p>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-white shadow-lg border border-white/20 ${isAnySuperUser ? 'bg-gradient-to-br from-amber-400 to-orange-600' : 'bg-gradient-to-br from-pink-500 to-rose-600'}`}>
            {user.full_name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950 z-[110] flex flex-col overflow-hidden"
            style={{ height: '100dvh', width: '100vw' }}
          >
            {/* Spacer for sticky header */}
            <div className="h-[72px] shrink-0" />

            <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col">
              <div className="space-y-3 pb-12">
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 px-2">{t('app_name')}</p>

                {visibleNavItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleLinkClick(item.id)}
                    className={`w-full text-right py-4 px-6 rounded-[var(--radius-main)] flex items-center gap-5 transition-all active:scale-[0.98] border-y-0 border-l-0 border-solid ${activeTab === item.id
                      ? 'bg-white/10 text-white font-black border-r-[6px] shadow-xl ' + item.color
                      : 'text-slate-400 border-r-[6px] border-transparent bg-white/5'
                      }`}
                  >
                    <item.icon className={`w-7 h-7 shrink-0 ${activeTab === item.id ? 'text-white' : 'text-slate-500'}`} />
                    <span className="text-xl font-black">{t(`tab_${item.id.replace(/-/g, '_')}` as any)}</span>
                  </button>
                ))}

                <div className="h-px bg-white/5 my-8" />

                <div className={`grid ${onToggleFreeze ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
                  <button
                    onClick={() => { onViewDashboard(); setIsOpen(false); }}
                    className="flex flex-col items-center justify-center p-4 rounded-[var(--radius-main)] bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 active:bg-yellow-500/20 gap-2 shadow-lg"
                  >
                    <TrophyIcon className="w-6 h-6" />
                    <span className="text-[10px] font-black">{t('view_leaderboard')}</span>
                  </button>
                  {onToggleFreeze && (
                    <button
                      onClick={() => { onToggleFreeze(!isFrozen); setIsOpen(false); }}
                      className={`flex flex-col items-center justify-center p-4 rounded-[var(--radius-main)] border gap-2 shadow-lg ${isFrozen
                        ? 'bg-green-500/10 border-green-500/20 text-green-400 active:bg-green-500/20'
                        : 'bg-red-500/10 border-red-500/20 text-red-400 active:bg-red-500/20'
                        }`}
                    >
                      {isFrozen ? <RefreshIcon className="w-6 h-6" /> : <PauseIcon className="w-6 h-6" />}
                      <span className="text-[10px] font-black">{isFrozen ? t('unfreeze_board') : t('freeze_board')}</span>
                    </button>
                  )}
                  <button
                    onClick={() => { onManualRefresh(); setIsOpen(false); }}
                    className="flex flex-col items-center justify-center p-4 rounded-[var(--radius-main)] bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 active:bg-cyan-500/20 gap-2 shadow-lg"
                  >
                    <RefreshIcon className={`w-6 h-6 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span className="text-[10px] font-black">{t('refresh')}</span>
                  </button>
                </div>

                <button
                  onClick={onLogout}
                  className="w-full mt-8 py-5 rounded-[var(--radius-main)] flex items-center justify-center gap-4 text-red-400 bg-red-500/10 border border-red-500/20 active:bg-red-500/20 font-black text-lg shadow-lg"
                >
                  <LogoutIcon className="w-6 h-6" />
                  <span>{t('logout')}</span>
                </button>
              </div>
            </div>

            <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shrink-0" />
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
};
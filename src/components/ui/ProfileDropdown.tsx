import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';

interface ProfileDropdownProps {
    user: any;
    onLogout: () => void;
    isOpen: boolean;
    onClose: () => void;
    isAdmin: boolean;
    isSuperUser: boolean;
    fallbackSlug: string;
    navigate: (path: string) => void;
    musicState?: {
        isPlaying: boolean;
        onToggle: () => void;
    };
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
    user,
    onLogout,
    isOpen,
    onClose,
    isAdmin,
    isSuperUser,
    fallbackSlug,
    navigate,
    musicState
}) => {
    const { t } = useLanguage();
    const { XIcon } = require('../Icons');

    if (!isOpen) return null;

    return (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-zinc-900/95 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl p-3 z-50">
            {/* User Info with Close Button */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                <div className="flex-1 min-w-0">
                    <div className="text-white font-black text-sm truncate">{user.full_name}</div>
                    <div className="text-white/60 text-xs capitalize">
                        {user.role === 'superuser' ? t('role_super_user') : 
                         user.role === 'admin' ? t('role_admin') : 
                         user.role === 'teacher' ? t('role_teacher') : 
                         user.role}
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="w-5 h-5 flex items-center justify-center text-white/60 hover:text-white/100 hover:bg-white/10 rounded transition-colors flex-shrink-0 ml-2"
                    title="Close"
                >
                    <XIcon className="w-3 h-3" />
                </button>
            </div>

            {/* Menu Items */}
            <div className="space-y-1">
                {/* All Competitions */}
                <button
                    onClick={() => navigate('/')}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded text-xs transition-colors text-right"
                >
                    <span className="w-3 h-3 flex items-center justify-center">🌱</span>
                    {t('all_campaigns')}
                </button>

                <div className="border-t border-white/10 my-1" />

                {/* Competition Board */}
                {fallbackSlug && (
                    <button
                        onClick={() => navigate(`/comp/${fallbackSlug}`)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded text-xs transition-colors text-right"
                    >
                        <span className="w-3 h-3 flex items-center justify-center">🏆</span>
                        {t('dashboard')}
                    </button>
                )}

                {/* Enter Points */}
                {user && fallbackSlug && (
                    <button
                        onClick={() => navigate(isAdmin ? `/admin/${fallbackSlug}/points` : `/vote/${fallbackSlug}`)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded text-xs transition-colors text-right"
                    >
                        <span className="w-3 h-3 flex items-center justify-center">🧮</span>
                        {t('enter_points')}
                    </button>
                )}

                {/* Management */}
                {user && fallbackSlug && isAdmin && (
                    <button
                        onClick={() => navigate(`/admin/${fallbackSlug}/settings`)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded text-xs transition-colors text-right"
                    >
                        <span className="w-3 h-3 flex items-center justify-center">⚙️</span>
                        {t('admin_panel')}
                    </button>
                )}

                <div className="border-t border-white/10 my-1" />

                {/* Music Toggle */}
                {musicState && (
                    <button
                        onClick={musicState.onToggle}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded text-xs transition-colors text-right"
                    >
                        <span className="w-3 h-3 flex items-center justify-center">
                            {musicState.isPlaying ? '🔊' : '🔇'}
                        </span>
                        {t('music')}
                    </button>
                )}

                {/* TV Mode */}
                <button
                    onClick={() => {}}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded text-xs transition-colors text-right"
                >
                    <span className="w-3 h-3 flex items-center justify-center">⚡</span>
                    {t('tv_mode')}
                </button>

                {/* Debug Console */}
                <button
                    onClick={() => {}}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded text-xs transition-colors text-right"
                >
                    <span className="w-3 h-3 flex items-center justify-center">🛡️</span>
                    {t('debug')}
                </button>

                {/* Super Admin */}
                {isSuperUser && (
                    <button
                        onClick={() => navigate('/super')}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded text-xs transition-colors text-right"
                    >
                        <span className="w-3 h-3 flex items-center justify-center">👑</span>
                        {t('system_admin')}
                    </button>
                )}

                <div className="border-t border-white/10 my-1" />

                {/* Logout */}
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded text-xs transition-colors text-right"
                >
                    <span className="w-3 h-3 flex items-center justify-center">🚪</span>
                    {t('logout') || 'התנתק'}
                </button>
            </div>
        </div>
    );
};
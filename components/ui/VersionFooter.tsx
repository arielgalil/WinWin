import React, { useState, useEffect, useRef } from 'react';
import {
    CrownIcon,
    CalculatorIcon,
    SproutIcon,
    TrophyIcon,
    Volume2Icon,
    VolumeXIcon,
    ZapIcon,
    ShieldAlertIcon,
    LockIcon,
    SettingsIcon,
    LogoutIcon,
    XIcon
} from './Icons';
import { useAuth } from '../../hooks/useAuth';
import { useCompetitionData } from '../../hooks/useCompetitionData';
import { isSuperUser as checkSuperUser } from '../../config';
import { useLanguage } from '../../hooks/useLanguage';
import { DebugConsole } from './DebugConsole';

interface VersionFooterProps {
    onShare?: () => void;
    isSharing?: boolean;
    musicState?: {
        isPlaying: boolean;
        onToggle: () => void;
    };
    className?: string;
}

export const VersionFooter: React.FC<VersionFooterProps> = ({
    musicState,
    className = ''
}) => {
    const { t } = useLanguage();
    const { user, logout: handleLogout } = useAuth();
    
    // Simple fallback for router functionality
    const [fallbackSlug, setFallbackSlug] = useState('');
    const [fallbackPath, setFallbackPath] = useState('/');
    
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const hash = window.location.hash;
            const pathname = window.location.pathname;
            setFallbackPath(hash || pathname);
            
            // Extract slug from hash or path
            const fullPath = hash || pathname;
            const segments = fullPath.split('/');
            const slugIndex = segments.findIndex((_, i) => 
                ['comp', 'admin', 'vote', 'login'].includes(segments[i - 1])
            );
            if (slugIndex !== -1) {
                setFallbackSlug(segments[slugIndex]);
            }
        }
    }, []);

    const { campaignRole } = useCompetitionData(fallbackSlug);

    const [isLowPerf, setIsLowPerf] = useState(localStorage.getItem('winwin_low_perf') === 'true');
    const [isDebugOpen, setIsDebugOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isLowPerf) {
            document.body.classList.add('low-perf');
        } else {
            document.body.classList.remove('low-perf');
        }
        localStorage.setItem('winwin_low_perf', String(isLowPerf));
    }, [isLowPerf]);

    // Close profile menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setIsProfileMenuOpen(false);
            }
        };

        if (isProfileMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isProfileMenuOpen]);

    const isSuperUser = checkSuperUser(user?.role);
    const isAdmin = isSuperUser || user?.role === 'admin' || campaignRole === 'admin' || campaignRole === 'superuser';

    const isBoardActive = fallbackPath.includes('/comp/');
    const isManageActive = fallbackPath.includes('/admin/');
    const isVoteActive = fallbackPath.includes('/vote/');

    // Smart navigation function
    const navigate = (path: string) => {
        if (typeof window !== 'undefined') {
            // If navigating to login and we have a fallbackSlug (we're in competition context),
            // make sure to go to the login for that specific board
            if (path.includes('/login/') && fallbackSlug) {
                window.location.href = `#/login/${fallbackSlug}`;
                return;
            }
            
            // If generic login path and we have fallbackSlug, use specific login
            if (path === '/login' && fallbackSlug) {
                window.location.href = `#/login/${fallbackSlug}`;
                return;
            }
            
            // For hash-based routing, prepend # to paths
            if (!path.startsWith('#')) {
                window.location.href = `#${path}`;
            } else {
                window.location.href = path;
            }
        }
    };

    // --- Unified Navigation Button Style ---
    const getNavButtonClass = () => `
        shrink-0 outline-none focus:outline-none focus:ring-0
        hover:scale-110 hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]
        transition-all duration-300 hover:text-white/100
    `;

    const getNavButtonStyle = () => ({
        transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    });

    return (
        <>
            <DebugConsole isOpen={isDebugOpen} onClose={() => setIsDebugOpen(false)} />

            {/* Footer Container: Transparent with exactly 4px (py-1) vertical padding */}
            <footer className={`w-full bg-transparent py-1 shrink-0 z-50 ${className}`}>
                <div className="max-w-[1920px] mx-auto flex justify-center px-4">
                    <nav className="bg-zinc-900/60 backdrop-blur-xl border border-white/30 h-9 flex items-center px-4 rounded-full shadow-2xl hover:bg-zinc-900/80 transition-all">

                        {/* 1. Branding (Right Side) */}
                        <button 
                            onClick={() => navigate('/')}
                            className={`flex items-center gap-1.5 ml-3 h-5 border-l border-white/10 pl-3 sm:gap-2 text-white/90 hover:text-white/100 ${getNavButtonClass()}`}
                            title={t('nav_home')}
                            style={getNavButtonStyle()}
                        >
                            <SproutIcon className="w-3.5 h-3.5 drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
                            <span className="hidden sm:inline font-black text-[10px] tracking-tight uppercase whitespace-nowrap transition-colors">{t('app_name')}</span>
                        </button>

                        {/* 2. Main Navigation Icons */}
                        <div className="flex items-center gap-0">

                            {fallbackSlug && (
                                <button 
                                    onClick={() => navigate(`/comp/${fallbackSlug}`)} 
                                    title={t('score_board')} 
                                    className={`w-7 h-7 flex items-center justify-center ${isBoardActive ? 'text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.9)] scale-110 opacity-100' : 'text-white/60 opacity-80'} ${getNavButtonClass()}`}
                                    style={getNavButtonStyle()}
                                >
                                    <TrophyIcon className="w-4 h-4" />
                                </button>
                            )}

{user && fallbackSlug && (
                                <button 
                                    onClick={() => navigate(isAdmin ? `/admin/${fallbackSlug}/points` : `/vote/${fallbackSlug}`)} 
                                    title={t('enter_points')} 
                                    className={`w-7 h-7 flex items-center justify-center ${isVoteActive ? 'text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.9)] scale-110 opacity-100' : 'text-white/60 opacity-80'} ${getNavButtonClass()}`}
                                    style={getNavButtonStyle()}
                                >
                                    <CalculatorIcon className="w-4 h-4" />
                                </button>
                            )}

                            {user && fallbackSlug && isAdmin && (
                                <button 
                                    onClick={() => navigate(`/admin/${fallbackSlug}/school`)} 
                                    title={t('manage')} 
                                    className={`w-7 h-7 flex items-center justify-center ${isManageActive ? 'text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.9)] scale-110 opacity-100' : 'text-white/60 opacity-80'} ${getNavButtonClass()}`}
                                    style={getNavButtonStyle()}
                                >
                                    <SettingsIcon className="w-4 h-4" />
                                </button>
                            )}

                            <div className="w-px h-4 bg-white/10 mx-1.5" />

                            {/* 3. Utility Icons (Music, TV Mode, Debug, Super) */}
                            {musicState && (
                                <button 
                                    onClick={musicState.onToggle} 
                                    className={`w-7 h-7 flex items-center justify-center ${musicState.isPlaying ? 'text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.9)] scale-110 opacity-100' : 'text-white/60 opacity-80'} ${getNavButtonClass()}`}
                                    title={t('music')}
                                    style={getNavButtonStyle()}
                                >
                                    {musicState.isPlaying ? <Volume2Icon className="w-4 h-4" /> : <VolumeXIcon className="w-4 h-4" />}
                                </button>
                            )}

                            {isBoardActive && (
                                <button 
                                    onClick={() => setIsLowPerf(!isLowPerf)} 
                                    className={`w-7 h-7 flex items-center justify-center ${isLowPerf ? 'text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.9)] scale-110 opacity-100' : 'text-white/60 opacity-80'} ${getNavButtonClass()}`}
                                    title={t('tv_mode')}
                                    style={getNavButtonStyle()}
                                >
                                    <ZapIcon className="w-4 h-4" />
                                </button>
                            )}

                            {isSuperUser && (
                                <button 
                                    onClick={() => navigate('/super')} 
                                    className={`w-7 h-7 flex items-center justify-center ${fallbackPath === '/super' ? 'text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.9)] scale-110 opacity-100' : 'text-white/60 opacity-80'} ${getNavButtonClass()}`}
                                    title={t('system_admin')}
                                    style={getNavButtonStyle()}
                                >
                                    <CrownIcon className="w-4 h-4" />
                                </button>
                            )}

                            <button 
                                onClick={() => setIsDebugOpen(!isDebugOpen)} 
                                className={`w-7 h-7 flex items-center justify-center ${isDebugOpen ? 'text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.9)] scale-110 opacity-100' : 'text-white/60 opacity-80'} ${getNavButtonClass()}`}
                                title={t('debug')}
                                style={getNavButtonStyle()}
                            >
                                <ShieldAlertIcon className="w-4 h-4" />
                            </button>
                        </div>

                        {/* 4. Auth Section (Left Side) */}
                        <div className="mr-2 flex items-center border-r border-white/10 pr-2">
                            {!user ? (
<button
                                        onClick={() => navigate('/login')}
                                        title={t('login_title')}
                                        className={`w-7 h-7 flex items-center justify-center ${fallbackPath.includes('/login') ? 'text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.9)] scale-110 opacity-100' : 'text-white/60 opacity-80'} ${getNavButtonClass()}`}
                                        style={getNavButtonStyle()}
                                    >
                                        <LockIcon className="w-4 h-4" />
                                    </button>
                            ) : (
                                <div className="relative" ref={profileMenuRef}>
                                    <button
                                        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                        title={user.full_name}
                                        className="w-5 h-5 rounded-full bg-transparent border-[1.5px] border-white flex items-center justify-center text-[8px] font-extrabold text-white transition-all shrink-0 outline-none focus:outline-none text-white/80 opacity-80 hover:text-white hover:opacity-100 hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.9)] hover:scale-110 focus:ring-0"
                                        style={{
                                            transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                                        }}
                                    >
                                        {(() => {
                                            const name = user.full_name || '';
                                            const words = name.trim().split(/\s+/);
                                            if (words.length === 1) {
                                                // Single word - take first 2 letters
                                                return words[0].slice(0, 2).toUpperCase();
                                            } else {
                                                // Multiple words - take first letter of first two words
                                                return words[0].charAt(0).toUpperCase() + words[1].charAt(0).toUpperCase();
                                            }
                                        })()}
                                    </button>
                                    
                                    {/* Profile Menu */}
                                    {isProfileMenuOpen && (
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-zinc-900/95 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl p-3 z-50">
                                            {/* User Info with Close Button */}
                                            <div className="border-b border-white/10 pb-3 mb-3 flex items-center justify-between">
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
                                                    onClick={() => setIsProfileMenuOpen(false)}
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
                                                    <SproutIcon className="w-3 h-3" />
                                                    כל התחרויות
                                                </button>

                                                <div className="border-t border-white/10 my-1" />

                                                {/* Competition Board */}
                                                {fallbackSlug && (
                                                    <button
                                                        onClick={() => navigate(`/comp/${fallbackSlug}`)}
                                                        className="w-full flex items-center gap-2 px-2 py-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded text-xs transition-colors text-right"
                                                    >
                                                        <TrophyIcon className="w-3 h-3" />
                                                        לוח תחרות
                                                    </button>
                                                )}

                                                {/* Enter Points */}
                                                {user && fallbackSlug && (
                                                    <button
                                                        onClick={() => navigate(isAdmin ? `/admin/${fallbackSlug}/points` : `/vote/${fallbackSlug}`)}
                                                        className="w-full flex items-center gap-2 px-2 py-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded text-xs transition-colors text-right"
                                                    >
                                                        <CalculatorIcon className="w-3 h-3" />
                                                        {t('enter_points')}
                                                    </button>
                                                )}

                                                {/* Management */}
                                                {user && fallbackSlug && isAdmin && (
                                                    <button
                                                        onClick={() => navigate(`/admin/${fallbackSlug}/school`)}
                                                        className="w-full flex items-center gap-2 px-2 py-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded text-xs transition-colors text-right"
                                                    >
                                                        <SettingsIcon className="w-3 h-3" />
                                                        ניהול תחרות
                                                    </button>
                                                )}

                                                <div className="border-t border-white/10 my-1" />

                                                {/* Music Toggle */}
                                                {musicState && (
                                                    <button
                                                        onClick={musicState.onToggle}
                                                        className="w-full flex items-center gap-2 px-2 py-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded text-xs transition-colors text-right"
                                                    >
                                                        {musicState.isPlaying ? <Volume2Icon className="w-3 h-3" /> : <VolumeXIcon className="w-3 h-3" />}
                                                        {t('music')}
                                                    </button>
                                                )}

                                                {/* TV Mode - Only on leaderboard */}
                                                {isBoardActive && (
                                                    <button
                                                        onClick={() => setIsLowPerf(!isLowPerf)}
                                                        className="w-full flex items-center gap-2 px-2 py-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded text-xs transition-colors text-right"
                                                    >
                                                        <ZapIcon className="w-3 h-3" />
                                                        {t('tv_mode')}
                                                    </button>
                                                )}

                                                {/* Debug Console */}
                                                <button
                                                    onClick={() => setIsDebugOpen(!isDebugOpen)}
                                                    className="w-full flex items-center gap-2 px-2 py-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded text-xs transition-colors text-right"
                                                >
                                                    <ShieldAlertIcon className="w-3 h-3" />
                                                    {t('debug')}
                                                </button>

                                                {/* Super Admin */}
                                                {isSuperUser && (
                                                    <button
                                                        onClick={() => navigate('/super')}
                                                        className="w-full flex items-center gap-2 px-2 py-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded text-xs transition-colors text-right"
                                                    >
                                                        <CrownIcon className="w-3 h-3" />
                                                        {t('system_admin')}
                                                    </button>
                                                )}

                                                <div className="border-t border-white/10 my-1" />

                                                {/* Logout */}
                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full flex items-center gap-2 px-2 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded text-xs transition-colors text-right"
                                                >
                                                    <LogoutIcon className="w-3 h-3" />
                                                    {t('logout') || 'התנתק'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </nav>
                </div>
            </footer>
        </>
    );
};
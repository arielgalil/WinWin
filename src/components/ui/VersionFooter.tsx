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
    XIcon,
    MoonIcon,
    SunIcon
} from './Icons';
import { useAuth } from '../../hooks/useAuth';
import { useCampaign } from '../../hooks/useCampaign';
import { useCampaignRole } from '../../hooks/useCampaignRole';
import { isSuperUser as checkSuperUser } from '../../config';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';
import { DebugConsole } from './DebugConsole';

interface VersionFooterProps {
    onShare?: () => void;
    isSharing?: boolean;
    musicState?: {
        isPlaying: boolean;
        onToggle: () => void;
    };
    className?: string;
    onAdminClick?: () => void;
}

export const VersionFooter: React.FC<VersionFooterProps> = ({
    musicState,
    className = '',
    onAdminClick
}) => {
    const { t } = useLanguage();
    const { user, logout: handleLogout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    
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

    const { campaignId } = useCampaign({ slugOverride: fallbackSlug });
    const { campaignRole } = useCampaignRole(campaignId, user?.id);

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
        hover:scale-110 hover:drop-shadow-[0_0_12px_var(--primary-base)]
        transition-all duration-300 hover:text-[var(--text-main)]
    `;

    const getNavButtonStyle = () => ({
        transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    });

    return (
        <>
            <DebugConsole isOpen={isDebugOpen} onClose={() => setIsDebugOpen(false)} />

            {/* Footer Container: Transparent with zero vertical padding to reduce height */}
            <footer className={`w-full bg-transparent py-0 shrink-0 z-50 flex items-center ${className}`}>
                <div className="max-w-[1920px] mx-auto flex justify-center px-4 w-full">
                    <nav className="bg-transparent border-0 h-6 flex items-center gap-4 px-4 rounded-full shadow-none transition-all">

                        {/* 1. Branding (Right Side) */}
                        <button 
                            onClick={() => navigate('/')}
                            className={`flex items-center gap-1.5 sm:gap-2 text-foreground/90 hover:text-foreground ${getNavButtonClass()}`}
                            title={t('nav_home')}
                            style={getNavButtonStyle()}
                        >
                            <SproutIcon className="w-4 h-4 drop-shadow-[0_0_8px_var(--primary-base)]" />
                            <span className="hidden sm:inline font-black text-[10px] tracking-tight uppercase whitespace-nowrap transition-colors leading-none translate-y-[0.5px] text-[var(--text-main)]">{t('app_name')}</span>
                        </button>

                        {/* 2. Main Navigation Icons */}
                        <div className="flex items-center gap-4">

                            {fallbackSlug && (
                                <button 
                                    onClick={() => navigate(`/comp/${fallbackSlug}`)} 
                                    title={t('score_board')} 
                                    className={`w-6 h-6 flex items-center justify-center ${isBoardActive ? 'text-[var(--text-primary)] drop-shadow-[0_0_12px_var(--primary-base)] scale-110' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'} ${getNavButtonClass()}`}
                                    style={getNavButtonStyle()}
                                >
                                    <TrophyIcon className="w-4 h-4" />
                                </button>
                            )}

                            {user && fallbackSlug && (
                                <button 
                                    onClick={() => navigate(isAdmin ? `/admin/${fallbackSlug}/points` : `/vote/${fallbackSlug}`)} 
                                    title={t('enter_points')} 
                                    className={`w-6 h-6 flex items-center justify-center ${isVoteActive ? 'text-[var(--text-primary)] drop-shadow-[0_0_12px_var(--primary-base)] scale-110' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'} ${getNavButtonClass()}`}
                                    style={getNavButtonStyle()}
                                >
                                    <CalculatorIcon className="w-4 h-4" />
                                </button>
                            )}

                            {user && fallbackSlug && isAdmin && (
                                <button 
                                    onClick={() => navigate(`/admin/${fallbackSlug}/settings`)} 
                                    title={t('manage')} 
                                    className={`w-6 h-6 flex items-center justify-center ${isManageActive ? 'text-[var(--text-primary)] drop-shadow-[0_0_12px_var(--primary-base)] scale-110' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'} ${getNavButtonClass()}`}
                                    style={getNavButtonStyle()}
                                >
                                    <SettingsIcon className="w-4 h-4" />
                                </button>
                            )}

                            {/* 3. Utility Icons (Music, TV Mode, Debug, Super) */}
                            {musicState && (
                                <button 
                                    onClick={musicState.onToggle} 
                                    className={`w-6 h-6 flex items-center justify-center ${musicState.isPlaying ? 'text-[var(--text-primary)] drop-shadow-[0_0_12px_var(--primary-base)] scale-110' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'} ${getNavButtonClass()}`}
                                    title={t('music')}
                                    style={getNavButtonStyle()}
                                >
                                    {musicState.isPlaying ? <Volume2Icon className="w-4 h-4" /> : <VolumeXIcon className="w-4 h-4" />}
                                </button>
                            )}

                            {isBoardActive && (
                                <button 
                                    onClick={() => setIsLowPerf(!isLowPerf)} 
                                    className={`w-6 h-6 flex items-center justify-center ${isLowPerf ? 'text-foreground drop-shadow-[0_0_12px_rgba(255,255,255,0.9)] scale-110 opacity-100' : 'text-foreground/60 opacity-80'} ${getNavButtonClass()}`}
                                    title={t('tv_mode')}
                                    style={getNavButtonStyle()}
                                >
                                    <ZapIcon className="w-4 h-4" />
                                </button>
                            )}

                            {isSuperUser && (
                                <button 
                                    onClick={() => navigate('/super')} 
                                    className={`w-6 h-6 flex items-center justify-center ${fallbackPath === '/super' ? 'text-foreground drop-shadow-[0_0_12px_rgba(255,255,255,0.9)] scale-110 opacity-100' : 'text-foreground/60 opacity-80'} ${getNavButtonClass()}`}
                                    title={t('system_admin')}
                                    style={getNavButtonStyle()}
                                >
                                    <CrownIcon className="w-4 h-4" />
                                </button>
                            )}

                            <button 
                                onClick={() => setIsDebugOpen(!isDebugOpen)} 
                                className={`w-6 h-6 flex items-center justify-center ${isDebugOpen ? 'text-foreground drop-shadow-[0_0_12px_rgba(255,255,255,0.9)] scale-110 opacity-100' : 'text-foreground/60 opacity-80'} ${getNavButtonClass()}`}
                                title={t('debug')}
                                style={getNavButtonStyle()}
                            >
                                <ShieldAlertIcon className="w-4 h-4" />
                            </button>
                        </div>

                        {/* 4. Auth Section (Left Side) */}
                        <div className="flex items-center gap-4">
                            {!user ? (
                                <button
                                    onClick={() => navigate('/login')}
                                    title={t('login_title')}
                                    className={`w-6 h-6 flex items-center justify-center ${fallbackPath.includes('/login') ? 'text-foreground drop-shadow-[0_0_12px_rgba(255,255,255,0.9)] scale-110 opacity-100' : 'text-foreground/60 opacity-80'} ${getNavButtonClass()}`}
                                    style={getNavButtonStyle()}
                                >
                                    <LockIcon className="w-4 h-4" />
                                </button>
                            ) : (
                                <div className="relative" ref={profileMenuRef}>
                                    <button
                                        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                        title={user.full_name}
                                        className="w-5 h-5 rounded-full bg-transparent border-[1.5px] border-foreground flex items-center justify-center text-[8px] font-extrabold text-foreground transition-all shrink-0 outline-none focus:outline-none opacity-80 hover:opacity-100 hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.9)] hover:scale-110 focus:ring-0"
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
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-[var(--bg-card)]/95 backdrop-blur-xl border border-[var(--border-subtle)] rounded-lg shadow-2xl p-3 z-50">
                                            {/* User Info with Close Button */}
                                            <div className="border-b border-[var(--border-subtle)] pb-3 mb-3 flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[var(--text-main)] font-black text-sm truncate">{user.full_name}</div>
                                                    <div className="text-[var(--text-muted)] text-xs capitalize">
                                                    {user.role === 'superuser' ? t('role_super_user') : 
                                                     user.role === 'admin' ? t('role_admin') : 
                                                     user.role === 'teacher' ? t('role_teacher') : 
                                                     user.role}
                                                </div>
                                                </div>
                                                <button
                                                    onClick={() => setIsProfileMenuOpen(false)}
                                                    className="w-5 h-5 flex items-center justify-center text-white/60 hover:text-white/100 hover:bg-white/10 rounded transition-colors flex-shrink-0 ms-2"
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
                                                    className="w-full flex items-center gap-2 px-2 py-1.5 text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] rounded text-xs transition-colors text-start"
                                                >
                                                    <SproutIcon className="w-4 h-4" />
                                                    {t('all_campaigns')}
                                                </button>

                                                <div className="border-t border-[var(--border-subtle)] my-1" />

                                                {/* Competition Board */}
                                                {fallbackSlug && (
                                                    <button
                                                        onClick={() => navigate(`/comp/${fallbackSlug}`)}
                                                        className="w-full flex items-center gap-2 px-2 py-1.5 text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] rounded text-xs transition-colors text-start"
                                                    >
                                                        <TrophyIcon className="w-4 h-4" />
                                                        {t('dashboard')}
                                                    </button>
                                                )}

                                                {/* Enter Points */}
                                                {user && fallbackSlug && (
                                                    <button
                                                        onClick={() => navigate(isAdmin ? `/admin/${fallbackSlug}/points` : `/vote/${fallbackSlug}`)}
                                                        className="w-full flex items-center gap-2 px-2 py-1.5 text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] rounded text-xs transition-colors text-start"
                                                    >
                                                        <CalculatorIcon className="w-4 h-4" />
                                                        {t('enter_points')}
                                                    </button>
                                                )}

                                                {/* Management */}
                                                {user && fallbackSlug && isAdmin && (
                                                    <button
                                                        onClick={() => navigate(`/admin/${fallbackSlug}/settings`)}
                                                        className="w-full flex items-center gap-2 px-2 py-1.5 text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] rounded text-xs transition-colors text-start"
                                                    >
                                                        <SettingsIcon className="w-4 h-4" />
                                                        {t('admin_panel')}
                                                    </button>
                                                )}

                                                <div className="border-t border-[var(--border-subtle)] my-1" />

                                                {/* Music Toggle */}
                                                {musicState && (
                                                    <button
                                                        onClick={musicState.onToggle}
                                                        className="w-full flex items-center gap-2 px-2 py-1.5 text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] rounded text-xs transition-colors text-start"
                                                    >
                                                        {musicState.isPlaying ? <Volume2Icon className="w-4 h-4" /> : <VolumeXIcon className="w-4 h-4" />}
                                                        {t('music')}
                                                    </button>
                                                )}

                                                {/* TV Mode - Only on leaderboard */}
                                                {isBoardActive && (
                                                    <button
                                                        onClick={() => setIsLowPerf(!isLowPerf)}
                                                        className="w-full flex items-center gap-2 px-2 py-1.5 text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] rounded text-xs transition-colors text-start"
                                                    >
                                                        <ZapIcon className="w-4 h-4" />
                                                        {t('tv_mode')}
                                                    </button>
                                                )}

                                                {/* Debug Console */}
                                                <button
                                                    onClick={() => setIsDebugOpen(!isDebugOpen)}
                                                    className="w-full flex items-center gap-2 px-2 py-1.5 text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] rounded text-xs transition-colors text-start"
                                                >
                                                    <ShieldAlertIcon className="w-4 h-4" />
                                                    {t('debug')}
                                                </button>

                                                {/* Super Admin */}
                                                {isSuperUser && (
                                                    <button
                                                        onClick={() => navigate('/super')}
                                                        className="w-full flex items-center gap-2 px-2 py-1.5 text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] rounded text-xs transition-colors text-start"
                                                    >
                                                        <CrownIcon className="w-4 h-4" />
                                                        {t('system_admin')}
                                                    </button>
                                                )}

                                                <div className="border-t border-[var(--border-subtle)] my-1" />

                                                {/* Logout */}
                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full flex items-center gap-2 px-2 py-1.5 text-[var(--status-error-text)] hover:bg-[var(--status-error-bg)] rounded text-xs transition-colors text-start"
                                                >
                                                    <LogoutIcon className="w-4 h-4" />
                                                    {t('logout') || 'התנתק'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 5. Theme Toggle (End-aligned) */}
                            <button
                                onClick={toggleTheme}
                                title={t('toggle_theme')}
                                className={`w-6 h-6 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] ${getNavButtonClass()}`}
                                style={getNavButtonStyle()}
                            >
                                {theme === 'dark' ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
                            </button>
                        </div>
                    </nav>
                </div>
            </footer>
        </>
    );
};
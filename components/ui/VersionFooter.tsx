import React, { useState, useEffect } from 'react';
import {
    HomeIcon,
    CrownIcon,
    CalculatorIcon,
    SproutIcon,
    TrophyIcon,
    Volume2Icon,
    VolumeXIcon,
    ZapIcon,
    ShieldAlertIcon,
    LockIcon,
    SettingsIcon
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
    const { user } = useAuth();
    
    // Simple fallback for router functionality
    const [fallbackSlug, setFallbackSlug] = useState('');
    const [fallbackPath, setFallbackPath] = useState('/');
    
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const path = window.location.pathname;
            setFallbackPath(path);
            
            // Extract slug from path
            const segments = path.split('/');
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

    useEffect(() => {
        if (isLowPerf) {
            document.body.classList.add('low-perf');
        } else {
            document.body.classList.remove('low-perf');
        }
        localStorage.setItem('winwin_low_perf', String(isLowPerf));
    }, [isLowPerf]);

    const isSuperUser = checkSuperUser(user?.role);
    const isAdmin = isSuperUser || user?.role === 'admin' || campaignRole === 'admin' || campaignRole === 'superuser';

    const isBoardActive = fallbackPath.includes('/comp/');
    const isManageActive = fallbackPath.includes('/admin/');
    const isVoteActive = fallbackPath.includes('/vote/');
    const isHomeActive = fallbackPath === '/' || fallbackPath === '/super' || fallbackPath.includes('/login');

    // Simple navigation function
    const navigate = (path: string) => {
        if (typeof window !== 'undefined') {
            window.location.href = path;
        }
    };

    // --- Unified Icon Class (White, Glowing, Centered) ---
    const getIconClass = (isActive: boolean) => `
    w-7 h-7 flex items-center justify-center transition-all duration-300 shrink-0 outline-none
    ${isActive
            ? 'text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.9)] scale-110 opacity-100'
            : 'text-white/60 hover:text-white/100 hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.6)] opacity-80'}
  `;

    return (
        <>
            <DebugConsole isOpen={isDebugOpen} onClose={() => setIsDebugOpen(false)} />

            {/* Footer Container: Transparent with exactly 4px (py-1) vertical padding */}
            <footer className={`w-full bg-transparent py-1 shrink-0 z-50 ${className}`}>
                <div className="max-w-[1920px] mx-auto flex justify-center px-4">
                    <nav className="bg-zinc-900/60 backdrop-blur-xl border border-white/30 h-9 flex items-center px-4 rounded-full shadow-2xl hover:bg-zinc-900/80 transition-all">

                        {/* 1. Branding (Right Side) */}
                        <div className="flex items-center gap-1.5 ml-3 shrink-0 h-5 border-l border-white/10 pl-3 sm:gap-2">
                            <SproutIcon className="w-3.5 h-3.5 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
                            <span className="hidden sm:inline font-black text-[9px] tracking-tight text-white/90 uppercase whitespace-nowrap">{t('app_name')}</span>
                        </div>

                        {/* 2. Main Navigation Icons */}
                        <div className="flex items-center gap-0">
                            <button onClick={() => navigate('/')} title={t('nav_home')} className={getIconClass(isHomeActive)}>
                                <HomeIcon className="w-4 h-4" />
                            </button>

                            {fallbackSlug && (
                                <button onClick={() => navigate(`/comp/${fallbackSlug}`)} title={t('score_board')} className={getIconClass(isBoardActive)}>
                                    <TrophyIcon className="w-4 h-4" />
                                </button>
                            )}

                            {user && fallbackSlug && (
                                <button onClick={() => navigate(isAdmin ? `/admin/${fallbackSlug}/points` : `/vote/${fallbackSlug}`)} title={t('enter_points')} className={getIconClass(isVoteActive)}>
                                    <CalculatorIcon className="w-4 h-4" />
                                </button>
                            )}

                            {user && isAdmin && fallbackSlug && (
                                <button onClick={() => navigate(`/admin/${fallbackSlug}/school`)} title={t('manage')} className={getIconClass(isManageActive)}>
                                    <SettingsIcon className="w-4 h-4" />
                                </button>
                            )}

                            <div className="w-px h-4 bg-white/10 mx-1.5" />

                            {/* 3. Utility Icons (Music, TV Mode, Debug, Super) */}
                            {musicState && fallbackSlug && isBoardActive && (
                                <button onClick={musicState.onToggle} className={getIconClass(musicState.isPlaying)} title={t('music')}>
                                    {musicState.isPlaying ? <Volume2Icon className="w-4 h-4" /> : <VolumeXIcon className="w-4 h-4" />}
                                </button>
                            )}

                            <button onClick={() => setIsLowPerf(!isLowPerf)} className={getIconClass(isLowPerf)} title={t('tv_mode')}>
                                <ZapIcon className="w-4 h-4" />
                            </button>

                            {isSuperUser && (
                                <button onClick={() => navigate('/super')} className={getIconClass(fallbackPath === '/super')} title={t('system_admin')}>
                                    <CrownIcon className="w-4 h-4" />
                                </button>
                            )}

                            <button onClick={() => setIsDebugOpen(!isDebugOpen)} title={t('debug')} className={getIconClass(isDebugOpen)}>
                                <ShieldAlertIcon className="w-4 h-4" />
                            </button>
                        </div>

                        {/* 4. Auth Section (Left Side) */}
                        <div className="mr-2 flex items-center border-r border-white/10 pr-2">
                            {!user ? (
                                <button
                                    onClick={() => navigate(fallbackSlug ? `/login/${fallbackSlug}` : '/login')}
                                    title={t('login_title')}
                                    className={getIconClass(fallbackPath.includes('/login'))}
                                >
                                    <LockIcon className="w-4 h-4" />
                                </button>
                            ) : (
                                <div className="w-7 h-7 flex items-center justify-center">
                                    <button
                                        onClick={() => navigate(isAdmin && fallbackSlug ? `/admin/${fallbackSlug}` : '/')}
                                        title={user.full_name}
                                        className="w-6 h-6 rounded-full bg-transparent border-[1.5px] border-white flex items-center justify-center text-[9px] font-black text-white transition-all hover:scale-110 active:scale-95 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                                    >
                                        {user.full_name?.charAt(0).toUpperCase()}
                                    </button>
                                </div>
                            )}
                        </div>
                    </nav>
                </div>
            </footer>
        </>
    );
};
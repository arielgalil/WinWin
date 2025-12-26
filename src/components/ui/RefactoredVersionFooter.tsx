import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useCompetitionData } from '../../hooks/useCompetitionData';
import { isSuperUser as checkSuperUser } from '../../config';
import { useLanguage } from '../../hooks/useLanguage';
import { DebugConsole } from './DebugConsole';
import { 
    NavigationButton,
    HomeButton,
    TrophyButton,
    CalculatorButton,
    SettingsButton,
    MusicButton,
    ZapButton,
    CrownButton,
    ShieldButton,
    LockButton
} from './NavigationButton';
import { ProfileDropdown } from './ProfileDropdown';

interface VersionFooterProps {
    onShare?: () => void;
    isSharing?: boolean;
    musicState?: {
        isPlaying: boolean;
        onToggle: () => void;
    };
    className?: string;
}

export const RefactoredVersionFooter: React.FC<VersionFooterProps> = ({
    musicState,
    className = ''
}) => {
    const { t } = useLanguage();
    const { user, logout: handleLogout } = useAuth();
    
    // Navigation state
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

    // Utility state
    const [isLowPerf, setIsLowPerf] = useState(localStorage.getItem('winwin_low_perf') === 'true');
    const [isDebugOpen, setIsDebugOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);

    // Effects
    useEffect(() => {
        if (isLowPerf) {
            document.body.classList.add('low-perf');
        } else {
            document.body.classList.remove('low-perf');
        }
        localStorage.setItem('winwin_low_perf', String(isLowPerf));
    }, [isLowPerf]);

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

    // User permissions
    const isSuperUser = checkSuperUser(user?.role);
    const isAdmin = isSuperUser || user?.role === 'admin' || campaignRole === 'admin' || campaignRole === 'superuser';

    // Navigation states
    const isBoardActive = fallbackPath.includes('/comp/');
    const isManageActive = fallbackPath.includes('/admin/');
    const isVoteActive = fallbackPath.includes('/vote/');

    // Navigation function
    const navigate = (path: string) => {
        if (typeof window !== 'undefined') {
            if (path.includes('/login/') && fallbackSlug) {
                window.location.href = `#/login/${fallbackSlug}`;
                return;
            }
            
            if (path === '/login' && fallbackSlug) {
                window.location.href = `#/login/${fallbackSlug}`;
                return;
            }
            
            window.location.href = path.startsWith('#') ? path : `#${path}`;
        }
    };

    return (
        <>
            <DebugConsole isOpen={isDebugOpen} onClose={() => setIsDebugOpen(false)} />

            {/* Footer Container */}
            <footer className={`w-full bg-transparent py-1 shrink-0 z-50 ${className}`}>
                <div className="max-w-[1920px] mx-auto flex justify-center px-4">
                    <nav className="bg-zinc-900/60 backdrop-blur-xl border border-white/30 h-9 flex items-center px-4 rounded-full shadow-2xl hover:bg-zinc-900/80 transition-all">

                        {/* Branding Section */}
                        <HomeButton 
                            onClick={() => navigate('/')}
                            title={t('nav_home')}
                            size="sm"
                            className="ml-3 h-5 border-l border-white/10 pl-3 flex items-center gap-1.5 sm:gap-2"
                            renderAs="div" // Custom prop for branding layout
                        />

                        {/* Main Navigation */}
                        <div className="flex items-center gap-0">
                            {fallbackSlug && (
                                <TrophyButton 
                                    onClick={() => navigate(`/comp/${fallbackSlug}`)}
                                    title={t('score_board')}
                                    isActive={isBoardActive}
                                />
                            )}

                            {user && fallbackSlug && (
                                <CalculatorButton 
                                    onClick={() => navigate(isAdmin ? `/admin/${fallbackSlug}/points` : `/vote/${fallbackSlug}`)}
                                    title={t('enter_points')}
                                    isActive={isVoteActive}
                                />
                            )}

                            {user && fallbackSlug && isAdmin && (
                                <SettingsButton 
                                    onClick={() => navigate(`/admin/${fallbackSlug}/settings`)}
                                    title={t('manage')}
                                    isActive={isManageActive}
                                />
                            )}

                            <div className="w-px h-4 bg-white/10 mx-1.5" />

                            {/* Utility Icons */}
                            {musicState && (
                                <MusicButton 
                                    {...musicState}
                                    title={t('music')}
                                    isActive={musicState.isPlaying}
                                />
                            )}

                            <ZapButton 
                                onClick={() => setIsLowPerf(!isLowPerf)}
                                title={t('tv_mode')}
                                isActive={isLowPerf}
                            />

                            {isSuperUser && (
                                <CrownButton 
                                    onClick={() => navigate('/super')}
                                    title={t('system_admin')}
                                    isActive={fallbackPath === '/super'}
                                />
                            )}

                            <ShieldButton 
                                onClick={() => setIsDebugOpen(!isDebugOpen)}
                                title={t('debug')}
                                isActive={isDebugOpen}
                            />
                        </div>

                        {/* Auth Section */}
                        <div className="mr-2 flex items-center border-r border-white/10 pr-2">
                            {!user ? (
                                <LockButton
                                    onClick={() => navigate('/login')}
                                    title={t('login_title')}
                                    isActive={fallbackPath.includes('/login')}
                                />
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
                                                return words[0].slice(0, 2).toUpperCase();
                                            } else {
                                                return words[0].charAt(0).toUpperCase() + words[1].charAt(0).toUpperCase();
                                            }
                                        })()}
                                    </button>
                                    
                                    <ProfileDropdown
                                        user={user}
                                        onLogout={handleLogout}
                                        isOpen={isProfileMenuOpen}
                                        onClose={() => setIsProfileMenuOpen(false)}
                                        isAdmin={isAdmin}
                                        isSuperUser={isSuperUser}
                                        fallbackSlug={fallbackSlug}
                                        navigate={navigate}
                                        musicState={musicState}
                                    />
                                </div>
                            )}
                        </div>
                    </nav>
                </div>
            </footer>
        </>
    );
};
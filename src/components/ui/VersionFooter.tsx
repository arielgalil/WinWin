import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
    BugIcon,
    CalculatorIcon,
    CrownIcon,
    LockIcon,
    LogoutIcon,
    MoonIcon,
    SettingsIcon,
    SproutIcon,
    SunIcon,
    TrophyIcon,
    Volume2Icon,
    VolumeXIcon,
    XIcon,
} from "./Icons";
import { useAuth } from "../../hooks/useAuth";
import { useCampaign } from "../../hooks/useCampaign";
import { useCampaignRole } from "../../hooks/useCampaignRole";
import { isSuperUser as checkSuperUser } from "../../config";
import { useLanguage } from "../../hooks/useLanguage";
import { useTheme } from "../../hooks/useTheme";
import { DebugConsole } from "./DebugConsole";

interface VersionFooterProps {
    onShare?: () => void;
    isSharing?: boolean;
    musicState?: {
        isPlaying: boolean;
        onToggle: () => void;
    };
    className?: string;
    onAdminClick?: () => void;
    isDebugOpen?: boolean;
    onDebugToggle?: () => void;
    viewerCount?: number;
}

export const VersionFooter: React.FC<VersionFooterProps> = ({
    musicState,
    className = "",
    onAdminClick: _onAdminClick,
    isDebugOpen = false,
    onDebugToggle,
    viewerCount,
}) => {
    const { t } = useLanguage();
    const { user, logout: handleLogout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const [internalDebugOpen, setInternalDebugOpen] = useState(false);
    const resolvedIsDebugOpen = onDebugToggle !== undefined ? isDebugOpen : internalDebugOpen;
    const handleDebugToggle = onDebugToggle || (() => setInternalDebugOpen(!internalDebugOpen));

    // Simple fallback for router functionality
    const [fallbackSlug, setFallbackSlug] = useState("");
    const [fallbackPath, setFallbackPath] = useState("/");

    useEffect(() => {
        if (typeof window !== "undefined") {
            const hash = window.location.hash;
            const pathname = window.location.pathname;
            setFallbackPath(hash || pathname);

            // Extract slug from hash or path
            const fullPath = hash || pathname;
            const segments = fullPath.split("/");
            const slugIndex = segments.findIndex((_, i) =>
                ["comp", "admin", "vote", "login"].includes(segments[i - 1])
            );
            if (slugIndex !== -1) {
                setFallbackSlug(segments[slugIndex]);
            }
        }
    }, []);

    const { campaignId } = useCampaign({ slugOverride: fallbackSlug });
    const { campaignRole } = useCampaignRole(campaignId, user?.id);

    const [isLowPerf] = useState(
        localStorage.getItem("winwin_low_perf") === "true",
    );
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);
    const avatarButtonRef = useRef<HTMLButtonElement>(null);
    const [menuPos, setMenuPos] = useState({ bottom: 0, left: 0 });

    useEffect(() => {
        if (isLowPerf) {
            document.body.classList.add("low-perf");
        } else {
            document.body.classList.remove("low-perf");
        }
        localStorage.setItem("winwin_low_perf", String(isLowPerf));
    }, [isLowPerf]);

    // Close profile menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                avatarButtonRef.current &&
                !avatarButtonRef.current.contains(event.target as Node)
            ) {
                setIsProfileMenuOpen(false);
            }
        };

        if (isProfileMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isProfileMenuOpen]);

    const isSuperUser = checkSuperUser(user?.role);
    const isAdmin = isSuperUser || user?.role === "admin" ||
        campaignRole === "admin" || campaignRole === "superuser";

    const isBoardActive = fallbackPath.includes("/comp/");
    const isManageActive = fallbackPath.includes("/admin/");
    const isVoteActive = fallbackPath.includes("/vote/");

    // Smart navigation function
    const navigate = (path: string) => {
        if (typeof window !== "undefined") {
            // If navigating to login and we have a fallbackSlug (we're in competition context),
            // make sure to go to the login for that specific board
            if (path.includes("/login/") && fallbackSlug) {
                window.location.href = `#/login/${fallbackSlug}`;
                return;
            }

            // If generic login path and we have fallbackSlug, use specific login
            if (path === "/login" && fallbackSlug) {
                window.location.href = `#/login/${fallbackSlug}`;
                return;
            }

            // For hash-based routing, prepend # to paths
            if (!path.startsWith("#")) {
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
        transition-all duration-300 hover:text-zinc-100
    `;

    const getNavButtonStyle = () => ({
        transition:
            "all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    });

    return (
        <footer
            className={`w-full bg-zinc-900 py-0.5 shrink-0 z-50 flex items-center ${className}`}
        >
                <div className="max-w-[1920px] mx-auto grid grid-cols-[1fr_auto_1fr] items-center px-4 w-full">
                    {/* Left: empty spacer */}
                    <div />

                    <nav className="h-6 flex items-center gap-4 px-4 transition-all">
                        {/* 1. Branding (Right Side) */}
                        <button
                            onClick={() => navigate("/")}
                            className={`flex items-center gap-1.5 sm:gap-2 text-zinc-100 hover:text-zinc-100 ${getNavButtonClass()}`}
                            title={t("nav_home")}
                            style={getNavButtonStyle()}
                        >
                            <SproutIcon className="w-4 h-4 drop-shadow-[0_0_8px_var(--primary-base)]" />
                            <span className="hidden sm:inline font-black text-[10px] tracking-tight uppercase whitespace-nowrap transition-colors leading-none translate-y-[0.5px] text-zinc-100">
                                {t("app_name")}
                            </span>
                        </button>

                        {/* 2. Main Navigation Icons */}
                        <div className="flex items-center gap-4">
                            {fallbackSlug && (
                                <button
                                    onClick={() =>
                                        navigate(`/comp/${fallbackSlug}`)}
                                    title={t("score_board")}
                                    className={`w-6 h-6 flex items-center justify-center ${
                                        isBoardActive
                                            ? "text-primary drop-shadow-[0_0_12px_var(--primary-base)] scale-110"
                                            : "text-zinc-400 hover:text-zinc-100"
                                    } ${getNavButtonClass()}`}
                                    style={getNavButtonStyle()}
                                >
                                    <TrophyIcon className="w-4 h-4" />
                                </button>
                            )}

                            {user && fallbackSlug && (
                                <button
                                    onClick={() =>
                                        navigate(
                                            isAdmin
                                                ? `/admin/${fallbackSlug}/points`
                                                : `/vote/${fallbackSlug}`,
                                        )}
                                    title={t("enter_points")}
                                    className={`w-6 h-6 flex items-center justify-center ${
                                        isVoteActive
                                            ? "text-primary drop-shadow-[0_0_12px_var(--primary-base)] scale-110"
                                            : "text-zinc-400 hover:text-zinc-100"
                                    } ${getNavButtonClass()}`}
                                    style={getNavButtonStyle()}
                                >
                                    <CalculatorIcon className="w-4 h-4" />
                                </button>
                            )}

                            {user && fallbackSlug && isAdmin && (
                                <button
                                    onClick={() =>
                                        navigate(
                                            `/admin/${fallbackSlug}/settings`,
                                        )}
                                    title={t("manage")}
                                    className={`w-6 h-6 flex items-center justify-center ${
                                        isManageActive
                                            ? "text-primary drop-shadow-[0_0_12px_var(--primary-base)] scale-110"
                                            : "text-zinc-400 hover:text-zinc-100"
                                    } ${getNavButtonClass()}`}
                                    style={getNavButtonStyle()}
                                >
                                    <SettingsIcon className="w-4 h-4" />
                                </button>
                            )}

                            {/* 3. Utility Icons (Music, Debug, Super) */}
                            {musicState && (
                                <button
                                    onClick={musicState.onToggle}
                                    className={`w-6 h-6 flex items-center justify-center ${
                                        musicState.isPlaying
                                            ? "text-primary drop-shadow-[0_0_12px_var(--primary-base)] scale-110"
                                            : "text-zinc-400 hover:text-zinc-100"
                                    } ${getNavButtonClass()}`}
                                    title={t("music")}
                                    style={getNavButtonStyle()}
                                >
                                    {musicState.isPlaying
                                        ? <Volume2Icon className="w-4 h-4" />
                                        : <VolumeXIcon className="w-4 h-4" />}
                                </button>
                            )}

                            {isSuperUser && (
                                <button
                                    onClick={() => navigate("/super")}
                                    className={`w-6 h-6 flex items-center justify-center ${
                                        fallbackPath === "/super"
                                            ? "text-zinc-100 drop-shadow-[0_0_12px_rgba(255,255,255,0.9)] scale-110 opacity-100"
                                            : "text-zinc-400 hover:text-zinc-100"
                                    } ${getNavButtonClass()}`}
                                    title={t("system_admin")}
                                    style={getNavButtonStyle()}
                                >
                                    <CrownIcon className="w-4 h-4" />
                                </button>
                            )}

                             <button
                                 onClick={handleDebugToggle}
                                 className={`w-6 h-6 flex items-center justify-center ${
                                     resolvedIsDebugOpen
                                         ? "text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.9)] scale-110 opacity-100 animate-pulse"
                                         : "text-zinc-400 hover:text-zinc-100"
                                 } ${getNavButtonClass()}`}
                                 title={t("debug")}
                                 style={getNavButtonStyle()}
                             >
                                <BugIcon className="w-4 h-4" />
                            </button>
                        </div>

                        {/* 4. Auth Section (Left Side) */}
                        <div className="flex items-center gap-4">
                            {!user
                                ? (
                                    <button
                                        onClick={() => navigate("/login")}
                                        title={t("login_title")}
                                        className={`w-6 h-6 flex items-center justify-center ${
                                            fallbackPath.includes("/login")
                                                ? "text-zinc-100 drop-shadow-[0_0_12px_rgba(255,255,255,0.9)] scale-110 opacity-100"
                                                : "text-zinc-400 hover:text-zinc-100"
                                        } ${getNavButtonClass()}`}
                                        style={getNavButtonStyle()}
                                    >
                                        <LockIcon className="w-4 h-4" />
                                    </button>
                                )
                                : (
                                    <div
                                        className="relative z-[110]"
                                        ref={profileMenuRef}
                                    >
                                        <button
                                            ref={avatarButtonRef}
                                            onClick={() => {
                                                if (!isProfileMenuOpen && avatarButtonRef.current) {
                                                    const rect = avatarButtonRef.current.getBoundingClientRect();
                                                    setMenuPos({
                                                        bottom: window.innerHeight - rect.top + 8,
                                                        left: rect.left + rect.width / 2,
                                                    });
                                                }
                                                setIsProfileMenuOpen(!isProfileMenuOpen);
                                            }}
                                            title={user.full_name}
                                            className="w-5 h-5 rounded-full bg-transparent border-[1.5px] border-zinc-300 flex items-center justify-center text-[8px] font-extrabold text-zinc-100 transition-all shrink-0 outline-none focus:outline-none opacity-80 hover:opacity-100 hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.9)] hover:scale-110 focus:ring-0"
                                            style={{
                                                transition:
                                                    "all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                                            }}
                                        >
                                            {(() => {
                                                const name = user.full_name ||
                                                    "";
                                                const words = name.trim().split(
                                                    /\s+/,
                                                );
                                                if (words.length === 1) {
                                                    // Single word - take first 2 letters
                                                    return words[0].slice(0, 2)
                                                        .toUpperCase();
                                                } else {
                                                    // Multiple words - take first letter of first two words
                                                    return words[0].charAt(0)
                                                        .toUpperCase() +
                                                        words[1].charAt(0)
                                                            .toUpperCase();
                                                }
                                            })()}
                                        </button>

                                        {/* Profile Menu via Portal */}
                                        {isProfileMenuOpen && createPortal(
                                            <>
                                            <div
                                                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] md:hidden"
                                                onClick={() => setIsProfileMenuOpen(false)}
                                            />
                                            <div
                                                className="fixed w-56 bg-[var(--bg-card)] backdrop-blur-2xl border border-[var(--border-main)] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-4 z-[9999] animate-in fade-in slide-in-from-bottom-2 duration-200"
                                                style={{ bottom: menuPos.bottom, left: menuPos.left, transform: 'translateX(-50%)' }}
                                            >
                                                {/* User Info with Close Button */}
                                                <div className="border-b border-[var(--border-subtle)] pb-4 mb-4 flex items-center justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-zinc-100 font-black text-base truncate">
                                                            {user.full_name}
                                                        </div>
                                                        <div className="text-zinc-400 text-xs font-bold uppercase tracking-wider mt-0.5">
                                                            {user.role ===
                                                                    "superuser"
                                                                ? t("role_super_user")
                                                                : user.role ===
                                                                        "admin"
                                                                ? t("role_admin")
                                                                : user.role ===
                                                                        "teacher"
                                                                ? t("role_teacher")
                                                                : user.role}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() =>
                                                            setIsProfileMenuOpen(
                                                                false,
                                                            )}
                                                        className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-[var(--bg-hover)] rounded-full transition-colors flex-shrink-0 ms-2"
                                                        title="Close"
                                                    >
                                                        <XIcon className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                {/* Menu Items */}
                                                <div className="space-y-1.5 font-bold">
                                                    {/* All Competitions */}
                                                    <button
                                                        onClick={() =>
                                                            navigate("/")}
                                                        className="w-full flex items-center gap-2 px-2 py-1.5 text-[var(--text-secondary)] hover:text-zinc-100 hover:bg-[var(--bg-hover)] rounded text-xs transition-colors text-start"
                                                    >
                                                        <SproutIcon className="w-4 h-4" />
                                                        {t("all_campaigns")}
                                                    </button>

                                                    <div className="border-t border-[var(--border-subtle)] my-1" />

                                                    {/* Competition Board */}
                                                    {fallbackSlug && (
                                                        <button
                                                            onClick={() =>
                                                                navigate(
                                                                    `/comp/${fallbackSlug}`,
                                                                )}
                                                            className="w-full flex items-center gap-2 px-2 py-1.5 text-[var(--text-secondary)] hover:text-zinc-100 hover:bg-[var(--bg-hover)] rounded text-xs transition-colors text-start"
                                                        >
                                                            <TrophyIcon className="w-4 h-4" />
                                                            {t("dashboard")}
                                                        </button>
                                                    )}

                                                    {/* Enter Points */}
                                                    {user && fallbackSlug && (
                                                        <button
                                                            onClick={() =>
                                                                navigate(
                                                                    isAdmin
                                                                        ? `/admin/${fallbackSlug}/points`
                                                                        : `/vote/${fallbackSlug}`,
                                                                )}
                                                            className="w-full flex items-center gap-2 px-2 py-1.5 text-[var(--text-secondary)] hover:text-zinc-100 hover:bg-[var(--bg-hover)] rounded text-xs transition-colors text-start"
                                                        >
                                                            <CalculatorIcon className="w-4 h-4" />
                                                            {t("enter_points")}
                                                        </button>
                                                    )}

                                                    {/* Management */}
                                                    {user && fallbackSlug &&
                                                        isAdmin && (
                                                        <button
                                                            onClick={() =>
                                                                navigate(
                                                                    `/admin/${fallbackSlug}/settings`,
                                                                )}
                                                            className="w-full flex items-center gap-2 px-2 py-1.5 text-[var(--text-secondary)] hover:text-zinc-100 hover:bg-[var(--bg-hover)] rounded text-xs transition-colors text-start"
                                                        >
                                                            <SettingsIcon className="w-4 h-4" />
                                                            {t("admin_panel")}
                                                        </button>
                                                    )}

                                                    <div className="border-t border-[var(--border-subtle)] my-1" />

                                                    {/* Music Toggle */}
                                                    {musicState && (
                                                        <button
                                                            onClick={musicState
                                                                .onToggle}
                                                            className="w-full flex items-center gap-2 px-2 py-1.5 text-[var(--text-secondary)] hover:text-zinc-100 hover:bg-[var(--bg-hover)] rounded text-xs transition-colors text-start"
                                                        >
                                                            {musicState
                                                                    .isPlaying
                                                                ? (
                                                                    <Volume2Icon className="w-4 h-4" />
                                                                )
                                                                : (
                                                                    <VolumeXIcon className="w-4 h-4" />
                                                                )}
                                                            {t("music")}
                                                        </button>
                                                    )}

                                                    {/* Debug Console */}
                                                    <button
                                                        onClick={onDebugToggle}
                                                        className="w-full flex items-center gap-2 px-2 py-1.5 text-[var(--text-secondary)] hover:text-zinc-100 hover:bg-[var(--bg-hover)] rounded text-xs transition-colors text-start"
                                                    >
                                                        <BugIcon className="w-4 h-4" />
                                                        {t("debug")}
                                                    </button>

                                                    {/* Super Admin */}
                                                    {isSuperUser && (
                                                        <button
                                                            onClick={() =>
                                                                navigate(
                                                                    "/super",
                                                                )}
                                                            className="w-full flex items-center gap-2 px-2 py-1.5 text-[var(--text-secondary)] hover:text-zinc-100 hover:bg-[var(--bg-hover)] rounded text-xs transition-colors text-start"
                                                        >
                                                            <CrownIcon className="w-4 h-4" />
                                                            {t("system_admin")}
                                                        </button>
                                                    )}

                                                    <div className="border-t border-[var(--border-subtle)] my-1" />

                                                    {/* Logout */}
                                                    <button
                                                        onClick={handleLogout}
                                                        className="w-full flex items-center gap-2 px-2 py-1.5 text-[var(--status-error-text)] hover:bg-[var(--status-error-bg)] rounded text-xs transition-colors text-start"
                                                    >
                                                        <LogoutIcon className="w-4 h-4" />
                                                        {t("logout") || "התנתק"}
                                                    </button>
                                                </div>
                                            </div>
                                            </>,
                                            document.body
                                        )}
                                    </div>
                                )}

                            {/* 5. Theme Toggle (End-aligned) */}
                            <button
                                onClick={toggleTheme}
                                title={theme === "dark" ? t("switch_to_light_mode") : t("switch_to_dark_mode")}
                                className={`w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-zinc-100 ${getNavButtonClass()}`}
                                style={getNavButtonStyle()}
                            >
                                {theme === "dark"
                                    ? <SunIcon className="w-4 h-4" />
                                    : <MoonIcon className="w-4 h-4" />}
                            </button>
                        </div>
                    </nav>

                    {/* Right: live viewer count */}
                    <div className="flex items-center justify-end">
                        {viewerCount !== undefined && viewerCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-500 leading-none">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0 self-center" />
                                {viewerCount}
                            </span>
                        )}
                    </div>
                </div>
                
                <DebugConsole 
                    isOpen={resolvedIsDebugOpen} 
                    onClose={() => {
                        if (onDebugToggle) {
                            onDebugToggle();
                        } else {
                            setInternalDebugOpen(false);
                        }
                    }} 
                />
            </footer>
    );
};

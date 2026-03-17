import React, { useState, useEffect, createContext, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile } from '../types';
import { t } from '../utils/i18n';
import { logger } from '../utils/logger';
import { withTimeout, promiseTimeout } from '../utils/supabaseUtils';

const SAVED_EMAIL_KEY = 'metziacha_saved_email';
const CACHED_PROFILE_KEY = 'metziacha_cached_profile';

export type AuthStatus = 'idle' | 'checking-session' | 'fetching-profile' | 'ready' | 'error';

export interface AuthContextType {
    user: UserProfile | null;
    authLoading: boolean;
    authStatus: AuthStatus;
    isSlowConnection: boolean;
    setAuthLoading: (val: boolean) => void;
    loginError: string;
    login: (email: string, password: string, remember: boolean) => Promise<boolean>;
    logout: () => Promise<void>;
    hardReset: () => Promise<void>;
    savedEmail: string;
    rememberMe: boolean;
    setRememberMe: (val: boolean) => void;
    setLoginError: (val: string) => void;
    isPasswordRecovery: boolean;
    resetPasswordForEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
    updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // 1. Synchronous hydration from cache for "Instant-On" UX
    const [user, setUser] = useState<UserProfile | null>(() => {
        try {
            const cached = localStorage.getItem(CACHED_PROFILE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                logger.debug("[AUTH] Hydrating user from cache for instant boot");
                return parsed;
            }
        } catch (e) {
            console.warn("Failed to parse cached profile", e);
        }
        return null;
    });

    // If we have a cached user, we can bypass the initial skeleton
    const [authLoading, setAuthLoading] = useState(() => {
        return !localStorage.getItem(CACHED_PROFILE_KEY);
    });

    const [authStatus, setAuthStatus] = useState<AuthStatus>('idle');
    const [isSlowConnection, setIsSlowConnection] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [savedEmail, setSavedEmail] = useState('');
    const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
    const initCalled = useRef(false);
    // Tracks initAuth() outcome to enable recovery in onAuthStateChange
    const initAuthStatusRef = useRef<'pending' | 'done' | 'failed'>('pending');

    const userRef = useRef<UserProfile | null>(user);

    const updateLoadingState = useCallback((state: boolean, reason: string) => {
        logger.debug(`[AUTH-STATE] authLoading -> ${state} (Reason: ${reason})`);
        setAuthLoading(state);
        if (!state) {
            setAuthStatus('ready');
            setIsSlowConnection(false);
        }
    }, []);

    const fetchUserProfile = useCallback(async (userId: string, userEmail: string, retryCount = 0, silent = false) => {
        // silent=true: background refresh when cached user already displayed — no loading state changes, no retries
        if (!silent) setAuthStatus('fetching-profile');
        try {
            logger.debug(`[AUTH] Fetching profile for ID: ${userId} (Attempt: ${retryCount + 1}, silent: ${silent})`);

            const timeoutMs = silent ? 5000 : 8000;
            const { data: profileData, error: profileError } = await withTimeout(
                supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .maybeSingle(),
                timeoutMs
            );

            if (profileError) throw profileError;

            let finalProfile: UserProfile;
            if (!profileData) {
                if (silent) return; // Don't overwrite cached user with a fallback
                console.warn("[AUTH] Profile not found, using email fallback");
                finalProfile = {
                    id: userId,
                    email: userEmail,
                    role: 'teacher',
                    class_id: null,
                    full_name: userEmail.split('@')[0] || t('user_fallback_name')
                };
            } else {
                finalProfile = profileData as UserProfile;
            }

            // Cache for next boot
            try {
                localStorage.setItem(CACHED_PROFILE_KEY, JSON.stringify(finalProfile));
            } catch (_e) {
                // QuotaExceededError or similar — non-fatal, cached profile just won't persist
            }
            setUser(finalProfile);
            userRef.current = finalProfile;

            if (!silent) updateLoadingState(false, "Profile process finished");
        } catch (err) {
            if (silent) {
                // Silent background refresh failed — leave cached user as-is, no UI impact
                logger.debug(`[AUTH] Silent background refresh failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
                return;
            }

            // Retry logic: 2 retries (Total 3 attempts)
            if (retryCount < 2) {
                const delay = 1000 * (retryCount + 1);
                console.warn(`[AUTH] Profile fetch failed (${err instanceof Error ? err.message : 'Unknown error'}), retrying in ${delay}ms... (Attempt ${retryCount + 1})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return fetchUserProfile(userId, userEmail, retryCount + 1, false);
            }

            console.error("[AUTH] Profile load failed after retries, applying safety fallback:", err);

            // If we don't have a user at all (even from cache), apply emergency fallback
            if (!userRef.current) {
                const fallback: UserProfile = {
                    id: userId,
                    email: userEmail,
                    role: 'teacher',
                    class_id: null,
                    full_name: userEmail.split('@')[0] || t('user_delayed_fallback_name')
                };
                setUser(fallback);
                userRef.current = fallback;
            }
            updateLoadingState(false, "Profile fallback applied");
        }
    }, [updateLoadingState]);

    const hardReset = async () => {
        logger.info("[AUTH] Initiating NUCLEAR RESET...");
        try {
            localStorage.clear();
            sessionStorage.clear();
            
            // Safe cookie clear
            try {
                const cookies = document.cookie.split(";");
                for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i];
                    const eqPos = cookie.indexOf("=");
                    const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
                    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                }
            } catch (e) {}

            // Safe service worker cleanup
            try {
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (const registration of registrations) {
                        await registration.unregister();
                    }
                }
            } catch (e) {}

            window.location.href = window.location.origin + "/?reset=" + Date.now() + "#/";
            window.location.reload();
        } catch (e) {
            window.location.reload();
        }
    };

    useEffect(() => {
        if (initCalled.current) return;
        initCalled.current = true;

        const email = localStorage.getItem(SAVED_EMAIL_KEY);
        if (email) {
            setSavedEmail(email);
            setRememberMe(true);
        }

        // Inform UI about slow connection if we're still loading after 4s
        const slowTimer = setTimeout(() => {
            if (authLoading) {
                console.info("[AUTH] Slow connection detected - informing UI");
                setIsSlowConnection(true);
            }
        }, 4000);

        // Final safety fallback (15s)
        const safetyTimer = setTimeout(() => {
            if (authLoading) {
                updateLoadingState(false, "Safety Timeout");
                setAuthStatus('error');
            }
        }, 15000);

        const initAuth = async () => {
            setAuthStatus('checking-session');
            try {
                // Background session check - reduced timeout to 5s
                const { data: { session } } = await promiseTimeout(supabase.auth.getSession(), 5000);

                if (session?.user) {
                    // If we already have a cached user displayed, do a silent background refresh
                    // to avoid blocking the UI with retries (which can take up to 27s)
                    const silent = !!userRef.current;
                    await fetchUserProfile(session.user.id, session.user.email || '', 0, silent);
                } else {
                    // No session found - clear cache and update UI
                    localStorage.removeItem(CACHED_PROFILE_KEY);
                    setUser(null);
                    userRef.current = null;
                    updateLoadingState(false, "No initial session");
                }
                initAuthStatusRef.current = 'done';
            } catch (err) {
                console.warn("[AUTH] Initial session check timed out or failed, relying on cache/offline state", err);
                initAuthStatusRef.current = 'failed'; // Allow onAuthStateChange to recover
                // If we have a cached user, we stay "logged in" but maybe offline
                // If we don't have a user, we must unlock to show login
                if (!userRef.current) {
                    updateLoadingState(false, "Init error");
                } else {
                    // We have cache, just stop the loading spinner
                    updateLoadingState(false, "Init timeout with cache");
                }
                setAuthStatus('ready'); // Treat as ready even if error, to unlock UI
            } finally {
                clearTimeout(safetyTimer);
                clearTimeout(slowTimer);
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            logger.debug(`[AUTH-EVENT] ${event}`);
            if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
                // Only recover if initAuth() failed (e.g. getSession() timed out).
                // Normal flow: initAuth() handles it. login() handles explicit logins.
                // Set to 'done' immediately to prevent handling multiple recovery events.
                if (initAuthStatusRef.current === 'failed') {
                    initAuthStatusRef.current = 'done';
                    logger.debug('[AUTH] Recovering session via onAuthStateChange after initAuth() failure');
                    // Silent: no retries, no loading state — just a background profile update
                    fetchUserProfile(session.user.id, session.user.email || '', 0, true);
                }
            } else if (event === 'SIGNED_OUT') {
                localStorage.removeItem(CACHED_PROFILE_KEY);
                setUser(null);
                userRef.current = null;
                setIsPasswordRecovery(false);
                updateLoadingState(false, "Signed out");
            }
        });

        return () => {
            subscription.unsubscribe();
            clearTimeout(safetyTimer);
            clearTimeout(slowTimer);
        };
    }, [fetchUserProfile, updateLoadingState, authLoading]);

    const login = async (email: string, password: string, remember: boolean) => {
        updateLoadingState(true, "Login starting");
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.toLowerCase().trim(),
                password,
            });

            if (error) throw error;
            if (data.user) {
                if (remember) localStorage.setItem(SAVED_EMAIL_KEY, email.toLowerCase().trim());
                else localStorage.removeItem(SAVED_EMAIL_KEY);
                await fetchUserProfile(data.user.id, data.user.email || '');
                return true;
            }
            return false;
        } catch (err: any) {
            setLoginError(t('login_failed_error'));
            updateLoadingState(false, "Login failed");
            return false;
        }
    };

    const logout = async () => {
        updateLoadingState(true, "Logout starting");
        try {
            await supabase.auth.signOut();
            localStorage.removeItem(CACHED_PROFILE_KEY);
            setUser(null);
            userRef.current = null;
        } finally {
            updateLoadingState(false, "Logout finished");
        }
    };

    const value = {
        user,
        authLoading,
        authStatus,
        isSlowConnection,
        setAuthLoading: (val: boolean) => setAuthLoading(val),
        loginError,
        login,
        logout,
        hardReset,
        savedEmail,
        rememberMe,
        setRememberMe: (val: boolean) => setRememberMe(val),
        setLoginError: (val: string) => setLoginError(val),
        isPasswordRecovery,
        resetPasswordForEmail: async (email: string) => {
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            return { success: !error, error: error?.message };
        },
        updatePassword: async (pass: string) => {
            const { error } = await supabase.auth.updateUser({ password: pass });
            return { success: !error, error: error?.message };
        }
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

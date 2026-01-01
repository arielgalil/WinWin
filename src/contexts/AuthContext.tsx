import React, { useState, useEffect, createContext, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { UserProfile } from '../types';
import { t } from '../utils/i18n';
import { TIMEOUTS } from '../config';
import { logger } from '../utils/logger';

const SAVED_EMAIL_KEY = 'metziacha_saved_email';

export interface AuthContextType {
    user: UserProfile | null;
    authLoading: boolean;
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
    const [user, setUser] = useState<UserProfile | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [loginError, setLoginError] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [savedEmail, setSavedEmail] = useState('');
    const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
    const initCalled = useRef(false);

    const userRef = useRef<UserProfile | null>(null);

    const updateLoadingState = useCallback((state: boolean, reason: string) => {
        logger.debug(`[AUTH-STATE] authLoading -> ${state} (Reason: ${reason})`);
        setAuthLoading(state);
    }, []);

    const fetchUserProfile = useCallback(async (userId: string, userEmail: string) => {
        if (userRef.current?.id === userId) {
            updateLoadingState(false, "Already loaded");
            return;
        }

        try {
            logger.debug(`[AUTH] Fetching profile for ID: ${userId}`);

            const { data: profileData, error: profileError } = await Promise.race([
                supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
                new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Profile Timeout')), TIMEOUTS.authProfileFetchMs))
            ]);

            if (profileError) throw profileError;

            if (!profileData) {
                console.warn("[AUTH] Profile not found, using email fallback");
                const fallback: UserProfile = {
                    id: userId,
                    email: userEmail,
                    role: 'teacher',
                    class_id: null,
                    full_name: userEmail.split('@')[0] || t('user_fallback_name')
                };
                setUser(fallback);
                userRef.current = fallback;
            } else {
                setUser(profileData as UserProfile);
                userRef.current = profileData as UserProfile;
            }
        } catch (err) {
            console.error("[AUTH] Profile load failed, applying safety fallback:", err);
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
        } finally {
            updateLoadingState(false, "Profile process finished");
        }
    }, [updateLoadingState]);

    const hardReset = async () => {
        logger.info("[AUTH] Initiating NUCLEAR RESET...");
        try {
            // Safe localStorage clear with try-catch
            try {
                localStorage.clear();
            } catch (e) {
                console.warn("Failed to clear localStorage:", e);
            }

            // Safe sessionStorage clear
            try {
                sessionStorage.clear();
            } catch (e) {
                console.warn("Failed to clear sessionStorage:", e);
            }

            // Safe cookie clear
            try {
                const cookies = document.cookie.split(";");
                for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i];
                    const eqPos = cookie.indexOf("=");
                    const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
                    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                }
            } catch (e) {
                console.warn("Failed to clear cookies:", e);
            }

            // Safe service worker cleanup
            try {
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (const registration of registrations) {
                        await registration.unregister();
                    }
                }
            } catch (e) {
                console.warn("Failed to unregister service workers:", e);
            }

            window.location.href = window.location.origin + "/?reset=" + Date.now() + "#/";
            window.location.reload();
        } catch (e) {
            console.error("Hard reset failed:", e);
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

        const safetyTimer = setTimeout(() => {
            if (authLoading) {
                updateLoadingState(false, "Safety Timeout");
            }
        }, TIMEOUTS.authSafetyTimeoutMs);

        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    await fetchUserProfile(session.user.id, session.user.email || '');
                } else {
                    updateLoadingState(false, "No initial session");
                }
            } catch (err) {
                updateLoadingState(false, "Init error");
            } finally {
                clearTimeout(safetyTimer);
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            logger.debug(`[AUTH-EVENT] ${event}`);
            if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
                if (!isPasswordRecovery) {
                    await fetchUserProfile(session.user.id, session.user.email || '');
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                userRef.current = null;
                setIsPasswordRecovery(false);
                updateLoadingState(false, "Signed out");
            }
        });

        return () => {
            subscription.unsubscribe();
            clearTimeout(safetyTimer);
        };
    }, [isPasswordRecovery, fetchUserProfile, updateLoadingState]);

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
            setUser(null);
            userRef.current = null;
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem('metziacha_elevation_token');
            }
        } finally {
            updateLoadingState(false, "Logout finished");
        }
    };

    const value = {
        user,
        authLoading,
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

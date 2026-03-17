import { useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useLanguage } from './useLanguage';
import { useToast } from './useToast';

function showKioskUpdateOverlay() {
    const lang = localStorage.getItem('language') ?? 'he';
    const label = lang === 'en' ? 'Updating...' : 'מעדכן...';

    const overlay = document.createElement('div');
    overlay.style.cssText = [
        'position:fixed', 'inset:0', 'z-index:99999',
        'display:flex', 'flex-direction:column', 'align-items:center', 'justify-content:center', 'gap:24px',
        'background:rgba(2,6,23,0.97)', 'backdrop-filter:blur(16px)',
        'animation:kiosk-fade-in 0.3s ease',
    ].join(';');

    overlay.innerHTML = `
        <style>
            @keyframes kiosk-fade-in { from { opacity:0 } to { opacity:1 } }
            @keyframes kiosk-spin { to { transform:rotate(360deg) } }
        </style>
        <div style="width:64px;height:64px;border-radius:50%;border:4px solid rgba(255,255,255,0.1);border-top-color:#6366f1;animation:kiosk-spin 0.9s linear infinite"></div>
        <p style="color:white;font-size:1.25rem;font-weight:800;letter-spacing:0.05em;opacity:0.9;font-family:sans-serif">${label}</p>
    `;

    document.body.appendChild(overlay);
}

/**
 * Global hook to listen for system-wide updates via Supabase Realtime.
 * If a new version is detected in the database, it triggers a page refresh.
 */
export const useRealtimeUpdate = () => {
    const { t } = useLanguage();
    const { showToast } = useToast();

    // Refs so the channel is created once and never torn down due to callback identity changes
    const tRef = useRef(t);
    const showToastRef = useRef(showToast);
    useEffect(() => { tRef.current = t; }, [t]);
    useEffect(() => { showToastRef.current = showToast; }, [showToast]);

    useEffect(() => {
        const currentVersion = import.meta.env.VITE_APP_VERSION;
        let reloadTimeoutId: ReturnType<typeof setTimeout> | null = null;

        const channel = supabase
            .channel('system_updates')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'system_config',
                    filter: 'key=eq.app_version'
                },
                (payload) => {
                    const data = payload.new as { value: { version: string, force_reload?: boolean } };
                    const newVersion = data.value.version;
                    const forceReload = data.value.force_reload;

                    if (newVersion !== currentVersion || forceReload) {
                        console.log(`[REALTIME-UPDATE] Version mismatch: Local(${currentVersion}) vs Remote(${newVersion})`);

                        // Check if we are on a kiosk-like view (Dashboard)
                        const isKiosk = window.location.pathname.includes('/comp/');

                        // Prevent infinite reload loops (safety)
                        const lastReload = sessionStorage.getItem('last_version_reload');
                        const now = Date.now();
                        if (lastReload && now - parseInt(lastReload) < 30000) {
                            console.warn("[REALTIME-UPDATE] Reload suppressed - too frequent");
                            return;
                        }

                        if (isKiosk || forceReload) {
                            console.log("[REALTIME-UPDATE] Kiosk mode or Force detected. Reloading in 2.5s...");
                            sessionStorage.setItem('last_version_reload', now.toString());
                            showKioskUpdateOverlay();
                            setTimeout(() => window.location.reload(), 2500);
                        } else {
                            // Admin/Teacher view - show notification and reload after delay if idle
                            showToastRef.current(tRef.current('update_available_reloading'), 'info');

                            reloadTimeoutId = setTimeout(() => {
                                console.log("[REALTIME-UPDATE] Refreshing after notification delay...");
                                sessionStorage.setItem('last_version_reload', now.toString());
                                window.location.reload();
                            }, 60000); // 60 seconds delay for active users
                        }
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('[REALTIME-UPDATE] Subscribed to system_config changes');
                }
            });

        return () => {
            supabase.removeChannel(channel);
            if (reloadTimeoutId) clearTimeout(reloadTimeoutId);
        };
    }, []); // Empty deps — channel created once on mount, cleaned up on unmount
};

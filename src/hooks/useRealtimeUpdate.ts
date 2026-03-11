import { useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useLanguage } from './useLanguage';
import { useToast } from './useToast';

/**
 * Global hook to listen for system-wide updates via Supabase Realtime.
 * If a new version is detected in the database, it triggers a page refresh.
 */
export const useRealtimeUpdate = () => {
    const { t } = useLanguage();
    const { showToast } = useToast();

    useEffect(() => {
        const currentVersion = import.meta.env.VITE_APP_VERSION;
        
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
                            console.log("[REALTIME-UPDATE] Kiosk mode or Force detected. Reloading immediately...");
                            sessionStorage.setItem('last_version_reload', now.toString());
                            window.location.reload();
                        } else {
                            // Admin/Teacher view - show notification and reload after delay if idle
                            showToast(t('update_available_reloading'), 'info');
                            
                            setTimeout(() => {
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
        };
    }, [showToast, t]);
};

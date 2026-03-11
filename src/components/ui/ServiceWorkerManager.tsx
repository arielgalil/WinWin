import React, { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useAutoUpdate } from '../../hooks/useAutoUpdate';
import { PwaReloadPrompt } from './PwaReloadPrompt';
import { useToast } from '../../hooks/useToast';
import { useLanguage } from '../../hooks/useLanguage';

export const ServiceWorkerManager: React.FC = () => {
    const { showToast } = useToast();
    const { t } = useLanguage();

    // Central Service Worker Registration
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('[PWA] Service Worker registered:', r);
        },
        onRegisterError(error) {
            console.error('[PWA] Service Worker registration error:', error);
        },
    });

    // Handle offline ready toast
    useEffect(() => {
        if (offlineReady) {
            showToast(t('pwa_offline_ready'), 'info');
            // Reset offlineReady state so the PwaReloadPrompt doesn't show it as well
            setOfflineReady(false);
        }
    }, [offlineReady, showToast, t, setOfflineReady]);

    useAutoUpdate({ 
        needRefresh, 
        updateServiceWorker 
    });

    return (
        <PwaReloadPrompt 
            offlineReady={offlineReady}
            needRefresh={needRefresh}
            setOfflineReady={setOfflineReady}
            setNeedRefresh={setNeedRefresh}
            updateServiceWorker={updateServiceWorker}
        />
    );
};

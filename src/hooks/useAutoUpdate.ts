import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export const useAutoUpdate = () => {
    const {
        needRefresh: [needRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('[PWA] Service Worker registered: ', r);
        },
        onRegisterError(error) {
            console.error('[PWA] Service Worker registration error: ', error);
        },
    });

    useEffect(() => {
        if (needRefresh) {
            console.log('[PWA] New content available. Waiting for idle period (60s)...');
            
            let timer: ReturnType<typeof setTimeout>;

            const startTimer = () => {
                timer = setTimeout(() => {
                    console.log('[PWA] Idle period reached. Forcing refresh...');
                    updateServiceWorker(true);
                }, 60000); // 60 seconds
            };

            const resetTimer = () => {
                if (timer) {
                    clearTimeout(timer);
                    startTimer();
                }
            };

            // Event listeners for interaction
            const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
            events.forEach(event => document.addEventListener(event, resetTimer));

            startTimer();

            return () => {
                if (timer) clearTimeout(timer);
                events.forEach(event => document.removeEventListener(event, resetTimer));
            };
        }
    }, [needRefresh, updateServiceWorker]);

    return { needRefresh, updateServiceWorker };
};

import { useEffect } from 'react';

interface AutoUpdateProps {
    needRefresh: boolean;
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
}

export const useAutoUpdate = ({ needRefresh, updateServiceWorker }: AutoUpdateProps) => {
    useEffect(() => {
        if (needRefresh) {
            console.log('[Kiosk-Update] New version detected. Preparing automatic refresh...');
            console.log('[Kiosk-Update] The application will refresh after 60 seconds of idle time.');
            
            let timer: ReturnType<typeof setTimeout>;

            const startTimer = () => {
                timer = setTimeout(() => {
                    console.log('[Kiosk-Update] Idle period reached. Forcing page refresh to synchronize version...');
                    updateServiceWorker(true);
                }, 60000); // 60 seconds
            };

            const resetTimer = () => {
                if (timer) {
                    console.log('[Kiosk-Update] User interaction detected. Resetting idle timer.');
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

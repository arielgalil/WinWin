import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useLanguage } from '../../hooks/useLanguage';
import { RefreshIcon, XIcon } from './Icons';
import { motion, AnimatePresence } from 'framer-motion';

export const PwaReloadPrompt: React.FC = () => {
    const { t } = useLanguage();
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r);
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    return (
        <AnimatePresence>
            {(offlineReady || needRefresh) && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[500] w-[calc(100%-2rem)] max-w-sm px-5 py-4 rounded-2xl bg-indigo-950/95 border border-indigo-500/60 backdrop-blur-2xl shadow-2xl flex flex-col gap-3"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-xl">
                            <RefreshIcon className="w-5 h-5 text-indigo-400" />
                        </div>
                        <p className="text-sm font-black text-white flex-1 tracking-tight">
                            {offlineReady ? t('pwa_offline_ready') : t('pwa_update_available')}
                        </p>
                        <button onClick={close} className="p-1.5 hover:bg-white/10 rounded-xl text-white/40 hover:text-white">
                            <XIcon className="w-4 h-4" />
                        </button>
                    </div>

                    {needRefresh && (
                        <button
                            onClick={() => updateServiceWorker(true)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-2.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 text-sm shadow-lg shadow-indigo-900/40"
                        >
                            <RefreshIcon className="w-4 h-4" />
                            {t('pwa_refresh_button')}
                        </button>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

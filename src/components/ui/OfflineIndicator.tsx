import React, { useState, useEffect } from 'react';
import { WifiOffIcon } from './Icons';
import { useLanguage } from '../../hooks/useLanguage';
import { motion, AnimatePresence } from 'framer-motion';

export const OfflineIndicator: React.FC = () => {
    const { t } = useLanguage();
    const [isOffline, setIsOffline] = useState(!window.navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <AnimatePresence>
            {isOffline && (
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    className="fixed top-0 left-0 right-0 z-[200] bg-red-600 text-white py-2 px-4 flex items-center justify-center gap-2 text-sm font-bold shadow-lg"
                >
                    <WifiOffIcon className="w-4 h-4" />
                    <span>{t('offline_message')}</span>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppSettings } from '../../types';

interface KioskRotatorProps {
    settings: AppSettings;
    children: React.ReactNode;
    isStarted?: boolean;
}

export const KioskRotator: React.FC<KioskRotatorProps> = ({ settings, children, isStarted = true }) => {
    const config = settings.rotation_config || [];
    const rotationEnabled = settings.rotation_enabled && config.length > 0 && isStarted;
    
    const [currentIndex, setCurrentIndex] = useState(-1); // -1 is the main game board

    useEffect(() => {
        if (!rotationEnabled) {
            setCurrentIndex(-1);
            return;
        }

        const rotate = () => {
            setCurrentIndex(prev => {
                if (prev >= config.length - 1) return -1;
                return prev + 1;
            });
        };

        // Determine duration for current view
        const currentDuration = currentIndex === -1 
            ? (settings.rotation_interval || 30) 
            : (config[currentIndex].duration || settings.rotation_interval || 30);

        const timer = setTimeout(rotate, currentDuration * 1000);
        return () => clearTimeout(timer);
    }, [currentIndex, rotationEnabled, config, settings.rotation_interval]);

    if (!rotationEnabled) {
        return <>{children}</>;
    }

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black">
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 w-full h-full"
                >
                    {currentIndex === -1 ? (
                        <div className="w-full h-full overflow-hidden">
                            {children}
                        </div>
                    ) : (
                        <iframe
                            src={config[currentIndex].url}
                            className="w-full h-full border-none"
                            title="Kiosk Content"
                            sandbox="allow-scripts allow-same-origin allow-forms"
                        />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
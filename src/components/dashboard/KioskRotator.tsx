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

    // If rotation is disabled, just render the board normally
    if (!settings.rotation_enabled || config.length === 0) {
        return <>{children}</>;
    }

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black">
            {/* 1. THE GAME BOARD (Always in DOM) */}
            <div 
                className="absolute inset-0 w-full h-full transition-all duration-700 ease-in-out"
                style={{ 
                    opacity: currentIndex === -1 ? 1 : 0,
                    pointerEvents: currentIndex === -1 ? 'auto' : 'none',
                    zIndex: currentIndex === -1 ? 20 : 0,
                    transform: currentIndex === -1 ? 'translateX(0)' : 'translateX(-20%)'
                }}
            >
                {children}
            </div>

            {/* 2. EXTERNAL SITES (Always in DOM) */}
            {config.map((item, idx) => (
                <div 
                    key={item.url + idx}
                    className="absolute inset-0 w-full h-full transition-all duration-700 ease-in-out bg-black"
                    style={{ 
                        opacity: currentIndex === idx ? 1 : 0,
                        pointerEvents: currentIndex === idx ? 'auto' : 'none',
                        zIndex: currentIndex === idx ? 20 : 0,
                        transform: currentIndex === idx 
                            ? 'translateX(0)' 
                            : (currentIndex < idx ? 'translateX(100%)' : 'translateX(-100%)')
                    }}
                >
                    <iframe
                        src={item.url}
                        className="w-full h-full border-none"
                        title={`Kiosk Content ${idx}`}
                        sandbox="allow-scripts allow-same-origin allow-forms"
                        loading="lazy"
                    />
                </div>
            ))}

            {/* Swipe Indicators / Progress Bar (Optional UI) */}
            {rotationEnabled && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-[100] pointer-events-none">
                    <motion.div 
                        key={currentIndex}
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ 
                            duration: currentIndex === -1 
                                ? (settings.rotation_interval || 30) 
                                : (config[currentIndex].duration || settings.rotation_interval || 30),
                            ease: "linear"
                        }}
                        className="h-full bg-indigo-500 shadow-[0_0_10px_#6366f1]"
                    />
                </div>
            )}
        </div>
    );
};
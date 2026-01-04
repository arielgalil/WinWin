import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppSettings } from '../../types';
import { KIOSK_CONSTANTS } from '../../constants';
import { KioskMediaItem } from './KioskMediaItem';

interface KioskRotatorProps {
    settings: AppSettings;
    children: React.ReactNode;
    currentIndex: number; // Index in settings.rotation_config
}

export const KioskRotator: React.FC<KioskRotatorProps> = ({ 
    settings, 
    children, 
    currentIndex 
}) => {
    const config = settings.rotation_config || [];
    const [previousIndex, setPreviousIndex] = useState<number | null>(null);
    const lastIndex = React.useRef(currentIndex);

    useEffect(() => {
        if (lastIndex.current !== currentIndex) {
            setPreviousIndex(lastIndex.current);
            const timer = setTimeout(() => {
                setPreviousIndex(null);
            }, 2000);
            lastIndex.current = currentIndex;
            return () => clearTimeout(timer);
        }
    }, [currentIndex]);

    // If rotation is disabled/empty, just render children.
    if (!settings.rotation_enabled || config.length === 0) {
        return <>{children}</>;
    }

    return (
        <div className="relative w-full h-full overflow-hidden bg-black">
            {/* Mount ALL items permanently to preserve state across rotations */}
            {config.map((item, idx) => {
                // Skip hidden items entirely
                if (item.hidden) return null;

                const isActive = currentIndex === idx;
                const wasActive = previousIndex === idx;
                const isVisible = isActive || wasActive;
                // Dormant = not visible but still mounted for state preservation
                const isDormant = !isActive && !wasActive;

                return (
                    <div 
                        key={item.url + idx}
                        className="absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out bg-black"
                        style={{ 
                            opacity: isActive ? 1 : 0,
                            // Use visibility: hidden for dormant items - browser throttles but preserves state
                            visibility: isDormant ? 'hidden' : 'visible',
                            pointerEvents: isActive ? 'auto' : 'none',
                            zIndex: isActive ? 20 : 10,
                        }}
                    >
                        {item.url === KIOSK_CONSTANTS.DASHBOARD_URL ? (
                            <div className="w-full h-full">{children}</div>
                        ) : (
                            <KioskMediaItem
                                url={item.url}
                                isPlaying={isActive}
                                volume={50}
                                title={`Kiosk Content ${idx}`}
                            />
                        )}
                    </div>
                );
            })}

            {/* Swipe Indicators / Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-[100] pointer-events-none">
                <motion.div 
                    key={currentIndex}
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ 
                        duration: config[currentIndex]?.duration || settings.rotation_interval || 30,
                        ease: "linear"
                    }}
                    className="h-full bg-indigo-500 shadow-[0_0_10px_#6366f1]"
                />
            </div>
        </div>
    );
};
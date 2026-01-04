import React from 'react';
import { motion } from 'framer-motion';
import { AppSettings } from '../../types';
import { KIOSK_CONSTANTS } from '../../constants';

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

    // If rotation is disabled/empty, just render children.
    if (!settings.rotation_enabled || config.length === 0) {
        return <>{children}</>;
    }

    return (
        <div className="relative w-full h-full overflow-hidden bg-black">
            {/* Render all config items (including dashboard marker) */}
            {config.map((item, idx) => {
                // Skip rendering hidden items UNLESS they are somehow active (shouldn't happen with fixed logic)
                if (item.hidden && currentIndex !== idx) return null;

                const isDashboard = item.url === KIOSK_CONSTANTS.DASHBOARD_URL;
                const isActive = currentIndex === idx;

                return (
                    <div 
                        key={item.url + idx}
                        className="absolute inset-0 w-full h-full transition-all duration-700 ease-in-out bg-black"
                        style={{ 
                            opacity: isActive ? 1 : 0,
                            pointerEvents: isActive ? 'auto' : 'none',
                            zIndex: isActive ? 20 : 0,
                            transform: isActive 
                                ? 'translateX(0)' 
                                : (currentIndex < idx ? 'translateX(100%)' : 'translateX(-100%)')
                        }}
                    >
                        {isDashboard ? (
                            <div className="w-full h-full">{children}</div>
                        ) : (
                            <iframe
                                src={item.url}
                                className="w-full h-full border-none"
                                title={`Kiosk Content ${idx}`}
                                sandbox="allow-scripts allow-same-origin allow-forms"
                                loading="lazy"
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
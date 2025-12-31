import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayIcon, SparklesIcon } from '../ui/Icons';
import { useLanguage } from '../../hooks/useLanguage';

interface KioskStartOverlayProps {
    onStart: () => void;
    isVisible: boolean;
}

export const KioskStartOverlay: React.FC<KioskStartOverlayProps> = ({ onStart, isVisible }) => {
    const { t } = useLanguage();
    const [countdown, setCountdown] = React.useState(15);

    React.useEffect(() => {
        if (isVisible && countdown > 0) {
            const timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        }
    }, [isVisible, countdown]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/90 backdrop-blur-md"
                >
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 1.1, opacity: 0 }}
                        className="text-center p-8 max-w-lg w-full"
                    >
                        <div className="relative inline-block mb-8">
                            <motion.div
                                animate={{ 
                                    scale: [1, 1.2, 1],
                                    rotate: [0, 5, -5, 0]
                                }}
                                transition={{ 
                                    duration: 4, 
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(79,70,229,0.5)] border-4 border-indigo-400/30"
                            >
                                <PlayIcon className="w-12 h-12 text-white ms-1" />
                            </motion.div>
                            
                            <motion.div
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute -top-4 -right-4"
                            >
                                <SparklesIcon className="w-8 h-8 text-amber-400" />
                            </motion.div>
                        </div>

                        <h2 className="text-4xl font-black text-white mb-4 tracking-tight">
                            {t('kiosk_start_title' as any)}
                        </h2>
                        <p className="text-slate-300 text-lg mb-10 leading-relaxed">
                            {t('kiosk_start_desc' as any)}
                        </p>

                        <button
                            onClick={onStart}
                            className="group relative inline-flex items-center justify-center px-10 py-5 font-bold text-white transition-all duration-200 bg-indigo-600 font-pj rounded-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-xl shadow-indigo-500/20"
                        >
                            <span className="relative flex items-center gap-3 text-xl">
                                {t('kiosk_start_button' as any)}
                                <PlayIcon className="w-6 h-6 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                            </span>
                        </button>

                        <div className="mt-8 flex flex-col items-center gap-2">
                            <p className="text-slate-500 text-sm italic">
                                {t('kiosk_audio_hint' as any)}
                            </p>
                            <div className="mt-2 text-indigo-400/60 text-xs font-mono">
                                Auto-starting in {countdown}s...
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

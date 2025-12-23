
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, AlertCircleIcon, InfoIcon, XIcon } from './Icons';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    message: string;
    type?: ToastType;
    onClose: () => void;
}

const MotionDiv = motion.div as any;

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircleIcon className="w-5 h-5 text-emerald-400" />;
            case 'error':
                return <AlertCircleIcon className="w-5 h-5 text-rose-400" />;
            case 'info':
            default:
                return <InfoIcon className="w-5 h-5 text-sky-400" />;
        }
    };

    const getTypeStyles = () => {
        switch (type) {
            case 'success':
                return {
                    bg: 'bg-emerald-950/95',
                    border: 'border-emerald-500/60',
                    glow: 'shadow-emerald-900/40',
                    progress: 'bg-emerald-400'
                };
            case 'error':
                return {
                    bg: 'bg-rose-950/95',
                    border: 'border-rose-500/60',
                    glow: 'shadow-rose-900/40',
                    progress: 'bg-rose-400'
                };
            case 'info':
            default:
                return {
                    bg: 'bg-slate-900/98',
                    border: 'border-white/40',
                    glow: 'shadow-black/60',
                    progress: 'bg-sky-400'
                };
        }
    };

    const styles = getTypeStyles();

    return (
        <MotionDiv
            layout
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.2 } }}
            className={`pointer-events-auto relative group flex items-center gap-4 px-5 py-4 rounded-2xl border backdrop-blur-2xl shadow-2xl ${styles.bg} ${styles.border} ${styles.glow} overflow-hidden`}
        >
            {/* Background Reflection */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-none" />

            <div className="shrink-0 relative">
                <div className={`absolute inset-0 ${styles.bg} blur-xl rounded-full`} />
                {getIcon()}
            </div>

            <p className="text-sm font-black text-white flex-1 relative tracking-tight">{message}</p>

            <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded-xl transition-all text-white/40 hover:text-white active:scale-90 relative"
            >
                <XIcon className="w-4 h-4" />
            </button>

            {/* Progress Bar Animation */}
            <MotionDiv
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 4, ease: "linear" }}
                className={`absolute bottom-0 left-0 h-1 ${styles.progress}`}
            />
        </MotionDiv>
    );
};

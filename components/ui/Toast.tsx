
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
                return <CheckCircleIcon className="w-5 h-5 text-green-400" />;
            case 'error':
                return <AlertCircleIcon className="w-5 h-5 text-red-400" />;
            case 'info':
            default:
                return <InfoIcon className="w-5 h-5 text-blue-400" />;
        }
    };

    const getBgColor = () => {
        switch (type) {
            case 'success':
                return 'bg-green-500/10 border-green-500/20';
            case 'error':
                return 'bg-red-500/10 border-red-500/20';
            case 'info':
            default:
                return 'bg-slate-900/90 border-white/10';
        }
    };

    return (
        <AnimatePresence>
            <MotionDiv
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl ${getBgColor()}`}
            >
                <div className="shrink-0">{getIcon()}</div>
                <p className="text-sm font-bold text-white flex-1">{message}</p>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-white/10 rounded-lg transition-colors text-slate-400"
                >
                    <XIcon className="w-4 h-4" />
                </button>
            </MotionDiv>
        </AnimatePresence>
    );
};

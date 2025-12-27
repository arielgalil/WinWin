import React, { useState, useEffect } from 'react';
import { SproutIcon, TrashIcon } from './Icons';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';
import { TIMEOUTS } from '../../config';

interface LoadingScreenProps {
    message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message }) => {
    const { t } = useLanguage();
    const [showOptions, setShowOptions] = useState(false);
    const { setAuthLoading, hardReset } = useAuth();

    const displayMessage = message || t('loading_data');

    useEffect(() => {
        const timer = setTimeout(() => setShowOptions(true), TIMEOUTS.loadingScreenOptionsMs);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="flex-1 flex items-center justify-center flex-col gap-8 p-4 text-center bg-[#020617] relative overflow-hidden h-full min-h-screen">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-500/10 via-transparent to-transparent opacity-50" />

            <div className="relative">
                <div className="w-24 h-24 bg-green-500/20 rounded-full absolute inset-0 blur-3xl animate-pulse" />
                <SproutIcon className="w-24 h-24 text-green-500 animate-bounce relative z-10" />
            </div>

            <div className="space-y-3 relative z-10">
                <h2 className="text-3xl font-black text-white tracking-tight">{displayMessage}</h2>
                <p className="text-slate-500 text-sm font-medium">{t('loading_wait')}</p>
            </div>

            {showOptions && (
                <div className="flex flex-col gap-3 mt-8 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <button
                        onClick={() => setAuthLoading(false)}
                        className="bg-white/5 hover:bg-white/10 text-slate-300 px-6 py-2.5 rounded-xl border border-white/10 text-xs font-black transition-all"
                    >
                        {t('stuck_skip')}
                    </button>

                    <button
                        onClick={hardReset}
                        className="text-red-400/60 hover:text-red-400 text-[10px] font-bold flex items-center gap-2 mx-auto transition-all bg-red-500/5 hover:bg-red-500/10 px-4 py-1.5 rounded-full border border-red-500/10"
                    >
                        <TrashIcon className="w-3 h-3" />
                        {t('hard_reset')}
                    </button>
                </div>
            )}
        </div>
    );
};

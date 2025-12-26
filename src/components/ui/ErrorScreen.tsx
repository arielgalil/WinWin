import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertIcon, HomeIcon } from './Icons';
import { useLanguage } from '../../hooks/useLanguage';

interface ErrorScreenProps {
    message: string;
}

export const ErrorScreen: React.FC<ErrorScreenProps> = ({ message }) => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    return (
        <div className="flex-1 flex items-center justify-center p-6 text-center h-full min-h-screen">
            <div className="bg-slate-900 border border-white/10 p-10 rounded-[3rem] max-w-md w-full shadow-2xl">
                <AlertIcon className="w-16 h-16 text-red-500 mx-auto mb-6" />
                <h2 className="text-2xl font-black text-white mb-4">{t('load_error')}</h2>
                <p className="text-slate-400 mb-8 font-medium">{message}</p>
                <button onClick={() => navigate('/')} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all">
                    <HomeIcon className="w-5 h-5" /> {t('back_to_selection')}
                </button>
            </div>
        </div>
    );
};

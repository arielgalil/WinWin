
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BurstNotificationData } from '../../types';
import { TrophyIcon, CrownIcon, StarIcon, TrendUpIcon, CheckIcon, SparklesIcon } from './Icons';
import { Confetti } from './Confetti';
import { FormattedNumber } from './FormattedNumber';
import { useLanguage } from '../../hooks/useLanguage';

const MotionDiv = motion.div as any;
const MotionH2 = motion.h2 as any;
const MotionH3 = motion.h3 as any;

interface BurstNotificationProps {
    data: BurstNotificationData | null;
    onDismiss: () => void;
    volume?: number;
    soundsEnabled?: boolean;
}

const BURST_SOUNDS: Record<string, string> = {
    GOAL_REACHED: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3', // Fanfare/Success
    LEADER_CHANGE: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3', // Trumpet
    STAR_STUDENT: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3', // Ding/Level up
    CLASS_BOOST: 'https://assets.mixkit.co/active_storage/sfx/1433/1433-preview.mp3', // Achievement
    SHOUTOUT: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'
};

export const BurstNotification: React.FC<BurstNotificationProps> = ({ 
    data, 
    onDismiss, 
    volume = 50, 
    soundsEnabled = true 
}) => {
    const { t, dir } = useLanguage();
    const DURATION = 5000; // 5 Seconds

    const onDismissRef = useRef(onDismiss);

    useEffect(() => {
        onDismissRef.current = onDismiss;
    }, [onDismiss]);

    useEffect(() => {
        if (data) {
            const timer = setTimeout(() => {
                if (onDismissRef.current) {
                    onDismissRef.current();
                }
            }, DURATION);
            return () => clearTimeout(timer);
        }
    }, [data]);

    // Sound Logic
    useEffect(() => {
        if (data && soundsEnabled) {
            const soundUrl = BURST_SOUNDS[data.type] || BURST_SOUNDS.STAR_STUDENT;
            const audio = new Audio(soundUrl);
            audio.volume = volume / 100;
            
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn("Auto-play was prevented. This usually happens if the user hasn't interacted with the page yet.", error);
                });
            }

            return () => {
                audio.pause();
                audio.src = '';
            };
        }
    }, [data, volume, soundsEnabled]);

    const getTheme = (type: string) => {
        switch (type) {
            case 'GOAL_REACHED':
                return {
                    bg: 'bg-gradient-to-b from-yellow-500/95 to-orange-600/95',
                    iconBg: 'bg-white text-yellow-600',
                    accentColor: 'text-yellow-200',
                    icon: <TrophyIcon className="w-20 h-20 md:w-28 md:h-28" />,
                };
            case 'LEADER_CHANGE':
                return {
                    bg: 'bg-gradient-to-b from-purple-600/95 to-indigo-700/95',
                    iconBg: 'bg-white text-purple-600',
                    accentColor: 'text-purple-200',
                    icon: <CrownIcon className="w-20 h-20 md:w-28 md:h-28" />,
                };
            case 'STAR_STUDENT':
                return {
                    bg: 'bg-gradient-to-b from-pink-500/95 to-rose-600/95',
                    iconBg: 'bg-white text-pink-600',
                    accentColor: 'text-pink-200',
                    icon: <StarIcon className="w-20 h-20 md:w-28 md:h-28" />,
                };
            case 'CLASS_BOOST':
                return {
                    bg: 'bg-gradient-to-b from-green-500/95 to-emerald-700/95',
                    iconBg: 'bg-white text-green-600',
                    accentColor: 'text-emerald-200',
                    icon: <TrendUpIcon className="w-20 h-20 md:w-28 md:h-28" />,
                };
            default:
                return {
                    bg: 'bg-slate-700/95',
                    iconBg: 'bg-white',
                    accentColor: 'text-slate-200',
                    icon: <CheckIcon className="w-20 h-20 md:w-28 md:h-28" />,
                };
        }
    };

    const theme = data ? getTheme(data.type) : null;

    return (
        <AnimatePresence>
            {data && theme && (
                <MotionDiv
                    key="burst-container"
                    className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 pointer-events-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    dir={dir}
                >
                    {/* Backdrop */}
                    <div
                        onClick={() => onDismissRef.current()}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
                    />

                    {/* Confetti for Goal/Leader */}
                    {(data.type === 'GOAL_REACHED' || data.type === 'LEADER_CHANGE') && <Confetti />}

                    {/* Card */}
                    <MotionDiv
                        key={data.id}
                        initial={{ scale: 0.8, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: -20 }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30
                        }}
                        className={`relative w-full max-w-[90vw] sm:max-w-lg h-[60vh] sm:h-[65vh] ${theme.bg} rounded-[2rem] sm:rounded-[4rem] p-1.5 sm:p-2 shadow-[0_0_120px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col`}
                    >
                        {/* Inner Container */}
                        <div className="bg-black/10 w-full h-full rounded-[1.5rem] sm:rounded-[3.5rem] p-3 sm:p-4 md:p-6 lg:p-8 flex flex-col items-center justify-center gap-3 sm:gap-4 md:gap-6 lg:gap-8 backdrop-blur-lg border border-white/20 relative overflow-hidden text-center">

                            {/* Rotating Icon Section */}
                            <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 flex items-center justify-center shrink-0">
                                {/* Outer Slow Ring */}
                                <MotionDiv
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 rounded-full border-4 border-dashed border-white/20"
                                />

                                {/* Middle Faster Ring */}
                                <MotionDiv
                                    animate={{ rotate: -360 }}
                                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-4 rounded-full border-2 border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.1)]"
                                />

                                {/* Sparkles on Ring */}
                                <MotionDiv
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute top-0 text-white/40"
                                >
                                    <SparklesIcon className="w-6 h-6" />
                                </MotionDiv>

                                {/* Core Icon Circle */}
                                <MotionDiv
                                    initial={{ scale: 0, rotate: -45 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                                    className={`w-36 h-36 md:w-48 md:h-48 rounded-full ${theme.iconBg} flex items-center justify-center shadow-2xl relative z-10 border-4 border-white/40 overflow-hidden group`}
                                >
                                    <div className="relative z-10 filter drop-shadow-xl group-hover:scale-110 transition-transform duration-500">
                                        {theme.icon}
                                    </div>
                                    {/* Inner Circle Glow */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 opacity-50" />
                                </MotionDiv>
                            </div>

                            {/* Text Content */}
                            <div className="flex-1 flex flex-col justify-center items-center gap-4 z-10 w-full">
                                <MotionH2
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-xl sm:text-2xl md:text-2xl lg:text-3xl font-bold text-white/90 uppercase tracking-[0.1em] drop-shadow-md"
                                >
                                    {data.title}
                                </MotionH2>

                                <MotionH3
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] break-words w-full"
                                >
                                    {data.subTitle}
                                </MotionH3>

                                {data.value !== undefined && (
                                    <MotionDiv
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 }}
                                        className="inline-block bg-black/20 backdrop-blur-xl rounded-3xl px-10 py-4 border border-white/20 mt-4 shadow-inner"
                                    >
                                        {typeof data.value === 'number' ? (
                                            <div className="flex items-center gap-4 justify-center text-4xl md:text-6xl font-black text-white tabular-nums" dir={dir}>
                                                <FormattedNumber value={data.value} forceSign={true} />
                                                <span className={`text-xl md:text-3xl font-bold opacity-80 ${theme.accentColor}`}>{t('points_plural')}</span>
                                            </div>
                                        ) : (
                                            <span className="text-3xl md:text-5xl font-black text-white drop-shadow-md" dir="auto">
                                                {data.value}
                                            </span>
                                        )}
                                    </MotionDiv>
                                )}
                            </div>

                            {/* Countdown Timer Strip */}
                            <div className="absolute bottom-0 left-0 w-full h-3 bg-black/30">
                                <MotionDiv
                                    initial={{ width: "100%" }}
                                    animate={{ width: "0%" }}
                                    transition={{ duration: DURATION / 1000, ease: "linear" }}
                                    className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                                />
                            </div>
                        </div>

                        {/* Ambient Shine Effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none animate-pulse" />
                    </MotionDiv>
                </MotionDiv>
            )}
        </AnimatePresence>
    );
};


import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppSettings, TickerMessage } from '../../types';
import { SparklesIcon, SproutIcon, MusicIcon, Volume2Icon, VolumeXIcon } from '../ui/Icons';
import { generateFillerMessages } from '../../services/geminiService';
import { FormattedNumber } from '../ui/FormattedNumber';
import { Logo } from '../ui/Logo';
import { useLanguage } from '../../hooks/useLanguage';
import { parseFormattedText } from '../../utils/whatsappUtils';

const MotionDiv = motion.div as any;

interface DashboardHeaderProps {
    settings: AppSettings;
    commentary: string;
    customMessages: TickerMessage[];
    totalInstitutionScore: number;
    isMusicPlaying?: boolean;
    setIsMusicPlaying?: (playing: boolean) => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    settings, commentary, customMessages, totalInstitutionScore, isMusicPlaying, setIsMusicPlaying
}) => {
    const { t } = useLanguage();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [maxChars, setMaxChars] = useState(60);
    const [aiFillers, setAiFillers] = useState<string[]>([]);
    const hasFetchedFillers = useRef(false);

    useEffect(() => {
        const updateMaxChars = () => setMaxChars(window.innerWidth < 1024 ? 45 : 80);
        updateMaxChars(); window.addEventListener('resize', updateMaxChars);
        return () => window.removeEventListener('resize', updateMaxChars);
    }, []);

    useEffect(() => {
        if (!settings.school_name || settings.school_name.includes(t('loading').replace('...', ''))) return;
        if (customMessages.length === 0 && !hasFetchedFillers.current) {
            hasFetchedFillers.current = true;
            generateFillerMessages(settings.school_name, settings.competition_name)
                .then(setAiFillers);
        }
    }, [customMessages.length, settings.school_name, settings.competition_name, t]);

    const playlist = useMemo(() => {
        const list = customMessages.length > 0 ? customMessages.map(m => m.text) : aiFillers;
        const final = commentary ? [commentary, ...list] : list;
        return final.filter(m => m && m.trim().length > 0);
    }, [commentary, customMessages, aiFillers]);

    const chunks = useMemo(() => {
        const msg = playlist[currentIndex % playlist.length] || "...";
        if (msg.length <= maxChars) return [msg];

        const res: string[] = [];
        let rem = msg;
        while (rem.length > 0) {
            if (rem.length <= maxChars) {
                res.push(rem);
                break;
            }
            let idx = rem.lastIndexOf(' ', maxChars);
            if (idx === -1) idx = maxChars;
            res.push(rem.slice(0, idx).trim());
            rem = rem.slice(idx).trim();
        }
        return res;
    }, [playlist, currentIndex, maxChars]);

    const [chunkIdx, setChunkIdx] = useState(0);
    useEffect(() => {
        const itv = setInterval(() => {
            if (chunkIdx < chunks.length - 1) setChunkIdx(prev => prev + 1);
            else { setChunkIdx(0); setCurrentIndex(prev => prev + 1); }
        }, 6000);
        return () => clearInterval(itv);
    }, [chunkIdx, chunks]);

    useEffect(() => {
        setChunkIdx(0);
    }, [currentIndex]);

    const currentText = chunks[chunkIdx] || "";
    const isAi = (commentary && currentText.includes(commentary.split('\n')[0])) || (customMessages.length === 0 && aiFillers.length > 0);

    return (
        <div className="flex flex-col gap-2 w-full">
            <div className="flex flex-col lg:flex-row items-stretch gap-2.5 z-10 shrink-0">

                {/* 1. Brand Card (Right) */}
                <div className="flex items-center justify-center px-5 py-2 rounded-2xl lg:rounded-3xl border border-white/10 bg-black/60 backdrop-blur-xl shadow-xl min-h-[55px] lg:min-h-[65px] flex-1 lg:flex-initial lg:min-w-[260px]">
                    <div className="flex items-center gap-3 min-w-0 rtl:flex-row ltr:flex-row">
                        <Logo
                            src={settings.logo_url}
                            className="w-9 h-9 md:w-10 md:h-10 shadow-lg border border-white/10"
                            fallbackIcon="trophy"
                            padding="p-1"
                        />
                        <div className="min-w-0 flex flex-col justify-center rtl:text-right ltr:text-left">
                            <h1
                                className="text-base md:text-lg lg:text-[clamp(1rem,1.3vw,1.2rem)] font-black tracking-tight whitespace-nowrap overflow-hidden text-ellipsis leading-tight text-white"
                                style={{ color: settings.header_text_color_1 || '#ffffff' }}
                            >
                                {settings.competition_name}
                            </h1>
                            <p className="text-white font-bold text-[9px] md:text-[10px] tracking-tight truncate leading-none opacity-50">
                                {settings.school_name}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. Ticker Card (Center) */}
                <div className="flex-1 relative overflow-hidden px-8 py-2 min-h-[40px] lg:min-h-0 flex items-center rounded-2xl lg:rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-xl">
                    <AnimatePresence mode="wait">
                        <MotionDiv
                            key={`${currentIndex}-${chunkIdx}`}
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="flex items-center justify-center lg:justify-start w-full gap-4"
                        >
                            <div className="shrink-0">
                                {isAi ? <SparklesIcon className="w-4 h-4 text-yellow-400 animate-pulse" /> : <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />}
                            </div>
                            <span className={`text-sm md:text-base lg:text-[clamp(1rem,1.2vw,1.15rem)] font-black tracking-tight leading-tight line-clamp-2 lg:line-clamp-1 transition-colors text-white ${isAi ? 'text-yellow-100' : ''}`}>
                                {parseFormattedText(currentText).map((part, i) => {
                                    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('*') && part.endsWith('*'))) {
                                        const content = part.startsWith('**') ? part.slice(2, -2) : part.slice(1, -1);
                                        return <strong key={i} className="text-yellow-400 font-black">{content}</strong>;
                                    }
                                    return part;
                                })}
                            </span>
                        </MotionDiv>
                    </AnimatePresence>

                    {chunks.length > 1 && (
                        <div className="absolute rtl:right-3 ltr:left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                            {chunks.map((_, idx) => (
                                <div key={idx} className={`w-1 h-1 rounded-full transition-all duration-300 ${idx === chunkIdx ? 'bg-white h-2.5 shadow-[0_0_5px_white]' : 'bg-white/20'}`} />
                            ))}
                        </div>
                    )}
                </div>

                {/* 3. Global Score (Left) */}
                <div className="flex items-center justify-center gap-4 px-6 py-2 rounded-2xl lg:rounded-3xl border border-white/10 bg-black/60 backdrop-blur-xl shadow-xl min-h-[55px] lg:min-h-[65px] flex-1 lg:flex-initial lg:min-w-[260px]">
                    <div className="flex flex-col items-center lg:items-end justify-center leading-none">
                        <div className="flex items-center gap-2 text-[9px] font-bold tracking-tight mb-0.5">
                            <span className="text-white opacity-40 uppercase">{t('cumulative_score')}</span>
                            <span className="text-emerald-400">{t('together')}</span>
                        </div>
                        <span className="text-xl lg:text-[clamp(1.4rem,1.9vw,1.75rem)] font-black font-mono text-white tracking-tighter tabular-nums drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                            <FormattedNumber value={totalInstitutionScore} />
                        </span>
                    </div>

                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.1)] flex items-center justify-center shrink-0 border-2 border-white/80">
                        <SproutIcon className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
                    </div>
                </div>

                {/* 4. Music Toggle (Optional) */}
                {settings.background_music_url && (
                    <button
                        onClick={() => setIsMusicPlaying?.(!isMusicPlaying)}
                        className={`flex items-center justify-center w-[55px] lg:w-[65px] rounded-2xl lg:rounded-3xl border transition-all duration-300 shadow-xl ${isMusicPlaying ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-black/40 border-white/10 text-white/40'}`}
                    >
                        {isMusicPlaying ? <Volume2Icon className="w-6 h-6 animate-pulse" /> : <VolumeXIcon className="w-6 h-6" />}
                    </button>
                )}
            </div>
        </div>
    );
};

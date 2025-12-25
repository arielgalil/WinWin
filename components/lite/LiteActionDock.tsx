
import React, { useState, useRef, useEffect } from 'react';
import { ScorePreset } from '../../types';
import { PlusIcon, ArrowRightIcon, SendIcon, EditIcon, XIcon } from '../ui/Icons';
import { formatNumberWithCommas, parseFormattedNumber } from '../../utils/stringUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { FormattedNumber } from '../ui/FormattedNumber';
import { triggerHaptic } from '../../utils/haptics';
import { useLanguage } from '../../hooks/useLanguage';

// Fix for framer-motion type mismatch
const MotionDiv = motion.div as any;

interface LiteActionDockProps {
    selectedCount: number;
    selectionLabel: string;
    presets: ScorePreset[];
    onAction: (points: number, note?: string) => void;
    onClear: () => void;
    isProcessing: boolean;
}

export const LiteActionDock: React.FC<LiteActionDockProps> = ({ selectedCount, selectionLabel, presets, onAction, onClear, isProcessing }) => {
    const { t, dir } = useLanguage();
    const [mode, setMode] = useState<'presets' | 'custom'>('presets');
    const [customValue, setCustomValue] = useState('');
    const [note, setNote] = useState('');
    const [showNoteInput, setShowNoteInput] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const noteRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (mode === 'custom' && inputRef.current) {
            inputRef.current.focus();
        }
    }, [mode]);

    useEffect(() => {
        if (showNoteInput && noteRef.current) {
            noteRef.current.focus();
        }
    }, [showNoteInput]);

    const handleActionClick = (val: number) => {
        triggerHaptic('impact');
        onAction(val, note);
        setNote('');
        setShowNoteInput(false);
    };

    const handleCustomSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const val = parseInt(customValue);
        if (!isNaN(val) && val !== 0) {
            triggerHaptic('impact');
            onAction(val, note);
            setCustomValue('');
            setNote('');
            setShowNoteInput(false);
            setMode('presets');
        }
    };

    const numValue = parseInt(customValue);
    const isNegative = !isNaN(numValue) && numValue < 0;
    const glassCardStyle = "bg-slate-800/90 backdrop-blur-3xl border border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.5)]";

    return (
        <AnimatePresence>
            {selectedCount > 0 && (
                <MotionDiv
                    initial={{ y: 20, opacity: 0, height: 0 }}
                    animate={{ y: 0, opacity: 1, height: 'auto' }}
                    exit={{ y: 20, opacity: 0, height: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                    className="relative w-full z-40 p-2 md:p-3 bg-zinc-950 border-t border-white/10 overflow-hidden"
                    dir={dir}
                >
                    <div
                        className={`${glassCardStyle} rounded-[var(--radius-main)] flex flex-col overflow-hidden`}
                    >
                        {/* Note Input Overlay */}
                        <AnimatePresence>
                            {showNoteInput && (
                                <MotionDiv
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="bg-blue-500/20 px-4 py-2 border-b border-white/10"
                                >
                                    <div className="flex items-center gap-3">
                                        <EditIcon className="w-4 h-4 text-blue-300 shrink-0" />
                                        <input
                                            ref={noteRef}
                                            value={note}
                                            onChange={e => setNote(e.target.value)}
                                            placeholder={t('add_note_placeholder')}
                                            className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-blue-300/50 rtl:text-right ltr:text-left"
                                        />
                                        <button onClick={() => { setNote(''); setShowNoteInput(false); }} className="text-slate-400 p-3 min-w-[44px] min-h-[44px] hover:text-white transition-colors rounded-lg hover:bg-slate-700/50 active:scale-95"><XIcon className="w-5 h-5" /></button>
                                    </div>
                                </MotionDiv>
                            )}
                        </AnimatePresence>

                        {/* Status Line */}
                        <div className="flex justify-between items-center px-5 pt-3 pb-2 bg-black/30">
                            <span className="text-white font-black text-sm flex items-center gap-3 truncate">
                                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_#60a5fa]"></span>
                                <span className="opacity-90">{selectionLabel}</span>
                            </span>
                            {!showNoteInput && (
                                <button
                                    onClick={() => setShowNoteInput(true)}
                                    className="text-[10px] font-bold text-blue-300 flex items-center gap-1 bg-blue-500/10 px-2 py-1 rounded-full border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                                >
                                    <EditIcon className="w-3 h-3" /> {t('add_context')}
                                </button>
                            )}
                        </div>

                        {/* Actions Area */}
                        <div className="h-[160px] relative px-2 py-2">
                            {mode === 'presets' && (
                                <div className="flex gap-2 h-full absolute inset-0 px-2 py-2 items-stretch rtl:flex-row ltr:flex-row">
                                    <div className="flex-1 grid grid-rows-2 grid-flow-col gap-2 overflow-x-auto custom-scrollbar pr-1" style={{ direction: dir }}>
                                        {presets.map((preset, idx) => {
                                            const val = preset.value;
                                            const isPos = val > 0;
                                            let bgStyle = isPos ? (val <= 5 ? 'bg-teal-600/90' : val <= 15 ? 'bg-emerald-600/90' : 'bg-green-600/90') : 'bg-rose-600/90';
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleActionClick(preset.value)}
                                                    disabled={isProcessing}
                                                    className={`min-w-[90px] rounded-[var(--radius-main)] flex flex-col items-center justify-center border active:scale-95 transition-all shadow-lg backdrop-blur-md ${bgStyle} ${isPos ? 'border-teal-200/40' : 'border-rose-200/40'}`}
                                                >
                                                    <span className="text-white/80 text-[10px] font-bold">{preset.label}</span>
                                                    <span className="text-white text-2xl font-black">
                                                        <FormattedNumber value={preset.value} forceSign={true} />
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button
                                        onClick={() => setMode('custom')}
                                        className="w-[75px] bg-slate-700/90 border-2 border-slate-500/50 rounded-[var(--radius-main)] flex flex-col items-center justify-center active:scale-95 transition-all shadow-lg shrink-0 gap-2 backdrop-blur-md hover:bg-slate-600 transition-colors"
                                    >
                                        <PlusIcon className="w-7 h-7 text-white" />
                                        <span className="text-white text-xs font-bold">{t('other')}</span>
                                    </button>
                                </div>
                            )}
                            {mode === 'custom' && (
                                <form onSubmit={handleCustomSubmit} className="flex gap-3 h-full absolute inset-0 z-10 items-center px-3 py-3">
                                    <button type="button" onClick={() => setMode('presets')} className="h-full px-5 rounded-[var(--radius-main)] bg-slate-600/80 border-2 border-slate-500/40 transition-colors hover:bg-slate-500 hover:text-white"><ArrowRightIcon className="w-8 h-8 text-white rtl:rotate-0 ltr:rotate-180" /></button>
                                    <input ref={inputRef} type="text" value={formatNumberWithCommas(customValue)} onChange={(e) => setCustomValue(parseFormattedNumber(e.target.value).toString())} placeholder="0" className="w-32 h-full bg-black/40 text-white text-center text-5xl font-black rounded-[var(--radius-main)] outline-none border-2 border-white/20 focus:border-blue-500 shadow-inner backdrop-blur-sm" dir="ltr" inputMode="decimal" />
                                    <button type="submit" disabled={!customValue || customValue === '0'} className={`flex-1 h-full font-black rounded-[var(--radius-main)] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all border-2 backdrop-blur-md ${isNegative ? 'bg-red-600/90 border-red-200/30' : 'bg-emerald-600/90 border-teal-200/30'}`}>
                                        <span className="text-5xl font-black leading-none drop-shadow-md"><FormattedNumber value={isNaN(numValue) ? 0 : numValue} forceSign={true} /></span>
                                        <div className="rtl:scale-x-1 ltr:scale-x-[-1] opacity-90"><SendIcon className="w-8 h-8 text-white" /></div>
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </MotionDiv>
            )}
        </AnimatePresence>
    );
};

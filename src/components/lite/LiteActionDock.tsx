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
    const glassCardStyle = "bg-[var(--bg-card)] border border-[var(--border-main)] shadow-2xl";

    return (
        <AnimatePresence>
            {selectedCount > 0 && (
                <MotionDiv
                    initial={{ y: 20, opacity: 0, height: 0 }}
                    animate={{ y: 0, opacity: 1, height: 'auto' }}
                    exit={{ y: 20, opacity: 0, height: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                    className="relative w-full z-40 p-2 md:p-3 bg-[var(--bg-page)] border-t border-[var(--border-main)] overflow-hidden"
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
                                    className="bg-indigo-500/10 dark:bg-indigo-500/20 px-4 py-2 border-b border-[var(--border-subtle)]"
                                >
                                    <div className="flex items-center gap-3">
                                        <EditIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-300 shrink-0" />
                                        <input
                                            ref={noteRef}
                                            value={note}
                                            onChange={e => setNote(e.target.value)}
                                            placeholder={t('add_note_placeholder')}
                                            className="bg-transparent border-none outline-none text-[var(--text-main)] text-sm w-full placeholder:text-[var(--text-muted)] opacity-60 rtl:text-right ltr:text-left"
                                        />
                                        <button onClick={() => { setNote(''); setShowNoteInput(false); }} className="text-[var(--text-muted)] p-3 min-w-[44px] min-h-[44px] hover:text-red-500 transition-colors rounded-lg hover:bg-[var(--bg-hover)] active:scale-95"><XIcon className="w-5 h-5" /></button>
                                    </div>
                                </MotionDiv>
                            )}
                        </AnimatePresence>

                        {/* Status Line */}
                        <div className="flex justify-between items-center px-5 pt-3 pb-2 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)]">
                            <span className="text-[var(--text-main)] font-[var(--fw-bold)] text-[var(--fs-base)] flex items-center gap-3 truncate">
                                <span className="w-2.5 h-2.5 rounded-full animate-pulse shadow-[0_0_8px_var(--acc-points)]" style={{ backgroundColor: 'var(--acc-points)' }}></span>
                                <span className="opacity-90">{selectionLabel}</span>
                            </span>
                            {!showNoteInput && (
                                <button
                                    onClick={() => setShowNoteInput(true)}
                                    className="text-[var(--fs-sm)] font-[var(--fw-bold)] text-indigo-600 dark:text-indigo-400 flex items-center gap-1 bg-indigo-500/10 px-2 py-1 rounded-full border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
                                >
                                    <EditIcon className="w-3 h-3" /> {t('add_context')}
                                </button>
                            )}
                        </div>

                        {/* Actions Area */}
                        <div className="h-[160px] relative px-2 py-2 bg-[var(--bg-card)]">
                            {mode === 'presets' && (
                                <div className="flex gap-2 h-full absolute inset-0 px-2 py-2 items-stretch rtl:flex-row ltr:flex-row">
                                    <div className="flex-1 grid grid-rows-2 grid-flow-col gap-2 overflow-x-auto custom-scrollbar pr-1" style={{ direction: dir }}>
                                        {presets.map((preset, idx) => {
                                            const val = preset.value;
                                            const isPos = val > 0;
                                            let bgStyle = isPos ? (val <= 5 ? 'bg-teal-600' : val <= 15 ? 'bg-emerald-600' : 'bg-green-600') : 'bg-rose-600';
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleActionClick(preset.value)}
                                                    disabled={isProcessing}
                                                    className={`min-w-[90px] rounded-[var(--radius-main)] flex flex-col items-center justify-center border active:scale-95 transition-all shadow-md ${bgStyle} border-white/20`}
                                                >
                                                    <span className="text-white/80 text-[var(--fs-sm)] font-[var(--fw-bold)]">{preset.label}</span>
                                                    <span className="text-white text-[var(--fs-xl)] font-[var(--fw-bold)]">
                                                        <FormattedNumber value={preset.value} forceSign={true} />
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button
                                        onClick={() => setMode('custom')}
                                        className="w-[75px] bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-[var(--radius-main)] flex flex-col items-center justify-center active:scale-95 transition-all shadow-md shrink-0 gap-2 hover:bg-[var(--bg-hover)]"
                                    >
                                        <PlusIcon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                                        <span className="text-indigo-600 dark:text-indigo-400 text-[var(--fs-sm)] font-[var(--fw-bold)]">{t('other')}</span>
                                    </button>
                                </div>
                            )}
                            {mode === 'custom' && (
                                <form onSubmit={handleCustomSubmit} className="flex gap-3 h-full absolute inset-0 z-10 items-center px-3 py-3">
                                    <button type="button" onClick={() => setMode('presets')} className="h-full px-5 rounded-[var(--radius-main)] bg-[var(--bg-surface)] border border-[var(--border-main)] text-[var(--text-main)] transition-colors hover:bg-[var(--bg-hover)]"><ArrowRightIcon className="w-8 h-8 rtl:rotate-0 ltr:rotate-180" /></button>
                                    <input ref={inputRef} type="text" value={formatNumberWithCommas(customValue)} onChange={(e) => setCustomValue(parseFormattedNumber(e.target.value).toString())} placeholder="0" className="w-32 h-full bg-[var(--bg-input)] text-[var(--text-main)] text-center text-[var(--fs-xl)] font-[var(--fw-bold)] rounded-[var(--radius-main)] outline-none border-2 border-[var(--border-main)] focus:border-indigo-500 shadow-inner" dir="ltr" inputMode="decimal" />
                                    <button type="submit" disabled={!customValue || customValue === '0'} className={`flex-1 h-full font-[var(--fw-bold)] rounded-[var(--radius-main)] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all border-2 ${isNegative ? 'bg-red-600 border-red-400' : 'bg-emerald-600 border-emerald-400'}`}>
                                        <span className="text-[var(--fs-xl)] font-[var(--fw-bold)] leading-none drop-shadow-md text-white"><FormattedNumber value={isNaN(numValue) ? 0 : numValue} forceSign={true} /></span>
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
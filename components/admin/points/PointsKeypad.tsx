
import React from 'react';
import { ScorePreset } from '../../../types';
import { SparklesIcon, TrendDownIcon, UsersIcon, SchoolIcon } from '../../ui/Icons';
import { FormattedNumber } from '../../ui/FormattedNumber';
import { useLanguage } from '../../../hooks/useLanguage';

interface PointsKeypadProps {
    points: number;
    setPoints: (val: number) => void;
    minPoints: number;
    maxPoints: number;
    stepSize: number;
    presets: ScorePreset[];
    onSubmit: (e: React.FormEvent) => void;
    isLocked: boolean;
    isNegative: boolean;
    targetLabel: string;
    targetType: 'class' | 'students';
}

export const PointsKeypad: React.FC<PointsKeypadProps> = ({
    points,
    setPoints,
    minPoints,
    maxPoints,
    stepSize,
    presets,
    onSubmit,
    isLocked,
    isNegative,
    targetLabel,
    targetType
}) => {
    const { t } = useLanguage();

    const handlePointsChange = (val: number) => {
        if (val > maxPoints) val = maxPoints;
        if (val < minPoints) val = minPoints;
        setPoints(val);
    };

    const handleManualInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === '' || val === '-') {
            setPoints(val === '-' ? -0 : 0);
            return;
        }
        const digits = val.replace(/[^\d]/g, '');
        if (!digits) {
            setPoints(0);
            return;
        }
        let num = parseInt(digits, 10);
        if (val.includes('-')) num = -Math.abs(num);
        else num = Math.abs(num);
        handlePointsChange(num);
    };

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-3 justify-center">
                {presets.map((preset, idx) => {
                    const isPresetNegative = preset.value < 0;
                    return (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => setPoints(preset.value)}
                            aria-pressed={points === preset.value}
                            aria-label={`${preset.label}: ${preset.value} points`}
                            className={`px-4 py-3 rounded-xl border text-sm font-bold transition-all hover:scale-105 active:scale-95 flex flex-col items-center min-w-[80px] focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#1e1e2e] outline-none
                                ${points === preset.value
                                    ? isPresetNegative
                                        ? 'bg-red-600 border-red-400 text-white shadow-md shadow-red-500/20'
                                        : 'bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-500/20'
                                    : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 shadow-sm hover:border-indigo-500 dark:hover:border-indigo-500'
                                }
                            `}
                        >
                            <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">{preset.label}</span>
                            <span className="text-xl text-gray-900 dark:text-white">
                                <FormattedNumber value={preset.value} forceSign={true} />
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="flex items-center justify-center gap-4">
                <button type="button" onClick={() => handlePointsChange(points + stepSize)} className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center text-gray-600 dark:text-gray-200 text-2xl font-bold shadow-sm active:scale-95 transition-transform border border-gray-200 dark:border-white/10">+</button>

                <div className="bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl w-32 h-16 flex flex-col items-center justify-center relative shadow-inner">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider absolute top-1">{t('points_label')}</span>
                    <input
                        type="text"
                        inputMode="decimal"
                        value={points === 0 ? '' : points.toString()}
                        onChange={handleManualInputChange}
                        placeholder="0"
                        aria-label={`${t('points_label')} ${points}`}
                        className={`bg-transparent text-center text-3xl font-bold w-full outline-none appearance-none mt-1 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-white dark:focus:ring-offset-black rounded-xl ${isNegative ? 'text-red-500 dark:text-red-400' : 'text-indigo-600 dark:text-indigo-400'}`}
                        dir="ltr"
                    />
                </div>

                <button type="button" onClick={() => handlePointsChange(points - stepSize)} className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center text-gray-600 dark:text-gray-200 text-2xl font-bold shadow-sm active:scale-95 transition-transform border border-gray-200 dark:border-white/10">-</button>
            </div>

            <button
                type="submit"
                disabled={isLocked}
                className={`w-full py-5 rounded-2xl font-bold text-white text-xl transition-all flex items-center justify-center gap-3 shadow-md relative overflow-hidden active:scale-98
                  ${isLocked
                        ? 'bg-gray-400 dark:bg-gray-700 text-gray-100 cursor-not-allowed'
                        : isNegative
                            ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30'
                            : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30'
                    }`}
            >
                <div className="relative z-10 flex flex-col items-center leading-tight">
                    <span className="flex items-center gap-2">
                        {isLocked ? (
                            <span>{t('updating')}</span>
                        ) : (
                            <>
                                {isNegative ? (
                                    <TrendDownIcon className="w-6 h-6 text-red-200" />
                                ) : (
                                    <SparklesIcon className="w-6 h-6 text-yellow-200" />
                                )}
                                <span className="flex items-center gap-1">
                                    {isNegative ? t('remove_short') : t('add_short')} <FormattedNumber value={Math.abs(points)} /> {t('points_label')}
                                </span>
                            </>
                        )}
                    </span>
                    {!isLocked && (
                        <span className="text-sm font-medium opacity-90 flex items-center gap-1 mt-1">
                            {t('for_label')}
                            <span className="font-bold underline decoration-white/30 underline-offset-4 flex items-center gap-1">
                                {targetType === 'students' ? <UsersIcon className="w-3 h-3" /> : <SchoolIcon className="w-3 h-3" />}
                                {targetLabel}
                            </span>
                        </span>
                    )}
                </div>

                {!isLocked && (
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                )}
            </button>
        </form>
    );
};

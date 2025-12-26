
import React, { memo } from 'react';
import { CheckIcon, SchoolIcon, UserIcon } from '../ui/Icons';
import { FormattedNumber } from '../ui/FormattedNumber';
import { triggerHaptic } from '../../utils/haptics';

interface LiteStudentCardProps {
  id: string;
  name: string;
  score: number;
  isSelected: boolean;
  onToggle: (id: string) => void;
  isClassEntity?: boolean;
}

export const LiteStudentCard: React.FC<LiteStudentCardProps> = memo(({ id, name, score, isSelected, onToggle, isClassEntity = false }) => {

  const handleClick = () => {
    triggerHaptic('selection');
    onToggle(id);
  };

  return (
    <button
      onClick={handleClick}
      aria-pressed={isSelected}
      className={`
        relative w-full h-24 rounded-[var(--radius-main)] flex flex-col items-center justify-center transition-all duration-200 touch-manipulation select-none overflow-hidden border backdrop-blur-md shadow-xl
        ${isSelected
          ? isClassEntity
            ? 'bg-purple-600 border-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.6)] scale-[0.98] ring-2 ring-purple-300 text-white'
            : 'bg-blue-600 border-blue-200 shadow-[0_0_20px_rgba(59,130,246,0.6)] scale-[0.98] ring-2 ring-blue-300 text-white'
          : isClassEntity
            ? 'bg-purple-500/10 dark:bg-purple-950/60 border-purple-500/50 active:scale-95 active:bg-purple-900 hover:border-purple-400 text-[var(--text-main)]'
            : 'bg-[var(--bg-card)] dark:bg-black/60 border-[var(--border-main)] dark:border-white/20 active:scale-95 active:bg-slate-100 dark:active:bg-black/80 hover:bg-slate-50 dark:hover:bg-black/70 text-[var(--text-main)]'
        }
      `}
    >
      {/* Background Icon/Glow for Class Entity */}
      {isClassEntity ? (
        <div className="absolute -bottom-3 -left-3 opacity-20 pointer-events-none">
          <SchoolIcon className="w-14 h-14 text-purple-600 dark:text-purple-300 rotate-12" />
        </div>
      ) : (
        <div className="absolute -bottom-3 -right-3 opacity-10 pointer-events-none">
          <UserIcon className="w-14 h-14 text-slate-900 dark:text-white -rotate-12" />
        </div>
      )}

      <div className="flex flex-col items-center justify-center z-10 w-full px-2 h-full py-1">
        {/* Name - Now smaller and at the top */}
        <span className={`font-black leading-tight text-center w-full break-words line-clamp-1 mb-1 transition-all duration-300
            ${isSelected ? 'text-white' : 'text-[var(--text-muted)] text-[10px]'}
        `}>
          {name}
        </span>

        {/* Score Badge - Centered in the card */}
        <div className={`font-black px-3 py-1.5 rounded-[var(--radius-main)] border transition-all duration-300 shadow-inner min-w-[50px]
            ${isSelected
            ? 'bg-[var(--bg-page)] text-[var(--primary-base)] border-[var(--bg-page)] scale-110'
            : isClassEntity
              ? 'bg-purple-500/20 dark:bg-purple-500/30 text-purple-700 dark:text-purple-100 border-purple-400/30'
              : 'bg-[var(--bg-surface)] dark:bg-slate-800 text-[var(--text-main)] dark:text-white border-[var(--border-main)] dark:border-white/20'
          }`}>
          <FormattedNumber value={score} className="text-base" />
        </div>
      </div>

      {isSelected && (
        <div className={`absolute top-2 right-2 text-white rounded-full p-1 shadow-xl border border-white/50 animate-in zoom-in duration-200 ${isClassEntity ? 'bg-purple-500' : 'bg-blue-500'}`}>
          <CheckIcon className="w-3 h-3" />
        </div>
      )}
    </button>
  );
}, (prev, next) => {
  return prev.isSelected === next.isSelected && prev.score === next.score && prev.name === next.name;
});

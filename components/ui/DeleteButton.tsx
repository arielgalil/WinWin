
import React, { useState, useEffect } from 'react';
import { TrendDownIcon, TrashIcon } from './Icons';
import { useLanguage } from '../../hooks/useLanguage';

interface DeleteButtonProps {
  onClick: () => void;
  className?: string;
}

export const DeleteButton: React.FC<DeleteButtonProps> = ({ onClick, className = "" }) => {
  const { t } = useLanguage();
  const [stage, setStage] = useState<'idle' | 'confirm'>('idle');

  useEffect(() => {
    if (stage === 'confirm') {
      const timeout = setTimeout(() => setStage('idle'), 3000);
      return () => clearTimeout(timeout);
    }
  }, [stage]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (stage === 'idle') {
      setStage('confirm');
    } else {
      onClick();
      setStage('idle');
    }
  };

  return (
    <div className={`relative flex items-center justify-center min-w-[32px] h-full ${className}`}>
      <button
        onClick={handleClick}
        className={`p-2 min-h-[40px] rounded-lg transition-all active:scale-95 border flex items-center justify-center
            ${stage === 'confirm'
            ? 'bg-rose-600 text-white border-rose-500 shadow-lg z-10 px-3'
            : 'bg-white/5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 dark:hover:text-rose-400 border-slate-200 dark:border-[var(--border-main)] hover:border-rose-500/20'
          }`}
        title={stage === 'idle' ? t('delete_action') : t('click_again_to_confirm')}
      >
        {stage === 'confirm' ? (
          <span className="text-[10px] font-black uppercase tracking-tight whitespace-nowrap flex items-center gap-1.5 animate-in fade-in zoom-in slide-in-from-right-1 duration-200">
            <TrashIcon className="w-3.5 h-3.5" /> {t('confirm')}
          </span>
        ) : (
          <TrashIcon className="w-4 h-4" />
        )}
      </button>
    </div>
  );
};

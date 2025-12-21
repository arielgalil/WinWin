
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
    <div className={`relative flex items-center justify-center min-w-[100px] h-10 ${className}`}>
      <button
        onClick={handleClick}
        className={`transition-all duration-300 rounded-xl flex items-center justify-center overflow-hidden h-9
            ${stage === 'confirm'
            ? 'bg-red-600 text-white w-28 shadow-lg shadow-red-900/40 z-10'
            : 'text-slate-500/30 hover:text-slate-500 hover:bg-slate-500/10 w-9'
          }`}
        title={stage === 'idle' ? t('delete_action') : t('click_again_to_confirm')}
      >
        {stage === 'confirm' ? (
          <span className="text-[10px] font-black whitespace-nowrap flex items-center gap-1 animate-in fade-in zoom-in duration-200 px-2">
            <TrendDownIcon className="w-3 h-3" /> {t('confirm_deletion')}
          </span>
        ) : (
          <TrashIcon className="w-5 h-5" />
        )}
      </button>
    </div>
  );
};

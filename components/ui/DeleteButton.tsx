
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
    <div className={`relative flex items-center justify-center min-w-[44px] h-10 ${className}`}>
      <button
        onClick={handleClick}
        className={`p-3 min-w-[44px] min-h-[44px] rounded-lg transition-all active:scale-95
            ${stage === 'confirm'
            ? 'bg-slate-700 text-white shadow-lg z-10'
            : 'bg-slate-600/20 text-slate-400 hover:bg-slate-600/30 hover:text-slate-300'
          }`}
        title={stage === 'idle' ? t('delete_action') : t('click_again_to_confirm')}
      >
        {stage === 'confirm' ? (
          <span className="text-[10px] font-black whitespace-nowrap flex items-center gap-1 animate-in fade-in zoom-in duration-200">
            <TrendDownIcon className="w-3 h-3" /> {t('confirm_deletion')}
          </span>
        ) : (
          <TrashIcon className="w-5 h-5" />
        )}
      </button>
    </div>
  );
};

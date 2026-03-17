import React from 'react';
import { ClockIcon } from './Icons';
import { useLanguage } from '../../hooks/useLanguage';
import { formatLastSaved } from '../../utils/dateUtils';
import { cn } from '../../lib/utils';

interface LastSavedPillProps {
  timestamp: Date | string | null;
  isPulse?: boolean;
  className?: string;
}

export const LastSavedPill: React.FC<LastSavedPillProps> = ({ 
  timestamp, 
  isPulse = false,
  className 
}) => {
  const { language, t } = useLanguage();

  const formattedTimestamp = React.useMemo(() => {
    if (!timestamp) return null;
    return timestamp instanceof Date ? timestamp.toISOString() : timestamp;
  }, [timestamp]);

  if (!formattedTimestamp) return null;

  return (
    <div className={cn(
      "flex items-center gap-2 bg-[var(--bg-surface)] border border-[var(--border-main)] px-3 py-1.5 rounded-full text-[10px] font-bold text-[var(--text-secondary)] shadow-sm transition-all",
      className
    )}>
      <ClockIcon className="w-3.5 h-3.5 text-orange-400" />
      <span>
        {t('last_saved')}: {formatLastSaved(formattedTimestamp, language)}
      </span>
      <div className={cn(
        "w-1.5 h-1.5 rounded-full bg-green-500 ml-0.5",
        isPulse && "animate-pulse"
      )} />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { ClockIcon } from './Icons';
import { SaveNotification } from '../../contexts/SaveNotificationContext';
import { formatLastSaved } from '../../utils/dateUtils';
import { useLanguage } from '../../hooks/useLanguage';

interface SaveNotificationBadgeProps {
  notification?: SaveNotification;
  onDismiss?: () => void;
}

export const SaveNotificationBadge: React.FC<SaveNotificationBadgeProps> = ({ notification, onDismiss }) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const { language, t } = useLanguage();

  const formatLocalDate = (date: Date): string => {
    return formatLastSaved(date.toISOString(), language);
  };

  useEffect(() => {
    if (!notification || isDismissed) {
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const timeUntilDismiss = notification!.autoDismissTime.getTime() - now.getTime();
      const secondsLeft = Math.max(0, Math.floor(timeUntilDismiss / 1000));

      if (secondsLeft === 0) {
        setIsDismissed(true);
        onDismiss?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [notification, isDismissed, onDismiss]);

  if (isDismissed || !notification) return null;

  return (
    <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-[11px] text-white/70 shadow-sm animate-in fade-in slide-in-from-left-2 duration-300">
      <ClockIcon className="w-3.5 h-3.5 text-orange-400" />
      <span className="text-[10px] font-bold">
        {notification.timestamp 
          ? `${t('last_saved')}: ${formatLocalDate(notification.timestamp)}`
          : t('not_saved_recently')}
      </span>
      {notification && (
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse ml-1" />
      )}
    </div>
  );
};

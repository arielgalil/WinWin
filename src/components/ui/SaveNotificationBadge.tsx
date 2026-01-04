import React, { useState, useEffect } from 'react';
import { SaveNotification } from '../../contexts/SaveNotificationContext';
import { LastSavedPill } from './LastSavedPill';

interface SaveNotificationBadgeProps {
  notification?: SaveNotification;
  onDismiss?: () => void;
}

export const SaveNotificationBadge: React.FC<SaveNotificationBadgeProps> = ({ notification, onDismiss }) => {
  const [isDismissed, setIsDismissed] = useState(false);

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
    <LastSavedPill 
      timestamp={notification.timestamp} 
      isPulse={true} 
      className="animate-in fade-in slide-in-from-left-2 duration-300"
    />
  );
};

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface SaveNotification {
  tab: string;
  timestamp: Date;
  autoDismissTime: Date;
}

interface SaveNotificationContextType {
  triggerSave: (tab: string) => void;
  dismiss: (tab: string) => void;
  notifications: Map<string, SaveNotification>;
}

const SaveNotificationContext = createContext<SaveNotificationContextType | null>(null);

export const useSaveNotification = () => {
  const context = useContext(SaveNotificationContext);
  if (!context) {
    throw new Error('useSaveNotification must be used within SaveNotificationProvider');
  }
  return context;
};

interface SaveNotificationProviderProps {
  children: ReactNode;
}

export const SaveNotificationProvider: React.FC<SaveNotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Map<string, SaveNotification>>(new Map());

  const triggerSave = (tab: string) => {
    const now = new Date();
    const autoDismissTime = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes from now
    
    const notification: SaveNotification = {
      tab,
      timestamp: now,
      autoDismissTime
    };
    
    setNotifications(prev => {
      const newMap = new Map(prev);
      newMap.set(tab, notification);
      return newMap;
    });
  };

  const dismiss = (tab: string) => {
    setNotifications(prev => {
      const newMap = new Map(prev);
      newMap.delete(tab);
      return newMap;
    });
  };

  // Auto-dismiss notifications after 15 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setNotifications(prev => {
        const newMap = new Map<string, SaveNotification>();
        let hasChanges = false;
        
        prev.forEach((notification, tab) => {
          if (now >= notification.autoDismissTime) {
            hasChanges = true;
          } else {
            newMap.set(tab, notification);
          }
        });
        
        return hasChanges ? newMap : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <SaveNotificationContext.Provider value={{ triggerSave, dismiss, notifications }}>
      {children}
    </SaveNotificationContext.Provider>
  );
};

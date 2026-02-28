import { useState, useCallback, useRef } from 'react';
import { Achievement } from '../utils/achievements';

export interface AchievementNotification {
  id: string;
  notifId: string;
  name: string;
  description: string;
  icon: string;
}

export function useAchievementNotifications() {
  const [notifications, setNotifications] = useState<AchievementNotification[]>([]);
  const counterRef = useRef(0);

  const addNotification = useCallback((achievement: Achievement) => {
    const notifId = `notif-${Date.now()}-${counterRef.current++}`;
    const notif: AchievementNotification = {
      id: achievement.id,
      notifId,
      name: achievement.name ?? achievement.title,
      description: achievement.description,
      icon: achievement.icon,
    };
    setNotifications(prev => [...prev, notif]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.notifId !== notifId));
    }, 4000);
  }, []);

  const dismissNotification = useCallback((notifId: string) => {
    setNotifications(prev => prev.filter(n => n.notifId !== notifId));
  }, []);

  return { notifications, addNotification, dismissNotification };
}

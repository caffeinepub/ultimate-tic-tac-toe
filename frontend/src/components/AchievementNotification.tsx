import React from 'react';
import { X } from 'lucide-react';
import { AchievementNotification as AchievementNotifType } from '../hooks/useAchievementNotifications';

interface Props {
  notifications: AchievementNotifType[];
  onDismiss: (notifId: string) => void;
}

const AchievementNotification: React.FC<Props> = ({ notifications, onDismiss }) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      {notifications.map(notif => (
        <div
          key={notif.notifId}
          className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border border-neon-blue/60 bg-gray-950/95 backdrop-blur-sm shadow-[0_0_20px_rgba(0,212,255,0.4)] animate-achievement-in min-w-[280px] max-w-[340px]"
          style={{ animation: 'achievementSlideIn 0.4s ease-out forwards' }}
        >
          <div className="text-2xl flex-shrink-0">{notif.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-neon-blue uppercase tracking-widest font-orbitron mb-0.5">
              Achievement Unlocked!
            </div>
            <div className="text-sm font-bold text-white font-rajdhani truncate">{notif.name}</div>
            <div className="text-xs text-gray-400 font-rajdhani truncate">{notif.description}</div>
          </div>
          <button
            onClick={() => onDismiss(notif.notifId)}
            className="flex-shrink-0 text-gray-500 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default AchievementNotification;

import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, Link, useNavigate } from '@tanstack/react-router';
import { Home, Trophy, User, BarChart2 } from 'lucide-react';
import AchievementNotification from './AchievementNotification';
import FirstVisitModal from './FirstVisitModal';
import LevelUpOverlay from './LevelUpOverlay';
import { useAchievementNotifications } from '../hooks/useAchievementNotifications';
import { registerNotificationCallback } from '../utils/achievements';
import { getPlayerProfile, getAvatarImagePath, PlayerProfile } from '../utils/playerProfile';

export default function RootLayout() {
  const navigate = useNavigate();
  const { notifications, addNotification, dismissNotification } = useAchievementNotifications();
  const [levelUpVisible, setLevelUpVisible] = useState(false);
  const [levelUpNewLevel, setLevelUpNewLevel] = useState(1);
  const [profile, setProfile] = useState<PlayerProfile | null>(null);

  useEffect(() => {
    registerNotificationCallback((achievement) => {
      addNotification(achievement);
    });
  }, [addNotification]);

  // Load profile on mount and listen for profile updates
  useEffect(() => {
    const loadProfile = () => {
      const p = getPlayerProfile();
      setProfile(p);
    };
    loadProfile();

    const handleStorage = () => loadProfile();
    window.addEventListener('storage', handleStorage);
    const interval = setInterval(loadProfile, 2000);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  // Listen for level-up events
  useEffect(() => {
    const handleLevelUp = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setLevelUpNewLevel(detail?.newLevel ?? 1);
      setLevelUpVisible(true);
    };
    window.addEventListener('levelup', handleLevelUp);
    return () => window.removeEventListener('levelup', handleLevelUp);
  }, []);

  const handleLevelUpDismiss = useCallback(() => {
    setLevelUpVisible(false);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navigation Bar */}
      <nav
        className="sticky top-0 z-50 border-b border-neon-blue/20 bg-gray-950/95 backdrop-blur-sm"
        style={{ boxShadow: '0 0 20px rgba(0,212,255,0.1)' }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 font-orbitron text-lg font-black text-neon-blue transition-all hover:scale-105"
            style={{ textShadow: '0 0 15px rgba(0,212,255,0.7)' }}
          >
            <span className="text-2xl">🎮</span>
            <span className="hidden sm:inline">ULTIMATE GAMING ARENA</span>
            <span className="sm:hidden">UGA</span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/"
              className="flex items-center gap-1 rounded-lg px-2 py-2 font-rajdhani text-sm text-gray-400 transition-all hover:text-neon-blue sm:px-3"
            >
              <Home size={16} />
              <span className="hidden sm:inline">Home</span>
            </Link>

            <Link
              to="/achievements"
              className="flex items-center gap-1 rounded-lg px-2 py-2 font-rajdhani text-sm text-gray-400 transition-all hover:text-neon-blue sm:px-3"
            >
              <Trophy size={16} />
              <span className="hidden sm:inline">Achievements</span>
            </Link>

            <Link
              to="/leaderboard"
              className="flex items-center gap-1 rounded-lg px-2 py-2 font-rajdhani text-sm text-gray-400 transition-all hover:text-neon-blue sm:px-3"
            >
              <BarChart2 size={16} />
              <span className="hidden sm:inline">Leaderboard</span>
            </Link>

            {/* Profile Button */}
            <Link
              to="/profile"
              className="flex items-center gap-2 rounded-xl border px-2 py-1.5 transition-all duration-200 hover:scale-105 sm:px-3"
              style={{
                borderColor: 'rgba(0,212,255,0.3)',
                background: 'rgba(0,212,255,0.05)',
                boxShadow: '0 0 10px rgba(0,212,255,0.1)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 0 20px rgba(0,212,255,0.3)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,212,255,0.6)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 0 10px rgba(0,212,255,0.1)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,212,255,0.3)';
              }}
            >
              {profile ? (
                <>
                  <div className="h-7 w-7 overflow-hidden rounded-lg border border-neon-blue/40 flex-shrink-0">
                    <img
                      src={getAvatarImagePath(profile.avatarId)}
                      alt="Profile"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `<div class="h-full w-full flex items-center justify-center text-sm bg-gray-800">${['🤖','👾','🦊','🐉','⚡'][profile.avatarId - 1] || '🎮'}</div>`;
                        }
                      }}
                    />
                  </div>
                  <span className="hidden font-rajdhani text-sm font-semibold text-neon-blue sm:inline max-w-[80px] truncate">
                    {profile.username}
                  </span>
                </>
              ) : (
                <>
                  <User size={16} className="text-neon-blue" />
                  <span className="hidden font-rajdhani text-sm font-semibold text-neon-blue sm:inline">
                    Profile
                  </span>
                </>
              )}
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-neon-blue/10 bg-gray-950 py-8 text-center">
        <p className="font-rajdhani text-sm text-gray-600">
          © {new Date().getFullYear()} Ultimate Gaming Arena. Built with{' '}
          <span className="text-red-500">♥</span> using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'ultimate-gaming-arena')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neon-blue hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>

      {/* Global Overlays */}
      <AchievementNotification
        notifications={notifications}
        onDismiss={dismissNotification}
      />
      <FirstVisitModal />
      <LevelUpOverlay
        visible={levelUpVisible}
        newLevel={levelUpNewLevel}
        onDismiss={handleLevelUpDismiss}
      />
    </div>
  );
}

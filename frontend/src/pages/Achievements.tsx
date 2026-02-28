import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Lock, Trophy, ArrowLeft } from 'lucide-react';
import { getAllAchievements, Achievement, resetAllAchievements } from '../utils/achievements';

const categoryLabels: Record<string, string> = {
  global: '🌐 Global',
  traffic: '🚗 Traffic Rush',
  snake: '🐍 Snake',
  rps: '✊ Rock Paper Scissors',
  snakeladder: '🎲 Snake & Ladder',
};

const categoryOrder = ['global', 'traffic', 'snake', 'rps', 'snakeladder'];

const AchievementCard: React.FC<{ achievement: Achievement }> = ({ achievement }) => {
  const { unlocked, name, description, icon } = achievement;

  return (
    <div
      className={`relative rounded-xl border p-4 flex items-start gap-4 transition-all duration-300 ${
        unlocked
          ? 'border-neon-blue/70 bg-gray-900/80 shadow-[0_0_18px_rgba(0,212,255,0.35)] hover:shadow-[0_0_28px_rgba(0,212,255,0.55)]'
          : 'border-gray-700/50 bg-gray-900/40 opacity-60'
      }`}
    >
      {/* Icon */}
      <div
        className={`text-3xl flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg ${
          unlocked ? 'bg-neon-blue/10' : 'bg-gray-800/60 grayscale'
        }`}
      >
        {unlocked ? icon : <Lock size={20} className="text-gray-500" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div
          className={`font-bold font-orbitron text-sm tracking-wide ${
            unlocked ? 'text-neon-blue' : 'text-gray-500'
          }`}
        >
          {name}
        </div>
        <div className="text-xs text-gray-400 font-rajdhani mt-0.5">{description}</div>
        {unlocked && achievement.unlockedAt && (
          <div className="text-xs text-gray-600 font-rajdhani mt-1">
            Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Unlocked badge */}
      {unlocked && (
        <div className="flex-shrink-0">
          <Trophy size={16} className="text-neon-blue" />
        </div>
      )}
    </div>
  );
};

const Achievements: React.FC = () => {
  const navigate = useNavigate();
  const [achievements, setAchievements] = React.useState<Achievement[]>([]);
  const [confirmReset, setConfirmReset] = React.useState(false);

  React.useEffect(() => {
    setAchievements(getAllAchievements());
  }, []);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  const grouped = categoryOrder.reduce<Record<string, Achievement[]>>((acc, cat) => {
    acc[cat] = achievements.filter(a => a.category === cat);
    return acc;
  }, {});

  const handleReset = () => {
    if (confirmReset) {
      resetAllAchievements();
      setAchievements(getAllAchievements());
      setConfirmReset(false);
    } else {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-neon-blue/20 bg-gray-950/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate({ to: '/' })}
              className="flex items-center gap-2 text-gray-400 hover:text-neon-blue transition-colors font-rajdhani text-sm"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          </div>
          <h1 className="font-orbitron font-bold text-xl text-neon-blue tracking-widest uppercase">
            Achievements
          </h1>
          <button
            onClick={handleReset}
            className={`text-xs font-rajdhani px-3 py-1.5 rounded border transition-colors ${
              confirmReset
                ? 'border-red-500 text-red-400 hover:bg-red-500/10'
                : 'border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-500'
            }`}
          >
            {confirmReset ? 'Confirm Reset?' : 'Reset'}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Progress summary */}
        <div className="mb-8 p-6 rounded-2xl border border-neon-blue/30 bg-gray-900/60 text-center">
          <div className="font-orbitron text-4xl font-bold text-neon-blue mb-1">
            {unlockedCount} <span className="text-gray-500 text-2xl">/ {totalCount}</span>
          </div>
          <div className="font-rajdhani text-gray-400 text-sm uppercase tracking-widest mb-4">
            Achievements Unlocked
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-neon-blue rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(0,212,255,0.8)]"
              style={{ width: totalCount > 0 ? `${(unlockedCount / totalCount) * 100}%` : '0%' }}
            />
          </div>
        </div>

        {/* Achievement categories */}
        <div className="space-y-8">
          {categoryOrder.map(cat => {
            const catAchievements = grouped[cat] || [];
            if (catAchievements.length === 0) return null;
            const catUnlocked = catAchievements.filter(a => a.unlocked).length;
            return (
              <section key={cat}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-orbitron text-sm font-bold text-gray-300 uppercase tracking-widest">
                    {categoryLabels[cat] || cat}
                  </h2>
                  <span className="text-xs font-rajdhani text-gray-500">
                    {catUnlocked}/{catAchievements.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {catAchievements.map(a => (
                    <AchievementCard key={a.id} achievement={a} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12 py-6 text-center">
        <p className="text-gray-600 text-xs font-rajdhani">
          © {new Date().getFullYear()} Ultimate Gaming Arena — Built with ❤️ using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'unknown-app')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neon-blue hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
};

export default Achievements;

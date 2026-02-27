import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import SoundToggle from '../components/SoundToggle';
import { useSoundManager } from '../hooks/useSoundManager';

interface GameCard {
  title: string;
  subtitle: string;
  icon: string;
  route: string;
  color: string;
  glow: string;
  border: string;
  badge?: string;
}

const GAMES: GameCard[] = [
  {
    title: 'Tic Tac Toe',
    subtitle: 'Single Player vs AI',
    icon: '🎮',
    route: '/single-player',
    color: 'text-neon-blue',
    glow: 'hover:shadow-[0_0_25px_rgba(0,212,255,0.3)]',
    border: 'hover:border-neon-blue/60',
    badge: 'AI',
  },
  {
    title: 'Tic Tac Toe',
    subtitle: 'Two Players',
    icon: '🕹️',
    route: '/two-player',
    color: 'text-neon-purple',
    glow: 'hover:shadow-[0_0_25px_rgba(168,85,247,0.3)]',
    border: 'hover:border-neon-purple/60',
    badge: '2P',
  },
  {
    title: 'Snake',
    subtitle: 'Classic arcade game',
    icon: '🐍',
    route: '/snake',
    color: 'text-green-400',
    glow: 'hover:shadow-[0_0_25px_rgba(74,222,128,0.3)]',
    border: 'hover:border-green-500/60',
  },
  {
    title: 'Traffic Rush',
    subtitle: 'Dodge the traffic',
    icon: '🚗',
    route: '/traffic',
    color: 'text-yellow-400',
    glow: 'hover:shadow-[0_0_25px_rgba(250,204,21,0.3)]',
    border: 'hover:border-yellow-500/60',
  },
  {
    title: 'Rock Paper Scissors',
    subtitle: 'Classic hand game',
    icon: '✊',
    route: '/rps',
    color: 'text-red-400',
    glow: 'hover:shadow-[0_0_25px_rgba(248,113,113,0.3)]',
    border: 'hover:border-red-500/60',
  },
  {
    title: 'Memory Match',
    subtitle: 'Find the pairs',
    icon: '🃏',
    route: '/memory',
    color: 'text-pink-400',
    glow: 'hover:shadow-[0_0_25px_rgba(244,114,182,0.3)]',
    border: 'hover:border-pink-500/60',
  },
  {
    title: 'Snake & Ladder',
    subtitle: 'Classic board game',
    icon: '🎲',
    route: '/snake-ladder',
    color: 'text-orange-400',
    glow: 'hover:shadow-[0_0_25px_rgba(251,146,60,0.3)]',
    border: 'hover:border-orange-500/60',
  },
];

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { playClick } = useSoundManager();

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-neon-blue/20 bg-gray-950/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎮</span>
          <div>
            <h1 className="font-orbitron text-white text-lg font-bold tracking-widest">ULTIMATE</h1>
            <p className="font-rajdhani text-neon-blue text-xs tracking-widest">GAMING ARENA</p>
          </div>
        </div>
        <SoundToggle />
      </header>

      {/* Hero */}
      <section className="text-center py-10 px-4">
        <h2 className="font-orbitron text-3xl md:text-4xl font-bold text-white mb-3 tracking-wider">
          Choose Your <span className="text-neon-blue">Game</span>
        </h2>
        <p className="font-rajdhani text-gray-400 text-lg tracking-wide">
          7 games • Difficulty levels • Sound effects
        </p>
      </section>

      {/* Game grid */}
      <main className="flex-1 px-4 pb-8">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {GAMES.map(game => (
            <button
              key={game.route}
              onClick={() => { playClick(); navigate({ to: game.route }); }}
              className={`
                group relative flex flex-col items-start gap-3 p-5 rounded-2xl
                border border-gray-800 bg-gray-900/60 backdrop-blur-sm
                transition-all duration-300 cursor-pointer text-left
                hover:bg-gray-800/80 hover:scale-[1.02] active:scale-[0.98]
                ${game.glow} ${game.border}
              `}
            >
              {game.badge && (
                <span className={`absolute top-3 right-3 font-orbitron text-xs px-2 py-0.5 rounded-full border border-current/40 bg-current/10 ${game.color}`}>
                  {game.badge}
                </span>
              )}
              <span className="text-4xl">{game.icon}</span>
              <div>
                <h3 className={`font-orbitron text-base font-bold tracking-wider ${game.color}`}>
                  {game.title}
                </h3>
                <p className="font-rajdhani text-gray-400 text-sm mt-0.5">{game.subtitle}</p>
              </div>
              <span className={`font-orbitron text-xs tracking-widest opacity-0 group-hover:opacity-100 transition-opacity ${game.color}`}>
                PLAY NOW →
              </span>
            </button>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 border-t border-gray-800">
        <p className="font-rajdhani text-gray-600 text-sm">
          © {new Date().getFullYear()} Built with{' '}
          <span className="text-red-500">♥</span>{' '}
          using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'ultimate-gaming-arena')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neon-blue hover:text-white transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
};

export default Home;

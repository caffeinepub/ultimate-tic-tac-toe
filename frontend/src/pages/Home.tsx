import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Zap, Grid3x3, Worm, Scissors, Brain, Car, Dices, Trophy } from 'lucide-react';

interface GameCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  color: 'blue' | 'purple' | 'green' | 'orange' | 'cyan' | 'pink';
}

interface Category {
  name: string;
  icon: React.ReactNode;
  games: GameCard[];
}

const colorStyles: Record<string, { border: string; glow: string; text: string; btnBg: string; btnHover: string; iconBg: string }> = {
  blue: {
    border: 'oklch(0.72 0.22 200 / 0.4)',
    glow: '0 0 20px oklch(0.72 0.22 200 / 0.4), 0 0 40px oklch(0.72 0.22 200 / 0.2)',
    text: 'oklch(0.85 0.22 200)',
    btnBg: 'oklch(0.72 0.22 200 / 0.15)',
    btnHover: 'oklch(0.72 0.22 200 / 0.25)',
    iconBg: 'oklch(0.72 0.22 200 / 0.1)',
  },
  purple: {
    border: 'oklch(0.65 0.28 295 / 0.4)',
    glow: '0 0 20px oklch(0.65 0.28 295 / 0.4), 0 0 40px oklch(0.65 0.28 295 / 0.2)',
    text: 'oklch(0.8 0.28 295)',
    btnBg: 'oklch(0.65 0.28 295 / 0.15)',
    btnHover: 'oklch(0.65 0.28 295 / 0.25)',
    iconBg: 'oklch(0.65 0.28 295 / 0.1)',
  },
  green: {
    border: 'oklch(0.75 0.22 155 / 0.4)',
    glow: '0 0 20px oklch(0.75 0.22 155 / 0.4), 0 0 40px oklch(0.75 0.22 155 / 0.2)',
    text: 'oklch(0.85 0.22 155)',
    btnBg: 'oklch(0.75 0.22 155 / 0.15)',
    btnHover: 'oklch(0.75 0.22 155 / 0.25)',
    iconBg: 'oklch(0.75 0.22 155 / 0.1)',
  },
  orange: {
    border: 'oklch(0.75 0.2 55 / 0.4)',
    glow: '0 0 20px oklch(0.75 0.2 55 / 0.4), 0 0 40px oklch(0.75 0.2 55 / 0.2)',
    text: 'oklch(0.85 0.2 55)',
    btnBg: 'oklch(0.75 0.2 55 / 0.15)',
    btnHover: 'oklch(0.75 0.2 55 / 0.25)',
    iconBg: 'oklch(0.75 0.2 55 / 0.1)',
  },
  cyan: {
    border: 'oklch(0.78 0.2 185 / 0.4)',
    glow: '0 0 20px oklch(0.78 0.2 185 / 0.4), 0 0 40px oklch(0.78 0.2 185 / 0.2)',
    text: 'oklch(0.88 0.2 185)',
    btnBg: 'oklch(0.78 0.2 185 / 0.15)',
    btnHover: 'oklch(0.78 0.2 185 / 0.25)',
    iconBg: 'oklch(0.78 0.2 185 / 0.1)',
  },
  pink: {
    border: 'oklch(0.7 0.25 340 / 0.4)',
    glow: '0 0 20px oklch(0.7 0.25 340 / 0.4), 0 0 40px oklch(0.7 0.25 340 / 0.2)',
    text: 'oklch(0.82 0.25 340)',
    btnBg: 'oklch(0.7 0.25 340 / 0.15)',
    btnHover: 'oklch(0.7 0.25 340 / 0.25)',
    iconBg: 'oklch(0.7 0.25 340 / 0.1)',
  },
};

const categories: Category[] = [
  {
    name: 'Strategy Games',
    icon: <Grid3x3 size={18} />,
    games: [
      {
        title: 'Tic Tac Toe',
        description: 'Classic X vs O battle. Challenge the AI or play with a friend in this timeless strategy game.',
        icon: <Grid3x3 size={32} />,
        route: '/single-player',
        color: 'blue',
      },
    ],
  },
  {
    name: 'Arcade Games',
    icon: <Car size={18} />,
    games: [
      {
        title: 'Snake Game',
        description: 'Guide your snake to eat food and grow longer. Avoid walls and yourself — how long can you last?',
        icon: <Worm size={32} />,
        route: '/snake',
        color: 'green',
      },
      {
        title: 'Traffic Car',
        description: 'Dodge incoming traffic at high speed! Use arrow keys to swerve and survive as long as possible.',
        icon: <Car size={32} />,
        route: '/traffic',
        color: 'cyan',
      },
    ],
  },
  {
    name: 'Casual Games',
    icon: <Scissors size={18} />,
    games: [
      {
        title: 'Rock Paper Scissors',
        description: 'The ultimate hand game. Test your luck and strategy against the computer in rapid-fire rounds.',
        icon: <Scissors size={32} />,
        route: '/rps',
        color: 'purple',
      },
      {
        title: 'Memory Card Match',
        description: 'Flip cards and find matching pairs. Train your memory and beat your best move count.',
        icon: <Brain size={32} />,
        route: '/memory',
        color: 'orange',
      },
    ],
  },
  {
    name: '2 Player Games',
    icon: <Dices size={18} />,
    games: [
      {
        title: 'Snake & Ladder',
        description: 'Classic board game for 2 players! Roll the dice, climb ladders, and avoid snakes to reach 100.',
        icon: <Dices size={32} />,
        route: '/snake-ladder',
        color: 'pink',
      },
    ],
  },
];

const categoryAccentColors: Record<string, { heading: string; line: string; badge: string }> = {
  'Strategy Games': {
    heading: 'oklch(0.85 0.22 200)',
    line: 'oklch(0.72 0.22 200 / 0.5)',
    badge: 'oklch(0.72 0.22 200 / 0.12)',
  },
  'Arcade Games': {
    heading: 'oklch(0.88 0.2 185)',
    line: 'oklch(0.78 0.2 185 / 0.5)',
    badge: 'oklch(0.78 0.2 185 / 0.12)',
  },
  'Casual Games': {
    heading: 'oklch(0.8 0.28 295)',
    line: 'oklch(0.65 0.28 295 / 0.5)',
    badge: 'oklch(0.65 0.28 295 / 0.12)',
  },
  '2 Player Games': {
    heading: 'oklch(0.82 0.25 340)',
    line: 'oklch(0.7 0.25 340 / 0.5)',
    badge: 'oklch(0.7 0.25 340 / 0.12)',
  },
};

export function Home() {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = React.useState<string | null>(null);

  return (
    <div className="min-h-screen bg-grid-pattern flex flex-col">
      {/* Ambient glow orbs */}
      <div
        className="fixed top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, oklch(0.72 0.22 200 / 0.06) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        className="fixed bottom-1/4 right-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, oklch(0.65 0.28 295 / 0.06) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Header */}
      <header className="w-full py-5 px-4 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <Zap size={20} className="text-neon-blue animate-glow-pulse" />
          <span className="font-orbitron text-xs tracking-widest text-muted-foreground uppercase hidden sm:block">
            Ultimate Gaming Arena
          </span>
          <Zap size={20} className="text-neon-purple animate-glow-pulse" />
        </div>
        <button
          onClick={() => navigate({ to: '/leaderboard' })}
          className="flex items-center gap-2 font-orbitron text-xs tracking-wider px-4 py-2 rounded-xl transition-all duration-300"
          style={{
            background: 'oklch(0.72 0.22 200 / 0.1)',
            border: '1px solid oklch(0.72 0.22 200 / 0.4)',
            color: 'oklch(0.85 0.22 200)',
            boxShadow: '0 0 10px oklch(0.72 0.22 200 / 0.2)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'oklch(0.72 0.22 200 / 0.2)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 20px oklch(0.72 0.22 200 / 0.4)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'oklch(0.72 0.22 200 / 0.1)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 10px oklch(0.72 0.22 200 / 0.2)';
          }}
        >
          <Trophy size={14} />
          <span>LEADERBOARD</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-4 py-6">
        <div className="w-full max-w-5xl flex flex-col items-center gap-10 animate-float-up">
          {/* Title */}
          <div className="text-center">
            <div className="font-orbitron text-xs sm:text-sm tracking-[0.3em] text-muted-foreground uppercase mb-3">
              ⚡ Welcome to ⚡
            </div>
            <h1
              className="font-orbitron font-black text-4xl sm:text-5xl md:text-6xl leading-tight animate-title-glow"
              style={{ color: 'oklch(0.85 0.22 200)' }}
            >
              ULTIMATE
            </h1>
            <h1
              className="font-orbitron font-black text-3xl sm:text-4xl md:text-5xl leading-tight"
              style={{
                color: 'oklch(0.8 0.28 295)',
                textShadow: '0 0 20px oklch(0.65 0.28 295 / 0.8), 0 0 50px oklch(0.65 0.28 295 / 0.4)',
              }}
            >
              GAMING ARENA
            </h1>
          </div>

          {/* Decorative line */}
          <div className="w-full flex items-center gap-3">
            <div
              className="flex-1 h-px"
              style={{ background: 'linear-gradient(to right, transparent, oklch(0.72 0.22 200 / 0.5))' }}
            />
            <div className="w-2 h-2 rounded-full bg-neon-blue animate-pulse" />
            <div
              className="flex-1 h-px"
              style={{ background: 'linear-gradient(to left, transparent, oklch(0.65 0.28 295 / 0.5))' }}
            />
          </div>

          {/* Categories */}
          <div className="w-full flex flex-col gap-10">
            {categories.map((category) => {
              const accent = categoryAccentColors[category.name];
              return (
                <section key={category.name}>
                  {/* Category Heading */}
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-orbitron text-xs tracking-widest uppercase"
                      style={{
                        background: accent.badge,
                        color: accent.heading,
                        border: `1px solid ${accent.line}`,
                      }}
                    >
                      {category.icon}
                      {category.name}
                    </div>
                    <div
                      className="flex-1 h-px"
                      style={{ background: `linear-gradient(to right, ${accent.line}, transparent)` }}
                    />
                  </div>

                  {/* Game Cards Grid */}
                  <div className={`grid gap-5 ${category.games.length === 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
                    {category.games.map((game) => {
                      const styles = colorStyles[game.color];
                      const isHovered = hoveredCard === game.title;
                      return (
                        <div
                          key={game.title}
                          className="rounded-2xl p-6 flex flex-col gap-4 cursor-pointer transition-all duration-300"
                          style={{
                            background: 'oklch(0.12 0.02 265)',
                            border: `1px solid ${isHovered ? styles.border : 'oklch(0.22 0.03 265)'}`,
                            boxShadow: isHovered ? styles.glow : 'none',
                            transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                          }}
                          onMouseEnter={() => setHoveredCard(game.title)}
                          onMouseLeave={() => setHoveredCard(null)}
                        >
                          {/* Icon */}
                          <div
                            className="w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300"
                            style={{
                              background: styles.iconBg,
                              color: styles.text,
                              boxShadow: isHovered ? `0 0 15px ${styles.border}` : 'none',
                            }}
                          >
                            {game.icon}
                          </div>

                          {/* Text */}
                          <div className="flex flex-col gap-1 flex-1">
                            <h2
                              className="font-orbitron font-bold text-lg tracking-wide"
                              style={{ color: styles.text }}
                            >
                              {game.title}
                            </h2>
                            <p className="font-rajdhani text-sm text-muted-foreground leading-relaxed">
                              {game.description}
                            </p>
                          </div>

                          {/* Play Button */}
                          <button
                            onClick={() => navigate({ to: game.route })}
                            className="w-full py-3 px-4 rounded-xl font-orbitron font-bold text-sm tracking-wider transition-all duration-300"
                            style={{
                              background: isHovered ? styles.btnHover : styles.btnBg,
                              border: `1px solid ${styles.border}`,
                              color: styles.text,
                              textShadow: `0 0 8px ${styles.text}80`,
                            }}
                          >
                            ▶ PLAY NOW
                          </button>
                        </div>
                      );
                    })}
                    {/* Spacer for single-game categories on sm+ */}
                    {category.games.length === 1 && (
                      <div className="hidden sm:block" />
                    )}
                  </div>
                </section>
              );
            })}
          </div>

          {/* Tagline */}
          <p className="font-rajdhani text-center text-muted-foreground text-sm tracking-widest uppercase">
            🎮 6 Games · Neon Powered · Score Tracking 🏆
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 px-4 text-center">
        <p className="font-rajdhani text-xs text-muted-foreground/50 tracking-wide">
          Built with{' '}
          <span style={{ color: 'oklch(0.65 0.28 295)' }}>♥</span>{' '}
          using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== 'undefined' ? window.location.hostname : 'ultimate-gaming-arena')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-neon-blue transition-colors duration-200"
            style={{ color: 'oklch(0.72 0.22 200 / 0.7)' }}
          >
            caffeine.ai
          </a>
          {' '}· © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}

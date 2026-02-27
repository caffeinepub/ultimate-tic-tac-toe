import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Trophy, Grid3x3, Worm, Scissors, Brain, Car, Dices } from 'lucide-react';

interface LeaderboardEntry {
  game: string;
  icon: React.ReactNode;
  color: string;
  glow: string;
  scores: { label: string; value: string | number; key: string }[];
}

function loadScore(key: string, defaultVal: number = 0): number {
  const val = parseInt(localStorage.getItem(key) ?? String(defaultVal), 10);
  return isNaN(val) ? defaultVal : val;
}

export function Leaderboard() {
  const navigate = useNavigate();

  // Read all scores from localStorage
  const [entries] = React.useState<LeaderboardEntry[]>(() => [
    {
      game: 'Tic Tac Toe',
      icon: <Grid3x3 size={24} />,
      color: 'oklch(0.85 0.22 200)',
      glow: 'oklch(0.72 0.22 200 / 0.4)',
      scores: [
        { label: 'Player X Wins', value: loadScore('tictactoe-score-x'), key: 'tictactoe-score-x' },
        { label: 'Player O Wins', value: loadScore('tictactoe-score-o'), key: 'tictactoe-score-o' },
      ],
    },
    {
      game: 'Snake Game',
      icon: <Worm size={24} />,
      color: 'oklch(0.85 0.22 155)',
      glow: 'oklch(0.75 0.22 155 / 0.4)',
      scores: [
        { label: 'High Score', value: loadScore('snake-high-score'), key: 'snake-high-score' },
      ],
    },
    {
      game: 'Rock Paper Scissors',
      icon: <Scissors size={24} />,
      color: 'oklch(0.8 0.28 295)',
      glow: 'oklch(0.65 0.28 295 / 0.4)',
      scores: [
        { label: 'Player Wins', value: loadScore('rps-player-wins'), key: 'rps-player-wins' },
        { label: 'CPU Wins', value: loadScore('rps-computer-wins'), key: 'rps-computer-wins' },
      ],
    },
    {
      game: 'Memory Card Match',
      icon: <Brain size={24} />,
      color: 'oklch(0.85 0.2 55)',
      glow: 'oklch(0.75 0.2 55 / 0.4)',
      scores: [
        {
          label: 'Best Moves',
          value: loadScore('memory-best-moves', 0) === 0 ? '—' : loadScore('memory-best-moves'),
          key: 'memory-best-moves',
        },
      ],
    },
    {
      game: 'Traffic Car',
      icon: <Car size={24} />,
      color: 'oklch(0.88 0.2 185)',
      glow: 'oklch(0.78 0.2 185 / 0.4)',
      scores: [
        { label: 'High Score', value: loadScore('trafficCarHighScore'), key: 'trafficCarHighScore' },
      ],
    },
    {
      game: 'Snake & Ladder',
      icon: <Dices size={24} />,
      color: 'oklch(0.82 0.25 340)',
      glow: 'oklch(0.7 0.25 340 / 0.4)',
      scores: [
        { label: 'Games Played', value: loadScore('snakeLadderGamesPlayed'), key: 'snakeLadderGamesPlayed' },
      ],
    },
  ]);

  return (
    <div className="min-h-screen bg-grid-pattern flex flex-col">
      {/* Ambient glow */}
      <div
        className="fixed top-1/4 left-1/3 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, oklch(0.72 0.22 200 / 0.05) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        className="fixed bottom-1/4 right-1/3 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, oklch(0.65 0.28 295 / 0.05) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Header */}
      <header className="w-full py-4 px-4 flex items-center justify-between max-w-2xl mx-auto">
        <button
          onClick={() => navigate({ to: '/' })}
          className="flex items-center gap-2 font-rajdhani text-sm text-muted-foreground hover:text-neon-blue transition-colors duration-200 group"
        >
          <ArrowLeft size={16} className="transition-transform duration-200 group-hover:-translate-x-1" />
          Back to Home
        </button>
        <div className="flex items-center gap-2">
          <Trophy size={16} style={{ color: 'oklch(0.85 0.2 55)' }} />
          <span
            className="font-orbitron font-bold text-sm tracking-widest"
            style={{ color: 'oklch(0.85 0.2 55)' }}
          >
            LEADERBOARD
          </span>
        </div>
        <div className="w-24" />
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-6 gap-6 max-w-2xl mx-auto w-full">
        {/* Title */}
        <div className="text-center animate-float-up">
          <div className="font-orbitron text-xs tracking-[0.3em] text-muted-foreground uppercase mb-2">
            ⚡ All-Time Records ⚡
          </div>
          <h1
            className="font-orbitron font-black text-3xl sm:text-4xl tracking-wider"
            style={{
              color: 'oklch(0.85 0.2 55)',
              textShadow: '0 0 20px oklch(0.75 0.2 55 / 0.8), 0 0 50px oklch(0.75 0.2 55 / 0.4)',
            }}
          >
            GLOBAL LEADERBOARD
          </h1>
        </div>

        {/* Decorative line */}
        <div className="w-full flex items-center gap-3">
          <div
            className="flex-1 h-px"
            style={{ background: 'linear-gradient(to right, transparent, oklch(0.75 0.2 55 / 0.5))' }}
          />
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'oklch(0.85 0.2 55)' }} />
          <div
            className="flex-1 h-px"
            style={{ background: 'linear-gradient(to left, transparent, oklch(0.75 0.2 55 / 0.5))' }}
          />
        </div>

        {/* Leaderboard Cards */}
        <div className="w-full flex flex-col gap-4">
          {entries.map((entry) => (
            <div
              key={entry.game}
              className="rounded-2xl p-5 flex flex-col gap-3 transition-all duration-300"
              style={{
                background: 'oklch(0.12 0.02 265)',
                border: `1px solid ${entry.glow}`,
                boxShadow: `0 0 15px ${entry.glow}`,
              }}
            >
              {/* Game header */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: `${entry.glow}`,
                    color: entry.color,
                  }}
                >
                  {entry.icon}
                </div>
                <h2
                  className="font-orbitron font-bold text-base tracking-wider"
                  style={{ color: entry.color }}
                >
                  {entry.game}
                </h2>
              </div>

              {/* Scores */}
              <div className="flex gap-3 flex-wrap">
                {entry.scores.map((score) => (
                  <div
                    key={score.key}
                    className="flex-1 min-w-[100px] rounded-xl py-3 px-4 text-center"
                    style={{
                      background: 'oklch(0.1 0.015 265)',
                      border: `1px solid ${entry.glow}`,
                    }}
                  >
                    <div className="font-rajdhani text-xs text-muted-foreground tracking-widest uppercase mb-1">
                      {score.label}
                    </div>
                    <div
                      className="font-orbitron font-black text-2xl"
                      style={{
                        color: entry.color,
                        textShadow: `0 0 10px ${entry.glow}`,
                      }}
                    >
                      {score.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Note */}
        <p className="font-rajdhani text-xs text-muted-foreground text-center tracking-wide">
          Scores are saved locally on this device. Play games to set new records!
        </p>
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

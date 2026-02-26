import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Bot, Users, Zap } from 'lucide-react';

export function Home() {
  const navigate = useNavigate();

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
      <header className="w-full py-6 px-4 flex justify-center">
        <div className="flex items-center gap-2">
          <Zap size={20} className="text-neon-blue animate-glow-pulse" />
          <span className="font-orbitron text-xs tracking-widest text-muted-foreground uppercase">
            Ultimate Gaming
          </span>
          <Zap size={20} className="text-neon-purple animate-glow-pulse" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md flex flex-col items-center gap-8 animate-float-up">
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
              className="font-orbitron font-black text-4xl sm:text-5xl md:text-6xl leading-tight"
              style={{
                color: 'oklch(0.8 0.28 295)',
                textShadow: '0 0 20px oklch(0.65 0.28 295 / 0.8), 0 0 50px oklch(0.65 0.28 295 / 0.4)',
              }}
            >
              TIC TAC TOE
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

          {/* Mode Selection */}
          <div className="w-full flex flex-col gap-4">
            <p className="font-rajdhani text-center text-muted-foreground text-sm tracking-widest uppercase">
              Choose Your Mode
            </p>

            {/* Single Player Button */}
            <button
              onClick={() => navigate({ to: '/single-player' })}
              className="neon-btn-blue w-full py-5 px-6 rounded-xl font-orbitron font-bold text-base sm:text-lg tracking-wider group"
            >
              <div className="flex items-center justify-center gap-3">
                <Bot
                  size={24}
                  className="transition-transform duration-300 group-hover:scale-110"
                />
                <div className="flex flex-col items-start">
                  <span>Single Player</span>
                  <span className="font-rajdhani text-xs font-normal tracking-widest opacity-70">
                    Play vs Computer
                  </span>
                </div>
              </div>
            </button>

            {/* Two Player Button */}
            <button
              onClick={() => navigate({ to: '/two-player' })}
              className="neon-btn-purple w-full py-5 px-6 rounded-xl font-orbitron font-bold text-base sm:text-lg tracking-wider group"
            >
              <div className="flex items-center justify-center gap-3">
                <Users
                  size={24}
                  className="transition-transform duration-300 group-hover:scale-110"
                />
                <div className="flex flex-col items-start">
                  <span>Two Player</span>
                  <span className="font-rajdhani text-xs font-normal tracking-widest opacity-70">
                    Play with Friend
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Instructions */}
          <div
            className="w-full rounded-xl p-4 border"
            style={{
              background: 'oklch(0.12 0.02 265)',
              borderColor: 'oklch(0.25 0.04 265)',
            }}
          >
            <p className="font-orbitron text-xs text-center text-muted-foreground tracking-widest uppercase mb-3">
              How to Play
            </p>
            <ul className="font-rajdhani text-sm text-muted-foreground space-y-1 text-center">
              <li>🎯 Get 3 in a row to win</li>
              <li>↔️ Rows, columns, or diagonals count</li>
              <li>🤖 Computer plays as O in Single Player</li>
              <li>🔄 Use Restart to play again</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 px-4 text-center">
        <p className="font-rajdhani text-xs text-muted-foreground/50 tracking-wide">
          Built with{' '}
          <span style={{ color: 'oklch(0.65 0.28 295)' }}>♥</span>{' '}
          using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== 'undefined' ? window.location.hostname : 'ultimate-tic-tac-toe')}`}
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

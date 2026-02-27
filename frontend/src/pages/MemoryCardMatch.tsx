import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, RotateCcw } from 'lucide-react';

const CARD_EMOJIS = ['🎮', '🕹️', '👾', '🚀', '⚡', '🔥', '💎', '🏆'];
const ALL_CARDS = [...CARD_EMOJIS, ...CARD_EMOJIS];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function loadBestMoves(): number {
  const val = parseInt(localStorage.getItem('memory-best-moves') ?? '0', 10);
  return isNaN(val) ? 0 : val;
}

export function MemoryCardMatch() {
  const navigate = useNavigate();

  const [cards, setCards] = useState<string[]>(() => shuffle(ALL_CARDS));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [bestMoves, setBestMoves] = useState(loadBestMoves);
  const [isChecking, setIsChecking] = useState(false);
  const [won, setWon] = useState(false);

  const handleCardClick = useCallback(
    (index: number) => {
      if (isChecking || flipped.includes(index) || matched.includes(index)) return;
      if (flipped.length === 2) return;

      const newFlipped = [...flipped, index];
      setFlipped(newFlipped);

      if (newFlipped.length === 2) {
        setMoves((m) => m + 1);
        setIsChecking(true);

        const [a, b] = newFlipped;
        if (cards[a] === cards[b]) {
          const newMatched = [...matched, a, b];
          setMatched(newMatched);
          setFlipped([]);
          setIsChecking(false);

          if (newMatched.length === ALL_CARDS.length) {
            setWon(true);
            const finalMoves = moves + 1;
            setBestMoves((prev) => {
              if (prev === 0 || finalMoves < prev) {
                localStorage.setItem('memory-best-moves', String(finalMoves));
                return finalMoves;
              }
              return prev;
            });
          }
        } else {
          setTimeout(() => {
            setFlipped([]);
            setIsChecking(false);
          }, 900);
        }
      }
    },
    [isChecking, flipped, matched, cards, moves]
  );

  const handleRestart = () => {
    setCards(shuffle(ALL_CARDS));
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setIsChecking(false);
    setWon(false);
  };

  return (
    <div className="min-h-screen bg-grid-pattern flex flex-col">
      <div
        className="fixed top-1/4 right-1/3 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, oklch(0.75 0.2 55 / 0.06) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Header */}
      <header className="w-full py-4 px-4 flex items-center justify-between max-w-lg mx-auto">
        <button
          onClick={() => navigate({ to: '/' })}
          className="flex items-center gap-2 font-rajdhani text-sm text-muted-foreground hover:text-neon-blue transition-colors duration-200 group"
        >
          <ArrowLeft size={16} className="transition-transform duration-200 group-hover:-translate-x-1" />
          Back to Home
        </button>
        <span
          className="font-orbitron font-bold text-sm tracking-widest"
          style={{ color: 'oklch(0.85 0.2 55)' }}
        >
          MEMORY MATCH
        </span>
        <div className="w-24" />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-4 gap-5">
        {/* Stats */}
        <div className="flex gap-6">
          <div
            className="px-5 py-2 rounded-xl text-center"
            style={{ background: 'oklch(0.12 0.02 265)', border: '1px solid oklch(0.75 0.2 55 / 0.3)' }}
          >
            <div className="font-rajdhani text-xs text-muted-foreground tracking-widest uppercase">Moves</div>
            <div
              className="font-orbitron font-black text-2xl"
              style={{ color: 'oklch(0.85 0.2 55)', textShadow: '0 0 10px oklch(0.75 0.2 55 / 0.8)' }}
            >
              {moves}
            </div>
          </div>
          <div
            className="px-5 py-2 rounded-xl text-center"
            style={{ background: 'oklch(0.12 0.02 265)', border: '1px solid oklch(0.72 0.22 200 / 0.3)' }}
          >
            <div className="font-rajdhani text-xs text-muted-foreground tracking-widest uppercase">Best</div>
            <div
              className="font-orbitron font-black text-2xl"
              style={{ color: 'oklch(0.85 0.22 200)', textShadow: '0 0 10px oklch(0.72 0.22 200 / 0.8)' }}
            >
              {bestMoves === 0 ? '—' : bestMoves}
            </div>
          </div>
        </div>

        {/* Win message */}
        {won && (
          <div
            className="px-6 py-3 rounded-xl text-center font-orbitron font-bold text-lg tracking-wider"
            style={{
              background: 'oklch(0.12 0.02 265)',
              border: '2px solid oklch(0.75 0.2 55 / 0.8)',
              color: 'oklch(0.85 0.2 55)',
              boxShadow: '0 0 20px oklch(0.75 0.2 55 / 0.4)',
            }}
          >
            🏆 YOU WIN! {moves} moves
          </div>
        )}

        {/* Card Grid */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {cards.map((emoji, index) => {
            const isFlipped = flipped.includes(index) || matched.includes(index);
            const isMatched = matched.includes(index);
            return (
              <button
                key={index}
                onClick={() => handleCardClick(index)}
                className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl flex items-center justify-center text-2xl transition-all duration-300 select-none"
                style={{
                  background: isMatched
                    ? 'oklch(0.15 0.06 55)'
                    : isFlipped
                    ? 'oklch(0.16 0.04 265)'
                    : 'oklch(0.12 0.02 265)',
                  border: isMatched
                    ? '2px solid oklch(0.75 0.2 55 / 0.8)'
                    : isFlipped
                    ? '2px solid oklch(0.72 0.22 200 / 0.6)'
                    : '2px solid oklch(0.22 0.03 265)',
                  boxShadow: isMatched
                    ? '0 0 15px oklch(0.75 0.2 55 / 0.4)'
                    : isFlipped
                    ? '0 0 10px oklch(0.72 0.22 200 / 0.3)'
                    : 'none',
                  transform: isFlipped ? 'rotateY(0deg)' : 'rotateY(0deg)',
                  cursor: isMatched || isFlipped ? 'default' : 'pointer',
                }}
              >
                {isFlipped ? emoji : '?'}
              </button>
            );
          })}
        </div>

        {/* Restart */}
        <button
          onClick={handleRestart}
          className="flex items-center gap-2 font-orbitron font-bold text-sm tracking-wider px-6 py-3 rounded-xl transition-all duration-300"
          style={{
            background: 'oklch(0.75 0.2 55 / 0.1)',
            border: '2px solid oklch(0.75 0.2 55 / 0.4)',
            color: 'oklch(0.85 0.2 55)',
          }}
        >
          <RotateCcw size={16} />
          NEW GAME
        </button>
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

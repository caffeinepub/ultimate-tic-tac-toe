import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import SoundToggle from '../components/SoundToggle';
import { useSoundManager } from '../hooks/useSoundManager';
import { awardXP, incrementGamesPlayed, incrementWins } from '../utils/playerProfile';

const EMOJIS = ['🎮', '🕹️', '👾', '🎯', '🏆', '⚡', '🔥', '💎'];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

function createDeck(): Card[] {
  const pairs = [...EMOJIS, ...EMOJIS];
  return shuffle(pairs).map((emoji, i) => ({
    id: i,
    emoji,
    flipped: false,
    matched: false,
  }));
}

function getBestScore(): number {
  try {
    return parseInt(localStorage.getItem('memory-best') || '0', 10);
  } catch {
    return 0;
  }
}

function saveBestScore(moves: number): boolean {
  try {
    const prev = getBestScore();
    if (prev === 0 || moves < prev) {
      localStorage.setItem('memory-best', String(moves));
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

const MemoryCardMatch: React.FC = () => {
  const navigate = useNavigate();
  const [cards, setCards] = useState<Card[]>(createDeck);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [bestScore, setBestScore] = useState(getBestScore);
  const [isNewBest, setIsNewBest] = useState(false);

  // Track flipped (non-matched) card ids
  const flippedRef = useRef<number[]>([]);
  // Lock to prevent clicking during mismatch delay
  const lockRef = useRef(false);

  const { playClick, playScore, playWin, playSpecial } = useSoundManager();

  const handleCardClick = useCallback((id: number) => {
    if (lockRef.current) return;

    setCards((prev) => {
      const card = prev.find((c) => c.id === id);
      // Ignore if already flipped or matched
      if (!card || card.flipped || card.matched) return prev;
      // Ignore if already 2 cards are flipped
      if (flippedRef.current.length >= 2) return prev;
      // Ignore if same card clicked twice
      if (flippedRef.current.includes(id)) return prev;

      playClick();

      const newFlipped = [...flippedRef.current, id];
      flippedRef.current = newFlipped;

      const updated = prev.map((c) => (c.id === id ? { ...c, flipped: true } : c));

      if (newFlipped.length === 2) {
        lockRef.current = true;
        const [idA, idB] = newFlipped;
        const cardA = updated.find((c) => c.id === idA)!;
        const cardB = updated.find((c) => c.id === idB)!;

        setMoves((m) => {
          const newMoves = m + 1;

          if (cardA.emoji === cardB.emoji) {
            // Match!
            playScore();
            setTimeout(() => {
              setCards((current) => {
                const withMatch = current.map((c) =>
                  c.id === idA || c.id === idB ? { ...c, matched: true, flipped: true } : c
                );
                const allDone = withMatch.every((c) => c.matched);
                if (allDone) {
                  setWon(true);
                  playWin();
                  awardXP(20);
                  incrementWins();
                  incrementGamesPlayed();
                  const isNew = saveBestScore(newMoves);
                  if (isNew) {
                    setBestScore(newMoves);
                    setIsNewBest(true);
                    playSpecial();
                  }
                }
                return withMatch;
              });
              flippedRef.current = [];
              lockRef.current = false;
            }, 400);
          } else {
            // Mismatch — flip back after delay
            setTimeout(() => {
              setCards((current) =>
                current.map((c) =>
                  c.id === idA || c.id === idB ? { ...c, flipped: false } : c
                )
              );
              flippedRef.current = [];
              lockRef.current = false;
            }, 900);
          }

          return newMoves;
        });
      }

      return updated;
    });
  }, [playClick, playScore, playWin, playSpecial]);

  const handleRestart = useCallback(() => {
    playClick();
    flippedRef.current = [];
    lockRef.current = false;
    setCards(createDeck());
    setMoves(0);
    setWon(false);
    setIsNewBest(false);
  }, [playClick]);

  const matchedCount = cards.filter((c) => c.matched).length / 2;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-neon-blue/20 bg-gray-950/80 backdrop-blur-sm">
        <button
          onClick={() => { playClick(); navigate({ to: '/' }); }}
          className="font-orbitron text-neon-blue hover:text-white transition-colors text-sm tracking-wider"
        >
          ← ARENA
        </button>
        <h1 className="font-orbitron text-white text-sm tracking-widest">MEMORY MATCH</h1>
        <SoundToggle />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-5 p-4">
        {/* Stats row */}
        <div className="flex gap-10">
          <div className="text-center">
            <div className="font-orbitron text-neon-blue text-2xl font-bold">{moves}</div>
            <div className="font-rajdhani text-gray-500 text-xs tracking-wider">MOVES</div>
          </div>
          <div className="text-center">
            <div className="font-orbitron text-yellow-400 text-2xl font-bold">{matchedCount} / 8</div>
            <div className="font-rajdhani text-gray-500 text-xs tracking-wider">PAIRS</div>
          </div>
          <div className="text-center">
            <div className="font-orbitron text-neon-purple text-2xl font-bold">
              {bestScore || '—'}
            </div>
            <div className="font-rajdhani text-gray-500 text-xs tracking-wider">BEST</div>
          </div>
        </div>

        {/* Win banner */}
        {won && (
          <div className="font-orbitron text-center py-3 px-6 rounded-xl border bg-green-500/10 border-green-500/40 shadow-[0_0_20px_rgba(74,222,128,0.3)]">
            <div className="text-green-400 text-xl font-bold">🏆 YOU WIN!</div>
            <div className="text-green-300 text-sm mt-1">
              Completed in {moves} moves
              {isNewBest && <span className="ml-2 text-yellow-400">✨ New Best!</span>}
            </div>
          </div>
        )}

        {/* Card grid */}
        <div className="grid grid-cols-4 gap-3">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              disabled={card.matched || won}
              className={[
                'w-16 h-16 rounded-xl border text-2xl font-bold',
                'transition-all duration-300 cursor-pointer',
                'flex items-center justify-center select-none',
                card.matched
                  ? 'bg-green-900/30 border-green-500/60 shadow-[0_0_12px_rgba(74,222,128,0.25)] scale-95 cursor-default'
                  : card.flipped
                  ? 'bg-gray-800 border-neon-blue/70 shadow-[0_0_12px_rgba(0,212,255,0.25)] scale-105'
                  : 'bg-gray-900 border-gray-700 hover:border-gray-500 hover:bg-gray-800 hover:scale-105',
              ].join(' ')}
            >
              <span
                className={`transition-all duration-200 ${
                  card.flipped || card.matched ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                }`}
              >
                {card.flipped || card.matched ? card.emoji : ''}
              </span>
              {!card.flipped && !card.matched && (
                <span className="text-gray-600 text-xl font-bold">?</span>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={handleRestart}
          className="font-orbitron text-sm px-6 py-2 rounded-lg border border-neon-blue/60 bg-neon-blue/10 text-neon-blue hover:bg-neon-blue/20 transition-all tracking-wider shadow-[0_0_8px_rgba(0,212,255,0.15)]"
        >
          {won ? 'PLAY AGAIN' : 'RESTART'}
        </button>

        <p className="font-rajdhani text-gray-600 text-xs tracking-wider text-center">
          Find all 8 matching pairs · Fewest moves wins
        </p>
      </main>
    </div>
  );
};

export default MemoryCardMatch;

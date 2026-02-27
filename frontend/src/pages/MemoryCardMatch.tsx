import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import SoundToggle from '../components/SoundToggle';
import { useSoundManager } from '../hooks/useSoundManager';

const EMOJIS = ['🎮', '🕹️', '👾', '🎯', '🏆', '⚡', '🔥', '💎'];
const CARDS = [...EMOJIS, ...EMOJIS];

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

const MemoryCardMatch: React.FC = () => {
  const navigate = useNavigate();
  const [cards, setCards] = useState<Card[]>(() =>
    shuffle(CARDS).map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }))
  );
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [bestScore, setBestScore] = useState(() => {
    try { return parseInt(localStorage.getItem('memory-best') || '0', 10); } catch { return 0; }
  });
  const lockRef = useRef(false);
  const { playClick, playScore, playWin, playSpecial } = useSoundManager();

  const handleCardClick = useCallback((id: number) => {
    if (lockRef.current) return;
    const card = cards.find(c => c.id === id);
    if (!card || card.flipped || card.matched) return;
    if (selected.includes(id)) return;

    playClick();

    const newSelected = [...selected, id];
    setCards(prev => prev.map(c => c.id === id ? { ...c, flipped: true } : c));
    setSelected(newSelected);

    if (newSelected.length === 2) {
      lockRef.current = true;
      setMoves(m => m + 1);
      const [a, b] = newSelected;
      const cardA = cards.find(c => c.id === a)!;
      const cardB = cards.find(c => c.id === b)!;

      if (cardA.emoji === cardB.emoji) {
        // Match
        playScore();
        setTimeout(() => {
          setCards(prev => {
            const updated = prev.map(c =>
              c.id === a || c.id === b ? { ...c, matched: true } : c
            );
            const allMatched = updated.every(c => c.matched);
            if (allMatched) {
              setWon(true);
              playWin();
              const totalMoves = moves + 1;
              const bs = parseInt(localStorage.getItem('memory-best') || '0', 10);
              if (bs === 0 || totalMoves < bs) {
                localStorage.setItem('memory-best', String(totalMoves));
                setBestScore(totalMoves);
                playSpecial();
              }
            }
            return updated;
          });
          setSelected([]);
          lockRef.current = false;
        }, 500);
      } else {
        // Mismatch
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === a || c.id === b ? { ...c, flipped: false } : c
          ));
          setSelected([]);
          lockRef.current = false;
        }, 900);
      }
    }
  }, [cards, selected, moves, playClick, playScore, playWin, playSpecial]);

  const handleRestart = useCallback(() => {
    playClick();
    setCards(shuffle(CARDS).map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false })));
    setSelected([]);
    setMoves(0);
    setWon(false);
    lockRef.current = false;
  }, [playClick]);

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

      <main className="flex-1 flex flex-col items-center justify-center gap-6 p-4">
        {/* Stats */}
        <div className="flex gap-8">
          <div className="text-center">
            <div className="font-orbitron text-neon-blue text-2xl font-bold">{moves}</div>
            <div className="font-rajdhani text-gray-500 text-xs tracking-wider">MOVES</div>
          </div>
          <div className="text-center">
            <div className="font-orbitron text-neon-purple text-2xl font-bold">{bestScore || '—'}</div>
            <div className="font-rajdhani text-gray-500 text-xs tracking-wider">BEST</div>
          </div>
        </div>

        {/* Win banner */}
        {won && (
          <div className="font-orbitron text-green-400 text-xl font-bold text-center py-3 px-6 rounded-xl border border-green-500/40 bg-green-500/10 shadow-[0_0_20px_rgba(74,222,128,0.3)]">
            🏆 YOU WIN! {moves} moves
          </div>
        )}

        {/* Card grid */}
        <div className="grid grid-cols-4 gap-3">
          {cards.map(card => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`
                w-16 h-16 rounded-xl border text-2xl font-bold
                transition-all duration-300 cursor-pointer
                flex items-center justify-center
                ${card.flipped || card.matched
                  ? 'bg-gray-800 border-neon-blue/60 shadow-[0_0_10px_rgba(0,212,255,0.2)] scale-105'
                  : 'bg-gray-900 border-gray-700 hover:border-gray-500 hover:bg-gray-800'
                }
                ${card.matched ? 'border-green-500/60 bg-green-900/20 shadow-[0_0_10px_rgba(74,222,128,0.2)]' : ''}
              `}
            >
              {card.flipped || card.matched ? card.emoji : '?'}
            </button>
          ))}
        </div>

        <button
          onClick={handleRestart}
          className="font-orbitron text-sm px-6 py-2 rounded-lg border border-neon-blue/60 bg-neon-blue/10 text-neon-blue hover:bg-neon-blue/20 transition-all tracking-wider"
        >
          RESTART
        </button>
      </main>
    </div>
  );
};

export default MemoryCardMatch;

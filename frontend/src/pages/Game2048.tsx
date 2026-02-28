import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import SoundToggle from '../components/SoundToggle';
import { useSoundManager } from '../hooks/useSoundManager';

type Board = (number | null)[][];

function emptyBoard(): Board {
  return Array.from({ length: 4 }, () => Array(4).fill(null));
}

function addRandomTile(board: Board): Board {
  const empty: [number, number][] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!board[r][c]) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return board;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const newBoard = board.map(row => [...row]);
  newBoard[r][c] = Math.random() < 0.9 ? 2 : 4;
  return newBoard;
}

function initBoard(): Board {
  let b = emptyBoard();
  b = addRandomTile(b);
  b = addRandomTile(b);
  return b;
}

function slideRow(row: (number | null)[]): { row: (number | null)[]; score: number } {
  const filtered = row.filter(v => v !== null) as number[];
  let score = 0;
  const merged: number[] = [];
  let i = 0;
  while (i < filtered.length) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      const val = filtered[i] * 2;
      merged.push(val);
      score += val;
      i += 2;
    } else {
      merged.push(filtered[i]);
      i++;
    }
  }
  while (merged.length < 4) merged.push(0);
  return { row: merged.map(v => v || null), score };
}

function moveLeft(board: Board): { board: Board; score: number; moved: boolean } {
  let totalScore = 0;
  let moved = false;
  const newBoard = board.map(row => {
    const { row: newRow, score } = slideRow(row);
    totalScore += score;
    if (JSON.stringify(row) !== JSON.stringify(newRow)) moved = true;
    return newRow;
  });
  return { board: newBoard, score: totalScore, moved };
}

function rotateRight(board: Board): Board {
  return board[0].map((_, c) => board.map(row => row[c]).reverse());
}

function rotateLeft(board: Board): Board {
  return board[0].map((_, c) => board.map(row => row[row.length - 1 - c]));
}

function move(board: Board, dir: 'left' | 'right' | 'up' | 'down'): { board: Board; score: number; moved: boolean } {
  let b = board;
  if (dir === 'right') b = rotateRight(rotateRight(b));
  if (dir === 'up') b = rotateLeft(b);
  if (dir === 'down') b = rotateRight(b);
  const result = moveLeft(b);
  let nb = result.board;
  if (dir === 'right') nb = rotateRight(rotateRight(nb));
  if (dir === 'up') nb = rotateRight(nb);
  if (dir === 'down') nb = rotateLeft(nb);
  return { board: nb, score: result.score, moved: result.moved };
}

function hasValidMoves(board: Board): boolean {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!board[r][c]) return true;
      if (c < 3 && board[r][c] === board[r][c + 1]) return true;
      if (r < 3 && board[r][c] === board[r + 1][c]) return true;
    }
  }
  return false;
}

const TILE_COLORS: Record<number, { bg: string; text: string; shadow: string }> = {
  2:    { bg: '#0d2233', text: '#00d4ff', shadow: '0 0 8px rgba(0,212,255,0.4)' },
  4:    { bg: '#0d1a33', text: '#4488ff', shadow: '0 0 8px rgba(68,136,255,0.4)' },
  8:    { bg: '#1a0d33', text: '#aa44ff', shadow: '0 0 10px rgba(170,68,255,0.5)' },
  16:   { bg: '#2a0d33', text: '#ff44ff', shadow: '0 0 10px rgba(255,68,255,0.5)' },
  32:   { bg: '#330d1a', text: '#ff4488', shadow: '0 0 12px rgba(255,68,136,0.5)' },
  64:   { bg: '#331a0d', text: '#ff8844', shadow: '0 0 12px rgba(255,136,68,0.5)' },
  128:  { bg: '#33280d', text: '#ffcc00', shadow: '0 0 14px rgba(255,204,0,0.6)' },
  256:  { bg: '#1a330d', text: '#88ff44', shadow: '0 0 14px rgba(136,255,68,0.6)' },
  512:  { bg: '#0d3322', text: '#00ff88', shadow: '0 0 16px rgba(0,255,136,0.6)' },
  1024: { bg: '#0d3333', text: '#00ffff', shadow: '0 0 18px rgba(0,255,255,0.7)' },
  2048: { bg: '#33330d', text: '#ffff00', shadow: '0 0 22px rgba(255,255,0,0.8)' },
};

const Game2048: React.FC = () => {
  const navigate = useNavigate();
  const [board, setBoard] = useState<Board>(initBoard);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    try { return parseInt(localStorage.getItem('2048-best') || '0', 10); } catch { return 0; }
  });
  const [gameOver, setGameOver] = useState(false);
  const { playScore, playGameOver, playClick } = useSoundManager();

  const handleMove = useCallback((dir: 'left' | 'right' | 'up' | 'down') => {
    if (gameOver) return;
    setBoard(prev => {
      const result = move(prev, dir);
      if (!result.moved) return prev;
      const newBoard = addRandomTile(result.board);
      if (result.score > 0) {
        setScore(s => {
          const ns = s + result.score;
          setBestScore(b => {
            const nb = Math.max(b, ns);
            try { localStorage.setItem('2048-best', String(nb)); } catch {}
            return nb;
          });
          return ns;
        });
        playScore();
      }
      if (!hasValidMoves(newBoard)) {
        setGameOver(true);
        playGameOver();
      }
      return newBoard;
    });
  }, [gameOver, playScore, playGameOver]);

  const restart = useCallback(() => {
    playClick();
    setBoard(initBoard());
    setScore(0);
    setGameOver(false);
  }, [playClick]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':  e.preventDefault(); handleMove('left'); break;
        case 'ArrowRight': e.preventDefault(); handleMove('right'); break;
        case 'ArrowUp':    e.preventDefault(); handleMove('up'); break;
        case 'ArrowDown':  e.preventDefault(); handleMove('down'); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleMove]);

  // Touch swipe support
  const touchStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    if (Math.abs(dx) > Math.abs(dy)) {
      handleMove(dx > 0 ? 'right' : 'left');
    } else {
      handleMove(dy > 0 ? 'down' : 'up');
    }
    touchStartRef.current = null;
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-neon-blue/20 bg-gray-950/80 backdrop-blur-sm">
        <button
          onClick={() => { playClick(); navigate({ to: '/' }); }}
          className="font-orbitron text-neon-blue hover:text-white transition-colors text-sm tracking-wider"
        >
          ← ARENA
        </button>
        <h1 className="font-orbitron text-white text-sm tracking-widest">2048</h1>
        <SoundToggle />
      </header>

      <div className="flex items-center justify-center gap-8 py-3 border-b border-gray-800">
        <div className="text-center">
          <div className="font-orbitron text-neon-blue text-xl font-bold">{score}</div>
          <div className="font-rajdhani text-gray-500 text-xs tracking-wider">SCORE</div>
        </div>
        <div className="text-center">
          <div className="font-orbitron text-yellow-400 text-xl font-bold">{bestScore}</div>
          <div className="font-rajdhani text-gray-500 text-xs tracking-wider">BEST</div>
        </div>
        <button
          onClick={restart}
          className="font-orbitron text-xs px-3 py-1.5 rounded-lg border border-neon-blue/50 bg-neon-blue/10 text-neon-blue hover:bg-neon-blue/20 transition-all tracking-wider"
        >
          NEW GAME
        </button>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
        {gameOver && (
          <div className="font-orbitron text-red-400 text-lg font-bold tracking-wider animate-pulse">
            GAME OVER — No more moves!
          </div>
        )}

        <div
          className="p-3 rounded-2xl border border-neon-blue/20 bg-gray-900/80 shadow-[0_0_30px_rgba(0,212,255,0.1)]"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {board.map((row, r) =>
              row.map((val, c) => {
                const colors = val ? TILE_COLORS[val] || { bg: '#1a0033', text: '#ff00ff', shadow: '0 0 20px rgba(255,0,255,0.8)' } : null;
                return (
                  <div
                    key={`${r}-${c}`}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center font-orbitron font-bold transition-all duration-100"
                    style={{
                      backgroundColor: colors ? colors.bg : '#111827',
                      color: colors ? colors.text : 'transparent',
                      boxShadow: colors ? colors.shadow : 'none',
                      fontSize: val && val >= 1000 ? '0.75rem' : val && val >= 100 ? '0.9rem' : '1.1rem',
                      border: colors ? `1px solid ${colors.text}33` : '1px solid #1f2937',
                    }}
                  >
                    {val || ''}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-2">
          {gameOver && (
            <button
              onClick={restart}
              className="font-orbitron text-sm px-5 py-2 rounded-lg border border-neon-blue/60 bg-neon-blue/10 text-neon-blue hover:bg-neon-blue/20 transition-all tracking-wider shadow-[0_0_10px_rgba(0,212,255,0.2)]"
            >
              RESTART
            </button>
          )}
        </div>

        <p className="font-rajdhani text-gray-600 text-xs tracking-wider text-center">
          Arrow keys to slide • Swipe on mobile • Merge tiles to reach 2048!
        </p>
      </main>
    </div>
  );
};

export default Game2048;

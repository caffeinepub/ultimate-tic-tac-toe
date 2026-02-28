import React, { useState, useCallback } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import SoundToggle from '../components/SoundToggle';
import { useSoundManager } from '../hooks/useSoundManager';
import { awardXP, incrementGamesPlayed, incrementWins } from '../utils/playerProfile';

const ROWS = 6;
const COLS = 7;

type Cell = null | 1 | 2;
type Board = Cell[][];

function createBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function checkWinner(board: Board): Cell {
  // Horizontal
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const v = board[r][c];
      if (v && v === board[r][c+1] && v === board[r][c+2] && v === board[r][c+3]) return v;
    }
  }
  // Vertical
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c < COLS; c++) {
      const v = board[r][c];
      if (v && v === board[r+1][c] && v === board[r+2][c] && v === board[r+3][c]) return v;
    }
  }
  // Diagonal ↘
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      const v = board[r][c];
      if (v && v === board[r+1][c+1] && v === board[r+2][c+2] && v === board[r+3][c+3]) return v;
    }
  }
  // Diagonal ↙
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 3; c < COLS; c++) {
      const v = board[r][c];
      if (v && v === board[r+1][c-1] && v === board[r+2][c-2] && v === board[r+3][c-3]) return v;
    }
  }
  return null;
}

function isDraw(board: Board): boolean {
  return board[0].every((c) => c !== null);
}

export default function Connect4Game() {
  const [board, setBoard] = useState<Board>(createBoard());
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [winner, setWinner] = useState<Cell>(null);
  const [draw, setDraw] = useState(false);
  const [hoverCol, setHoverCol] = useState<number | null>(null);
  const [scores, setScores] = useState({ p1: 0, p2: 0 });
  const [gameResultHandled, setGameResultHandled] = useState(false);
  const { playClick, playWin, playGameOver } = useSoundManager();

  const handleDrop = useCallback((col: number) => {
    if (winner || draw) return;

    // Find lowest empty row
    let row = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (!board[r][col]) { row = r; break; }
    }
    if (row === -1) return;

    playClick();
    const newBoard = board.map((r) => [...r]);
    newBoard[row][col] = currentPlayer;

    const w = checkWinner(newBoard);
    const d = !w && isDraw(newBoard);

    setBoard(newBoard);

    if (w) {
      setWinner(w);
      if (!gameResultHandled) {
        playWin();
        setScores((s) => ({ ...s, [w === 1 ? 'p1' : 'p2']: s[w === 1 ? 'p1' : 'p2'] + 1 }));
        awardXP(20);
        incrementWins();
        incrementGamesPlayed();
        setGameResultHandled(true);
      }
    } else if (d) {
      setDraw(true);
      if (!gameResultHandled) {
        playGameOver();
        awardXP(5);
        incrementGamesPlayed();
        setGameResultHandled(true);
      }
    } else {
      setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
    }
  }, [board, currentPlayer, winner, draw, gameResultHandled, playClick, playWin, playGameOver]);

  const handleReset = () => {
    setBoard(createBoard());
    setCurrentPlayer(1);
    setWinner(null);
    setDraw(false);
    setGameResultHandled(false);
  };

  const P1_COLOR = '#00d4ff';
  const P2_COLOR = '#a855f7';

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-rajdhani text-sm text-gray-400 hover:text-neon-blue transition-colors">
            <ArrowLeft size={16} />Back
          </Link>
          <h1 className="font-orbitron text-xl font-bold text-neon-blue" style={{ textShadow: '0 0 15px rgba(0,212,255,0.7)' }}>CONNECT 4</h1>
          <SoundToggle />
        </div>

        {/* Scores */}
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div className="score-card text-center py-3" style={{ borderColor: winner === 1 ? P1_COLOR : undefined }}>
            <div className="font-orbitron text-2xl font-bold" style={{ color: P1_COLOR }}>{scores.p1}</div>
            <div className="font-rajdhani text-xs uppercase tracking-widest text-gray-400">Player 1</div>
          </div>
          <div className="score-card text-center py-3" style={{ borderColor: winner === 2 ? P2_COLOR : undefined }}>
            <div className="font-orbitron text-2xl font-bold" style={{ color: P2_COLOR }}>{scores.p2}</div>
            <div className="font-rajdhani text-xs uppercase tracking-widest text-gray-400">Player 2</div>
          </div>
        </div>

        {/* Status */}
        <div className="mb-4 text-center font-orbitron text-sm font-bold">
          {winner ? (
            <span style={{ color: winner === 1 ? P1_COLOR : P2_COLOR, textShadow: `0 0 15px ${winner === 1 ? P1_COLOR : P2_COLOR}` }}>
              Player {winner} Wins! 🏆
            </span>
          ) : draw ? (
            <span className="text-yellow-400" style={{ textShadow: '0 0 15px rgba(250,204,21,0.8)' }}>It's a Draw!</span>
          ) : (
            <span style={{ color: currentPlayer === 1 ? P1_COLOR : P2_COLOR }}>
              Player {currentPlayer}'s Turn
            </span>
          )}
        </div>

        {/* Board */}
        <div
          className="mx-auto rounded-2xl border border-neon-blue/20 p-3"
          style={{ background: 'rgba(0,212,255,0.03)', boxShadow: '0 0 30px rgba(0,212,255,0.08)' }}
        >
          {/* Column hover indicators */}
          <div className="mb-1 grid" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: '4px' }}>
            {Array.from({ length: COLS }, (_, c) => (
              <div
                key={c}
                className="flex h-6 items-center justify-center text-xs transition-opacity"
                style={{ opacity: hoverCol === c && !winner && !draw ? 1 : 0, color: currentPlayer === 1 ? P1_COLOR : P2_COLOR }}
              >
                ▼
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: '4px' }}>
            {board.map((row, r) =>
              row.map((cell, c) => (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleDrop(c)}
                  onMouseEnter={() => setHoverCol(c)}
                  onMouseLeave={() => setHoverCol(null)}
                  disabled={!!winner || draw}
                  className="aspect-square rounded-full border-2 transition-all duration-200"
                  style={{
                    borderColor: 'rgba(0,212,255,0.1)',
                    background: cell === 1
                      ? P1_COLOR
                      : cell === 2
                      ? P2_COLOR
                      : hoverCol === c && !winner && !draw
                      ? `${currentPlayer === 1 ? P1_COLOR : P2_COLOR}22`
                      : 'rgba(0,0,0,0.4)',
                    boxShadow: cell === 1
                      ? `0 0 12px ${P1_COLOR}`
                      : cell === 2
                      ? `0 0 12px ${P2_COLOR}`
                      : 'none',
                    minWidth: '36px',
                    minHeight: '36px',
                  }}
                />
              ))
            )}
          </div>
        </div>

        <div className="mt-4 text-center">
          <button onClick={handleReset} className="neon-btn-blue rounded-xl px-6 py-2 font-orbitron text-sm font-bold">
            New Game
          </button>
        </div>
      </div>
    </div>
  );
}

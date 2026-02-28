import React from 'react';
import type { Board, CellValue } from '../hooks/useGameLogic';
import { RotateCcw } from 'lucide-react';

interface GameBoardProps {
  board: Board;
  winningCells: number[];
  onCellClick: (index: number) => void;
  disabled?: boolean;
  statusMessage: React.ReactNode;
  statusType: 'playing' | 'winner-x' | 'winner-o' | 'draw';
  onRestart: () => void;
}

function CellContent({ value }: { value: CellValue }) {
  if (!value) return null;
  return (
    <span
      className={`font-orbitron font-bold select-none ${value === 'X' ? 'cell-x' : 'cell-o'}`}
      style={{ fontSize: 'clamp(2rem, 8vw, 3.5rem)', lineHeight: 1 }}
    >
      {value}
    </span>
  );
}

export function GameBoard({
  board,
  winningCells,
  onCellClick,
  disabled = false,
  statusMessage,
  statusType,
  onRestart,
}: GameBoardProps) {
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Status Banner */}
      <div className={`status-banner w-full max-w-sm ${statusType !== 'playing' ? statusType : ''}`}>
        <div className="font-rajdhani text-base sm:text-lg font-semibold tracking-wide">
          {statusMessage}
        </div>
      </div>

      {/* Game Grid */}
      <div
        className="ttt-grid mx-auto"
        style={{ width: 'min(360px, calc(100vw - 2rem))' }}
      >
        {board.map((cell, index) => {
          const isWinning = winningCells.includes(index);
          const isOccupied = cell !== null;

          return (
            <button
              key={index}
              onClick={() => {
                if (!disabled && !isOccupied) {
                  onCellClick(index);
                }
              }}
              className={`game-cell${isOccupied ? ' occupied' : ''}${isWinning ? ' winning' : ''}`}
              aria-label={`Cell ${index + 1}${cell ? `, ${cell}` : ', empty'}`}
              disabled={disabled || isOccupied}
            >
              <CellContent value={cell} />
            </button>
          );
        })}
      </div>

      {/* Restart Button */}
      <button
        onClick={onRestart}
        className="neon-btn-blue flex items-center gap-2 px-6 py-3 rounded-lg font-orbitron text-sm font-semibold tracking-wider uppercase mt-2"
        aria-label="Restart game"
      >
        <RotateCcw size={16} />
        Restart
      </button>
    </div>
  );
}

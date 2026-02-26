import React from 'react';
import type { Scores } from '../hooks/useScoreboard';

interface ScoreboardProps {
  scores: Scores;
  playerXLabel?: string;
  playerOLabel?: string;
  currentPlayer?: 'X' | 'O';
  gameOver?: boolean;
}

export function Scoreboard({
  scores,
  playerXLabel = 'Player X',
  playerOLabel = 'Player O',
  currentPlayer,
  gameOver = false,
}: ScoreboardProps) {
  const isXActive = !gameOver && currentPlayer === 'X';
  const isOActive = !gameOver && currentPlayer === 'O';

  return (
    <div className="w-full flex gap-3 sm:gap-4">
      {/* Player X Score */}
      <div
        className={`score-card flex-1 border transition-all duration-300 ${
          isXActive
            ? 'border-neon-blue/60 shadow-neon-blue-sm'
            : 'border-border'
        }`}
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          {isXActive && (
            <span className="w-2 h-2 rounded-full bg-neon-blue animate-pulse" />
          )}
          <span
            className={`font-orbitron text-xs sm:text-sm font-semibold tracking-wider uppercase ${
              isXActive ? 'neon-text-blue' : 'text-muted-foreground'
            }`}
          >
            {playerXLabel}
          </span>
        </div>
        <div
          className={`font-orbitron text-3xl sm:text-4xl font-bold ${
            isXActive ? 'neon-text-blue' : 'text-foreground/70'
          }`}
        >
          {scores.x}
        </div>
      </div>

      {/* VS Divider */}
      <div className="flex items-center justify-center px-1">
        <span className="font-orbitron text-xs text-muted-foreground/50 tracking-widest">
          VS
        </span>
      </div>

      {/* Player O Score */}
      <div
        className={`score-card flex-1 border transition-all duration-300 ${
          isOActive
            ? 'border-neon-purple/60 shadow-neon-purple-sm'
            : 'border-border'
        }`}
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          {isOActive && (
            <span className="w-2 h-2 rounded-full bg-neon-purple animate-pulse" />
          )}
          <span
            className={`font-orbitron text-xs sm:text-sm font-semibold tracking-wider uppercase ${
              isOActive ? 'neon-text-purple' : 'text-muted-foreground'
            }`}
          >
            {playerOLabel}
          </span>
        </div>
        <div
          className={`font-orbitron text-3xl sm:text-4xl font-bold ${
            isOActive ? 'neon-text-purple' : 'text-foreground/70'
          }`}
        >
          {scores.o}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Users } from 'lucide-react';
import { GameBoard } from '../components/GameBoard';
import { Scoreboard } from '../components/Scoreboard';
import { useGameLogic } from '../hooks/useGameLogic';
import { useScoreboard } from '../hooks/useScoreboard';

export function TwoPlayer() {
  const navigate = useNavigate();
  const { gameState, makeMove, resetGame } = useGameLogic();
  const { scores, incrementScore } = useScoreboard();
  const scoreUpdatedRef = useRef(false);

  // Track score updates
  useEffect(() => {
    if (gameState.status !== 'playing' && !scoreUpdatedRef.current) {
      scoreUpdatedRef.current = true;
      if (gameState.status === 'won' && gameState.winner) {
        incrementScore(gameState.winner);
      }
    }
  }, [gameState.status, gameState.winner, incrementScore]);

  const handleCellClick = (index: number) => {
    if (gameState.status !== 'playing') return;
    makeMove(index);
  };

  const handleRestart = () => {
    scoreUpdatedRef.current = false;
    resetGame();
  };

  // Determine status message and type
  const getStatusInfo = () => {
    if (gameState.status === 'won') {
      if (gameState.winner === 'X') {
        return {
          message: (
            <span>
              🎉 <span className="neon-text-blue">Player X Wins!</span> Congratulations!
            </span>
          ),
          type: 'winner-x' as const,
        };
      } else {
        return {
          message: (
            <span>
              🎉 <span className="neon-text-purple">Player O Wins!</span> Congratulations!
            </span>
          ),
          type: 'winner-o' as const,
        };
      }
    }
    if (gameState.status === 'draw') {
      return {
        message: <span>🤝 <span style={{ color: 'oklch(0.8 0.15 60)' }}>It's a Draw!</span> Well played!</span>,
        type: 'draw' as const,
      };
    }
    if (gameState.currentPlayer === 'X') {
      return {
        message: (
          <span>
            <span className="neon-text-blue">Player X</span>'s turn
          </span>
        ),
        type: 'playing' as const,
      };
    }
    return {
      message: (
        <span>
          <span className="neon-text-purple">Player O</span>'s turn
        </span>
      ),
      type: 'playing' as const,
    };
  };

  const { message, type } = getStatusInfo();

  return (
    <div className="min-h-screen bg-grid-pattern flex flex-col">
      {/* Ambient glow */}
      <div
        className="fixed top-0 left-0 w-full h-full pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 20% 20%, oklch(0.72 0.22 200 / 0.04) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, oklch(0.65 0.28 295 / 0.04) 0%, transparent 50%)',
        }}
      />

      {/* Header */}
      <header className="w-full py-4 px-4 flex items-center justify-between max-w-lg mx-auto">
        <button
          onClick={() => navigate({ to: '/' })}
          className="flex items-center gap-2 font-rajdhani text-sm text-muted-foreground hover:text-neon-blue transition-colors duration-200 group"
        >
          <ArrowLeft size={16} className="transition-transform duration-200 group-hover:-translate-x-1" />
          Back
        </button>
        <div className="flex items-center gap-2">
          <Users size={16} className="text-neon-blue" />
          <span className="font-orbitron text-xs tracking-widest text-muted-foreground uppercase">
            2 Players
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-4">
        <div className="w-full max-w-sm flex flex-col items-center gap-5">
          {/* Title */}
          <h2 className="font-orbitron font-bold text-xl sm:text-2xl tracking-wider text-center">
            <span className="neon-text-purple">TWO</span>{' '}
            <span className="text-foreground/80">PLAYER</span>
          </h2>

          {/* Scoreboard */}
          <Scoreboard
            scores={scores}
            playerXLabel="Player X"
            playerOLabel="Player O"
            currentPlayer={gameState.status === 'playing' ? gameState.currentPlayer : undefined}
            gameOver={gameState.status !== 'playing'}
          />

          {/* Game Board */}
          <GameBoard
            board={gameState.board}
            winningCells={gameState.winningCells}
            onCellClick={handleCellClick}
            disabled={gameState.status !== 'playing'}
            statusMessage={message}
            statusType={type}
            onRestart={handleRestart}
          />
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

import React, { useEffect, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { GameBoard } from '../components/GameBoard';
import { Scoreboard } from '../components/Scoreboard';
import SoundToggle from '../components/SoundToggle';
import { useGameLogic } from '../hooks/useGameLogic';
import { useScoreboard } from '../hooks/useScoreboard';
import { useSoundManager } from '../hooks/useSoundManager';
import { recordWin, recordGameStart } from '../utils/achievements';
import { awardXP, incrementGamesPlayed, incrementWins } from '../utils/playerProfile';

const TwoPlayer: React.FC = () => {
  const navigate = useNavigate();
  const { gameState, makeMove, resetGame } = useGameLogic();
  const { scores, incrementScore, resetScores } = useScoreboard();
  const { playClick, playWin, playScore } = useSoundManager();

  const scoreUpdatedRef = useRef(false);
  const prevStatusRef = useRef<string>(gameState.status);
  const gameStartedRef = useRef(false);

  useEffect(() => {
    if (gameState.status === prevStatusRef.current) return;
    prevStatusRef.current = gameState.status;

    if (gameState.status === 'won' && !scoreUpdatedRef.current) {
      scoreUpdatedRef.current = true;
      if (gameState.winner) incrementScore(gameState.winner);
      playWin();
      recordWin('tictactoe');
      awardXP(20);
      incrementWins();
      incrementGamesPlayed();
    } else if (gameState.status === 'draw' && !scoreUpdatedRef.current) {
      scoreUpdatedRef.current = true;
      playScore();
      awardXP(5);
      incrementGamesPlayed();
    }
  }, [gameState.status, gameState.winner, incrementScore, playWin, playScore]);

  const handleCellClick = (index: number) => {
    if (gameState.status !== 'playing') return;
    playClick();
    if (!gameStartedRef.current) {
      recordGameStart('tictactoe');
      gameStartedRef.current = true;
    }
    makeMove(index);
  };

  const handleRestart = () => {
    playClick();
    scoreUpdatedRef.current = false;
    prevStatusRef.current = 'playing';
    gameStartedRef.current = false;
    resetGame();
  };

  const handleResetScores = () => {
    playClick();
    resetScores();
  };

  const getStatusInfo = () => {
    if (gameState.status === 'won') {
      if (gameState.winner === 'X') {
        return {
          message: <span>🎉 <span className="neon-text-blue">Player X Wins!</span></span>,
          type: 'winner-x' as const,
        };
      }
      return {
        message: <span>🎉 <span className="neon-text-purple">Player O Wins!</span></span>,
        type: 'winner-o' as const,
      };
    }
    if (gameState.status === 'draw') {
      return {
        message: <span>🤝 It's a Draw!</span>,
        type: 'draw' as const,
      };
    }
    if (gameState.currentPlayer === 'X') {
      return {
        message: <span><span className="neon-text-blue">Player X</span>'s turn</span>,
        type: 'playing' as const,
      };
    }
    return {
      message: <span><span className="neon-text-purple">Player O</span>'s turn</span>,
      type: 'playing' as const,
    };
  };

  const { message, type } = getStatusInfo();

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-neon-blue/20 bg-gray-950/80 backdrop-blur-sm">
        <button
          onClick={() => { playClick(); navigate({ to: '/' }); }}
          className="font-orbitron text-neon-blue hover:text-white transition-colors text-sm tracking-wider"
        >
          ← ARENA
        </button>
        <h1 className="font-orbitron text-white text-sm tracking-widest">TIC TAC TOE — 2P</h1>
        <SoundToggle />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-6 p-4">
        <div className="w-full max-w-sm">
          <Scoreboard
            scores={scores}
            currentPlayer={gameState.status === 'playing' ? gameState.currentPlayer : undefined}
            gameOver={gameState.status !== 'playing'}
          />
        </div>
        <GameBoard
          board={gameState.board}
          winningCells={gameState.winningCells}
          onCellClick={handleCellClick}
          disabled={gameState.status !== 'playing'}
          statusMessage={message}
          statusType={type}
          onRestart={handleRestart}
        />
        <button
          onClick={handleResetScores}
          className="font-rajdhani text-gray-500 hover:text-gray-300 text-sm tracking-wider transition-colors"
        >
          Reset Scores
        </button>
      </main>
    </div>
  );
};

export default TwoPlayer;

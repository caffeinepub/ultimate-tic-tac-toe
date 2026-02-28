import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { GameBoard } from '../components/GameBoard';
import { Scoreboard } from '../components/Scoreboard';
import SoundToggle from '../components/SoundToggle';
import DifficultySelector, { Difficulty } from '../components/DifficultySelector';
import { useGameLogic } from '../hooks/useGameLogic';
import { useScoreboard } from '../hooks/useScoreboard';
import { useSoundManager } from '../hooks/useSoundManager';
import { getBestMove, getRandomMove } from '../utils/minimax';
import { recordWin, recordGameStart } from '../utils/achievements';
import { awardXP, incrementGamesPlayed, incrementWins } from '../utils/playerProfile';

const HUMAN = 'X';
const AI = 'O';

const difficultyLabels: Record<Difficulty, { label: string; color: string }> = {
  easy: { label: 'EASY', color: 'text-green-400' },
  medium: { label: 'MEDIUM', color: 'text-yellow-400' },
  hard: { label: 'HARD', color: 'text-red-400' },
};

const SinglePlayer: React.FC = () => {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const { gameState, makeMove, resetGame, getAvailableCells } = useGameLogic();
  const { scores, incrementScore, resetScores } = useScoreboard();
  const { playClick, playWin, playGameOver, playScore } = useSoundManager();

  const scoreUpdatedRef = useRef(false);
  const prevStatusRef = useRef<string>(gameState.status);
  const aiThinkingRef = useRef(false);

  // Sound & score effects on game outcome
  useEffect(() => {
    if (gameState.status === prevStatusRef.current) return;
    prevStatusRef.current = gameState.status;

    if (gameState.status === 'won' && !scoreUpdatedRef.current) {
      scoreUpdatedRef.current = true;
      if (gameState.winner) incrementScore(gameState.winner);
      if (gameState.winner === HUMAN) {
        playWin();
        recordWin('tictactoe');
        awardXP(20);
        incrementWins();
      } else {
        playGameOver();
        awardXP(5);
      }
      incrementGamesPlayed();
    } else if (gameState.status === 'draw' && !scoreUpdatedRef.current) {
      scoreUpdatedRef.current = true;
      playScore();
      awardXP(5);
      incrementGamesPlayed();
    }
  }, [gameState.status, gameState.winner, incrementScore, playWin, playGameOver, playScore]);

  // AI move logic
  useEffect(() => {
    if (!difficulty) return;
    if (gameState.status !== 'playing') return;
    if (gameState.currentPlayer !== AI) return;
    if (aiThinkingRef.current) return;

    aiThinkingRef.current = true;

    const timer = setTimeout(() => {
      const boardCopy = [...gameState.board] as (string | null)[];
      const available = getAvailableCells(gameState.board);

      if (available.length === 0) {
        aiThinkingRef.current = false;
        return;
      }

      let move = -1;

      if (difficulty === 'easy') {
        move = getRandomMove(boardCopy);
      } else if (difficulty === 'medium') {
        if (Math.random() < 0.5) {
          move = getBestMove(boardCopy, AI, HUMAN);
        } else {
          move = getRandomMove(boardCopy);
        }
      } else {
        move = getBestMove(boardCopy, AI, HUMAN);
      }

      if (move !== -1) {
        makeMove(move);
      }
      aiThinkingRef.current = false;
    }, 500);

    return () => {
      clearTimeout(timer);
      aiThinkingRef.current = false;
    };
  }, [gameState.board, gameState.currentPlayer, gameState.status, difficulty, makeMove, getAvailableCells]);

  const handleCellClick = (index: number) => {
    if (!difficulty) return;
    if (gameState.currentPlayer !== HUMAN) return;
    if (gameState.status !== 'playing') return;
    playClick();
    makeMove(index);
  };

  const handleRestart = () => {
    playClick();
    scoreUpdatedRef.current = false;
    prevStatusRef.current = 'playing';
    aiThinkingRef.current = false;
    resetGame();
    setDifficulty(null);
  };

  const handleResetScores = () => {
    playClick();
    resetScores();
  };

  const handleSelectDifficulty = (d: Difficulty) => {
    playClick();
    scoreUpdatedRef.current = false;
    prevStatusRef.current = 'playing';
    aiThinkingRef.current = false;
    setDifficulty(d);
    resetGame();
    recordGameStart('tictactoe');
  };

  const getStatusInfo = () => {
    if (gameState.status === 'won') {
      if (gameState.winner === HUMAN) {
        return {
          message: <span>🎉 <span className="neon-text-blue">You Win!</span></span>,
          type: 'winner-x' as const,
        };
      }
      return {
        message: <span>🤖 <span className="neon-text-purple">Computer Wins!</span></span>,
        type: 'winner-o' as const,
      };
    }
    if (gameState.status === 'draw') {
      return {
        message: <span>🤝 It's a Draw!</span>,
        type: 'draw' as const,
      };
    }
    if (gameState.currentPlayer === HUMAN) {
      return {
        message: <span>Your turn — <span className="neon-text-blue">Player X</span></span>,
        type: 'playing' as const,
      };
    }
    return {
      message: <span><span className="neon-text-purple">Computer</span> is thinking...</span>,
      type: 'playing' as const,
    };
  };

  const { message, type } = getStatusInfo();
  const isBoardDisabled =
    gameState.status !== 'playing' || gameState.currentPlayer === AI;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Difficulty Selector Overlay */}
      {!difficulty && (
        <DifficultySelector
          gameTitle="Tic Tac Toe"
          gameIcon="🎮"
          onSelect={handleSelectDifficulty}
          descriptions={{
            easy: 'AI makes random moves',
            medium: 'AI mixes strategy & random',
            hard: 'Unbeatable Minimax AI',
          }}
        />
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-neon-blue/20 bg-gray-950/80 backdrop-blur-sm">
        <button
          onClick={() => { playClick(); navigate({ to: '/' }); }}
          className="font-orbitron text-neon-blue hover:text-white transition-colors text-sm tracking-wider flex items-center gap-2"
        >
          ← ARENA
        </button>
        <div className="flex items-center gap-3">
          <h1 className="font-orbitron text-white text-sm tracking-widest">TIC TAC TOE</h1>
          {difficulty && (
            <span
              className={`font-orbitron text-xs font-bold px-2 py-0.5 rounded border border-current/30 bg-current/10 ${difficultyLabels[difficulty].color}`}
            >
              {difficultyLabels[difficulty].label}
            </span>
          )}
        </div>
        <SoundToggle />
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center gap-6 p-4">
        <div className="w-full max-w-sm">
          <Scoreboard
            scores={scores}
            playerXLabel="You (X)"
            playerOLabel="Computer"
            currentPlayer={gameState.status === 'playing' ? gameState.currentPlayer : undefined}
            gameOver={gameState.status !== 'playing'}
          />
        </div>
        <GameBoard
          board={gameState.board}
          winningCells={gameState.winningCells}
          onCellClick={handleCellClick}
          disabled={isBoardDisabled}
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

export default SinglePlayer;

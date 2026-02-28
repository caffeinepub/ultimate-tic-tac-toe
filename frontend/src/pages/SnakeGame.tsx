import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import SoundToggle from '../components/SoundToggle';
import DifficultySelector, { Difficulty } from '../components/DifficultySelector';
import { useSoundManager } from '../hooks/useSoundManager';
import { recordGameStart, recordScore, checkSnakeLength } from '../utils/achievements';
import { awardXP, incrementGamesPlayed, addToTotalScore } from '../utils/playerProfile';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface Point { x: number; y: number; }

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;

const DIFFICULTY_SPEEDS: Record<Difficulty, number> = {
  easy: 200,
  medium: 130,
  hard: 70,
};

const difficultyLabels: Record<Difficulty, string> = {
  easy: 'EASY',
  medium: 'MEDIUM',
  hard: 'HARD',
};

const SCORE_MILESTONES = [50, 100, 150, 200, 300, 500];

const SnakeGame: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { playScore, playGameOver, playSpecial, playClick } = useSoundManager();

  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('snake-highscore') || '0'));
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const snakeRef = useRef<Point[]>([{ x: 10, y: 10 }]);
  const foodRef = useRef<Point>({ x: 5, y: 5 });
  const dirRef = useRef<Direction>('RIGHT');
  const nextDirRef = useRef<Direction>('RIGHT');
  const scoreRef = useRef(0);
  const runningRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const milestonesAwardedRef = useRef<Set<number>>(new Set());

  const placeFood = useCallback(() => {
    let pos: Point;
    do {
      pos = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) };
    } while (snakeRef.current.some(s => s.x === pos.x && s.y === pos.y));
    foodRef.current = pos;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Grid
    ctx.strokeStyle = '#ffffff08';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL_SIZE, 0); ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * CELL_SIZE); ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE); ctx.stroke();
    }

    // Food
    const food = foodRef.current;
    ctx.shadowColor = '#ff4444';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.arc(
      food.x * CELL_SIZE + CELL_SIZE / 2,
      food.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;

    // Snake
    snakeRef.current.forEach((seg, i) => {
      const isHead = i === 0;
      ctx.shadowColor = '#00d4ff';
      ctx.shadowBlur = isHead ? 15 : 6;
      ctx.fillStyle = isHead ? '#00d4ff' : `rgba(0, 180, 220, ${Math.max(0.3, 1 - i * 0.04)})`;
      ctx.fillRect(seg.x * CELL_SIZE + 1, seg.y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
    });
    ctx.shadowBlur = 0;
  }, []);

  const stopGame = useCallback(() => {
    runningRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const gameStep = useCallback(() => {
    if (!runningRef.current) return;

    dirRef.current = nextDirRef.current;
    const head = snakeRef.current[0];
    const newHead: Point = {
      x: head.x + (dirRef.current === 'RIGHT' ? 1 : dirRef.current === 'LEFT' ? -1 : 0),
      y: head.y + (dirRef.current === 'DOWN' ? 1 : dirRef.current === 'UP' ? -1 : 0),
    };

    // Wall collision
    if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
      stopGame();
      setGameOver(true);
      playGameOver();
      const finalScore = scoreRef.current;
      addToTotalScore(finalScore);
      awardXP(5);
      incrementGamesPlayed();
      if (finalScore > highScore) {
        setHighScore(finalScore);
        localStorage.setItem('snake-highscore', String(finalScore));
        playSpecial();
      }
      return;
    }

    // Self collision
    if (snakeRef.current.some(s => s.x === newHead.x && s.y === newHead.y)) {
      stopGame();
      setGameOver(true);
      playGameOver();
      const finalScore = scoreRef.current;
      addToTotalScore(finalScore);
      awardXP(5);
      incrementGamesPlayed();
      if (finalScore > highScore) {
        setHighScore(finalScore);
        localStorage.setItem('snake-highscore', String(finalScore));
        playSpecial();
      }
      return;
    }

    const newSnake = [newHead, ...snakeRef.current];

    if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
      // Ate food
      scoreRef.current += 10;
      setScore(scoreRef.current);
      playScore();
      recordScore(10);
      checkSnakeLength(newSnake.length);
      placeFood();

      // Score milestones for XP
      for (const milestone of SCORE_MILESTONES) {
        if (!milestonesAwardedRef.current.has(milestone) && scoreRef.current >= milestone) {
          milestonesAwardedRef.current.add(milestone);
          awardXP(10);
        }
      }
    } else {
      newSnake.pop();
    }

    snakeRef.current = newSnake;
    draw();
  }, [draw, stopGame, placeFood, playGameOver, playScore, playSpecial, highScore]);

  const startGame = useCallback((diff: Difficulty) => {
    stopGame();
    snakeRef.current = [{ x: 10, y: 10 }];
    dirRef.current = 'RIGHT';
    nextDirRef.current = 'RIGHT';
    scoreRef.current = 0;
    milestonesAwardedRef.current = new Set();
    setScore(0);
    setGameOver(false);
    placeFood();
    runningRef.current = true;
    recordGameStart('snake');
    intervalRef.current = setInterval(gameStep, DIFFICULTY_SPEEDS[diff]);
    draw();
  }, [stopGame, placeFood, gameStep, draw]);

  const handleSelectDifficulty = (d: Difficulty) => {
    playClick();
    setDifficulty(d);
    setGameStarted(true);
    startGame(d);
  };

  const handleRestart = () => {
    playClick();
    if (difficulty) {
      startGame(difficulty);
    } else {
      setGameStarted(false);
      setDifficulty(null);
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT',
        w: 'UP', s: 'DOWN', a: 'LEFT', d: 'RIGHT',
        W: 'UP', S: 'DOWN', A: 'LEFT', D: 'RIGHT',
      };
      const dir = map[e.key];
      if (!dir) return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
      const opposites: Record<Direction, Direction> = {
        UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT',
      };
      if (dir !== opposites[dirRef.current]) {
        nextDirRef.current = dir;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopGame();
  }, [stopGame]);

  // Initial draw
  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {!gameStarted && (
        <DifficultySelector
          gameTitle="Snake"
          gameIcon="🐍"
          onSelect={handleSelectDifficulty}
          descriptions={{
            easy: 'Slow speed — learn the ropes',
            medium: 'Normal speed — balanced challenge',
            hard: 'Fast speed — test your reflexes',
          }}
        />
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-neon-blue/20 bg-gray-950/80 backdrop-blur-sm">
        <button
          onClick={() => { playClick(); navigate({ to: '/' }); }}
          className="font-orbitron text-neon-blue hover:text-white transition-colors text-sm tracking-wider"
        >
          ← ARENA
        </button>
        <div className="flex items-center gap-3">
          <h1 className="font-orbitron text-white text-sm tracking-widest">SNAKE</h1>
          {difficulty && (
            <span className="font-orbitron text-xs font-bold px-2 py-0.5 rounded border border-green-400/30 bg-green-400/10 text-green-400">
              {difficultyLabels[difficulty]}
            </span>
          )}
        </div>
        <SoundToggle />
      </header>

      {/* Score bar */}
      <div className="flex items-center justify-center gap-8 py-2 border-b border-gray-800">
        <div className="text-center">
          <div className="font-orbitron text-neon-blue text-xl font-bold">{score}</div>
          <div className="font-rajdhani text-gray-500 text-xs tracking-wider">SCORE</div>
        </div>
        <div className="text-center">
          <div className="font-orbitron text-yellow-400 text-xl font-bold">{highScore}</div>
          <div className="font-rajdhani text-gray-500 text-xs tracking-wider">BEST</div>
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
        <div className="relative border border-neon-blue/30 shadow-[0_0_25px_rgba(0,212,255,0.15)] overflow-hidden">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="block"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
          {gameOver && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
              <div className="font-orbitron text-3xl font-black text-red-400 mb-2"
                style={{ textShadow: '0 0 20px rgba(248,113,113,0.8)' }}>
                GAME OVER
              </div>
              <div className="font-rajdhani text-gray-300 mb-4">Score: {score}</div>
              <button
                onClick={handleRestart}
                className="neon-btn-blue px-6 py-2 rounded-lg font-orbitron text-sm font-bold tracking-wider"
              >
                PLAY AGAIN
              </button>
            </div>
          )}
        </div>

        <p className="font-rajdhani text-gray-600 text-xs tracking-wider text-center">
          Arrow keys or WASD to move
        </p>
      </main>
    </div>
  );
};

export default SnakeGame;

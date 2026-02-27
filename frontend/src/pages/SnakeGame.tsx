import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import SoundToggle from '../components/SoundToggle';
import DifficultySelector, { Difficulty } from '../components/DifficultySelector';
import { useSoundManager } from '../hooks/useSoundManager';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Point = { x: number; y: number };

const DIFFICULTY_SPEEDS: Record<Difficulty, number> = {
  easy: 200,
  medium: 130,
  hard: 70,
};

const difficultyLabels: Record<Difficulty, { label: string; color: string }> = {
  easy: { label: 'EASY', color: 'text-green-400' },
  medium: { label: 'MEDIUM', color: 'text-yellow-400' },
  hard: { label: 'HARD', color: 'text-red-400' },
};

function randomPoint(snake: Point[]): Point {
  let point: Point;
  do {
    point = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some(s => s.x === point.x && s.y === point.y));
  return point;
}

const SnakeGame: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try { return parseInt(localStorage.getItem('snake-high-score') || '0', 10); } catch { return 0; }
  });
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'dead'>('idle');
  const { playScore, playGameOver, playSpecial, playClick } = useSoundManager();

  // Game state refs for animation loop
  const snakeRef = useRef<Point[]>([{ x: 10, y: 10 }]);
  const directionRef = useRef<Direction>('RIGHT');
  const nextDirectionRef = useRef<Direction>('RIGHT');
  const foodRef = useRef<Point>({ x: 5, y: 5 });
  const scoreRef = useRef(0);
  const gameStateRef = useRef<'idle' | 'playing' | 'dead'>('idle');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const difficultyRef = useRef<Difficulty | null>(null);

  const stopGame = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Grid lines
    ctx.strokeStyle = 'rgba(0,212,255,0.05)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }

    // Food
    const food = foodRef.current;
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ff00ff';
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
    const snake = snakeRef.current;
    snake.forEach((seg, i) => {
      const isHead = i === 0;
      const ratio = 1 - i / snake.length;
      if (isHead) {
        ctx.shadowColor = '#00d4ff';
        ctx.shadowBlur = 16;
        ctx.fillStyle = '#00d4ff';
      } else {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        const g = Math.floor(100 + ratio * 155);
        ctx.fillStyle = `rgb(0, ${g}, 180)`;
      }
      const padding = isHead ? 1 : 2;
      ctx.fillRect(
        seg.x * CELL_SIZE + padding,
        seg.y * CELL_SIZE + padding,
        CELL_SIZE - padding * 2,
        CELL_SIZE - padding * 2
      );
    });
    ctx.shadowBlur = 0;

    // Dead overlay
    if (gameStateRef.current === 'dead') {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 20px Orbitron, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 10);
      ctx.fillStyle = '#00d4ff';
      ctx.font = '13px Orbitron, monospace';
      ctx.fillText('Press SPACE or tap Restart', CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 20);
    }
  }, []);

  const tick = useCallback(() => {
    if (gameStateRef.current !== 'playing') return;

    directionRef.current = nextDirectionRef.current;
    const head = snakeRef.current[0];
    const dir = directionRef.current;

    const newHead: Point = {
      x: head.x + (dir === 'RIGHT' ? 1 : dir === 'LEFT' ? -1 : 0),
      y: head.y + (dir === 'DOWN' ? 1 : dir === 'UP' ? -1 : 0),
    };

    // Wall collision
    if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
      gameStateRef.current = 'dead';
      setGameState('dead');
      stopGame();
      playGameOver();
      // Update high score
      if (scoreRef.current > 0) {
        const hs = parseInt(localStorage.getItem('snake-high-score') || '0', 10);
        if (scoreRef.current > hs) {
          localStorage.setItem('snake-high-score', String(scoreRef.current));
          setHighScore(scoreRef.current);
          playSpecial();
        }
      }
      draw();
      return;
    }

    // Self collision
    if (snakeRef.current.some(s => s.x === newHead.x && s.y === newHead.y)) {
      gameStateRef.current = 'dead';
      setGameState('dead');
      stopGame();
      playGameOver();
      if (scoreRef.current > 0) {
        const hs = parseInt(localStorage.getItem('snake-high-score') || '0', 10);
        if (scoreRef.current > hs) {
          localStorage.setItem('snake-high-score', String(scoreRef.current));
          setHighScore(scoreRef.current);
          playSpecial();
        }
      }
      draw();
      return;
    }

    const newSnake = [newHead, ...snakeRef.current];

    // Food eaten
    if (newHead.x === foodRef.current.x && newHead.y === foodRef.current.y) {
      const newScore = scoreRef.current + 1;
      scoreRef.current = newScore;
      setScore(newScore);
      playScore();
      foodRef.current = randomPoint(newSnake);
    } else {
      newSnake.pop();
    }

    snakeRef.current = newSnake;
    draw();
  }, [draw, stopGame, playGameOver, playSpecial, playScore]);

  const startGame = useCallback((diff: Difficulty) => {
    stopGame();
    snakeRef.current = [{ x: 10, y: 10 }];
    directionRef.current = 'RIGHT';
    nextDirectionRef.current = 'RIGHT';
    foodRef.current = randomPoint([{ x: 10, y: 10 }]);
    scoreRef.current = 0;
    setScore(0);
    gameStateRef.current = 'playing';
    setGameState('playing');
    difficultyRef.current = diff;

    const speed = DIFFICULTY_SPEEDS[diff];
    intervalRef.current = setInterval(tick, speed);
    draw();
  }, [stopGame, tick, draw]);

  const handleSelectDifficulty = useCallback((d: Difficulty) => {
    playClick();
    setDifficulty(d);
    difficultyRef.current = d;
    startGame(d);
  }, [playClick, startGame]);

  const handleRestart = useCallback(() => {
    playClick();
    setDifficulty(null);
    stopGame();
    gameStateRef.current = 'idle';
    setGameState('idle');
  }, [playClick, stopGame]);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const dir = directionRef.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          if (dir !== 'DOWN') nextDirectionRef.current = 'UP';
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          if (dir !== 'UP') nextDirectionRef.current = 'DOWN';
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          if (dir !== 'RIGHT') nextDirectionRef.current = 'LEFT';
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          if (dir !== 'LEFT') nextDirectionRef.current = 'RIGHT';
          break;
        case ' ':
          e.preventDefault();
          if (gameStateRef.current === 'dead') {
            handleRestart();
          }
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleRestart]);

  // Initial draw
  useEffect(() => {
    draw();
  }, [draw]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopGame();
  }, [stopGame]);

  // D-pad handlers
  const dpad = (dir: Direction) => {
    const current = directionRef.current;
    if (dir === 'UP' && current !== 'DOWN') nextDirectionRef.current = 'UP';
    if (dir === 'DOWN' && current !== 'UP') nextDirectionRef.current = 'DOWN';
    if (dir === 'LEFT' && current !== 'RIGHT') nextDirectionRef.current = 'LEFT';
    if (dir === 'RIGHT' && current !== 'LEFT') nextDirectionRef.current = 'RIGHT';
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Difficulty Selector */}
      {!difficulty && (
        <DifficultySelector
          gameTitle="Snake"
          gameIcon="🐍"
          onSelect={handleSelectDifficulty}
          descriptions={{
            easy: 'Slow speed — take your time',
            medium: 'Normal speed — classic feel',
            hard: 'Fast speed — lightning reflexes!',
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
            <span className={`font-orbitron text-xs font-bold px-2 py-0.5 rounded border border-current/30 bg-current/10 ${difficultyLabels[difficulty].color}`}>
              {difficultyLabels[difficulty].label}
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
          <div className="font-orbitron text-neon-purple text-xl font-bold">{highScore}</div>
          <div className="font-rajdhani text-gray-500 text-xs tracking-wider">BEST</div>
        </div>
      </div>

      {/* Game canvas */}
      <main className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
        <div className="relative border border-neon-blue/30 shadow-[0_0_20px_rgba(0,212,255,0.15)]">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="block"
          />
        </div>

        {/* Controls */}
        <div className="flex gap-3 items-center">
          {gameState === 'dead' && (
            <button
              onClick={handleRestart}
              className="font-orbitron text-sm px-4 py-2 rounded-lg border border-neon-blue/60 bg-neon-blue/10 text-neon-blue hover:bg-neon-blue/20 transition-all tracking-wider"
            >
              RESTART
            </button>
          )}
        </div>

        {/* D-pad */}
        <div className="grid grid-cols-3 gap-1 mt-2">
          <div />
          <button
            onPointerDown={() => dpad('UP')}
            className="w-12 h-12 rounded-lg border border-gray-700 bg-gray-800/80 text-white flex items-center justify-center hover:bg-gray-700 active:bg-gray-600 transition-colors text-lg"
          >▲</button>
          <div />
          <button
            onPointerDown={() => dpad('LEFT')}
            className="w-12 h-12 rounded-lg border border-gray-700 bg-gray-800/80 text-white flex items-center justify-center hover:bg-gray-700 active:bg-gray-600 transition-colors text-lg"
          >◀</button>
          <button
            onPointerDown={() => dpad('DOWN')}
            className="w-12 h-12 rounded-lg border border-gray-700 bg-gray-800/80 text-white flex items-center justify-center hover:bg-gray-700 active:bg-gray-600 transition-colors text-lg"
          >▼</button>
          <button
            onPointerDown={() => dpad('RIGHT')}
            className="w-12 h-12 rounded-lg border border-gray-700 bg-gray-800/80 text-white flex items-center justify-center hover:bg-gray-700 active:bg-gray-600 transition-colors text-lg"
          >▶</button>
        </div>

        <p className="font-rajdhani text-gray-600 text-xs tracking-wider text-center">
          Arrow keys / WASD to move • SPACE to restart
        </p>
      </main>
    </div>
  );
};

export default SnakeGame;

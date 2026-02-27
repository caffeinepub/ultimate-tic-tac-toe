import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, RotateCcw, ArrowUp, ArrowDown, ArrowRight } from 'lucide-react';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;
const INITIAL_SPEED = 150;
const MIN_SPEED = 60;

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Point = { x: number; y: number };

function randomFood(snake: Point[]): Point {
  let pos: Point;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some((s) => s.x === pos.x && s.y === pos.y));
  return pos;
}

function getSpeed(length: number): number {
  const speed = INITIAL_SPEED - (length - 3) * 4;
  return Math.max(speed, MIN_SPEED);
}

export function SnakeGame() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const snakeRef = useRef<Point[]>([{ x: 10, y: 10 }]);
  const directionRef = useRef<Direction>('RIGHT');
  const nextDirectionRef = useRef<Direction>('RIGHT');
  const foodRef = useRef<Point>(randomFood([{ x: 10, y: 10 }]));
  const gameOverRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = parseInt(localStorage.getItem('snake-high-score') ?? '0', 10);
    return isNaN(saved) ? 0 : saved;
  });
  const [isGameOver, setIsGameOver] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  const scoreRef = useRef(0);

  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    ctx.strokeStyle = 'rgba(100, 200, 255, 0.04)';
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

    const food = foodRef.current;
    ctx.fillStyle = '#ff6b6b';
    ctx.shadowColor = '#ff6b6b';
    ctx.shadowBlur = 12;
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

    const snake = snakeRef.current;
    snake.forEach((seg, i) => {
      const isHead = i === 0;
      const ratio = 1 - i / snake.length;
      if (isHead) {
        ctx.fillStyle = '#00e5ff';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 16;
      } else {
        const g = Math.floor(180 + ratio * 75);
        ctx.fillStyle = `rgb(0, ${g}, 200)`;
        ctx.shadowColor = `rgb(0, ${g}, 200)`;
        ctx.shadowBlur = 6;
      }
      const padding = isHead ? 1 : 2;
      ctx.fillRect(
        seg.x * CELL_SIZE + padding,
        seg.y * CELL_SIZE + padding,
        CELL_SIZE - padding * 2,
        CELL_SIZE - padding * 2
      );
      ctx.shadowBlur = 0;
    });
  }, []);

  const stopGame = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    if (gameOverRef.current) return;

    directionRef.current = nextDirectionRef.current;
    const snake = snakeRef.current;
    const head = snake[0];
    const dir = directionRef.current;

    const newHead: Point = {
      x: head.x + (dir === 'RIGHT' ? 1 : dir === 'LEFT' ? -1 : 0),
      y: head.y + (dir === 'DOWN' ? 1 : dir === 'UP' ? -1 : 0),
    };

    if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
      gameOverRef.current = true;
      setIsGameOver(true);
      stopGame();
      return;
    }

    if (snake.some((s) => s.x === newHead.x && s.y === newHead.y)) {
      gameOverRef.current = true;
      setIsGameOver(true);
      stopGame();
      return;
    }

    const food = foodRef.current;
    const ateFood = newHead.x === food.x && newHead.y === food.y;
    const newSnake = [newHead, ...snake];
    if (!ateFood) {
      newSnake.pop();
    } else {
      const newScore = scoreRef.current + 1;
      scoreRef.current = newScore;
      setScore(newScore);
      foodRef.current = randomFood(newSnake);

      setHighScore((prev) => {
        if (newScore > prev) {
          localStorage.setItem('snake-high-score', String(newScore));
          return newScore;
        }
        return prev;
      });

      stopGame();
      snakeRef.current = newSnake;
      drawGame();
      const newInterval = setInterval(tick, getSpeed(newSnake.length));
      intervalRef.current = newInterval;
      return;
    }

    snakeRef.current = newSnake;
    drawGame();
  }, [drawGame, stopGame]);

  const startGame = useCallback(() => {
    stopGame();
    const initialSnake = [{ x: 10, y: 10 }];
    snakeRef.current = initialSnake;
    directionRef.current = 'RIGHT';
    nextDirectionRef.current = 'RIGHT';
    foodRef.current = randomFood(initialSnake);
    gameOverRef.current = false;
    scoreRef.current = 0;
    setScore(0);
    setIsGameOver(false);
    setIsStarted(true);
    drawGame();
    intervalRef.current = setInterval(tick, INITIAL_SPEED);
  }, [stopGame, drawGame, tick]);

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
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    drawGame();
    return () => stopGame();
  }, [drawGame, stopGame]);

  const handleDpad = (dir: Direction) => {
    const current = directionRef.current;
    if (dir === 'UP' && current !== 'DOWN') nextDirectionRef.current = 'UP';
    if (dir === 'DOWN' && current !== 'UP') nextDirectionRef.current = 'DOWN';
    if (dir === 'LEFT' && current !== 'RIGHT') nextDirectionRef.current = 'LEFT';
    if (dir === 'RIGHT' && current !== 'LEFT') nextDirectionRef.current = 'RIGHT';
  };

  return (
    <div className="min-h-screen bg-grid-pattern flex flex-col">
      <div
        className="fixed top-1/3 left-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, oklch(0.75 0.22 155 / 0.06) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Header */}
      <header className="w-full py-4 px-4 flex items-center justify-between max-w-lg mx-auto">
        <button
          onClick={() => navigate({ to: '/' })}
          className="flex items-center gap-2 font-rajdhani text-sm text-muted-foreground hover:text-neon-blue transition-colors duration-200 group"
        >
          <ArrowLeft size={16} className="transition-transform duration-200 group-hover:-translate-x-1" />
          Back to Home
        </button>
        <span
          className="font-orbitron font-bold text-sm tracking-widest"
          style={{ color: 'oklch(0.85 0.22 155)' }}
        >
          SNAKE GAME
        </span>
        <div className="w-24" />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-4 gap-4">
        {/* Score */}
        <div className="flex gap-6">
          <div
            className="px-5 py-2 rounded-xl text-center"
            style={{ background: 'oklch(0.12 0.02 265)', border: '1px solid oklch(0.75 0.22 155 / 0.3)' }}
          >
            <div className="font-rajdhani text-xs text-muted-foreground tracking-widest uppercase">Score</div>
            <div
              className="font-orbitron font-black text-2xl"
              style={{ color: 'oklch(0.85 0.22 155)', textShadow: '0 0 10px oklch(0.75 0.22 155 / 0.8)' }}
            >
              {score}
            </div>
          </div>
          <div
            className="px-5 py-2 rounded-xl text-center"
            style={{ background: 'oklch(0.12 0.02 265)', border: '1px solid oklch(0.72 0.22 200 / 0.3)' }}
          >
            <div className="font-rajdhani text-xs text-muted-foreground tracking-widest uppercase">Best</div>
            <div
              className="font-orbitron font-black text-2xl"
              style={{ color: 'oklch(0.85 0.22 200)', textShadow: '0 0 10px oklch(0.72 0.22 200 / 0.8)' }}
            >
              {highScore}
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="rounded-xl"
            style={{
              border: '2px solid oklch(0.75 0.22 155 / 0.4)',
              boxShadow: '0 0 30px oklch(0.75 0.22 155 / 0.2)',
              maxWidth: '100%',
              display: 'block',
            }}
          />
          {isGameOver && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center rounded-xl gap-4"
              style={{ background: 'rgba(0,0,0,0.82)' }}
            >
              <div
                className="font-orbitron font-black text-3xl"
                style={{ color: 'oklch(0.75 0.25 25)', textShadow: '0 0 20px oklch(0.65 0.25 25 / 0.8)' }}
              >
                GAME OVER
              </div>
              <div className="font-rajdhani text-lg text-muted-foreground">
                Score: <span style={{ color: 'oklch(0.85 0.22 155)' }} className="font-bold">{score}</span>
              </div>
              <button
                onClick={startGame}
                className="flex items-center gap-2 font-orbitron font-bold text-sm tracking-wider px-6 py-3 rounded-xl transition-all duration-300"
                style={{
                  background: 'oklch(0.75 0.22 155 / 0.15)',
                  border: '2px solid oklch(0.75 0.22 155 / 0.6)',
                  color: 'oklch(0.85 0.22 155)',
                }}
              >
                <RotateCcw size={16} />
                RESTART
              </button>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-2">
          {!isStarted && !isGameOver && (
            <button
              onClick={startGame}
              className="font-orbitron font-bold text-sm tracking-wider px-8 py-3 rounded-xl transition-all duration-300"
              style={{
                background: 'oklch(0.75 0.22 155 / 0.15)',
                border: '2px solid oklch(0.75 0.22 155 / 0.6)',
                color: 'oklch(0.85 0.22 155)',
                boxShadow: '0 0 15px oklch(0.75 0.22 155 / 0.3)',
              }}
            >
              ▶ START GAME
            </button>
          )}

          {/* D-pad */}
          <div className="grid grid-cols-3 gap-1 mt-1">
            <div />
            <button
              onPointerDown={() => handleDpad('UP')}
              className="w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-150 active:scale-95 select-none"
              style={{ background: 'oklch(0.75 0.22 155 / 0.1)', border: '1px solid oklch(0.75 0.22 155 / 0.4)', color: 'oklch(0.85 0.22 155)' }}
            >
              <ArrowUp size={20} />
            </button>
            <div />
            <button
              onPointerDown={() => handleDpad('LEFT')}
              className="w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-150 active:scale-95 select-none"
              style={{ background: 'oklch(0.75 0.22 155 / 0.1)', border: '1px solid oklch(0.75 0.22 155 / 0.4)', color: 'oklch(0.85 0.22 155)' }}
            >
              <ArrowLeft size={20} />
            </button>
            <button
              onPointerDown={() => handleDpad('DOWN')}
              className="w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-150 active:scale-95 select-none"
              style={{ background: 'oklch(0.75 0.22 155 / 0.1)', border: '1px solid oklch(0.75 0.22 155 / 0.4)', color: 'oklch(0.85 0.22 155)' }}
            >
              <ArrowDown size={20} />
            </button>
            <button
              onPointerDown={() => handleDpad('RIGHT')}
              className="w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-150 active:scale-95 select-none"
              style={{ background: 'oklch(0.75 0.22 155 / 0.1)', border: '1px solid oklch(0.75 0.22 155 / 0.4)', color: 'oklch(0.85 0.22 155)' }}
            >
              <ArrowRight size={20} />
            </button>
          </div>
          <p className="font-rajdhani text-xs text-muted-foreground text-center tracking-wide">
            Use WASD / Arrow keys or D-pad to control
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 px-4 text-center">
        <p className="font-rajdhani text-xs text-muted-foreground/50 tracking-wide">
          Built with{' '}
          <span style={{ color: 'oklch(0.65 0.28 295)' }}>♥</span>{' '}
          using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== 'undefined' ? window.location.hostname : 'ultimate-gaming-arena')}`}
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

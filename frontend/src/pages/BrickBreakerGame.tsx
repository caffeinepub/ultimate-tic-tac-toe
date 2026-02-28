import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import SoundToggle from '../components/SoundToggle';
import { useSoundManager } from '../hooks/useSoundManager';
import { awardXP, incrementGamesPlayed, incrementWins, addToTotalScore } from '../utils/playerProfile';

const W = 480;
const H = 520;
const PADDLE_W = 90;
const PADDLE_H = 12;
const PADDLE_Y = H - 30;
const BALL_R = 8;
const BALL_SPEED = 5;
const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_W = 52;
const BRICK_H = 20;
const BRICK_PAD = 4;
const BRICK_OFFSET_X = 16;
const BRICK_OFFSET_Y = 50;
const PADDLE_SPEED = 6;

const BRICK_COLORS = ['#ff4444', '#ff8800', '#ffdd00', '#00d4ff', '#7b2fff'];

interface Brick {
  x: number;
  y: number;
  alive: boolean;
  color: string;
}

function initBricks(): Brick[] {
  const bricks: Brick[] = [];
  for (let r = 0; r < BRICK_ROWS; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      bricks.push({
        x: BRICK_OFFSET_X + c * (BRICK_W + BRICK_PAD),
        y: BRICK_OFFSET_Y + r * (BRICK_H + BRICK_PAD),
        alive: true,
        color: BRICK_COLORS[r % BRICK_COLORS.length],
      });
    }
  }
  return bricks;
}

type Phase = 'idle' | 'playing' | 'won' | 'lost';

interface State {
  paddleX: number;
  ballX: number;
  ballY: number;
  ballVX: number;
  ballVY: number;
  bricks: Brick[];
  score: number;
  lives: number;
  phase: Phase;
  keys: { left: boolean; right: boolean };
  mouseX: number | null;
}

function makeState(): State {
  return {
    paddleX: W / 2 - PADDLE_W / 2,
    ballX: W / 2,
    ballY: PADDLE_Y - BALL_R - 2,
    ballVX: BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
    ballVY: -BALL_SPEED,
    bricks: initBricks(),
    score: 0,
    lives: 3,
    phase: 'idle',
    keys: { left: false, right: false },
    mouseX: null,
  };
}

export default function BrickBreakerGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<State>(makeState());
  const rafRef = useRef(0);
  const loopRef = useRef<() => void>(() => {});

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [phase, setPhase] = useState<Phase>('idle');

  const { playClick, playScore, playWin, playGameOver } = useSoundManager();
  const soundRef = useRef({ playClick, playScore, playWin, playGameOver });
  soundRef.current = { playClick, playScore, playWin, playGameOver };

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = stateRef.current;

    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, W, H);

    // Bricks
    s.bricks.forEach((b) => {
      if (!b.alive) return;
      ctx.fillStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 6;
      ctx.fillRect(b.x, b.y, BRICK_W, BRICK_H);
      // Highlight edge
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(b.x, b.y, BRICK_W, 3);
      ctx.shadowBlur = 0;
    });

    // Paddle
    ctx.fillStyle = '#00d4ff';
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.roundRect(s.paddleX, PADDLE_Y, PADDLE_W, PADDLE_H, 4);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Ball
    ctx.beginPath();
    ctx.arc(s.ballX, s.ballY, BALL_R, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Overlays
    if (s.phase === 'idle') {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#00d4ff';
      ctx.shadowColor = '#00d4ff';
      ctx.shadowBlur = 20;
      ctx.font = 'bold 20px Orbitron, monospace';
      ctx.fillText('BRICK BREAKER', W / 2, H / 2 - 30);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#cccccc';
      ctx.font = '14px Orbitron, monospace';
      ctx.fillText('PRESS SPACE TO START', W / 2, H / 2 + 10);
      ctx.fillStyle = '#888888';
      ctx.font = '12px Rajdhani, sans-serif';
      ctx.fillText('Arrow Keys or Mouse to move paddle', W / 2, H / 2 + 40);
    } else if (s.phase === 'won') {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#00ff88';
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 20;
      ctx.font = 'bold 30px Orbitron, monospace';
      ctx.fillText('YOU WIN! 🏆', W / 2, H / 2 - 30);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Rajdhani, sans-serif';
      ctx.fillText(`Score: ${s.score}`, W / 2, H / 2 + 10);
      ctx.fillStyle = '#00d4ff';
      ctx.font = '14px Rajdhani, sans-serif';
      ctx.fillText('PRESS SPACE TO PLAY AGAIN', W / 2, H / 2 + 50);
    } else if (s.phase === 'lost') {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff4444';
      ctx.shadowColor = '#ff4444';
      ctx.shadowBlur = 20;
      ctx.font = 'bold 30px Orbitron, monospace';
      ctx.fillText('GAME OVER', W / 2, H / 2 - 30);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Rajdhani, sans-serif';
      ctx.fillText(`Score: ${s.score}`, W / 2, H / 2 + 10);
      ctx.fillStyle = '#00d4ff';
      ctx.font = '14px Rajdhani, sans-serif';
      ctx.fillText('PRESS SPACE TO PLAY AGAIN', W / 2, H / 2 + 50);
    }
  }, []);

  const resetGame = useCallback(() => {
    const fresh = makeState();
    fresh.phase = 'playing';
    stateRef.current = fresh;
    setScore(0);
    setLives(3);
    setPhase('playing');
  }, []);

  // Game loop stored in ref to avoid stale closures
  useEffect(() => {
    loopRef.current = () => {
      const s = stateRef.current;

      if (s.phase === 'playing') {
        // Paddle movement via keyboard
        if (s.keys.left) s.paddleX = Math.max(0, s.paddleX - PADDLE_SPEED);
        if (s.keys.right) s.paddleX = Math.min(W - PADDLE_W, s.paddleX + PADDLE_SPEED);

        // Paddle movement via mouse
        if (s.mouseX !== null) {
          const target = s.mouseX - PADDLE_W / 2;
          s.paddleX = Math.max(0, Math.min(W - PADDLE_W, target));
        }

        // Ball movement
        s.ballX += s.ballVX;
        s.ballY += s.ballVY;

        // Wall bounces
        if (s.ballX - BALL_R < 0) {
          s.ballX = BALL_R;
          s.ballVX = Math.abs(s.ballVX);
        }
        if (s.ballX + BALL_R > W) {
          s.ballX = W - BALL_R;
          s.ballVX = -Math.abs(s.ballVX);
        }
        if (s.ballY - BALL_R < 0) {
          s.ballY = BALL_R;
          s.ballVY = Math.abs(s.ballVY);
        }

        // Paddle collision
        if (
          s.ballVY > 0 &&
          s.ballY + BALL_R >= PADDLE_Y &&
          s.ballY + BALL_R <= PADDLE_Y + PADDLE_H + 4 &&
          s.ballX >= s.paddleX - BALL_R &&
          s.ballX <= s.paddleX + PADDLE_W + BALL_R
        ) {
          s.ballY = PADDLE_Y - BALL_R;
          s.ballVY = -Math.abs(s.ballVY);
          // Angle based on hit position
          const hitPos = (s.ballX - (s.paddleX + PADDLE_W / 2)) / (PADDLE_W / 2);
          s.ballVX = hitPos * BALL_SPEED * 1.2;
          // Ensure minimum horizontal speed
          if (Math.abs(s.ballVX) < 1) s.ballVX = s.ballVX < 0 ? -1 : 1;
          soundRef.current.playClick();
        }

        // Ball lost
        if (s.ballY - BALL_R > H) {
          s.lives -= 1;
          setLives(s.lives);
          if (s.lives <= 0) {
            s.phase = 'lost';
            setPhase('lost');
            soundRef.current.playGameOver();
            addToTotalScore(s.score);
            awardXP(5);
            incrementGamesPlayed();
          } else {
            // Reset ball above paddle
            s.ballX = s.paddleX + PADDLE_W / 2;
            s.ballY = PADDLE_Y - BALL_R - 2;
            s.ballVX = BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
            s.ballVY = -BALL_SPEED;
          }
        }

        // Brick collisions
        let bricksLeft = 0;
        for (const b of s.bricks) {
          if (!b.alive) continue;
          bricksLeft++;
          // AABB collision
          if (
            s.ballX + BALL_R > b.x &&
            s.ballX - BALL_R < b.x + BRICK_W &&
            s.ballY + BALL_R > b.y &&
            s.ballY - BALL_R < b.y + BRICK_H
          ) {
            b.alive = false;
            bricksLeft--;

            // Determine bounce direction
            const overlapLeft = s.ballX + BALL_R - b.x;
            const overlapRight = b.x + BRICK_W - (s.ballX - BALL_R);
            const overlapTop = s.ballY + BALL_R - b.y;
            const overlapBottom = b.y + BRICK_H - (s.ballY - BALL_R);
            const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

            if (minOverlap === overlapTop || minOverlap === overlapBottom) {
              s.ballVY = -s.ballVY;
            } else {
              s.ballVX = -s.ballVX;
            }

            s.score += 10;
            setScore(s.score);
            soundRef.current.playScore();
            break; // one brick per frame
          }
        }

        // Win check
        if (bricksLeft === 0 && s.phase === 'playing') {
          s.phase = 'won';
          setPhase('won');
          soundRef.current.playWin();
          addToTotalScore(s.score);
          awardXP(20);
          incrementWins();
          incrementGamesPlayed();
        }
      }

      drawCanvas();
      rafRef.current = requestAnimationFrame(loopRef.current);
    };
  });

  // Start loop on mount
  useEffect(() => {
    rafRef.current = requestAnimationFrame(loopRef.current);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Keyboard listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); s.keys.left = true; }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); s.keys.right = true; }
      if (e.code === 'Space') {
        e.preventDefault();
        if (s.phase === 'idle' || s.phase === 'won' || s.phase === 'lost') resetGame();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') s.keys.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') s.keys.right = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [resetGame]);

  // Mouse control
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    stateRef.current.mouseX = (e.clientX - rect.left) * scaleX;
  }, []);

  const handleMouseLeave = useCallback(() => {
    stateRef.current.mouseX = null;
  }, []);

  const handleCanvasClick = useCallback(() => {
    const s = stateRef.current;
    if (s.phase === 'idle' || s.phase === 'won' || s.phase === 'lost') resetGame();
  }, [resetGame]);

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-rajdhani text-sm text-gray-400 hover:text-neon-blue transition-colors">
            <ArrowLeft size={16} /> Back
          </Link>
          <h1
            className="font-orbitron text-xl font-bold text-neon-blue"
            style={{ textShadow: '0 0 15px rgba(0,212,255,0.7)' }}
          >
            BRICK BREAKER
          </h1>
          <SoundToggle />
        </div>

        <div className="mb-4 flex justify-between">
          <div className="score-card text-center px-6 py-3">
            <div className="font-orbitron text-2xl font-bold text-neon-blue">{score}</div>
            <div className="font-rajdhani text-xs uppercase tracking-widest text-gray-400">Score</div>
          </div>
          <div className="score-card text-center px-6 py-3">
            <div className="font-orbitron text-2xl font-bold text-red-400">
              {'❤️'.repeat(Math.max(0, lives))}
            </div>
            <div className="font-rajdhani text-xs uppercase tracking-widest text-gray-400">Lives</div>
          </div>
        </div>

        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleCanvasClick}
            className="cursor-none rounded-xl border border-neon-blue/20"
            style={{ boxShadow: '0 0 30px rgba(0,212,255,0.1)', maxWidth: '100%' }}
          />
        </div>

        <div className="mt-4 text-center font-rajdhani text-xs text-gray-600">
          Arrow Keys / A-D or Mouse to move · Space to start
        </div>

        {(phase === 'idle' || phase === 'won' || phase === 'lost') && (
          <div className="mt-3 flex justify-center">
            <button
              onClick={() => { soundRef.current.playClick(); resetGame(); }}
              className="font-orbitron text-sm px-6 py-2 rounded-lg border border-neon-blue/60 bg-neon-blue/10 text-neon-blue hover:bg-neon-blue/20 transition-all tracking-wider"
            >
              {phase === 'idle' ? 'START' : 'PLAY AGAIN'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

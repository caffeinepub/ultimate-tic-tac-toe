import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import SoundToggle from '../components/SoundToggle';
import { useSoundManager } from '../hooks/useSoundManager';
import { awardXP, incrementGamesPlayed, addToTotalScore } from '../utils/playerProfile';

const W = 400;
const H = 600;
const BIRD_X = 80;
const BIRD_R = 14;
const GRAVITY = 0.45;
const JUMP_VEL = -9;
const PIPE_W = 55;
const PIPE_GAP = 155;
const PIPE_SPEED = 2.8;
const PIPE_INTERVAL = 95; // frames between pipes
const GROUND_H = 40;

interface Pipe {
  x: number;
  topH: number;
  scored: boolean;
}

type Phase = 'idle' | 'playing' | 'dead';

interface State {
  birdY: number;
  birdVY: number;
  birdAngle: number;
  pipes: Pipe[];
  score: number;
  frame: number;
  phase: Phase;
}

function makeState(): State {
  return {
    birdY: H / 2,
    birdVY: 0,
    birdAngle: 0,
    pipes: [],
    score: 0,
    frame: 0,
    phase: 'idle',
  };
}

export default function FlappyBirdGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<State>(makeState());
  const rafRef = useRef(0);
  const loopRef = useRef<() => void>(() => {});

  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => parseInt(localStorage.getItem('flappy-best') || '0'));
  const [phase, setPhase] = useState<Phase>('idle');

  const { playClick, playScore, playGameOver } = useSoundManager();
  const soundRef = useRef({ playClick, playScore, playGameOver });
  soundRef.current = { playClick, playScore, playGameOver };

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = stateRef.current;

    // Sky background
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, W, H);

    // Stars (static decorative)
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    for (let i = 0; i < 30; i++) {
      const sx = ((i * 137 + 50) % W);
      const sy = ((i * 97 + 20) % (H - GROUND_H - 20));
      ctx.fillRect(sx, sy, 1, 1);
    }

    // Pipes
    s.pipes.forEach((p) => {
      // Top pipe
      const grad1 = ctx.createLinearGradient(p.x, 0, p.x + PIPE_W, 0);
      grad1.addColorStop(0, '#5b21b6');
      grad1.addColorStop(1, '#7b2fff');
      ctx.fillStyle = grad1;
      ctx.shadowColor = '#7b2fff';
      ctx.shadowBlur = 8;
      ctx.fillRect(p.x, 0, PIPE_W, p.topH);
      // Pipe cap
      ctx.fillStyle = '#9b59ff';
      ctx.fillRect(p.x - 4, p.topH - 14, PIPE_W + 8, 14);

      // Bottom pipe
      const bottomY = p.topH + PIPE_GAP;
      const bottomH = H - GROUND_H - bottomY;
      ctx.fillStyle = grad1;
      ctx.fillRect(p.x, bottomY, PIPE_W, bottomH);
      // Pipe cap
      ctx.fillStyle = '#9b59ff';
      ctx.fillRect(p.x - 4, bottomY, PIPE_W + 8, 14);
      ctx.shadowBlur = 0;
    });

    // Ground
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, H - GROUND_H, W, GROUND_H);
    ctx.fillStyle = '#00d4ff';
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 6;
    ctx.fillRect(0, H - GROUND_H, W, 2);
    ctx.shadowBlur = 0;

    // Bird (rotated based on velocity)
    ctx.save();
    ctx.translate(BIRD_X, s.birdY);
    const angle = Math.max(-0.5, Math.min(1.2, s.birdVY * 0.06));
    ctx.rotate(angle);

    // Bird body
    ctx.beginPath();
    ctx.ellipse(0, 0, BIRD_R + 2, BIRD_R, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#00d4ff';
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 18;
    ctx.fill();

    // Bird eye
    ctx.beginPath();
    ctx.arc(6, -4, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(7, -4, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = '#030712';
    ctx.fill();

    // Wing
    ctx.beginPath();
    ctx.ellipse(-2, 4, 8, 4, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#0099bb';
    ctx.fill();

    ctx.restore();
    ctx.shadowBlur = 0;

    // Score display on canvas
    if (s.phase === 'playing') {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = 'bold 28px Orbitron, monospace';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 4;
      ctx.fillText(String(s.score), W / 2, 50);
      ctx.shadowBlur = 0;
    }

    // Idle overlay
    if (s.phase === 'idle') {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#00d4ff';
      ctx.shadowColor = '#00d4ff';
      ctx.shadowBlur = 20;
      ctx.font = 'bold 22px Orbitron, monospace';
      ctx.fillText('FLAPPY BIRD', W / 2, H / 2 - 40);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#cccccc';
      ctx.font = '14px Orbitron, monospace';
      ctx.fillText('TAP / SPACE TO START', W / 2, H / 2 + 5);
      ctx.fillStyle = '#888888';
      ctx.font = '12px Rajdhani, sans-serif';
      ctx.fillText('Click or press Space to flap', W / 2, H / 2 + 35);
    }

    // Dead overlay
    if (s.phase === 'dead') {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff4444';
      ctx.shadowColor = '#ff4444';
      ctx.shadowBlur = 20;
      ctx.font = 'bold 30px Orbitron, monospace';
      ctx.fillText('GAME OVER', W / 2, H / 2 - 50);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = '18px Rajdhani, sans-serif';
      ctx.fillText(`Score: ${s.score}`, W / 2, H / 2);
      ctx.fillStyle = '#ffdd00';
      ctx.font = '14px Rajdhani, sans-serif';
      ctx.fillText(`Best: ${Math.max(s.score, parseInt(localStorage.getItem('flappy-best') || '0'))}`, W / 2, H / 2 + 28);
      ctx.fillStyle = '#00d4ff';
      ctx.font = '14px Orbitron, monospace';
      ctx.fillText('TAP / SPACE TO RESTART', W / 2, H / 2 + 65);
    }
  }, []);

  const flap = useCallback(() => {
    const s = stateRef.current;
    if (s.phase === 'idle') {
      s.phase = 'playing';
      s.birdVY = JUMP_VEL;
      setPhase('playing');
      soundRef.current.playClick();
    } else if (s.phase === 'playing') {
      s.birdVY = JUMP_VEL;
      soundRef.current.playClick();
    } else if (s.phase === 'dead') {
      // Restart
      const fresh = makeState();
      fresh.phase = 'playing';
      fresh.birdVY = JUMP_VEL;
      stateRef.current = fresh;
      setScore(0);
      setPhase('playing');
      soundRef.current.playClick();
    }
  }, []);

  // Game loop in ref to avoid stale closures
  useEffect(() => {
    loopRef.current = () => {
      const s = stateRef.current;

      if (s.phase === 'playing') {
        s.frame++;

        // Physics
        s.birdVY += GRAVITY;
        s.birdY += s.birdVY;

        // Spawn pipes
        if (s.frame % PIPE_INTERVAL === 0) {
          const minTop = 60;
          const maxTop = H - GROUND_H - PIPE_GAP - 60;
          const topH = minTop + Math.random() * (maxTop - minTop);
          s.pipes.push({ x: W + 10, topH, scored: false });
        }

        // Move & cull pipes
        for (const p of s.pipes) p.x -= PIPE_SPEED;
        s.pipes = s.pipes.filter((p) => p.x + PIPE_W > -10);

        // Score
        for (const p of s.pipes) {
          if (!p.scored && p.x + PIPE_W < BIRD_X - BIRD_R) {
            p.scored = true;
            s.score++;
            setScore(s.score);
            soundRef.current.playScore();
            if (s.score % 5 === 0) awardXP(10);
          }
        }

        // Collision detection
        const hitGround = s.birdY + BIRD_R >= H - GROUND_H;
        const hitCeiling = s.birdY - BIRD_R <= 0;
        const hitPipe = s.pipes.some(
          (p) =>
            BIRD_X + BIRD_R > p.x + 4 &&
            BIRD_X - BIRD_R < p.x + PIPE_W - 4 &&
            (s.birdY - BIRD_R < p.topH - 4 || s.birdY + BIRD_R > p.topH + PIPE_GAP + 4)
        );

        if (hitGround || hitCeiling || hitPipe) {
          s.phase = 'dead';
          setPhase('dead');
          soundRef.current.playGameOver();
          addToTotalScore(s.score);
          awardXP(5);
          incrementGamesPlayed();
          const prevBest = parseInt(localStorage.getItem('flappy-best') || '0');
          const newBest = Math.max(s.score, prevBest);
          if (newBest > prevBest) {
            localStorage.setItem('flappy-best', String(newBest));
            setBest(newBest);
          }
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

  // Keyboard listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        flap();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [flap]);

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
            FLAPPY BIRD
          </h1>
          <SoundToggle />
        </div>

        <div className="mb-4 flex justify-between">
          <div className="score-card text-center px-6 py-3">
            <div className="font-orbitron text-2xl font-bold text-neon-blue">{score}</div>
            <div className="font-rajdhani text-xs uppercase tracking-widest text-gray-400">Score</div>
          </div>
          <div className="score-card text-center px-6 py-3">
            <div className="font-orbitron text-2xl font-bold text-yellow-400">{best}</div>
            <div className="font-rajdhani text-xs uppercase tracking-widest text-gray-400">Best</div>
          </div>
        </div>

        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            onClick={flap}
            className="cursor-pointer rounded-xl border border-neon-blue/20"
            style={{ boxShadow: '0 0 30px rgba(0,212,255,0.1)', maxWidth: '100%' }}
          />
        </div>

        <div className="mt-4 text-center font-rajdhani text-xs text-gray-600">
          Click canvas or press Space to flap · Avoid the pipes!
        </div>

        {phase === 'dead' && (
          <div className="mt-3 flex justify-center">
            <button
              onClick={flap}
              className="font-orbitron text-sm px-6 py-2 rounded-lg border border-neon-blue/60 bg-neon-blue/10 text-neon-blue hover:bg-neon-blue/20 transition-all tracking-wider"
            >
              PLAY AGAIN
            </button>
          </div>
        )}
        {phase === 'idle' && (
          <div className="mt-3 flex justify-center">
            <button
              onClick={flap}
              className="font-orbitron text-sm px-6 py-2 rounded-lg border border-neon-blue/60 bg-neon-blue/10 text-neon-blue hover:bg-neon-blue/20 transition-all tracking-wider"
            >
              START GAME
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

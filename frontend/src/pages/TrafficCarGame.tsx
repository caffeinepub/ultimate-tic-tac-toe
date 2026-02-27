import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import SoundToggle from '../components/SoundToggle';
import DifficultySelector, { Difficulty } from '../components/DifficultySelector';
import { useSoundManager } from '../hooks/useSoundManager';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Car {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  lane: number;
  speed: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CANVAS_W = 360;
const CANVAS_H = 600;
const LANE_COUNT = 4;
const LANE_W = CANVAS_W / LANE_COUNT;
const PLAYER_W = 40;
const PLAYER_H = 70;
const ENEMY_W = 38;
const ENEMY_H = 65;

const ENEMY_COLORS = ['#ff4444', '#ff8800', '#ffcc00', '#cc44ff', '#44ffcc', '#ff44aa'];

// Difficulty configs
const DIFFICULTY_CONFIG: Record<Difficulty, {
  baseSpeed: number;
  spawnInterval: number;
  maxCars: number;
  speedMultiplierRate: number;
}> = {
  easy: {
    baseSpeed: 2.5,
    spawnInterval: 120,
    maxCars: 3,
    speedMultiplierRate: 0.0003,
  },
  medium: {
    baseSpeed: 4,
    spawnInterval: 80,
    maxCars: 5,
    speedMultiplierRate: 0.0005,
  },
  hard: {
    baseSpeed: 6,
    spawnInterval: 45,
    maxCars: 8,
    speedMultiplierRate: 0.0008,
  },
};

const difficultyLabels: Record<Difficulty, { label: string; color: string }> = {
  easy: { label: 'EASY', color: 'text-green-400' },
  medium: { label: 'MEDIUM', color: 'text-yellow-400' },
  hard: { label: 'HARD', color: 'text-red-400' },
};

// ─── Component ────────────────────────────────────────────────────────────────
const TrafficCarGame: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try { return parseInt(localStorage.getItem('traffic-high-score') || '0', 10); } catch { return 0; }
  });
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'dead'>('idle');
  const { playScore, playGameOver, playSpecial, playClick } = useSoundManager();

  // Game refs
  const gameStateRef = useRef<'idle' | 'playing' | 'dead'>('idle');
  const playerRef = useRef({ x: CANVAS_W / 2 - PLAYER_W / 2, y: CANVAS_H - PLAYER_H - 20 });
  const carsRef = useRef<Car[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const scoreRef = useRef(0);
  const frameRef = useRef(0);
  const speedMultRef = useRef(1);
  const rafRef = useRef<number | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const laneOffsetRef = useRef(0);
  const carIdRef = useRef(0);
  const difficultyRef = useRef<Difficulty>('medium');
  const lastMilestoneRef = useRef(0);

  // Web Audio engine sound
  const audioCtxRef = useRef<AudioContext | null>(null);
  const engineOscRef = useRef<OscillatorNode | null>(null);
  const engineGainRef = useRef<GainNode | null>(null);

  const startEngineSound = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (engineOscRef.current) {
        engineOscRef.current.stop();
        engineOscRef.current = null;
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      engineOscRef.current = osc;
      engineGainRef.current = gain;
    } catch { /* ignore */ }
  }, []);

  const stopEngineSound = useCallback(() => {
    try {
      if (engineOscRef.current) {
        engineOscRef.current.stop();
        engineOscRef.current = null;
      }
    } catch { /* ignore */ }
  }, []);

  const drawCar = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, isPlayer: boolean) => {
    // Body
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = isPlayer ? 16 : 8;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Windows
    ctx.fillStyle = isPlayer ? 'rgba(0,212,255,0.5)' : 'rgba(0,0,0,0.5)';
    ctx.fillRect(x + w * 0.15, y + h * 0.15, w * 0.7, h * 0.2);
    ctx.fillRect(x + w * 0.15, y + h * 0.45, w * 0.7, h * 0.2);

    // Wheels
    ctx.fillStyle = '#111';
    ctx.fillRect(x - 4, y + h * 0.1, 6, h * 0.2);
    ctx.fillRect(x + w - 2, y + h * 0.1, 6, h * 0.2);
    ctx.fillRect(x - 4, y + h * 0.65, 6, h * 0.2);
    ctx.fillRect(x + w - 2, y + h * 0.65, 6, h * 0.2);

    if (isPlayer) {
      // Headlights
      ctx.fillStyle = '#ffffaa';
      ctx.shadowColor = '#ffff00';
      ctx.shadowBlur = 10;
      ctx.fillRect(x + 4, y + 4, 8, 5);
      ctx.fillRect(x + w - 12, y + 4, 8, 5);
      ctx.shadowBlur = 0;
    }
  }, []);

  const drawRoad = useCallback((ctx: CanvasRenderingContext2D) => {
    // Road background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Lane dividers
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.setLineDash([30, 20]);
    ctx.lineDashOffset = -laneOffsetRef.current;
    for (let i = 1; i < LANE_COUNT; i++) {
      ctx.beginPath();
      ctx.moveTo(i * LANE_W, 0);
      ctx.lineTo(i * LANE_W, CANVAS_H);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Road edges
    ctx.strokeStyle = 'rgba(255,200,0,0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(2, 0); ctx.lineTo(2, CANVAS_H);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(CANVAS_W - 2, 0); ctx.lineTo(CANVAS_W - 2, CANVAS_H);
    ctx.stroke();
  }, []);

  const spawnCar = useCallback(() => {
    const config = DIFFICULTY_CONFIG[difficultyRef.current];
    const lane = Math.floor(Math.random() * LANE_COUNT);
    const x = lane * LANE_W + (LANE_W - ENEMY_W) / 2;
    const color = ENEMY_COLORS[Math.floor(Math.random() * ENEMY_COLORS.length)];
    const speed = config.baseSpeed * speedMultRef.current * (0.8 + Math.random() * 0.4);
    carsRef.current.push({
      id: carIdRef.current++,
      x, y: -ENEMY_H - 10,
      width: ENEMY_W, height: ENEMY_H,
      color, lane, speed,
    });
  }, []);

  const gameLoop = useCallback(() => {
    if (gameStateRef.current !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    frameRef.current++;
    const config = DIFFICULTY_CONFIG[difficultyRef.current];

    // Speed increase
    speedMultRef.current += config.speedMultiplierRate;

    // Update engine sound pitch
    if (engineOscRef.current && audioCtxRef.current) {
      engineOscRef.current.frequency.setValueAtTime(
        80 + speedMultRef.current * 20,
        audioCtxRef.current.currentTime
      );
    }

    // Lane scroll
    laneOffsetRef.current = (laneOffsetRef.current + speedMultRef.current * 2) % 50;

    // Player movement
    const player = playerRef.current;
    const moveSpeed = 4;
    if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a') || keysRef.current.has('A')) {
      player.x = Math.max(0, player.x - moveSpeed);
    }
    if (keysRef.current.has('ArrowRight') || keysRef.current.has('d') || keysRef.current.has('D')) {
      player.x = Math.min(CANVAS_W - PLAYER_W, player.x + moveSpeed);
    }

    // Spawn cars
    if (frameRef.current % config.spawnInterval === 0 && carsRef.current.length < config.maxCars) {
      spawnCar();
    }

    // Update cars
    carsRef.current = carsRef.current.filter(car => {
      car.y += car.speed * speedMultRef.current;
      return car.y < CANVAS_H + ENEMY_H;
    });

    // Score
    const newScore = Math.floor(frameRef.current / 10);
    if (newScore !== scoreRef.current) {
      scoreRef.current = newScore;
      setScore(newScore);

      // Milestone sounds every 50 points
      if (newScore > 0 && newScore % 50 === 0 && newScore !== lastMilestoneRef.current) {
        lastMilestoneRef.current = newScore;
        playScore();
      }
      // Special at 100, 200, 300...
      if (newScore > 0 && newScore % 100 === 0 && newScore !== lastMilestoneRef.current + 50) {
        playSpecial();
      }
    }

    // Collision detection
    const px = player.x, py = player.y;
    for (const car of carsRef.current) {
      if (
        px < car.x + car.width - 4 &&
        px + PLAYER_W > car.x + 4 &&
        py < car.y + car.height - 4 &&
        py + PLAYER_H > car.y + 4
      ) {
        // Crash!
        gameStateRef.current = 'dead';
        setGameState('dead');
        stopEngineSound();
        playGameOver();

        // Particles
        for (let i = 0; i < 30; i++) {
          particlesRef.current.push({
            x: px + PLAYER_W / 2,
            y: py + PLAYER_H / 2,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 1,
            color: ['#ff4444', '#ff8800', '#ffff00'][Math.floor(Math.random() * 3)],
          });
        }

        // High score
        const hs = parseInt(localStorage.getItem('traffic-high-score') || '0', 10);
        if (scoreRef.current > hs) {
          localStorage.setItem('traffic-high-score', String(scoreRef.current));
          setHighScore(scoreRef.current);
          playSpecial();
        }
        break;
      }
    }

    // Update particles
    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.life -= 0.03;
      return p.life > 0;
    });

    // Draw
    drawRoad(ctx);

    // Draw particles
    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
    });
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Draw enemy cars
    carsRef.current.forEach(car => {
      drawCar(ctx, car.x, car.y, car.width, car.height, car.color, false);
    });

    // Draw player
    if (gameStateRef.current !== 'dead') {
      drawCar(ctx, player.x, player.y, PLAYER_W, PLAYER_H, '#00d4ff', true);
    }

    // Dead overlay
    if (gameStateRef.current === 'dead') {
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 22px Orbitron, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', CANVAS_W / 2, CANVAS_H / 2 - 20);
      ctx.fillStyle = '#00d4ff';
      ctx.font = '13px Orbitron, monospace';
      ctx.fillText(`Score: ${scoreRef.current}`, CANVAS_W / 2, CANVAS_H / 2 + 10);
      ctx.fillStyle = '#aaa';
      ctx.font = '11px Rajdhani, monospace';
      ctx.fillText('Tap Restart to play again', CANVAS_W / 2, CANVAS_H / 2 + 35);
    }

    rafRef.current = requestAnimationFrame(gameLoop);
  }, [drawRoad, drawCar, spawnCar, stopEngineSound, playGameOver, playScore, playSpecial]);

  const startGame = useCallback((diff: Difficulty) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    difficultyRef.current = diff;
    playerRef.current = { x: CANVAS_W / 2 - PLAYER_W / 2, y: CANVAS_H - PLAYER_H - 20 };
    carsRef.current = [];
    particlesRef.current = [];
    scoreRef.current = 0;
    frameRef.current = 0;
    speedMultRef.current = 1;
    laneOffsetRef.current = 0;
    lastMilestoneRef.current = 0;
    setScore(0);
    gameStateRef.current = 'playing';
    setGameState('playing');
    startEngineSound();
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop, startEngineSound]);

  const handleSelectDifficulty = useCallback((d: Difficulty) => {
    playClick();
    setDifficulty(d);
    startGame(d);
  }, [playClick, startGame]);

  const handleRestart = useCallback(() => {
    playClick();
    stopEngineSound();
    setDifficulty(null);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    gameStateRef.current = 'idle';
    setGameState('idle');
  }, [playClick, stopEngineSound]);

  // Keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // Touch controls
  const touchStartX = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 5) {
      playerRef.current.x = Math.max(0, Math.min(CANVAS_W - PLAYER_W, playerRef.current.x + dx * 0.3));
      touchStartX.current = e.touches[0].clientX;
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      stopEngineSound();
    };
  }, [stopEngineSound]);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Difficulty Selector */}
      {!difficulty && (
        <DifficultySelector
          gameTitle="Traffic Rush"
          gameIcon="🚗"
          onSelect={handleSelectDifficulty}
          descriptions={{
            easy: 'Slow traffic, fewer cars',
            medium: 'Normal traffic flow',
            hard: 'Fast & dense traffic!',
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
          <h1 className="font-orbitron text-white text-sm tracking-widest">TRAFFIC RUSH</h1>
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

      {/* Canvas */}
      <main className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
        <div
          className="relative border border-neon-blue/30 shadow-[0_0_20px_rgba(0,212,255,0.15)]"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="block"
          />
        </div>

        {gameState === 'dead' && (
          <button
            onClick={handleRestart}
            className="font-orbitron text-sm px-6 py-2 rounded-lg border border-neon-blue/60 bg-neon-blue/10 text-neon-blue hover:bg-neon-blue/20 transition-all tracking-wider"
          >
            RESTART
          </button>
        )}

        <p className="font-rajdhani text-gray-600 text-xs tracking-wider text-center">
          Arrow keys / A-D to steer • Touch and drag on mobile
        </p>
      </main>
    </div>
  );
};

export default TrafficCarGame;

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 560;
const LANE_COUNT = 4;
const ROAD_LEFT = 30;
const ROAD_RIGHT = CANVAS_WIDTH - 30;
const ROAD_WIDTH = ROAD_RIGHT - ROAD_LEFT;
const LANE_WIDTH = ROAD_WIDTH / LANE_COUNT;

const PLAYER_WIDTH = 36;
const PLAYER_HEIGHT = 60;
const TRAFFIC_WIDTH = 36;
const TRAFFIC_HEIGHT = 60;

const TRAFFIC_COLORS = ['#ff4444', '#ff8800', '#ffcc00', '#44ff88', '#4488ff', '#cc44ff'];
const PLAYER_COLOR = '#00e5ff';

interface TrafficCar {
  id: number;
  x: number;
  y: number;
  speed: number;
  color: string;
  lane: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 0..1
  color: string;
  size: number;
}

interface TrailPoint {
  x: number;
  y: number;
  age: number; // ms
}

interface BgLight {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  speed: number;
  color: string;
}

function getLaneCenterX(lane: number): number {
  return ROAD_LEFT + lane * LANE_WIDTH + LANE_WIDTH / 2;
}

function getRandomLane(): number {
  return Math.floor(Math.random() * LANE_COUNT);
}

function createBgLights(): BgLight[] {
  const colors = ['#00e5ff', '#cc44ff', '#4488ff', '#44ff88', '#ff8800'];
  const lights: BgLight[] = [];
  for (let i = 0; i < 12; i++) {
    lights.push({
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * CANVAS_HEIGHT,
      radius: 15 + Math.random() * 35,
      opacity: 0.03 + Math.random() * 0.07,
      speed: 0.5 + Math.random() * 2.5,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }
  return lights;
}

// Web Audio API engine sound
function createEngineSound(ctx: AudioContext): { start: () => void; stop: () => void; setSpeed: (s: number) => void } {
  let oscillator: OscillatorNode | null = null;
  let gainNode: GainNode | null = null;
  let noiseSource: AudioBufferSourceNode | null = null;
  let noiseGain: GainNode | null = null;
  let filterNode: BiquadFilterNode | null = null;
  let running = false;

  function start() {
    if (running) return;
    running = true;

    // Low rumble oscillator
    oscillator = ctx.createOscillator();
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(55, ctx.currentTime);

    gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.04, ctx.currentTime);

    // Noise for texture
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    filterNode = ctx.createBiquadFilter();
    filterNode.type = 'lowpass';
    filterNode.frequency.setValueAtTime(200, ctx.currentTime);

    noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.015, ctx.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    noiseSource.connect(filterNode);
    filterNode.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    oscillator.start();
    noiseSource.start();
  }

  function stop() {
    running = false;
    try {
      oscillator?.stop();
      noiseSource?.stop();
    } catch (_) { /* ignore */ }
    oscillator?.disconnect();
    gainNode?.disconnect();
    noiseSource?.disconnect();
    filterNode?.disconnect();
    noiseGain?.disconnect();
    oscillator = null;
    gainNode = null;
    noiseSource = null;
    filterNode = null;
    noiseGain = null;
  }

  function setSpeed(speed: number) {
    if (!oscillator || !gainNode || !filterNode) return;
    const freq = 55 + speed * 18;
    oscillator.frequency.setTargetAtTime(freq, ctx.currentTime, 0.1);
    filterNode.frequency.setTargetAtTime(150 + speed * 60, ctx.currentTime, 0.1);
  }

  return { start, stop, setSpeed };
}

export function TrafficCarGame() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Game state refs
  const playerXRef = useRef(getLaneCenterX(1));
  const playerLaneRef = useRef(1);
  const trafficCarsRef = useRef<TrafficCar[]>([]);
  const gameOverRef = useRef(false);
  const scoreRef = useRef(0);
  const frameRef = useRef<number>(0);
  const lastSpawnRef = useRef(0);
  const lastScoreTickRef = useRef(0);
  const carIdRef = useRef(0);
  const keysRef = useRef<Set<string>>(new Set());
  const moveCooldownRef = useRef(0);

  // Speed multiplier (increases over time)
  const speedMultiplierRef = useRef(1.0);

  // Road scroll offset
  const roadOffsetRef = useRef(0);

  // Trail points
  const trailRef = useRef<TrailPoint[]>([]);
  const lastTrailTimeRef = useRef(0);

  // Particles
  const particlesRef = useRef<Particle[]>([]);

  // Background lights
  const bgLightsRef = useRef<BgLight[]>(createBgLights());

  // Audio
  const audioCtxRef = useRef<AudioContext | null>(null);
  const engineRef = useRef<ReturnType<typeof createEngineSound> | null>(null);

  // Crash state
  const crashPosRef = useRef<{ x: number; y: number } | null>(null);
  const crashTimeRef = useRef<number>(0);

  // React state for UI
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = parseInt(localStorage.getItem('trafficCarHighScore') ?? '0', 10);
    return isNaN(saved) ? 0 : saved;
  });
  const [isGameOver, setIsGameOver] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [scoreAnimKey, setScoreAnimKey] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [crashParticles, setCrashParticles] = useState<Particle[]>([]);
  const [showExplosion, setShowExplosion] = useState(false);
  const [explosionPos, setExplosionPos] = useState({ x: 0, y: 0 });

  const drawBgLights = useCallback((ctx: CanvasRenderingContext2D) => {
    const lights = bgLightsRef.current;
    for (const light of lights) {
      const grad = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, light.radius);
      grad.addColorStop(0, light.color + Math.round(light.opacity * 255).toString(16).padStart(2, '0'));
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(light.x, light.y, light.radius, light.radius * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }, []);

  const drawRoad = useCallback((ctx: CanvasRenderingContext2D, offset: number) => {
    // Background
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Background moving lights (behind road)
    drawBgLights(ctx);

    // Grass / side areas
    ctx.fillStyle = '#0d1a0d';
    ctx.fillRect(0, 0, ROAD_LEFT, CANVAS_HEIGHT);
    ctx.fillRect(ROAD_RIGHT, 0, CANVAS_WIDTH - ROAD_RIGHT, CANVAS_HEIGHT);

    // Road surface
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(ROAD_LEFT, 0, ROAD_WIDTH, CANVAS_HEIGHT);

    // Road edges
    ctx.strokeStyle = '#ffffff44';
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(ROAD_LEFT, 0);
    ctx.lineTo(ROAD_LEFT, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ROAD_RIGHT, 0);
    ctx.lineTo(ROAD_RIGHT, CANVAS_HEIGHT);
    ctx.stroke();

    // Lane dividers (dashed, scrolling)
    ctx.strokeStyle = '#ffffff22';
    ctx.lineWidth = 2;
    const dashLen = 30;
    const gapLen = 20;
    const period = dashLen + gapLen;
    for (let i = 1; i < LANE_COUNT; i++) {
      const x = ROAD_LEFT + i * LANE_WIDTH;
      ctx.beginPath();
      // Start from a negative offset so dashes scroll smoothly
      let y = (offset % period) - period;
      while (y < CANVAS_HEIGHT) {
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + dashLen);
        y += period;
      }
      ctx.setLineDash([]);
      ctx.stroke();
    }
  }, [drawBgLights]);

  const drawTrail = useCallback((ctx: CanvasRenderingContext2D, now: number) => {
    const trail = trailRef.current;
    const maxAge = 400; // ms
    for (const pt of trail) {
      const age = now - pt.age;
      if (age > maxAge) continue;
      const alpha = 1 - age / maxAge;
      const size = PLAYER_WIDTH * 0.35 * alpha;
      const grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, size * 2);
      grad.addColorStop(0, `rgba(0,229,255,${alpha * 0.7})`);
      grad.addColorStop(0.5, `rgba(100,100,255,${alpha * 0.3})`);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y, size, size * 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }, []);

  const drawCar = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    isPlayer: boolean
  ) => {
    const w = isPlayer ? PLAYER_WIDTH : TRAFFIC_WIDTH;
    const h = isPlayer ? PLAYER_HEIGHT : TRAFFIC_HEIGHT;
    const cx = x - w / 2;
    const cy = y - h / 2;

    // Car body
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = isPlayer ? 18 : 10;
    ctx.beginPath();
    ctx.roundRect(cx, cy, w, h, 6);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Windshield
    ctx.fillStyle = isPlayer ? 'rgba(0,229,255,0.3)' : 'rgba(255,255,255,0.2)';
    const ww = w * 0.6;
    const wh = h * 0.22;
    const wx = cx + (w - ww) / 2;
    const wy = isPlayer ? cy + h * 0.12 : cy + h * 0.62;
    ctx.beginPath();
    ctx.roundRect(wx, wy, ww, wh, 3);
    ctx.fill();

    // Headlights / taillights
    const lightColor = isPlayer ? '#00e5ff' : '#ff4444';
    ctx.fillStyle = lightColor;
    ctx.shadowColor = lightColor;
    ctx.shadowBlur = 8;
    const ly = isPlayer ? cy + h - 8 : cy + 4;
    ctx.fillRect(cx + 4, ly, 8, 5);
    ctx.fillRect(cx + w - 12, ly, 8, 5);
    ctx.shadowBlur = 0;
  }, []);

  const drawParticles = useCallback((ctx: CanvasRenderingContext2D, now: number) => {
    const particles = particlesRef.current;
    for (const p of particles) {
      if (p.life <= 0) continue;
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }, []);

  const spawnParticles = useCallback((x: number, y: number) => {
    const colors = ['#ff4444', '#ff8800', '#ffcc00', '#00e5ff', '#ffffff'];
    const newParticles: Particle[] = [];
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16 + (Math.random() - 0.5) * 0.5;
      const speed = 2 + Math.random() * 5;
      newParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 4,
      });
    }
    particlesRef.current = newParticles;
  }, []);

  const checkCollision = useCallback((px: number, py: number, cars: TrafficCar[]): boolean => {
    const pw = PLAYER_WIDTH - 4;
    const ph = PLAYER_HEIGHT - 4;
    for (const car of cars) {
      const tw = TRAFFIC_WIDTH - 4;
      const th = TRAFFIC_HEIGHT - 4;
      if (
        Math.abs(px - car.x) < (pw + tw) / 2 &&
        Math.abs(py - car.y) < (ph + th) / 2
      ) {
        return true;
      }
    }
    return false;
  }, []);

  const gameLoop = useCallback((timestamp: number) => {
    if (gameOverRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Gradually increase speed multiplier
    speedMultiplierRef.current = 1.0 + scoreRef.current * 0.04;

    // Handle keyboard input
    if (moveCooldownRef.current > 0) {
      moveCooldownRef.current -= 1;
    } else {
      if (keysRef.current.has('ArrowLeft') && playerLaneRef.current > 0) {
        playerLaneRef.current -= 1;
        playerXRef.current = getLaneCenterX(playerLaneRef.current);
        moveCooldownRef.current = 12;
      } else if (keysRef.current.has('ArrowRight') && playerLaneRef.current < LANE_COUNT - 1) {
        playerLaneRef.current += 1;
        playerXRef.current = getLaneCenterX(playerLaneRef.current);
        moveCooldownRef.current = 12;
      }
    }

    const playerY = CANVAS_HEIGHT - 90;

    // Update road scroll offset
    const roadScrollSpeed = 3 * speedMultiplierRef.current;
    roadOffsetRef.current = (roadOffsetRef.current + roadScrollSpeed) % (30 + 20);

    // Update background lights
    const lights = bgLightsRef.current;
    for (const light of lights) {
      light.y += light.speed * speedMultiplierRef.current;
      if (light.y - light.radius > CANVAS_HEIGHT) {
        light.y = -light.radius;
        light.x = ROAD_LEFT + Math.random() * ROAD_WIDTH;
      }
    }

    // Spawn traffic cars
    const spawnInterval = Math.max(500, 1800 - scoreRef.current * 15) / speedMultiplierRef.current;
    if (timestamp - lastSpawnRef.current > spawnInterval) {
      const lane = getRandomLane();
      const baseSpeed = (2.5 + Math.random() * 1.5) * speedMultiplierRef.current;
      trafficCarsRef.current.push({
        id: carIdRef.current++,
        x: getLaneCenterX(lane),
        y: -TRAFFIC_HEIGHT,
        speed: baseSpeed,
        color: TRAFFIC_COLORS[Math.floor(Math.random() * TRAFFIC_COLORS.length)],
        lane,
      });
      lastSpawnRef.current = timestamp;
    }

    // Move traffic cars
    trafficCarsRef.current = trafficCarsRef.current
      .map((car) => ({ ...car, y: car.y + car.speed }))
      .filter((car) => car.y < CANVAS_HEIGHT + TRAFFIC_HEIGHT);

    // Score tick (every ~1 second at 60fps)
    if (timestamp - lastScoreTickRef.current > 1000) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
      setScoreAnimKey((k) => k + 1);
      lastScoreTickRef.current = timestamp;
    }

    // Update engine sound speed
    if (engineRef.current) {
      engineRef.current.setSpeed(speedMultiplierRef.current);
    }

    // Collision detection
    if (checkCollision(playerXRef.current, playerY, trafficCarsRef.current)) {
      gameOverRef.current = true;
      const finalSc = scoreRef.current;
      setFinalScore(finalSc);
      setIsGameOver(true);

      // Trigger crash effects
      spawnParticles(playerXRef.current, playerY);
      crashPosRef.current = { x: playerXRef.current, y: playerY };
      crashTimeRef.current = timestamp;

      // Canvas rect for explosion overlay position
      const rect = canvas.getBoundingClientRect();
      const scaleX = rect.width / CANVAS_WIDTH;
      const scaleY = rect.height / CANVAS_HEIGHT;
      setExplosionPos({
        x: playerXRef.current * scaleX,
        y: playerY * scaleY,
      });
      setShowExplosion(true);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 600);
      setTimeout(() => setShowExplosion(false), 700);

      // Stop engine sound
      engineRef.current?.stop();

      setHighScore((prev) => {
        if (finalSc > prev) {
          localStorage.setItem('trafficCarHighScore', String(finalSc));
          return finalSc;
        }
        return prev;
      });
      return;
    }

    // Update trail
    if (timestamp - lastTrailTimeRef.current > 30) {
      trailRef.current.push({ x: playerXRef.current, y: playerY + PLAYER_HEIGHT / 2, age: timestamp });
      lastTrailTimeRef.current = timestamp;
    }
    // Remove old trail points
    trailRef.current = trailRef.current.filter((pt) => timestamp - pt.age < 500);

    // Update particles
    particlesRef.current = particlesRef.current
      .map((p) => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        vy: p.vy + 0.15,
        life: p.life - 0.025,
      }))
      .filter((p) => p.life > 0);

    // Draw
    drawRoad(ctx, roadOffsetRef.current);
    drawTrail(ctx, timestamp);
    trafficCarsRef.current.forEach((car) => drawCar(ctx, car.x, car.y, car.color, false));
    drawCar(ctx, playerXRef.current, playerY, PLAYER_COLOR, true);
    drawParticles(ctx, timestamp);

    frameRef.current = requestAnimationFrame(gameLoop);
  }, [drawRoad, drawCar, drawTrail, drawParticles, checkCollision, spawnParticles]);

  const startGame = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    playerLaneRef.current = 1;
    playerXRef.current = getLaneCenterX(1);
    trafficCarsRef.current = [];
    gameOverRef.current = false;
    scoreRef.current = 0;
    lastSpawnRef.current = 0;
    lastScoreTickRef.current = 0;
    moveCooldownRef.current = 0;
    speedMultiplierRef.current = 1.0;
    roadOffsetRef.current = 0;
    trailRef.current = [];
    particlesRef.current = [];
    bgLightsRef.current = createBgLights();
    setScore(0);
    setIsGameOver(false);
    setIsStarted(true);
    setShowExplosion(false);
    setIsShaking(false);

    // Initialize / restart audio
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioContext();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      engineRef.current?.stop();
      engineRef.current = createEngineSound(audioCtxRef.current);
      engineRef.current.start();
    } catch (_) { /* audio not available */ }

    frameRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  // Draw idle screen
  const drawIdle = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawRoad(ctx, 0);
    drawCar(ctx, getLaneCenterX(1), CANVAS_HEIGHT - 90, PLAYER_COLOR, true);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, CANVAS_HEIGHT / 2 - 50, CANVAS_WIDTH, 100);
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 18px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TRAFFIC CAR', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 15);
    ctx.fillStyle = '#ffffff88';
    ctx.font = '13px Rajdhani, sans-serif';
    ctx.fillText('Press START to play', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 15);
    ctx.textAlign = 'left';
  }, [drawRoad, drawCar]);

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        keysRef.current.add(e.key);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Initial draw
  useEffect(() => {
    drawIdle();
    return () => {
      cancelAnimationFrame(frameRef.current);
      engineRef.current?.stop();
      try { audioCtxRef.current?.close(); } catch (_) { /* ignore */ }
    };
  }, [drawIdle]);

  const handleMobileLeft = () => {
    if (gameOverRef.current || !isStarted) return;
    if (playerLaneRef.current > 0) {
      playerLaneRef.current -= 1;
      playerXRef.current = getLaneCenterX(playerLaneRef.current);
      moveCooldownRef.current = 12;
    }
  };

  const handleMobileRight = () => {
    if (gameOverRef.current || !isStarted) return;
    if (playerLaneRef.current < LANE_COUNT - 1) {
      playerLaneRef.current += 1;
      playerXRef.current = getLaneCenterX(playerLaneRef.current);
      moveCooldownRef.current = 12;
    }
  };

  return (
    <div className="min-h-screen bg-grid-pattern flex flex-col">
      {/* Ambient glow */}
      <div
        className="fixed top-1/3 left-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, oklch(0.78 0.2 185 / 0.07) 0%, transparent 70%)',
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
          style={{ color: 'oklch(0.88 0.2 185)' }}
        >
          TRAFFIC CAR
        </span>
        <div className="w-24" />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-4 gap-4">
        {/* Score display */}
        <div className="flex gap-6">
          <div
            className="px-5 py-2 rounded-xl text-center"
            style={{ background: 'oklch(0.12 0.02 265)', border: '1px solid oklch(0.78 0.2 185 / 0.3)' }}
          >
            <div className="font-rajdhani text-xs text-muted-foreground tracking-widest uppercase">Score</div>
            <div
              key={scoreAnimKey}
              className="font-orbitron font-black text-2xl score-pop"
              style={{ color: 'oklch(0.88 0.2 185)', textShadow: '0 0 10px oklch(0.78 0.2 185 / 0.8)' }}
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

        {/* Canvas container */}
        <div
          ref={containerRef}
          className={`relative${isShaking ? ' traffic-shake' : ''}`}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="rounded-2xl"
            style={{
              border: '2px solid oklch(0.78 0.2 185 / 0.4)',
              boxShadow: '0 0 30px oklch(0.78 0.2 185 / 0.2)',
              maxWidth: '100%',
              display: 'block',
            }}
          />

          {/* Explosion overlay */}
          {showExplosion && (
            <div
              className="traffic-explosion pointer-events-none"
              style={{
                position: 'absolute',
                left: explosionPos.x,
                top: explosionPos.y,
                transform: 'translate(-50%, -50%)',
                width: 80,
                height: 80,
              }}
            />
          )}

          {/* Game Over Overlay */}
          {isGameOver && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl gap-4"
              style={{ background: 'rgba(0,0,0,0.82)' }}
            >
              <div
                className="font-orbitron font-black text-3xl"
                style={{ color: 'oklch(0.75 0.25 25)', textShadow: '0 0 20px oklch(0.65 0.25 25 / 0.8)' }}
              >
                GAME OVER
              </div>
              <div className="font-rajdhani text-lg text-muted-foreground">
                Score: <span style={{ color: 'oklch(0.88 0.2 185)' }} className="font-bold">{finalScore}</span>
              </div>
              {finalScore >= highScore && finalScore > 0 && (
                <div
                  className="font-orbitron text-sm tracking-wider"
                  style={{ color: 'oklch(0.85 0.22 200)' }}
                >
                  🏆 NEW HIGH SCORE!
                </div>
              )}
              <button
                onClick={startGame}
                className="flex items-center gap-2 font-orbitron font-bold text-sm tracking-wider px-6 py-3 rounded-xl transition-all duration-300 mt-2"
                style={{
                  background: 'oklch(0.78 0.2 185 / 0.15)',
                  border: '2px solid oklch(0.78 0.2 185 / 0.6)',
                  color: 'oklch(0.88 0.2 185)',
                }}
              >
                <RotateCcw size={16} />
                RESTART
              </button>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-3 w-full max-w-xs">
          {!isStarted && !isGameOver && (
            <button
              onClick={startGame}
              className="w-full py-3 font-orbitron font-bold text-sm tracking-wider rounded-xl transition-all duration-300"
              style={{
                background: 'oklch(0.78 0.2 185 / 0.15)',
                border: '2px solid oklch(0.78 0.2 185 / 0.6)',
                color: 'oklch(0.88 0.2 185)',
                boxShadow: '0 0 15px oklch(0.78 0.2 185 / 0.3)',
              }}
            >
              ▶ START GAME
            </button>
          )}

          {/* Mobile controls */}
          <div className="flex gap-4 w-full">
            <button
              onPointerDown={handleMobileLeft}
              className="flex-1 py-4 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-95 select-none"
              style={{
                background: 'oklch(0.78 0.2 185 / 0.1)',
                border: '1px solid oklch(0.78 0.2 185 / 0.4)',
                color: 'oklch(0.88 0.2 185)',
              }}
            >
              <ChevronLeft size={28} />
            </button>
            <button
              onPointerDown={handleMobileRight}
              className="flex-1 py-4 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-95 select-none"
              style={{
                background: 'oklch(0.78 0.2 185 / 0.1)',
                border: '1px solid oklch(0.78 0.2 185 / 0.4)',
                color: 'oklch(0.88 0.2 185)',
              }}
            >
              <ChevronRight size={28} />
            </button>
          </div>

          <p className="font-rajdhani text-xs text-muted-foreground text-center tracking-wide">
            Use ← → arrow keys or tap buttons to change lanes
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

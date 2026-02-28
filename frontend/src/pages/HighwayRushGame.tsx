import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { ArrowLeft, RotateCcw, Trophy } from 'lucide-react';
import DifficultySelector, { Difficulty, CarType, CAR_TYPES, CarTypeConfig } from '../components/DifficultySelector';
import { unlockAchievement } from '../utils/achievements';
import { useHighwayRushSound } from '../hooks/useHighwayRushSound';
import HighwayRushLeaderboard from '../components/HighwayRushLeaderboard';
import InterstitialAd from '../components/InterstitialAd';
import RewardedAd from '../components/RewardedAd';

// ─── Car color map (CarTypeConfig has no color field) ─────────────────────────
const CAR_COLOR_MAP: Record<CarType, string> = {
  muscle:  '#e53935',
  sports:  '#1565c0',
  truck:   '#2e7d32',
  compact: '#f9a825',
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface TrafficCar {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  speed: number;
  lane: number;
}

interface PlayerCar {
  x: number;
  y: number;
  width: number;
  height: number;
  targetX: number;
  lane: number;
}

interface LeaderboardEntry {
  score: number;
  difficulty: string;
  carType: string;
  date: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const ROAD_LEFT = 60;
const ROAD_RIGHT = 340;
const ROAD_WIDTH = ROAD_RIGHT - ROAD_LEFT;
const NUM_LANES = 4;
const LANE_WIDTH = ROAD_WIDTH / NUM_LANES;

const DIFFICULTY_SETTINGS: Record<Difficulty, { baseSpeed: number; spawnRate: number; speedIncrease: number }> = {
  easy:   { baseSpeed: 3,   spawnRate: 0.015, speedIncrease: 0.0003 },
  medium: { baseSpeed: 5,   spawnRate: 0.022, speedIncrease: 0.0005 },
  hard:   { baseSpeed: 8,   spawnRate: 0.030, speedIncrease: 0.0008 },
};

const TRAFFIC_COLORS = ['#ff4444', '#44ff44', '#ffff44', '#ff8844', '#44ffff', '#ff44ff'];

function getLaneX(lane: number): number {
  return ROAD_LEFT + lane * LANE_WIDTH + LANE_WIDTH / 2;
}

function saveLeaderboard(entries: LeaderboardEntry[]) {
  localStorage.setItem('highway_rush_leaderboard', JSON.stringify(entries));
}

function loadLeaderboard(): LeaderboardEntry[] {
  try {
    return JSON.parse(localStorage.getItem('highway_rush_leaderboard') || '[]');
  } catch {
    return [];
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
const HighwayRushGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  // UI state
  const [gamePhase, setGamePhase] = useState<'setup' | 'playing' | 'crashed' | 'gameover'>('setup');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [rewardedUsed, setRewardedUsed] = useState(false);
  const [showInterstitial, setShowInterstitial] = useState(false);

  // `muted` is the correct property name from useHighwayRushSound
  const { playScreech, playBonus, playGameOver: playSoundGameOver, muted } = useHighwayRushSound();

  // Game loop refs
  const animFrameRef = useRef<number>(0);
  const gameStateRef = useRef({
    phase: 'setup' as 'setup' | 'playing' | 'crashed' | 'gameover',
    score: 0,
    lives: 3,
    speed: 5,
    rewardedUsed: false,
    player: null as PlayerCar | null,
    traffic: [] as TrafficCar[],
    roadOffset: 0,
    spawnTimer: 0,
    difficulty: 'medium' as Difficulty,
    carType: 'sports' as CarType,
    carCfg: CAR_TYPES.find((c) => c.id === 'sports') as CarTypeConfig,
  });

  const loopRef = useRef<(ts: number) => void>(() => {});
  const lastTsRef = useRef<number>(0);

  // ── Draw helpers ─────────────────────────────────────────────────────────────
  const drawRoad = useCallback((ctx: CanvasRenderingContext2D, offset: number) => {
    // Background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Grass
    ctx.fillStyle = '#0d1f0d';
    ctx.fillRect(0, 0, ROAD_LEFT, CANVAS_HEIGHT);
    ctx.fillRect(ROAD_RIGHT, 0, CANVAS_WIDTH - ROAD_RIGHT, CANVAS_HEIGHT);

    // Road surface
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(ROAD_LEFT, 0, ROAD_WIDTH, CANVAS_HEIGHT);

    // Road edges
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ROAD_LEFT, 0);
    ctx.lineTo(ROAD_LEFT, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ROAD_RIGHT, 0);
    ctx.lineTo(ROAD_RIGHT, CANVAS_HEIGHT);
    ctx.stroke();

    // Lane dashes
    ctx.strokeStyle = '#ffffff44';
    ctx.lineWidth = 2;
    ctx.setLineDash([30, 20]);
    for (let i = 1; i < NUM_LANES; i++) {
      const x = ROAD_LEFT + i * LANE_WIDTH;
      ctx.beginPath();
      ctx.moveTo(x, -(offset % 50));
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }, []);

  const drawCar = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    w: number, h: number,
    color: string,
    isPlayer = false
  ) => {
    ctx.save();
    // Body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - h / 2, w, h, 4);
    ctx.fill();

    // Windshield
    ctx.fillStyle = isPlayer ? '#aaddff88' : '#ffffff33';
    const ww = w * 0.6;
    const wh = h * 0.25;
    ctx.fillRect(x - ww / 2, y - h / 2 + (isPlayer ? h * 0.1 : h * 0.55), ww, wh);

    // Headlights / taillights
    ctx.fillStyle = isPlayer ? '#ffff88' : '#ff4444';
    const lightY = isPlayer ? y + h / 2 - 6 : y - h / 2 + 4;
    ctx.fillRect(x - w / 2 + 4, lightY, 8, 5);
    ctx.fillRect(x + w / 2 - 12, lightY, 8, 5);

    // Neon glow for player
    if (isPlayer) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x - w / 2, y - h / 2, w, h, 4);
      ctx.stroke();
    }
    ctx.restore();
  }, []);

  // ── Game loop ─────────────────────────────────────────────────────────────────
  loopRef.current = (ts: number) => {
    const gs = gameStateRef.current;
    if (gs.phase !== 'playing') return;

    const delta = Math.min((ts - lastTsRef.current) / 1000, 0.05);
    lastTsRef.current = ts;

    const settings = DIFFICULTY_SETTINGS[gs.difficulty];
    gs.speed += settings.speedIncrease;
    gs.score += delta * 10 * (gs.difficulty === 'hard' ? 1.5 : gs.difficulty === 'medium' ? 1.2 : 1);
    gs.roadOffset += gs.speed;

    // Spawn traffic
    if (Math.random() < settings.spawnRate) {
      const lane = Math.floor(Math.random() * NUM_LANES);
      const carW = 36 + Math.random() * 10;
      const carH = 60 + Math.random() * 20;
      gs.traffic.push({
        x: getLaneX(lane),
        y: -carH,
        width: carW,
        height: carH,
        color: TRAFFIC_COLORS[Math.floor(Math.random() * TRAFFIC_COLORS.length)],
        speed: gs.speed * (0.4 + Math.random() * 0.4),
        lane,
      });
    }

    // Move traffic
    gs.traffic = gs.traffic.filter((car) => {
      car.y += gs.speed - car.speed * 0.5;
      return car.y < CANVAS_HEIGHT + 80;
    });

    // Player smooth movement
    if (gs.player) {
      gs.player.x += (gs.player.targetX - gs.player.x) * 0.18;

      // Collision detection
      for (const car of gs.traffic) {
        const px = gs.player.x, py = gs.player.y;
        const pw = gs.player.width, ph = gs.player.height;
        if (
          Math.abs(px - car.x) < (pw + car.width) / 2 - 4 &&
          Math.abs(py - car.y) < (ph + car.height) / 2 - 4
        ) {
          // Remove colliding car
          gs.traffic = gs.traffic.filter((c) => c !== car);
          gs.lives -= 1;
          playScreech();

          if (gs.lives <= 0) {
            gs.phase = 'gameover';
            playSoundGameOver();

            // Save score
            const entry: LeaderboardEntry = {
              score: Math.floor(gs.score),
              difficulty: gs.difficulty,
              carType: gs.carType,
              date: new Date().toLocaleDateString(),
            };
            const lb = loadLeaderboard();
            lb.push(entry);
            lb.sort((a, b) => b.score - a.score);
            saveLeaderboard(lb.slice(0, 10));

            // Achievements
            if (gs.score >= 1000) unlockAchievement('highway_1000');
            if (gs.score >= 5000) unlockAchievement('highway_5000');
            if (gs.score >= 10000) unlockAchievement('highway_10000');

            setGamePhase('gameover');
            setShowInterstitial(true);
          } else {
            gs.phase = 'crashed';
            setGamePhase('crashed');
          }

          setScore(Math.floor(gs.score));
          setLives(gs.lives);
          return;
        }
      }

      // Near-miss bonus
      for (const car of gs.traffic) {
        const dx = Math.abs(gs.player.x - car.x);
        const dy = Math.abs(gs.player.y - car.y);
        if (dx < 40 && dy < 80 && dx > 20) {
          gs.score += 0.5;
          playBonus();
        }
      }
    }

    // Draw
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    drawRoad(ctx, gs.roadOffset);

    // Draw traffic
    for (const car of gs.traffic) {
      drawCar(ctx, car.x, car.y, car.width, car.height, car.color);
    }

    // Draw player — use CAR_COLOR_MAP since CarTypeConfig has no color field
    if (gs.player) {
      const playerColor = CAR_COLOR_MAP[gs.carType] ?? '#00aaff';
      drawCar(ctx, gs.player.x, gs.player.y, gs.player.width, gs.player.height, playerColor, true);
    }

    // Score overlay on canvas
    ctx.fillStyle = '#ffffff99';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`${Math.floor(gs.score).toString().padStart(6, '0')}`, CANVAS_WIDTH / 2 - 28, 24);

    // Update React score periodically
    if (Math.floor(gs.score) % 50 === 0) {
      setScore(Math.floor(gs.score));
    }

    animFrameRef.current = requestAnimationFrame((t) => loopRef.current(t));
  };

  // ── Start game ────────────────────────────────────────────────────────────────
  const startGame = useCallback((diff: Difficulty, ct: CarType) => {
    const settings = DIFFICULTY_SETTINGS[diff];
    const carCfg = CAR_TYPES.find((c) => c.id === ct) ?? CAR_TYPES[3];

    const gs = gameStateRef.current;
    gs.phase = 'playing';
    gs.score = 0;
    gs.lives = 3;
    gs.speed = settings.baseSpeed;
    gs.rewardedUsed = false;
    gs.traffic = [];
    gs.roadOffset = 0;
    gs.spawnTimer = 0;
    gs.difficulty = diff;
    gs.carType = ct;
    gs.carCfg = carCfg;
    gs.player = {
      x: getLaneX(1),
      y: CANVAS_HEIGHT - 80,
      width: carCfg.width,
      height: carCfg.height,
      targetX: getLaneX(1),
      lane: 1,
    };

    setGamePhase('playing');
    setScore(0);
    setLives(3);
    setRewardedUsed(false);
    setShowInterstitial(false);

    lastTsRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame((t) => loopRef.current(t));
  }, []);

  // ── Resume after rewarded ad ──────────────────────────────────────────────────
  const resumeAfterReward = useCallback(() => {
    const gs = gameStateRef.current;
    gs.lives += 1;
    gs.rewardedUsed = true;
    gs.phase = 'playing';

    setLives(gs.lives);
    setRewardedUsed(true);
    setGamePhase('playing');

    lastTsRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame((t) => loopRef.current(t));
  }, []);

  // ── Continue after crash (no reward) ─────────────────────────────────────────
  const continueAfterCrash = useCallback(() => {
    const gs = gameStateRef.current;
    gs.phase = 'playing';
    setGamePhase('playing');
    lastTsRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame((t) => loopRef.current(t));
  }, []);

  // ── Keyboard controls ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const gs = gameStateRef.current;
      if (gs.phase !== 'playing' || !gs.player) return;

      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        gs.player.lane = Math.max(0, gs.player.lane - 1);
        gs.player.targetX = getLaneX(gs.player.lane);
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        gs.player.lane = Math.min(NUM_LANES - 1, gs.player.lane + 1);
        gs.player.targetX = getLaneX(gs.player.lane);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // ── Touch controls ────────────────────────────────────────────────────────────
  const touchStartXRef = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const gs = gameStateRef.current;
    if (gs.phase !== 'playing' || !gs.player) return;
    const dx = e.changedTouches[0].clientX - touchStartXRef.current;
    if (dx > 30) {
      gs.player.lane = Math.min(NUM_LANES - 1, gs.player.lane + 1);
      gs.player.targetX = getLaneX(gs.player.lane);
    } else if (dx < -30) {
      gs.player.lane = Math.max(0, gs.player.lane - 1);
      gs.player.targetX = getLaneX(gs.player.lane);
    }
  };

  // ── Cleanup ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  // ── Interstitial close → navigate home ───────────────────────────────────────
  const handleInterstitialClose = useCallback(() => {
    navigate({ to: '/' });
  }, [navigate]);

  // ── Lane buttons (mobile) ─────────────────────────────────────────────────────
  const moveLane = (dir: -1 | 1) => {
    const gs = gameStateRef.current;
    if (!gs.player) return;
    gs.player.lane = Math.max(0, Math.min(NUM_LANES - 1, gs.player.lane + dir));
    gs.player.targetX = getLaneX(gs.player.lane);
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-4 px-2">
      {/* Header */}
      <div className="w-full max-w-md flex items-center justify-between mb-3 px-1">
        <Link to="/" className="flex items-center gap-1 text-muted-foreground hover:text-foreground font-rajdhani text-sm transition-colors">
          <ArrowLeft size={14} /> Back
        </Link>
        <h1 className="font-orbitron font-bold text-lg text-neon-blue">HIGHWAY RUSH</h1>
        <button
          onClick={() => setShowLeaderboard(true)}
          className="flex items-center gap-1 text-muted-foreground hover:text-neon-blue font-rajdhani text-sm transition-colors"
        >
          <Trophy size={14} /> Scores
        </button>
      </div>

      {/* Lives HUD */}
      {(gamePhase === 'playing' || gamePhase === 'crashed') && (
        <div className="flex gap-2 mb-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full border ${
                i < lives
                  ? 'bg-neon-blue border-neon-blue shadow-[0_0_6px_#00aaff]'
                  : 'bg-transparent border-neon-blue/30'
              }`}
            />
          ))}
        </div>
      )}

      {/* Setup screen — DifficultySelector uses onSelect, gameTitle, gameIcon, showCarSelection */}
      {gamePhase === 'setup' && (
        <div className="w-full max-w-md">
          <DifficultySelector
            gameTitle="Highway Rush"
            gameIcon="🏎️"
            showCarSelection={true}
            descriptions={{
              easy:   'Slower traffic, more room to breathe',
              medium: 'Balanced challenge for most players',
              hard:   'Dense traffic, high speed — survive!',
            }}
            onSelect={(diff, ct) => {
              startGame(diff, (ct ?? 'compact') as CarType);
            }}
          />
        </div>
      )}

      {/* Canvas */}
      {(gamePhase === 'playing' || gamePhase === 'crashed' || gamePhase === 'gameover') && (
        <div
          className="relative"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="rounded-lg border border-neon-blue/30 shadow-[0_0_30px_#00aaff22]"
            style={{ maxHeight: 'calc(100vh - 280px)', width: 'auto' }}
          />

          {/* Crashed overlay */}
          {gamePhase === 'crashed' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 rounded-lg">
              <h2 className="font-orbitron text-2xl font-bold text-red-400 mb-1">CRASH!</h2>
              <p className="font-rajdhani text-muted-foreground mb-2">
                Lives: <span className="text-neon-blue font-bold">{lives}</span>
              </p>

              {/* Rewarded ad — once per session */}
              {!rewardedUsed && (
                <div className="mb-3">
                  <RewardedAd
                    onRewardGranted={resumeAfterReward}
                    disabled={rewardedUsed}
                  />
                </div>
              )}

              <button
                onClick={continueAfterCrash}
                className="px-5 py-2 bg-surface/60 border border-neon-blue/40 text-foreground font-rajdhani font-semibold rounded-lg hover:border-neon-blue transition-all text-sm"
              >
                Continue (–1 Life)
              </button>
            </div>
          )}

          {/* Mobile lane buttons */}
          {gamePhase === 'playing' && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-between px-3">
              <button
                className="w-12 h-12 rounded-full bg-black/60 border border-neon-blue/40 text-neon-blue text-lg flex items-center justify-center active:bg-neon-blue/20"
                onTouchStart={() => moveLane(-1)}
                onClick={() => moveLane(-1)}
              >
                ←
              </button>
              <button
                className="w-12 h-12 rounded-full bg-black/60 border border-neon-blue/40 text-neon-blue text-lg flex items-center justify-center active:bg-neon-blue/20"
                onTouchStart={() => moveLane(1)}
                onClick={() => moveLane(1)}
              >
                →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Game Over (before interstitial) */}
      {gamePhase === 'gameover' && !showInterstitial && (
        <div className="w-full max-w-md flex flex-col items-center gap-4 mt-4">
          <h2 className="font-orbitron text-3xl font-bold text-red-400">GAME OVER</h2>
          <p className="font-orbitron text-4xl font-bold text-neon-blue">{score}</p>
          <button
            onClick={() => setGamePhase('setup')}
            className="flex items-center gap-2 px-6 py-2.5 bg-neon-blue/20 border border-neon-blue text-neon-blue font-orbitron font-bold rounded-lg hover:bg-neon-blue/30 transition-all"
          >
            <RotateCcw size={16} /> PLAY AGAIN
          </button>
        </div>
      )}

      {/* Leaderboard */}
      {showLeaderboard && (
        <HighwayRushLeaderboard onClose={() => setShowLeaderboard(false)} />
      )}

      {/* Interstitial ad — after full Game Over only */}
      {showInterstitial && (
        <InterstitialAd onClose={handleInterstitialClose} />
      )}
    </div>
  );
};

export default HighwayRushGame;

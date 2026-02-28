import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import SoundToggle from '../components/SoundToggle';
import { useSoundManager } from '../hooks/useSoundManager';
import { awardXP, incrementGamesPlayed, addToTotalScore } from '../utils/playerProfile';

const W = 360;
const H = 600;
const LANE_COUNT = 3;
const LANE_W = W / LANE_COUNT;
const CAR_W = 40;
const CAR_H = 70;
const ENEMY_W = 40;
const ENEMY_H = 70;
const SCORE_MILESTONES = [50, 100, 200, 400, 600];

function getLaneX(lane: number) {
  return lane * LANE_W + LANE_W / 2 - CAR_W / 2;
}

interface EnemyCar { x: number; y: number; speed: number; color: string; }

const ENEMY_COLORS = ['#ff4444', '#ff8800', '#ffdd00', '#ff44aa', '#ff6644'];

export default function TrafficCarGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'playing' | 'dead'>('idle');
  const [currentLane, setCurrentLane] = useState(1);
  const { playClick, playScore, playGameOver } = useSoundManager();

  const stateRef = useRef({
    lane: 1,
    enemies: [] as EnemyCar[],
    score: 0,
    frame: 0,
    phase: 'idle' as 'idle' | 'playing' | 'dead',
    roadOffset: 0,
    milestonesAwarded: new Set<number>(),
    setScoreRef: null as ((s: number) => void) | null,
  });
  const rafRef = useRef(0);

  useEffect(() => {
    stateRef.current.setScoreRef = setScore;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = stateRef.current;

    // Road
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, W, H);

    // Lane markings
    s.roadOffset = (s.roadOffset + (s.phase === 'playing' ? 4 : 0)) % 80;
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    ctx.setLineDash([40, 40]);
    ctx.lineDashOffset = -s.roadOffset;
    for (let i = 1; i < LANE_COUNT; i++) {
      ctx.beginPath();
      ctx.moveTo(i * LANE_W, 0);
      ctx.lineTo(i * LANE_W, H);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Enemy cars
    s.enemies.forEach((e) => {
      ctx.fillStyle = e.color;
      ctx.shadowColor = e.color;
      ctx.shadowBlur = 8;
      ctx.fillRect(e.x, e.y, ENEMY_W, ENEMY_H);
      ctx.shadowBlur = 0;
      // Windshield
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(e.x + 5, e.y + 10, ENEMY_W - 10, 20);
    });

    // Player car
    const px = getLaneX(s.lane);
    const py = H - CAR_H - 20;
    ctx.fillStyle = '#00d4ff';
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 12;
    ctx.fillRect(px, py, CAR_W, CAR_H);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(px + 5, py + 10, CAR_W - 10, 20);

    if (s.phase === 'idle') {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#00d4ff';
      ctx.font = 'bold 16px Orbitron, monospace';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#00d4ff';
      ctx.shadowBlur = 20;
      ctx.fillText('TAP LANE TO START', W / 2, H / 2);
      ctx.shadowBlur = 0;
    } else if (s.phase === 'dead') {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 28px Orbitron, monospace';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ff4444';
      ctx.shadowBlur = 20;
      ctx.fillText('CRASH!', W / 2, H / 2 - 30);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Rajdhani, sans-serif';
      ctx.fillText(`Score: ${s.score}`, W / 2, H / 2 + 10);
      ctx.fillStyle = '#00d4ff';
      ctx.font = '14px Rajdhani, sans-serif';
      ctx.fillText('TAP LANE TO RESTART', W / 2, H / 2 + 50);
    }
  }, []);

  const loop = useCallback(() => {
    const s = stateRef.current;
    if (s.phase === 'playing') {
      s.frame++;

      // Spawn enemies
      if (s.frame % 60 === 0) {
        const lane = Math.floor(Math.random() * LANE_COUNT);
        const speed = 3 + Math.min(s.score / 100, 5);
        s.enemies.push({
          x: getLaneX(lane),
          y: -ENEMY_H,
          speed,
          color: ENEMY_COLORS[Math.floor(Math.random() * ENEMY_COLORS.length)],
        });
      }

      // Move enemies
      s.enemies.forEach((e) => { e.y += e.speed; });
      s.enemies = s.enemies.filter((e) => e.y < H + ENEMY_H);

      // Score
      if (s.frame % 30 === 0) {
        s.score++;
        if (s.setScoreRef) s.setScoreRef(s.score);

        for (const m of SCORE_MILESTONES) {
          if (!s.milestonesAwarded.has(m) && s.score >= m) {
            s.milestonesAwarded.add(m);
            awardXP(10);
          }
        }
      }

      // Collision
      const px = getLaneX(s.lane);
      const py = H - CAR_H - 20;
      const crashed = s.enemies.some(
        (e) =>
          px < e.x + ENEMY_W &&
          px + CAR_W > e.x &&
          py < e.y + ENEMY_H &&
          py + CAR_H > e.y
      );

      if (crashed) {
        s.phase = 'dead';
        setPhase('dead');
        playGameOver();
        addToTotalScore(s.score);
        awardXP(5);
        incrementGamesPlayed();
      }
    }

    draw();
    rafRef.current = requestAnimationFrame(loop);
  }, [draw, playGameOver]);

  const handleLaneClick = useCallback((lane: number) => {
    const s = stateRef.current;
    playClick();
    if (s.phase === 'idle') {
      s.phase = 'playing';
      setPhase('playing');
    } else if (s.phase === 'dead') {
      s.enemies = [];
      s.score = 0;
      s.frame = 0;
      s.phase = 'playing';
      s.milestonesAwarded = new Set();
      if (s.setScoreRef) s.setScoreRef(0);
      setPhase('playing');
    }
    s.lane = lane;
    setCurrentLane(lane);
  }, [playClick]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loop]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (e.key === 'ArrowLeft') { e.preventDefault(); s.lane = Math.max(0, s.lane - 1); setCurrentLane(s.lane); }
      if (e.key === 'ArrowRight') { e.preventDefault(); s.lane = Math.min(LANE_COUNT - 1, s.lane + 1); setCurrentLane(s.lane); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="mx-auto max-w-sm">
        <div className="mb-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-rajdhani text-sm text-gray-400 hover:text-neon-blue transition-colors">
            <ArrowLeft size={16} />Back
          </Link>
          <h1 className="font-orbitron text-xl font-bold text-neon-blue" style={{ textShadow: '0 0 15px rgba(0,212,255,0.7)' }}>TRAFFIC RUSH</h1>
          <SoundToggle />
        </div>

        <div className="mb-4 text-center">
          <div className="score-card inline-block px-8 py-3">
            <div className="font-orbitron text-2xl font-bold text-neon-blue">{score}</div>
            <div className="font-rajdhani text-xs uppercase tracking-widest text-gray-400">Score</div>
          </div>
        </div>

        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className="rounded-xl border border-neon-blue/20"
            style={{ boxShadow: '0 0 30px rgba(0,212,255,0.1)', maxWidth: '100%' }}
          />
        </div>

        {/* Lane buttons */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[0, 1, 2].map((lane) => (
            <button
              key={lane}
              onClick={() => handleLaneClick(lane)}
              className="rounded-xl border py-3 font-orbitron text-sm font-bold transition-all duration-200 hover:scale-105"
              style={{
                borderColor: currentLane === lane ? 'rgba(0,212,255,0.8)' : 'rgba(0,212,255,0.2)',
                background: currentLane === lane ? 'rgba(0,212,255,0.15)' : 'rgba(0,212,255,0.05)',
                color: currentLane === lane ? '#00d4ff' : '#6b7280',
                boxShadow: currentLane === lane ? '0 0 15px rgba(0,212,255,0.3)' : 'none',
              }}
            >
              {lane === 0 ? '← LEFT' : lane === 1 ? 'CENTER' : 'RIGHT →'}
            </button>
          ))}
        </div>

        <div className="mt-3 text-center font-rajdhani text-xs text-gray-600">
          Arrow Keys or tap lane buttons to switch lanes
        </div>
      </div>
    </div>
  );
}

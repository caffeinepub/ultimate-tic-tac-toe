import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { LEVELS, LevelData, Platform, Hazard } from '../utils/darkTrapEscapeLevels';
import { getUnlockedLevels, unlockLevel, isLevelUnlocked } from '../utils/darkTrapEscapeProgress';
import { useDarkTrapEscapeSound } from '../hooks/useDarkTrapEscapeSound';

// ─── Constants ───────────────────────────────────────────────────────────────
const PLAYER_W = 28;
const PLAYER_H = 36;
const GRAVITY = 0.55;
const JUMP_FORCE = -13.5;
const MOVE_SPEED = 4.5;
const FRICTION = 0.82;
const MAX_FALL = 18;
const RESPAWN_DELAY = 1000; // ms

// ─── Types ────────────────────────────────────────────────────────────────────
interface Vec2 { x: number; y: number; }

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  color: string; size: number;
}

interface PlatformState {
  data: Platform;
  // Runtime state
  currentX: number;
  currentY: number;
  moveDir: number;
  // Fake platform
  falling: boolean;
  fallTimer: number;
  fallVy: number;
  // Hidden trap
  revealed: boolean;
  revealTimer: number;
}

interface HazardState {
  data: Hazard;
  currentX: number;
  currentY: number;
  moveDir: number;
  // Surprise trap
  triggered: boolean;
  triggerTimer: number;
  spikeAnim: number;
}

interface GameState {
  player: {
    x: number; y: number;
    vx: number; vy: number;
    grounded: boolean;
    jumpCount: number;
    dead: boolean;
    respawnTimer: number;
    facingRight: boolean;
    animFrame: number;
  };
  camera: Vec2;
  platforms: PlatformState[];
  hazards: HazardState[];
  particles: Particle[];
  shakeTimer: number;
  shakeIntensity: number;
  levelComplete: boolean;
  levelCompleteTimer: number;
  tick: number;
}

type GameScreen = 'menu' | 'playing' | 'paused' | 'howToPlay' | 'levelSelect' | 'victory';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function rectsOverlap(ax: number, ay: number, aw: number, ah: number,
                       bx: number, by: number, bw: number, bh: number) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function buildPlatformStates(platforms: Platform[]): PlatformState[] {
  return platforms.map(p => ({
    data: p,
    currentX: p.x,
    currentY: p.y,
    moveDir: 1,
    falling: false,
    fallTimer: 0,
    fallVy: 0,
    revealed: false,
    revealTimer: 0,
  }));
}

function buildHazardStates(hazards: Hazard[]): HazardState[] {
  return hazards.map(h => ({
    data: h,
    currentX: h.x,
    currentY: h.y,
    moveDir: 1,
    triggered: false,
    triggerTimer: 0,
    spikeAnim: Math.random() * Math.PI * 2,
  }));
}

function spawnParticles(x: number, y: number): Particle[] {
  const colors = ['#ff00ff', '#00ffff', '#ff4444', '#ffff00', '#ff8800'];
  const particles: Particle[] = [];
  for (let i = 0; i < 28; i++) {
    const angle = (Math.PI * 2 * i) / 28 + (Math.random() - 0.5) * 0.5;
    const speed = 2 + Math.random() * 5;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 1,
      maxLife: 0.6 + Math.random() * 0.6,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 2 + Math.random() * 4,
    });
  }
  return particles;
}

function initGameState(level: LevelData): GameState {
  return {
    player: {
      x: level.spawnPoint.x,
      y: level.spawnPoint.y,
      vx: 0, vy: 0,
      grounded: false,
      jumpCount: 0,
      dead: false,
      respawnTimer: 0,
      facingRight: true,
      animFrame: 0,
    },
    camera: { x: 0, y: 0 },
    platforms: buildPlatformStates(level.platforms),
    hazards: buildHazardStates(level.hazards),
    particles: [],
    shakeTimer: 0,
    shakeIntensity: 0,
    levelComplete: false,
    levelCompleteTimer: 0,
    tick: 0,
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DarkTrapEscapeGame() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [screen, setScreen] = useState<GameScreen>('menu');
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [unlockedLevels, setUnlockedLevels] = useState<number[]>(getUnlockedLevels);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 500 });

  const screenRef = useRef<GameScreen>('menu');
  const levelIdxRef = useRef(0);
  const stateRef = useRef<GameState>(initGameState(LEVELS[0]));
  const keysRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const sound = useDarkTrapEscapeSound();
  const soundRef = useRef(sound);
  soundRef.current = sound;

  // ─── Resize ────────────────────────────────────────────────────────────────
  useEffect(() => {
    function resize() {
      const container = containerRef.current;
      if (!container) return;
      const w = Math.min(container.clientWidth, 900);
      const h = Math.min(container.clientHeight - 60, 560);
      setCanvasSize({ w: Math.max(w, 320), h: Math.max(h, 300) });
    }
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // ─── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.code);
      // Jump
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        handleJump();
      }
      // Pause
      if (e.code === 'Escape') {
        if (screenRef.current === 'playing') setScreen('paused');
        else if (screenRef.current === 'paused') setScreen('playing');
      }
    };
    const onUp = (e: KeyboardEvent) => keysRef.current.delete(e.code);
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Jump handler (stable ref) ─────────────────────────────────────────────
  const handleJump = useCallback(() => {
    if (screenRef.current !== 'playing') return;
    const p = stateRef.current.player;
    if (p.dead) return;
    if (p.jumpCount < 2) {
      p.vy = JUMP_FORCE;
      p.jumpCount++;
      p.grounded = false;
      soundRef.current.playJumpSound();
    }
  }, []);

  // ─── Load level ────────────────────────────────────────────────────────────
  const loadLevel = useCallback((idx: number) => {
    levelIdxRef.current = idx;
    setCurrentLevelIdx(idx);
    stateRef.current = initGameState(LEVELS[idx]);
  }, []);

  // ─── Start game ────────────────────────────────────────────────────────────
  const startGame = useCallback((levelIdx = 0) => {
    loadLevel(levelIdx);
    setScreen('playing');
    soundRef.current.startBackgroundMusic();
  }, [loadLevel]);

  // ─── Sync screen ref ───────────────────────────────────────────────────────
  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  // ─── Game loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function update(dt: number) {
      const gs = stateRef.current;
      const level = LEVELS[levelIdxRef.current];
      const p = gs.player;
      gs.tick++;

      // ── Respawn ──
      if (p.dead) {
        p.respawnTimer -= dt * 1000;
        // Update particles even while dead
        updateParticles(gs, dt);
        if (gs.shakeTimer > 0) gs.shakeTimer -= dt * 1000;
        if (p.respawnTimer <= 0) {
          p.dead = false;
          p.x = level.spawnPoint.x;
          p.y = level.spawnPoint.y;
          p.vx = 0; p.vy = 0;
          p.grounded = false;
          p.jumpCount = 0;
          // Reset fake platforms and hidden traps
          gs.platforms.forEach(ps => {
            if (ps.data.type === 'fake') {
              ps.falling = false; ps.fallTimer = 0; ps.fallVy = 0;
              ps.currentX = ps.data.x; ps.currentY = ps.data.y;
            }
            if (ps.data.type === 'hidden_trap') {
              ps.revealed = false; ps.revealTimer = 0;
            }
          });
          gs.hazards.forEach(hs => {
            if (hs.data.type === 'surprise_trap') {
              hs.triggered = false; hs.triggerTimer = 0;
            }
          });
        }
        return;
      }

      // ── Level complete ──
      if (gs.levelComplete) {
        gs.levelCompleteTimer -= dt * 1000;
        if (gs.levelCompleteTimer <= 0) {
          const nextIdx = levelIdxRef.current + 1;
          if (nextIdx >= LEVELS.length) {
            setScreen('victory');
          } else {
            loadLevel(nextIdx);
          }
        }
        return;
      }

      // ── Input ──
      const keys = keysRef.current;
      const movingLeft = keys.has('ArrowLeft') || keys.has('KeyA');
      const movingRight = keys.has('ArrowRight') || keys.has('KeyD');

      if (movingLeft) { p.vx -= MOVE_SPEED * 0.35; p.facingRight = false; }
      if (movingRight) { p.vx += MOVE_SPEED * 0.35; p.facingRight = true; }

      // Clamp horizontal speed
      p.vx = Math.max(-MOVE_SPEED, Math.min(MOVE_SPEED, p.vx));
      if (!movingLeft && !movingRight) p.vx *= FRICTION;

      // ── Gravity ──
      p.vy += GRAVITY;
      if (p.vy > MAX_FALL) p.vy = MAX_FALL;

      // ── Update moving platforms ──
      gs.platforms.forEach(ps => {
        const d = ps.data;
        if (d.type === 'moving') {
          const speed = (d.moveSpeed || 1.5) * ps.moveDir;
          if (d.moveAxis === 'x') {
            ps.currentX += speed;
            if (ps.currentX >= (d.moveMax || d.x + 200)) ps.moveDir = -1;
            if (ps.currentX <= (d.moveMin || d.x)) ps.moveDir = 1;
          } else {
            ps.currentY += speed;
            if (ps.currentY >= (d.moveMax || d.y + 100)) ps.moveDir = -1;
            if (ps.currentY <= (d.moveMin || d.y - 100)) ps.moveDir = 1;
          }
        }
        // Fake platform falling
        if (d.type === 'fake' && ps.falling) {
          ps.fallVy += 0.4;
          ps.currentY += ps.fallVy;
        }
      });

      // ── Update hazard animations ──
      gs.hazards.forEach(hs => {
        hs.spikeAnim += 0.05;
        if (hs.data.type === 'surprise_trap' && hs.triggered) {
          hs.triggerTimer -= dt * 1000;
        }
      });

      // ── Move player ──
      p.x += p.vx;
      p.y += p.vy;

      // World bounds
      if (p.x < 0) { p.x = 0; p.vx = 0; }
      if (p.x + PLAYER_W > level.worldWidth) { p.x = level.worldWidth - PLAYER_W; p.vx = 0; }

      // Fall off world = death
      if (p.y > level.worldHeight + 100) {
        killPlayer(gs, level);
        return;
      }

      // ── Platform collision ──
      p.grounded = false;
      let onMovingPlatform: PlatformState | null = null;

      gs.platforms.forEach(ps => {
        if (ps.data.type === 'fake' && ps.falling && ps.currentY > level.worldHeight + 200) return;

        const px = ps.currentX, py = ps.currentY;
        const pw = ps.data.width, ph = ps.data.height;

        if (!rectsOverlap(p.x, p.y, PLAYER_W, PLAYER_H, px, py, pw, ph)) return;

        // Hidden trap: reveal on contact
        if (ps.data.type === 'hidden_trap' && !ps.revealed) {
          ps.revealed = true;
          soundRef.current.playTrapSound();
          // Kill player after brief delay (trap activates)
          setTimeout(() => {
            if (!stateRef.current.player.dead) {
              killPlayer(stateRef.current, LEVELS[levelIdxRef.current]);
            }
          }, 300);
        }

        // Fake platform: start falling when player lands on top
        if (ps.data.type === 'fake' && !ps.falling) {
          const prevBottom = p.y + PLAYER_H - p.vy;
          if (prevBottom <= py + 4) {
            ps.fallTimer = ps.data.fallDelay || 600;
            setTimeout(() => { ps.falling = true; }, ps.fallTimer);
          }
        }

        // Resolve collision (top only for landing)
        const prevBottom = p.y + PLAYER_H - p.vy;
        const prevRight = p.x + PLAYER_W - p.vx;
        const prevLeft = p.x - p.vx;

        // Landing on top
        if (prevBottom <= py + 4 && p.vy >= 0) {
          p.y = py - PLAYER_H;
          p.vy = 0;
          p.grounded = true;
          p.jumpCount = 0;
          if (ps.data.type === 'moving') onMovingPlatform = ps;
        }
        // Hitting bottom
        else if (p.y >= py + ph - 4 && p.vy < 0) {
          p.y = py + ph;
          p.vy = 0;
        }
        // Left wall
        else if (prevRight <= px + 4 && p.vx > 0) {
          p.x = px - PLAYER_W;
          p.vx = 0;
        }
        // Right wall
        else if (prevLeft >= px + pw - 4 && p.vx < 0) {
          p.x = px + pw;
          p.vx = 0;
        }
      });

      // Carry player on moving platform
      if (onMovingPlatform) {
        const mp = onMovingPlatform as PlatformState;
        const d = mp.data;
        const speed = (d.moveSpeed || 1.5) * mp.moveDir;
        if (d.moveAxis === 'x') p.x += speed;
        else p.y += speed;
      }

      // ── Hazard collision ──
      gs.hazards.forEach(hs => {
        if (p.dead) return;
        const hx = hs.currentX, hy = hs.currentY;
        const hw = hs.data.width, hh = hs.data.height;

        if (hs.data.type === 'spike') {
          // Spike hitbox is slightly smaller
          if (rectsOverlap(p.x + 4, p.y + 4, PLAYER_W - 8, PLAYER_H - 4, hx, hy, hw, hh)) {
            killPlayer(gs, level);
          }
        }

        if (hs.data.type === 'surprise_trap' && !hs.triggered) {
          const r = hs.data.triggerRadius || 60;
          const cx = p.x + PLAYER_W / 2;
          const cy = p.y + PLAYER_H / 2;
          const dx = cx - (hx + hw / 2);
          const dy = cy - (hy + hh / 2);
          if (Math.sqrt(dx * dx + dy * dy) < r) {
            hs.triggered = true;
            hs.triggerTimer = 400;
            soundRef.current.playTrapSound();
            setTimeout(() => {
              if (!stateRef.current.player.dead) {
                killPlayer(stateRef.current, LEVELS[levelIdxRef.current]);
              }
            }, 200);
          }
        }
      });

      // ── Exit door ──
      if (!p.dead && !gs.levelComplete) {
        const door = level.exitDoor;
        if (rectsOverlap(p.x, p.y, PLAYER_W, PLAYER_H, door.x, door.y, door.width, door.height)) {
          gs.levelComplete = true;
          gs.levelCompleteTimer = 1800;
          const levelNum = level.levelNumber;
          unlockLevel(levelNum + 1);
          setUnlockedLevels(getUnlockedLevels());
          soundRef.current.playLevelCompleteSound();
        }
      }

      // ── Camera ──
      const targetCamX = p.x - canvasRef.current!.width / 2 + PLAYER_W / 2;
      const targetCamY = p.y - canvasRef.current!.height / 2 + PLAYER_H / 2;
      gs.camera.x = lerp(gs.camera.x, targetCamX, 0.1);
      gs.camera.y = lerp(gs.camera.y, targetCamY, 0.1);
      // Clamp camera
      gs.camera.x = Math.max(0, Math.min(level.worldWidth - canvasRef.current!.width, gs.camera.x));
      gs.camera.y = Math.max(0, Math.min(level.worldHeight - canvasRef.current!.height, gs.camera.y));

      // ── Particles ──
      updateParticles(gs, dt);

      // ── Screen shake ──
      if (gs.shakeTimer > 0) gs.shakeTimer -= dt * 1000;

      // ── Player animation ──
      if (Math.abs(p.vx) > 0.5 && p.grounded) {
        p.animFrame = (p.animFrame + 0.2) % 4;
      }
    }

    function killPlayer(gs: GameState, _level: LevelData) {
      if (gs.player.dead) return;
      gs.player.dead = true;
      gs.player.respawnTimer = RESPAWN_DELAY;
      gs.particles.push(...spawnParticles(gs.player.x + PLAYER_W / 2, gs.player.y + PLAYER_H / 2));
      gs.shakeTimer = 400;
      gs.shakeIntensity = 8;
      soundRef.current.playDeathSound();
    }

    function updateParticles(gs: GameState, dt: number) {
      gs.particles = gs.particles.filter(p => p.life > 0);
      gs.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.life -= dt / p.maxLife;
      });
    }

    function render() {
      if (!canvas || !ctx) return;
      const gs = stateRef.current;
      const level = LEVELS[levelIdxRef.current];
      const W = canvas.width;
      const H = canvas.height;

      ctx.clearRect(0, 0, W, H);

      // Background
      ctx.fillStyle = '#050510';
      ctx.fillRect(0, 0, W, H);

      // Screen shake
      let shakeX = 0, shakeY = 0;
      if (gs.shakeTimer > 0) {
        const intensity = gs.shakeIntensity * (gs.shakeTimer / 400);
        shakeX = (Math.random() - 0.5) * intensity;
        shakeY = (Math.random() - 0.5) * intensity;
      }

      ctx.save();
      ctx.translate(-gs.camera.x + shakeX, -gs.camera.y + shakeY);

      // ── Background grid ──
      ctx.strokeStyle = 'rgba(0,255,255,0.04)';
      ctx.lineWidth = 1;
      const gridSize = 80;
      const startX = Math.floor(gs.camera.x / gridSize) * gridSize;
      const startY = Math.floor(gs.camera.y / gridSize) * gridSize;
      for (let gx = startX; gx < gs.camera.x + W + gridSize; gx += gridSize) {
        ctx.beginPath(); ctx.moveTo(gx, gs.camera.y); ctx.lineTo(gx, gs.camera.y + H); ctx.stroke();
      }
      for (let gy = startY; gy < gs.camera.y + H + gridSize; gy += gridSize) {
        ctx.beginPath(); ctx.moveTo(gs.camera.x, gy); ctx.lineTo(gs.camera.x + W, gy); ctx.stroke();
      }

      // ── Platforms ──
      gs.platforms.forEach(ps => {
        const d = ps.data;
        const px = ps.currentX, py = ps.currentY;
        const pw = d.width, ph = d.height;

        // Skip if off screen
        if (px + pw < gs.camera.x - 50 || px > gs.camera.x + W + 50) return;
        if (py + ph < gs.camera.y - 50 || py > gs.camera.y + H + 50) return;

        ctx.save();
        ctx.shadowBlur = 12;

        if (d.type === 'static') {
          ctx.shadowColor = '#00ffff';
          ctx.fillStyle = '#003344';
          ctx.fillRect(px, py, pw, ph);
          ctx.strokeStyle = '#00ffff';
          ctx.lineWidth = 2;
          ctx.strokeRect(px, py, pw, ph);
          // Top glow line
          ctx.fillStyle = '#00ffff';
          ctx.fillRect(px, py, pw, 2);
        } else if (d.type === 'moving') {
          ctx.shadowColor = '#00ff88';
          ctx.fillStyle = '#003322';
          ctx.fillRect(px, py, pw, ph);
          ctx.strokeStyle = '#00ff88';
          ctx.lineWidth = 2;
          ctx.strokeRect(px, py, pw, ph);
          ctx.fillStyle = '#00ff88';
          ctx.fillRect(px, py, pw, 2);
          // Arrow indicator
          ctx.fillStyle = 'rgba(0,255,136,0.5)';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(d.moveAxis === 'x' ? '↔' : '↕', px + pw / 2, py + ph / 2 + 4);
        } else if (d.type === 'fake') {
          const alpha = ps.falling ? Math.max(0, 1 - ps.fallVy / 20) : 1;
          ctx.globalAlpha = alpha;
          ctx.shadowColor = '#ff8800';
          ctx.fillStyle = '#332200';
          ctx.fillRect(px, py, pw, ph);
          ctx.strokeStyle = '#ff8800';
          ctx.lineWidth = 2;
          ctx.strokeRect(px, py, pw, ph);
          ctx.fillStyle = '#ff8800';
          ctx.fillRect(px, py, pw, 2);
          // Crack marks
          ctx.strokeStyle = 'rgba(255,136,0,0.4)';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(px + pw * 0.3, py); ctx.lineTo(px + pw * 0.25, py + ph); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(px + pw * 0.7, py); ctx.lineTo(px + pw * 0.75, py + ph); ctx.stroke();
        } else if (d.type === 'hidden_trap') {
          if (!ps.revealed) {
            // Looks like a normal platform but slightly different color
            ctx.shadowColor = '#8800ff';
            ctx.fillStyle = '#220033';
            ctx.fillRect(px, py, pw, ph);
            ctx.strokeStyle = '#8800ff';
            ctx.lineWidth = 2;
            ctx.strokeRect(px, py, pw, ph);
            ctx.fillStyle = '#8800ff';
            ctx.fillRect(px, py, pw, 2);
          } else {
            // Revealed: glowing red danger
            const pulse = 0.6 + 0.4 * Math.sin(gs.tick * 0.2);
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 20 * pulse;
            ctx.fillStyle = '#330000';
            ctx.fillRect(px, py, pw, ph);
            ctx.strokeStyle = `rgba(255,0,0,${pulse})`;
            ctx.lineWidth = 2;
            ctx.strokeRect(px, py, pw, ph);
            // Danger X
            ctx.strokeStyle = `rgba(255,0,0,${pulse})`;
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(px + 4, py + 2); ctx.lineTo(px + pw - 4, py + ph - 2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(px + pw - 4, py + 2); ctx.lineTo(px + 4, py + ph - 2); ctx.stroke();
          }
        }

        ctx.restore();
      });

      // ── Hazards ──
      gs.hazards.forEach(hs => {
        const hx = hs.currentX, hy = hs.currentY;
        const hw = hs.data.width, hh = hs.data.height;

        if (hx + hw < gs.camera.x - 50 || hx > gs.camera.x + W + 50) return;
        if (hy + hh < gs.camera.y - 50 || hy > gs.camera.y + H + 50) return;

        ctx.save();

        if (hs.data.type === 'spike') {
          const pulse = 0.7 + 0.3 * Math.sin(hs.spikeAnim);
          ctx.shadowBlur = 10 * pulse;
          ctx.shadowColor = '#ff2244';
          const count = Math.floor(hw / 12);
          for (let i = 0; i < count; i++) {
            const sx = hx + i * 12 + 6;
            const sy = hy + hh;
            const tipY = hy + (2 + 3 * Math.sin(hs.spikeAnim + i * 0.8));
            ctx.fillStyle = `rgba(255,${Math.floor(34 + 40 * pulse)},68,${pulse})`;
            ctx.beginPath();
            ctx.moveTo(sx - 5, sy);
            ctx.lineTo(sx + 5, sy);
            ctx.lineTo(sx, tipY);
            ctx.closePath();
            ctx.fill();
          }
        }

        if (hs.data.type === 'surprise_trap') {
          if (!hs.triggered) {
            // Hidden — looks like floor marking
            const pulse = 0.5 + 0.5 * Math.sin(gs.tick * 0.08);
            ctx.shadowBlur = 8 * pulse;
            ctx.shadowColor = '#ff4400';
            ctx.strokeStyle = `rgba(255,68,0,${0.3 + 0.3 * pulse})`;
            ctx.lineWidth = 2;
            ctx.strokeRect(hx, hy, hw, hh);
            ctx.fillStyle = `rgba(255,68,0,${0.1 * pulse})`;
            ctx.fillRect(hx, hy, hw, hh);
            ctx.fillStyle = `rgba(255,68,0,${0.4 * pulse})`;
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('!', hx + hw / 2, hy + hh / 2 + 5);
          } else {
            // Triggered: explosion flash
            const t = Math.max(0, hs.triggerTimer / 400);
            ctx.shadowBlur = 30 * t;
            ctx.shadowColor = '#ff8800';
            ctx.fillStyle = `rgba(255,136,0,${t * 0.8})`;
            ctx.beginPath();
            ctx.arc(hx + hw / 2, hy + hh / 2, hw * t * 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        ctx.restore();
      });

      // ── Exit door ──
      const door = level.exitDoor;
      const doorPulse = 0.6 + 0.4 * Math.sin(gs.tick * 0.06);
      ctx.save();
      ctx.shadowBlur = 20 * doorPulse;
      ctx.shadowColor = '#00ff88';
      // Door frame
      ctx.strokeStyle = `rgba(0,255,136,${doorPulse})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(door.x, door.y, door.width, door.height);
      // Door fill
      ctx.fillStyle = `rgba(0,255,136,${0.15 * doorPulse})`;
      ctx.fillRect(door.x, door.y, door.width, door.height);
      // EXIT text
      ctx.fillStyle = `rgba(0,255,136,${doorPulse})`;
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('EXIT', door.x + door.width / 2, door.y + door.height / 2 + 4);
      // Arrow
      ctx.fillText('▲', door.x + door.width / 2, door.y + 14);
      ctx.restore();

      // ── Player ──
      if (!gs.player.dead) {
        const p = gs.player;
        ctx.save();
        ctx.shadowBlur = 16;
        ctx.shadowColor = '#ff00ff';

        // Body
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(p.x, p.y, PLAYER_W, PLAYER_H);

        // Visor
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(p.x + (p.facingRight ? 14 : 4), p.y + 8, 10, 6);

        // Legs animation
        if (p.grounded && Math.abs(p.vx) > 0.5) {
          const legOffset = Math.sin(p.animFrame * Math.PI) * 4;
          ctx.fillStyle = '#cc00cc';
          ctx.fillRect(p.x + 4, p.y + PLAYER_H - 8, 8, 8 + legOffset);
          ctx.fillRect(p.x + PLAYER_W - 12, p.y + PLAYER_H - 8, 8, 8 - legOffset);
        }

        // Jump glow
        if (!p.grounded) {
          ctx.shadowBlur = 24;
          ctx.shadowColor = '#ff88ff';
        }

        ctx.restore();
      }

      // ── Particles ──
      gs.particles.forEach(part => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, part.life);
        ctx.shadowBlur = 6;
        ctx.shadowColor = part.color;
        ctx.fillStyle = part.color;
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.size * part.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      ctx.restore(); // camera transform

      // ── HUD ──
      renderHUD(ctx, gs, level, W, H);

      // ── Level complete overlay ──
      if (gs.levelComplete) {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, W, H);
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#00ff88';
        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 36px "Orbitron", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('LEVEL COMPLETE!', W / 2, H / 2 - 20);
        ctx.font = '18px "Orbitron", monospace';
        ctx.fillStyle = 'rgba(0,255,136,0.7)';
        const nextLvl = levelIdxRef.current + 2;
        if (nextLvl <= LEVELS.length) {
          ctx.fillText(`Loading Level ${nextLvl}...`, W / 2, H / 2 + 20);
        } else {
          ctx.fillText('You escaped the darkness!', W / 2, H / 2 + 20);
        }
        ctx.restore();
      }
    }

    function renderHUD(ctx: CanvasRenderingContext2D, gs: GameState, level: LevelData, W: number, H: number) {
      ctx.save();
      // Level number
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00ffff';
      ctx.fillStyle = '#00ffff';
      ctx.font = 'bold 14px "Orbitron", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`LEVEL ${level.levelNumber}`, 16, 28);

      // Death indicator
      if (gs.player.dead) {
        ctx.fillStyle = 'rgba(255,0,0,0.8)';
        ctx.font = 'bold 20px "Orbitron", monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ff0000';
        ctx.fillText('DEAD — RESPAWNING...', W / 2, H / 2);
      }

      // Hint for double jump
      if (level.levelNumber === 1) {
        ctx.fillStyle = 'rgba(0,255,255,0.5)';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('WASD / Arrow Keys to move  •  Space / Up to jump (double jump!)', W / 2, H - 16);
      }

      ctx.restore();
    }

    function loop(timestamp: number) {
      if (screenRef.current !== 'playing') {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      const dt = Math.min((timestamp - (lastTimeRef.current || timestamp)) / 1000, 0.05);
      lastTimeRef.current = timestamp;
      update(dt);
      render();
      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [canvasSize, loadLevel]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Stop music on unmount ─────────────────────────────────────────────────
  useEffect(() => {
    return () => { soundRef.current.stopBackgroundMusic(); };
  }, []);

  // ─── Touch controls ────────────────────────────────────────────────────────
  const touchLeft = useCallback((active: boolean) => {
    if (active) keysRef.current.add('ArrowLeft'); else keysRef.current.delete('ArrowLeft');
  }, []);
  const touchRight = useCallback((active: boolean) => {
    if (active) keysRef.current.add('ArrowRight'); else keysRef.current.delete('ArrowRight');
  }, []);

  // ─── Screens ───────────────────────────────────────────────────────────────
  if (screen === 'menu') {
    return <MenuScreen onStart={() => startGame(0)} onLevels={() => setScreen('levelSelect')} onHowToPlay={() => setScreen('howToPlay')} onBack={() => navigate({ to: '/' })} />;
  }
  if (screen === 'howToPlay') {
    return <HowToPlayScreen onBack={() => setScreen('menu')} />;
  }
  if (screen === 'levelSelect') {
    return (
      <LevelSelectScreen
        unlockedLevels={unlockedLevels}
        onSelect={(idx) => startGame(idx)}
        onBack={() => setScreen('menu')}
      />
    );
  }
  if (screen === 'victory') {
    return <VictoryScreen onMenu={() => setScreen('menu')} onReplay={() => startGame(0)} />;
  }

  // Playing / Paused
  return (
    <div ref={containerRef} className="flex flex-col items-center justify-center min-h-screen bg-black select-none" style={{ touchAction: 'none' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between w-full max-w-[900px] px-3 py-2">
        <button
          onClick={() => navigate({ to: '/' })}
          className="text-cyan-400 font-mono text-xs border border-cyan-400/30 px-3 py-1 rounded hover:bg-cyan-400/10 transition-colors"
        >
          ← HOME
        </button>
        <span className="text-cyan-400 font-mono text-sm tracking-widest">DARK TRAP ESCAPE</span>
        <div className="flex gap-2">
          <button
            onClick={sound.toggleMute}
            className="text-cyan-400 font-mono text-xs border border-cyan-400/30 px-3 py-1 rounded hover:bg-cyan-400/10 transition-colors"
          >
            {sound.muted ? '🔇' : '🔊'}
          </button>
          <button
            onClick={() => setScreen(screen === 'paused' ? 'playing' : 'paused')}
            className="text-cyan-400 font-mono text-xs border border-cyan-400/30 px-3 py-1 rounded hover:bg-cyan-400/10 transition-colors"
          >
            {screen === 'paused' ? '▶ RESUME' : '⏸ PAUSE'}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={canvasSize.w}
          height={canvasSize.h}
          className="block border border-cyan-900/40"
          style={{ imageRendering: 'pixelated' }}
          tabIndex={0}
        />

        {/* Pause overlay */}
        {screen === 'paused' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
            <h2 className="text-cyan-400 font-mono text-3xl font-bold mb-8 tracking-widest">PAUSED</h2>
            <div className="flex flex-col gap-3 w-48">
              <button
                onClick={() => setScreen('playing')}
                className="py-3 bg-cyan-400/10 border border-cyan-400/50 text-cyan-400 font-mono rounded hover:bg-cyan-400/20 transition-colors"
              >
                ▶ RESUME
              </button>
              <button
                onClick={() => { loadLevel(currentLevelIdx); setScreen('playing'); }}
                className="py-3 bg-yellow-400/10 border border-yellow-400/50 text-yellow-400 font-mono rounded hover:bg-yellow-400/20 transition-colors"
              >
                ↺ RESTART
              </button>
              <button
                onClick={() => { setScreen('menu'); sound.stopBackgroundMusic(); }}
                className="py-3 bg-red-400/10 border border-red-400/50 text-red-400 font-mono rounded hover:bg-red-400/20 transition-colors"
              >
                ✕ MENU
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile touch controls */}
      <div className="flex items-center justify-between w-full max-w-[900px] px-4 mt-3 md:hidden">
        <div className="flex gap-2">
          <TouchBtn label="◀" onActive={(a) => touchLeft(a)} />
          <TouchBtn label="▶" onActive={(a) => touchRight(a)} />
        </div>
        <TouchBtn label="JUMP" onActive={(a) => { if (a) handleJump(); }} big />
      </div>

      {/* Desktop hint */}
      <p className="hidden md:block text-cyan-900 font-mono text-xs mt-2">
        WASD / Arrow Keys • Space to Jump • Double Jump available • Esc to Pause
      </p>
    </div>
  );
}

// ─── Touch Button ─────────────────────────────────────────────────────────────
function TouchBtn({ label, onActive, big }: { label: string; onActive: (active: boolean) => void; big?: boolean }) {
  return (
    <button
      className={`${big ? 'w-20 h-14' : 'w-14 h-14'} bg-cyan-400/10 border border-cyan-400/40 text-cyan-400 font-mono text-lg rounded-lg active:bg-cyan-400/30 select-none`}
      onTouchStart={(e) => { e.preventDefault(); onActive(true); }}
      onTouchEnd={(e) => { e.preventDefault(); onActive(false); }}
      onMouseDown={() => onActive(true)}
      onMouseUp={() => onActive(false)}
      onMouseLeave={() => onActive(false)}
    >
      {label}
    </button>
  );
}

// ─── Menu Screen ──────────────────────────────────────────────────────────────
function MenuScreen({ onStart, onLevels, onHowToPlay, onBack }: {
  onStart: () => void; onLevels: () => void; onHowToPlay: () => void; onBack: () => void;
}) {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4" style={{ background: 'radial-gradient(ellipse at center, #0a0020 0%, #000000 70%)' }}>
      <button onClick={onBack} className="absolute top-4 left-4 text-cyan-400/60 font-mono text-xs border border-cyan-400/20 px-3 py-1 rounded hover:bg-cyan-400/10 transition-colors">
        ← BACK
      </button>

      {/* Title */}
      <div className="text-center mb-12">
        <div className="text-6xl mb-4">🕳️</div>
        <h1 className="font-mono text-4xl md:text-5xl font-black text-transparent bg-clip-text mb-2"
          style={{ backgroundImage: 'linear-gradient(135deg, #ff00ff, #00ffff)', WebkitBackgroundClip: 'text' }}>
          DARK TRAP
        </h1>
        <h1 className="font-mono text-4xl md:text-5xl font-black text-transparent bg-clip-text mb-4"
          style={{ backgroundImage: 'linear-gradient(135deg, #00ffff, #ff00ff)', WebkitBackgroundClip: 'text' }}>
          ESCAPE
        </h1>
        <p className="text-cyan-400/60 font-mono text-sm">10 levels of deception and danger</p>
      </div>

      {/* Menu buttons */}
      <div className="flex flex-col gap-4 w-64">
        <MenuBtn onClick={onStart} color="cyan">▶ START GAME</MenuBtn>
        <MenuBtn onClick={onLevels} color="purple">📋 SELECT LEVEL</MenuBtn>
        <MenuBtn onClick={onHowToPlay} color="green">❓ HOW TO PLAY</MenuBtn>
      </div>

      {/* Decorative neon lines */}
      <div className="mt-16 flex gap-2 opacity-30">
        {['#ff00ff', '#00ffff', '#ff8800', '#00ff88', '#ff0044'].map((c, i) => (
          <div key={i} className="w-8 h-1 rounded-full" style={{ backgroundColor: c }} />
        ))}
      </div>
    </div>
  );
}

function MenuBtn({ children, onClick, color }: { children: React.ReactNode; onClick: () => void; color: 'cyan' | 'purple' | 'green' }) {
  const styles = {
    cyan: 'border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10',
    purple: 'border-purple-400/50 text-purple-400 hover:bg-purple-400/10',
    green: 'border-green-400/50 text-green-400 hover:bg-green-400/10',
  };
  return (
    <button
      onClick={onClick}
      className={`py-4 border font-mono text-sm rounded-lg transition-all duration-200 hover:scale-105 ${styles[color]}`}
    >
      {children}
    </button>
  );
}

// ─── How To Play Screen ───────────────────────────────────────────────────────
function HowToPlayScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-8" style={{ background: 'radial-gradient(ellipse at center, #0a0020 0%, #000000 70%)' }}>
      <div className="max-w-lg w-full">
        <h2 className="font-mono text-2xl font-bold text-cyan-400 text-center mb-8 tracking-widest">HOW TO PLAY</h2>

        <div className="space-y-4 mb-8">
          <InfoCard title="🎮 Controls" color="cyan">
            <p>Arrow Keys / WASD — Move left & right</p>
            <p>Space / Up / W — Jump</p>
            <p>Jump again in mid-air for a <span className="text-cyan-300">Double Jump!</span></p>
            <p>Esc — Pause game</p>
          </InfoCard>

          <InfoCard title="🎯 Goal" color="green">
            <p>Reach the glowing <span className="text-green-300">EXIT door</span> in each level.</p>
            <p>Complete all 10 levels to escape the darkness!</p>
          </InfoCard>

          <InfoCard title="⚠️ Hazards" color="red">
            <p><span className="text-red-300">Red spikes</span> — instant death on contact</p>
            <p><span className="text-orange-300">Cracked platforms</span> — fall after you land on them</p>
            <p><span className="text-purple-300">Purple platforms</span> — hidden traps, activate on touch</p>
            <p><span className="text-orange-300">! markers</span> — surprise traps, triggered by proximity</p>
            <p><span className="text-green-300">↔ ↕ platforms</span> — moving platforms, ride them!</p>
          </InfoCard>

          <InfoCard title="💡 Tips" color="yellow">
            <p>You respawn instantly — don't give up!</p>
            <p>Watch for subtle visual differences in platforms.</p>
            <p>Use double jump to reach higher platforms.</p>
          </InfoCard>
        </div>

        <button
          onClick={onBack}
          className="w-full py-3 border border-cyan-400/50 text-cyan-400 font-mono rounded-lg hover:bg-cyan-400/10 transition-colors"
        >
          ← BACK TO MENU
        </button>
      </div>
    </div>
  );
}

function InfoCard({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  const borderColors: Record<string, string> = {
    cyan: 'border-cyan-400/30', green: 'border-green-400/30',
    red: 'border-red-400/30', yellow: 'border-yellow-400/30',
  };
  const titleColors: Record<string, string> = {
    cyan: 'text-cyan-400', green: 'text-green-400',
    red: 'text-red-400', yellow: 'text-yellow-400',
  };
  return (
    <div className={`border ${borderColors[color] || 'border-gray-400/30'} rounded-lg p-4 bg-white/5`}>
      <h3 className={`font-mono font-bold mb-2 ${titleColors[color] || 'text-gray-400'}`}>{title}</h3>
      <div className="font-mono text-xs text-gray-300 space-y-1">{children}</div>
    </div>
  );
}

// ─── Level Select Screen ──────────────────────────────────────────────────────
function LevelSelectScreen({ unlockedLevels, onSelect, onBack }: {
  unlockedLevels: number[]; onSelect: (idx: number) => void; onBack: () => void;
}) {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-8" style={{ background: 'radial-gradient(ellipse at center, #0a0020 0%, #000000 70%)' }}>
      <div className="max-w-lg w-full">
        <h2 className="font-mono text-2xl font-bold text-cyan-400 text-center mb-8 tracking-widest">SELECT LEVEL</h2>

        <div className="grid grid-cols-5 gap-3 mb-8">
          {LEVELS.map((level, idx) => {
            const unlocked = isLevelUnlocked(level.levelNumber) || unlockedLevels.includes(level.levelNumber);
            return (
              <button
                key={level.levelNumber}
                onClick={() => unlocked && onSelect(idx)}
                disabled={!unlocked}
                className={`aspect-square flex flex-col items-center justify-center rounded-lg border font-mono text-sm font-bold transition-all duration-200
                  ${unlocked
                    ? 'border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10 hover:scale-105 cursor-pointer'
                    : 'border-gray-700/50 text-gray-600 cursor-not-allowed opacity-50'
                  }`}
              >
                {unlocked ? (
                  <>
                    <span className="text-lg">{level.levelNumber}</span>
                    <span className="text-xs opacity-60">LVL</span>
                  </>
                ) : (
                  <>
                    <span className="text-lg">🔒</span>
                    <span className="text-xs">{level.levelNumber}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        <p className="text-center text-gray-500 font-mono text-xs mb-6">
          Complete levels to unlock the next one
        </p>

        <button
          onClick={onBack}
          className="w-full py-3 border border-cyan-400/50 text-cyan-400 font-mono rounded-lg hover:bg-cyan-400/10 transition-colors"
        >
          ← BACK TO MENU
        </button>
      </div>
    </div>
  );
}

// ─── Victory Screen ───────────────────────────────────────────────────────────
function VictoryScreen({ onMenu, onReplay }: { onMenu: () => void; onReplay: () => void }) {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4" style={{ background: 'radial-gradient(ellipse at center, #001a00 0%, #000000 70%)' }}>
      <div className="text-center">
        <div className="text-6xl mb-4">🏆</div>
        <h1 className="font-mono text-4xl font-black text-green-400 mb-2" style={{ textShadow: '0 0 30px #00ff88' }}>
          YOU ESCAPED!
        </h1>
        <p className="text-green-400/60 font-mono text-sm mb-2">All 10 levels conquered</p>
        <p className="text-cyan-400/40 font-mono text-xs mb-10">The darkness could not hold you.</p>

        <div className="flex flex-col gap-3 w-56 mx-auto">
          <button
            onClick={onReplay}
            className="py-3 border border-green-400/50 text-green-400 font-mono rounded-lg hover:bg-green-400/10 transition-colors"
          >
            ↺ PLAY AGAIN
          </button>
          <button
            onClick={onMenu}
            className="py-3 border border-cyan-400/50 text-cyan-400 font-mono rounded-lg hover:bg-cyan-400/10 transition-colors"
          >
            ← MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
}

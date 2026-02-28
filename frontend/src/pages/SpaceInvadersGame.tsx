import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useSoundManager } from "../hooks/useSoundManager";
import SoundToggle from "../components/SoundToggle";
import { awardXP } from "../utils/achievements";

const W = 600;
const H = 500;
const PLAYER_W = 40;
const PLAYER_H = 20;
const BULLET_W = 4;
const BULLET_H = 12;
const ALIEN_COLS = 11;
const ALIEN_ROWS = 5;
const ALIEN_W = 36;
const ALIEN_H = 24;
const ALIEN_GAP_X = 12;
const ALIEN_GAP_Y = 16;

interface Bullet { x: number; y: number; enemy?: boolean }
interface Alien { x: number; y: number; alive: boolean; row: number }

function initAliens(): Alien[] {
  const aliens: Alien[] = [];
  for (let r = 0; r < ALIEN_ROWS; r++) {
    for (let c = 0; c < ALIEN_COLS; c++) {
      aliens.push({
        x: 60 + c * (ALIEN_W + ALIEN_GAP_X),
        y: 60 + r * (ALIEN_H + ALIEN_GAP_Y),
        alive: true,
        row: r,
      });
    }
  }
  return aliens;
}

export default function SpaceInvadersGame() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { playClick, playScore, playGameOver } = useSoundManager();

  const playerXRef = useRef(W / 2 - PLAYER_W / 2);
  const bulletsRef = useRef<Bullet[]>([]);
  const aliensRef = useRef<Alien[]>(initAliens());
  const alienDirRef = useRef(1);
  const alienSpeedRef = useRef(1.5);
  const alienShootTimerRef = useRef(0);
  const livesRef = useRef(3);
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const runningRef = useRef(false);
  const rafRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());
  const shootCooldownRef = useRef(0);
  const lastTimeRef = useRef(0);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem("spaceinvaders_highscore") || "0"));
  const [gameState, setGameState] = useState<"idle" | "playing" | "over">("idle");

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#050510";
    ctx.fillRect(0, 0, W, H);

    // Stars
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    for (let i = 0; i < 60; i++) {
      const sx = (i * 137.5) % W;
      const sy = (i * 97.3) % H;
      ctx.fillRect(sx, sy, 1, 1);
    }

    // Player
    const px = playerXRef.current;
    const py = H - 50;
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#00c8ff";
    ctx.fillStyle = "#00c8ff";
    ctx.beginPath();
    ctx.moveTo(px + PLAYER_W / 2, py);
    ctx.lineTo(px + PLAYER_W, py + PLAYER_H);
    ctx.lineTo(px, py + PLAYER_H);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Aliens
    aliensRef.current.forEach(a => {
      if (!a.alive) return;
      const colors = ["#ff4444", "#ff8800", "#ffff00", "#00ff88", "#00c8ff"];
      ctx.shadowBlur = 10;
      ctx.shadowColor = colors[a.row];
      ctx.fillStyle = colors[a.row];
      ctx.fillRect(a.x + 4, a.y + 4, ALIEN_W - 8, ALIEN_H - 8);
      ctx.fillStyle = "#050510";
      ctx.fillRect(a.x + 8, a.y + 8, 6, 6);
      ctx.fillRect(a.x + ALIEN_W - 14, a.y + 8, 6, 6);
      ctx.shadowBlur = 0;
    });

    // Bullets
    bulletsRef.current.forEach(b => {
      ctx.shadowBlur = 8;
      ctx.shadowColor = b.enemy ? "#ff4444" : "#00ffff";
      ctx.fillStyle = b.enemy ? "#ff4444" : "#00ffff";
      ctx.fillRect(b.x - BULLET_W / 2, b.y, BULLET_W, BULLET_H);
      ctx.shadowBlur = 0;
    });

    // Ground line
    ctx.strokeStyle = "rgba(0,200,255,0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, H - 25);
    ctx.lineTo(W, H - 25);
    ctx.stroke();
  }, []);

  const endGame = useCallback(() => {
    runningRef.current = false;
    cancelAnimationFrame(rafRef.current);
    playGameOver();
    setHighScore(prev => {
      const next = Math.max(prev, scoreRef.current);
      localStorage.setItem("spaceinvaders_highscore", String(next));
      return next;
    });
    setGameState("over");
  }, [playGameOver]);

  const nextLevel = useCallback(() => {
    levelRef.current++;
    alienSpeedRef.current += 0.5;
    aliensRef.current = initAliens();
    setLevel(levelRef.current);
    playScore();
  }, [playScore]);

  const gameLoop = useCallback((time: number) => {
    if (!runningRef.current) return;
    const dt = Math.min(time - lastTimeRef.current, 50);
    lastTimeRef.current = time;

    // Move player
    if (keysRef.current.has("ArrowLeft") && playerXRef.current > 0) playerXRef.current -= 4;
    if (keysRef.current.has("ArrowRight") && playerXRef.current < W - PLAYER_W) playerXRef.current += 4;

    // Shoot
    if (shootCooldownRef.current > 0) shootCooldownRef.current -= dt;
    if (keysRef.current.has(" ") && shootCooldownRef.current <= 0) {
      bulletsRef.current.push({ x: playerXRef.current + PLAYER_W / 2, y: H - 55 });
      shootCooldownRef.current = 400;
      playClick();
    }

    // Move bullets
    bulletsRef.current = bulletsRef.current.filter(b => b.y > -20 && b.y < H + 20);
    bulletsRef.current.forEach(b => { b.y += b.enemy ? 3 : -8; });

    // Move aliens
    const aliveAliens = aliensRef.current.filter(a => a.alive);
    if (aliveAliens.length === 0) {
      nextLevel();
    } else {
      const speed = alienSpeedRef.current;
      let hitWall = false;
      aliveAliens.forEach(a => { a.x += alienDirRef.current * speed; });
      aliveAliens.forEach(a => {
        if (a.x <= 0 || a.x + ALIEN_W >= W) hitWall = true;
      });
      if (hitWall) {
        alienDirRef.current *= -1;
        aliveAliens.forEach(a => { a.y += 20; });
      }

      // Alien shoot
      alienShootTimerRef.current += dt;
      const shootInterval = Math.max(600, 1500 - levelRef.current * 100);
      if (alienShootTimerRef.current > shootInterval) {
        alienShootTimerRef.current = 0;
        const shooters = aliveAliens.filter((_, i) => i % 3 === 0);
        if (shooters.length > 0) {
          const shooter = shooters[Math.floor(Math.random() * shooters.length)];
          bulletsRef.current.push({ x: shooter.x + ALIEN_W / 2, y: shooter.y + ALIEN_H, enemy: true });
        }
      }

      // Bullet-alien collision
      bulletsRef.current = bulletsRef.current.filter(b => {
        if (b.enemy) return true;
        const hit = aliensRef.current.find(a => a.alive && b.x >= a.x && b.x <= a.x + ALIEN_W && b.y >= a.y && b.y <= a.y + ALIEN_H);
        if (hit) {
          hit.alive = false;
          const pts = (5 - hit.row) * 10;
          scoreRef.current += pts;
          setScore(scoreRef.current);
          playScore();
          if (scoreRef.current % 100 === 0) awardXP(10);
          return false;
        }
        return true;
      });

      // Enemy bullet hits player
      const playerHit = bulletsRef.current.some(b =>
        b.enemy &&
        b.x >= playerXRef.current &&
        b.x <= playerXRef.current + PLAYER_W &&
        b.y >= H - 55 &&
        b.y <= H - 30
      );
      if (playerHit) {
        bulletsRef.current = bulletsRef.current.filter(b =>
          !(b.enemy && b.x >= playerXRef.current && b.x <= playerXRef.current + PLAYER_W && b.y >= H - 55 && b.y <= H - 30)
        );
        livesRef.current--;
        setLives(livesRef.current);
        playGameOver();
        if (livesRef.current <= 0) { endGame(); return; }
      }

      // Aliens reach bottom
      if (aliveAliens.some(a => a.y + ALIEN_H >= H - 30)) { endGame(); return; }
    }

    draw();
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [draw, endGame, nextLevel, playClick, playScore, playGameOver]);

  const startGame = useCallback(() => {
    playerXRef.current = W / 2 - PLAYER_W / 2;
    bulletsRef.current = [];
    aliensRef.current = initAliens();
    alienDirRef.current = 1;
    alienSpeedRef.current = 1.5;
    alienShootTimerRef.current = 0;
    livesRef.current = 3;
    scoreRef.current = 0;
    levelRef.current = 1;
    shootCooldownRef.current = 0;
    runningRef.current = true;
    setScore(0); setLives(3); setLevel(1);
    setGameState("playing");
    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => { keysRef.current.add(e.key); if (e.key === " ") e.preventDefault(); };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  useEffect(() => {
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate({ to: "/" })} className="font-rajdhani text-gray-400 hover:text-neon-blue transition-colors text-sm">← Back</button>
          <h1 className="font-orbitron text-2xl font-black text-neon-blue" style={{ textShadow: '0 0 15px rgba(0,212,255,0.7)' }}>SPACE INVADERS</h1>
          <SoundToggle />
        </div>
        <div className="flex gap-6 justify-center mb-4">
          {([["SCORE", score, "text-neon-blue"], ["BEST", highScore, "text-neon-purple"], ["LIVES", "❤️".repeat(Math.max(0, lives)), "text-red-400"], ["LEVEL", level, "text-green-400"]] as [string, string | number, string][]).map(([l, v, c]) => (
            <div key={l} className="text-center">
              <div className="font-rajdhani text-xs text-gray-400">{l}</div>
              <div className={`font-orbitron text-lg ${c}`}>{v}</div>
            </div>
          ))}
        </div>
        <div className="relative border border-neon-blue/30 rounded-xl overflow-hidden">
          <canvas ref={canvasRef} width={W} height={H} className="block w-full" />
          {gameState === "idle" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75">
              <div className="text-5xl mb-4">👾</div>
              <h2 className="font-orbitron text-2xl text-neon-blue mb-2">SPACE INVADERS</h2>
              <p className="font-rajdhani text-gray-400 mb-6 text-center px-4">← → to move, Space to shoot. Destroy all aliens!</p>
              <button onClick={startGame} className="px-8 py-3 bg-neon-blue/20 border border-neon-blue text-neon-blue font-orbitron rounded-lg hover:bg-neon-blue/30 transition-colors">START GAME</button>
            </div>
          )}
          {gameState === "over" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
              <div className="text-5xl mb-4">💀</div>
              <h2 className="font-orbitron text-2xl text-red-400 mb-2">GAME OVER</h2>
              <p className="font-rajdhani text-gray-400 mb-1">Score: <span className="text-neon-blue">{score}</span></p>
              <p className="font-rajdhani text-gray-400 mb-6">Best: <span className="text-neon-purple">{highScore}</span></p>
              <button onClick={startGame} className="px-8 py-3 bg-neon-blue/20 border border-neon-blue text-neon-blue font-orbitron rounded-lg hover:bg-neon-blue/30 transition-colors">PLAY AGAIN</button>
            </div>
          )}
        </div>
        <p className="font-rajdhani text-xs text-gray-600 text-center mt-4">← → Move | Space Shoot</p>
      </div>
    </div>
  );
}

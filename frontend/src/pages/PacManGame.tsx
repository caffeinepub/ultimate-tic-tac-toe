import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useSoundManager } from "../hooks/useSoundManager";
import SoundToggle from "../components/SoundToggle";
import { awardXP } from "../utils/achievements";

const CELL = 20;
const MAZE_TEMPLATE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,1],
  [1,3,1,1,2,1,1,1,2,1,1,1,2,1,1,1,2,1,1,3,1],
  [1,2,1,1,2,1,1,1,2,1,1,1,2,1,1,1,2,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,2,1,1,1,1,1,1,1,2,1,2,1,1,2,1],
  [1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1],
  [1,1,1,1,2,1,1,1,0,0,0,0,0,1,1,1,2,1,1,1,1],
  [1,1,1,1,2,1,0,0,0,1,1,1,0,0,0,1,2,1,1,1,1],
  [1,1,1,1,2,0,0,1,1,1,1,1,1,1,0,0,2,1,1,1,1],
  [0,0,0,0,2,0,0,1,1,1,1,1,1,1,0,0,2,0,0,0,0],
  [1,1,1,1,2,0,0,1,1,1,1,1,1,1,0,0,2,1,1,1,1],
  [1,1,1,1,2,1,0,0,0,1,1,1,0,0,0,1,2,1,1,1,1],
  [1,1,1,1,2,1,1,1,0,0,0,0,0,1,1,1,2,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,1,1,2,1,1,1,2,1,1,1,2,1,1,2,1],
  [1,3,2,1,2,2,2,2,2,2,0,2,2,2,2,2,2,1,2,3,1],
  [1,1,2,1,2,1,2,1,1,1,1,1,1,1,2,1,2,1,2,1,1],
  [1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1],
  [1,2,1,1,1,1,1,1,2,1,1,1,2,1,1,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

const ROWS = MAZE_TEMPLATE.length;
const COLS = MAZE_TEMPLATE[0].length;
const W = COLS * CELL;
const H = ROWS * CELL;

interface Ghost { x: number; y: number; dir: { x: number; y: number }; color: string; vulnerable: boolean; eaten: boolean }

function initMaze() { return MAZE_TEMPLATE.map(r => [...r]); }

function canMove(maze: number[][], x: number, y: number): boolean {
  if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return false;
  return maze[y][x] !== 1;
}

const GHOST_COLORS = ["#ff4444", "#ffb8ff", "#00ffff", "#ffb852"];
const GHOST_STARTS = [{ x: 9, y: 9 }, { x: 10, y: 9 }, { x: 11, y: 9 }, { x: 10, y: 10 }];
const MOVE_DIRS = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];

export default function PacManGame() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { playClick, playScore, playGameOver } = useSoundManager();

  const mazeRef = useRef(initMaze());
  const pacRef = useRef({ x: 10, y: 16, dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 }, mouth: 0, mouthDir: 1 });
  const ghostsRef = useRef<Ghost[]>(GHOST_STARTS.map((s, i) => ({ ...s, dir: MOVE_DIRS[i % 4], color: GHOST_COLORS[i], vulnerable: false, eaten: false })));
  const livesRef = useRef(3);
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const powerTimerRef = useRef(0);
  const runningRef = useRef(false);
  const rafRef = useRef(0);
  const lastTimeRef = useRef(0);
  const moveTimerRef = useRef(0);
  const ghostMoveTimerRef = useRef(0);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem("pacman_highscore") || "0"));
  const [gameState, setGameState] = useState<"idle" | "playing" | "over">("idle");

  const countPellets = useCallback(() => mazeRef.current.flat().filter(c => c === 2 || c === 3).length, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#050510";
    ctx.fillRect(0, 0, W, H);

    mazeRef.current.forEach((row, r) => {
      row.forEach((cell, c) => {
        const cx = c * CELL + CELL / 2;
        const cy = r * CELL + CELL / 2;
        if (cell === 1) {
          ctx.fillStyle = "#1a1a6e";
          ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
          ctx.strokeStyle = "#4444ff";
          ctx.lineWidth = 1;
          ctx.strokeRect(c * CELL + 0.5, r * CELL + 0.5, CELL - 1, CELL - 1);
        } else if (cell === 2) {
          ctx.shadowBlur = 4;
          ctx.shadowColor = "#ffff00";
          ctx.fillStyle = "#ffff00";
          ctx.beginPath();
          ctx.arc(cx, cy, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else if (cell === 3) {
          ctx.shadowBlur = 12;
          ctx.shadowColor = "#ffaa00";
          ctx.fillStyle = "#ffaa00";
          ctx.beginPath();
          ctx.arc(cx, cy, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });
    });

    const pac = pacRef.current;
    const px = pac.x * CELL + CELL / 2;
    const py = pac.y * CELL + CELL / 2;
    const angle = Math.atan2(pac.dir.y, pac.dir.x);
    const mouth = (pac.mouth / 30) * Math.PI * 0.4;
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#ffff00";
    ctx.fillStyle = "#ffff00";
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.arc(px, py, CELL / 2 - 2, angle + mouth, angle + Math.PI * 2 - mouth);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    ghostsRef.current.forEach(g => {
      if (g.eaten) return;
      const gx = g.x * CELL + CELL / 2;
      const gy = g.y * CELL + CELL / 2;
      const gr = CELL / 2 - 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = g.vulnerable ? "#4444ff" : g.color;
      ctx.fillStyle = g.vulnerable ? "#4444ff" : g.color;
      ctx.beginPath();
      ctx.arc(gx, gy - 2, gr, Math.PI, 0);
      ctx.lineTo(gx + gr, gy + gr);
      for (let i = 0; i < 3; i++) {
        ctx.arc(gx + gr - (i + 0.5) * (gr * 2 / 3), gy + gr, gr / 3, 0, Math.PI, true);
      }
      ctx.lineTo(gx - gr, gy - 2);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "white";
      ctx.beginPath(); ctx.arc(gx - 4, gy - 2, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(gx + 4, gy - 2, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#000088";
      ctx.beginPath(); ctx.arc(gx - 3, gy - 2, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(gx + 5, gy - 2, 1.5, 0, Math.PI * 2); ctx.fill();
    });
  }, []);

  const endGame = useCallback(() => {
    runningRef.current = false;
    cancelAnimationFrame(rafRef.current);
    playGameOver();
    setHighScore(prev => {
      const next = Math.max(prev, scoreRef.current);
      localStorage.setItem("pacman_highscore", String(next));
      return next;
    });
    setGameState("over");
  }, [playGameOver]);

  const gameLoop = useCallback((time: number) => {
    if (!runningRef.current) return;
    const dt = Math.min(time - lastTimeRef.current, 50);
    lastTimeRef.current = time;

    if (powerTimerRef.current > 0) {
      powerTimerRef.current -= dt;
      if (powerTimerRef.current <= 0) {
        ghostsRef.current.forEach(g => { g.vulnerable = false; g.eaten = false; });
      }
    }

    const pacSpeed = 200;
    moveTimerRef.current += dt;
    if (moveTimerRef.current >= pacSpeed) {
      moveTimerRef.current = 0;
      const pac = pacRef.current;
      pac.mouth = (pac.mouth + pac.mouthDir * 5) % 30;
      if (pac.mouth <= 0 || pac.mouth >= 30) pac.mouthDir *= -1;

      const nd = pac.nextDir;
      if (canMove(mazeRef.current, pac.x + nd.x, pac.y + nd.y)) {
        pac.dir = nd;
      }
      const wnx = (pac.x + pac.dir.x + COLS) % COLS;
      const wny = (pac.y + pac.dir.y + ROWS) % ROWS;
      if (canMove(mazeRef.current, wnx, wny)) {
        pac.x = wnx; pac.y = wny;
        const cell = mazeRef.current[pac.y][pac.x];
        if (cell === 2) {
          mazeRef.current[pac.y][pac.x] = 0;
          scoreRef.current += 10;
          setScore(scoreRef.current);
          playClick();
        } else if (cell === 3) {
          mazeRef.current[pac.y][pac.x] = 0;
          scoreRef.current += 50;
          setScore(scoreRef.current);
          powerTimerRef.current = 10000;
          ghostsRef.current.forEach(g => { g.vulnerable = true; g.eaten = false; });
          playScore();
        }
        if (scoreRef.current % 200 === 0 && scoreRef.current > 0) awardXP(10);
        if (countPellets() === 0) {
          levelRef.current++;
          setLevel(levelRef.current);
          mazeRef.current = initMaze();
          pac.x = 10; pac.y = 16;
          ghostsRef.current = GHOST_STARTS.map((s, i) => ({ ...s, dir: MOVE_DIRS[i % 4], color: GHOST_COLORS[i], vulnerable: false, eaten: false }));
          playScore();
        }
      }
    }

    const ghostSpeed = Math.max(300, 500 - levelRef.current * 30);
    ghostMoveTimerRef.current += dt;
    if (ghostMoveTimerRef.current >= ghostSpeed) {
      ghostMoveTimerRef.current = 0;
      ghostsRef.current.forEach(g => {
        if (g.eaten) return;
        const pac = pacRef.current;
        const possible = MOVE_DIRS.filter(d => canMove(mazeRef.current, g.x + d.x, g.y + d.y) && !(d.x === -g.dir.x && d.y === -g.dir.y));
        if (possible.length === 0) return;
        let chosen = possible[Math.floor(Math.random() * possible.length)];
        if (!g.vulnerable && Math.random() < 0.6) {
          const dx = pac.x - g.x; const dy = pac.y - g.y;
          chosen = possible.reduce((a, b) => {
            const da = Math.abs(a.x - dx) + Math.abs(a.y - dy);
            const db = Math.abs(b.x - dx) + Math.abs(b.y - dy);
            return da < db ? a : b;
          });
        }
        g.dir = chosen;
        g.x = (g.x + chosen.x + COLS) % COLS;
        g.y = (g.y + chosen.y + ROWS) % ROWS;
      });
    }

    const pac = pacRef.current;
    ghostsRef.current.forEach(g => {
      if (g.eaten) return;
      if (g.x === pac.x && g.y === pac.y) {
        if (g.vulnerable) {
          g.eaten = true;
          scoreRef.current += 200;
          setScore(scoreRef.current);
          playScore();
        } else {
          livesRef.current--;
          setLives(livesRef.current);
          playGameOver();
          if (livesRef.current <= 0) { endGame(); return; }
          pac.x = 10; pac.y = 16;
          ghostsRef.current = GHOST_STARTS.map((s, i) => ({ ...s, dir: MOVE_DIRS[i % 4], color: GHOST_COLORS[i], vulnerable: false, eaten: false }));
        }
      }
    });

    draw();
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [draw, endGame, playClick, playScore, playGameOver, countPellets]);

  const startGame = useCallback(() => {
    mazeRef.current = initMaze();
    pacRef.current = { x: 10, y: 16, dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 }, mouth: 0, mouthDir: 1 };
    ghostsRef.current = GHOST_STARTS.map((s, i) => ({ ...s, dir: MOVE_DIRS[i % 4], color: GHOST_COLORS[i], vulnerable: false, eaten: false }));
    livesRef.current = 3;
    scoreRef.current = 0;
    levelRef.current = 1;
    powerTimerRef.current = 0;
    moveTimerRef.current = 0;
    ghostMoveTimerRef.current = 0;
    runningRef.current = true;
    setScore(0); setLives(3); setLevel(1);
    setGameState("playing");
    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const map: Record<string, { x: number; y: number }> = {
        ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 },
        ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 },
      };
      if (map[e.key]) { e.preventDefault(); pacRef.current.nextDir = map[e.key]; }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate({ to: "/" })} className="font-rajdhani text-gray-400 hover:text-neon-blue transition-colors text-sm">← Back</button>
          <h1 className="font-orbitron text-2xl font-black text-neon-blue" style={{ textShadow: '0 0 15px rgba(0,212,255,0.7)' }}>PAC-MAN</h1>
          <SoundToggle />
        </div>
        <div className="flex gap-4 justify-center mb-4">
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
              <div className="text-5xl mb-4">👻</div>
              <h2 className="font-orbitron text-2xl text-neon-blue mb-2">PAC-MAN</h2>
              <p className="font-rajdhani text-gray-400 mb-6 text-center px-4">Arrow keys to move. Eat all pellets, avoid ghosts!</p>
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
        <p className="font-rajdhani text-xs text-gray-600 text-center mt-4">Arrow Keys to move · Power pellets make ghosts vulnerable</p>
      </div>
    </div>
  );
}

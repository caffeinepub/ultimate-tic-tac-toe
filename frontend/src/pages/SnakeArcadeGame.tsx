import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useSoundManager } from "../hooks/useSoundManager";
import SoundToggle from "../components/SoundToggle";
import { awardXP } from "../utils/achievements";

const CELL = 20;
const COLS = 25;
const ROWS = 20;
const W = COLS * CELL;
const H = ROWS * CELL;

type Dir = { x: number; y: number };
type Point = { x: number; y: number };

const DIRS: Record<string, Dir> = {
  ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 }, W: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 }, S: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 }, A: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 }, D: { x: 1, y: 0 },
};

function randomFood(snake: Point[]): Point {
  let p: Point;
  do {
    p = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
  } while (snake.some(s => s.x === p.x && s.y === p.y));
  return p;
}

export default function SnakeArcadeGame() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { playScore, playGameOver } = useSoundManager();

  const snakeRef = useRef<Point[]>([{ x: 12, y: 10 }, { x: 11, y: 10 }, { x: 10, y: 10 }]);
  const dirRef = useRef<Dir>({ x: 1, y: 0 });
  const nextDirRef = useRef<Dir>({ x: 1, y: 0 });
  const foodRef = useRef<Point>(randomFood(snakeRef.current));
  const scoreRef = useRef(0);
  const runningRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem("snake_highscore") || "0"));
  const [gameState, setGameState] = useState<"idle" | "playing" | "over">("idle");

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#050510";
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = "rgba(0,200,255,0.05)";
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, H); ctx.stroke(); }
    for (let y = 0; y <= ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(W, y * CELL); ctx.stroke(); }

    // Food
    const food = foodRef.current;
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#ff4444";
    ctx.fillStyle = "#ff4444";
    ctx.beginPath();
    ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Snake
    snakeRef.current.forEach((seg, i) => {
      const ratio = 1 - i / snakeRef.current.length;
      ctx.shadowBlur = i === 0 ? 20 : 8;
      ctx.shadowColor = "#00c8ff";
      ctx.fillStyle = i === 0 ? "#00ffff" : `rgba(0,${Math.floor(150 + ratio * 105)},255,${0.5 + ratio * 0.5})`;
      const pad = i === 0 ? 1 : 2;
      ctx.beginPath();
      ctx.roundRect(seg.x * CELL + pad, seg.y * CELL + pad, CELL - pad * 2, CELL - pad * 2, 4);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
  }, []);

  const endGame = useCallback(() => {
    runningRef.current = false;
    if (intervalRef.current) clearInterval(intervalRef.current);
    playGameOver();
    const s = scoreRef.current;
    setHighScore(prev => {
      const next = Math.max(prev, s);
      localStorage.setItem("snake_highscore", String(next));
      return next;
    });
    setGameState("over");
  }, [playGameOver]);

  const tick = useCallback(() => {
    if (!runningRef.current) return;
    dirRef.current = nextDirRef.current;
    const head = snakeRef.current[0];
    const newHead = { x: head.x + dirRef.current.x, y: head.y + dirRef.current.y };

    if (newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS) { endGame(); return; }
    if (snakeRef.current.some(s => s.x === newHead.x && s.y === newHead.y)) { endGame(); return; }

    const ate = newHead.x === foodRef.current.x && newHead.y === foodRef.current.y;
    snakeRef.current = [newHead, ...snakeRef.current];
    if (ate) {
      playScore();
      scoreRef.current += 10;
      setScore(scoreRef.current);
      foodRef.current = randomFood(snakeRef.current);
      if (scoreRef.current % 50 === 0) awardXP(10);
    } else {
      snakeRef.current.pop();
    }
    draw();
  }, [draw, endGame, playScore]);

  const startGame = useCallback(() => {
    snakeRef.current = [{ x: 12, y: 10 }, { x: 11, y: 10 }, { x: 10, y: 10 }];
    dirRef.current = { x: 1, y: 0 };
    nextDirRef.current = { x: 1, y: 0 };
    foodRef.current = randomFood(snakeRef.current);
    scoreRef.current = 0;
    setScore(0);
    runningRef.current = true;
    setGameState("playing");
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(tick, 120);
    draw();
  }, [tick, draw]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const d = DIRS[e.key];
      if (!d) return;
      e.preventDefault();
      const cur = dirRef.current;
      if (d.x === -cur.x && d.y === -cur.y) return;
      nextDirRef.current = d;
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    draw();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [draw]);

  // Restart interval when tick changes (after startGame)
  useEffect(() => {
    if (gameState === "playing" && runningRef.current) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(tick, 120);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [tick, gameState]);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate({ to: "/" })} className="font-rajdhani text-gray-400 hover:text-neon-blue transition-colors text-sm">
            ← Back
          </button>
          <h1 className="font-orbitron text-2xl font-black text-neon-blue" style={{ textShadow: '0 0 15px rgba(0,212,255,0.7)' }}>SNAKE</h1>
          <SoundToggle />
        </div>

        <div className="flex gap-6 justify-center mb-4">
          <div className="text-center">
            <div className="font-rajdhani text-xs text-gray-400">SCORE</div>
            <div className="font-orbitron text-xl text-neon-blue">{score}</div>
          </div>
          <div className="text-center">
            <div className="font-rajdhani text-xs text-gray-400">BEST</div>
            <div className="font-orbitron text-xl text-neon-purple">{highScore}</div>
          </div>
        </div>

        <div className="relative border border-neon-blue/30 rounded-xl overflow-hidden" style={{ width: W, maxWidth: "100%" }}>
          <canvas ref={canvasRef} width={W} height={H} className="block w-full" />

          {gameState === "idle" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
              <div className="text-5xl mb-4">🐍</div>
              <h2 className="font-orbitron text-2xl text-neon-blue mb-2">SNAKE ARCADE</h2>
              <p className="font-rajdhani text-gray-400 mb-6 text-center px-4">Use Arrow Keys or WASD to control the snake. Eat food to grow!</p>
              <button onClick={startGame} className="px-8 py-3 bg-neon-blue/20 border border-neon-blue text-neon-blue font-orbitron rounded-lg hover:bg-neon-blue/30 transition-colors">
                START GAME
              </button>
            </div>
          )}

          {gameState === "over" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
              <div className="text-5xl mb-4">💀</div>
              <h2 className="font-orbitron text-2xl text-red-400 mb-2">GAME OVER</h2>
              <p className="font-rajdhani text-gray-400 mb-1">Score: <span className="text-neon-blue">{score}</span></p>
              <p className="font-rajdhani text-gray-400 mb-6">Best: <span className="text-neon-purple">{highScore}</span></p>
              <button onClick={startGame} className="px-8 py-3 bg-neon-blue/20 border border-neon-blue text-neon-blue font-orbitron rounded-lg hover:bg-neon-blue/30 transition-colors">
                PLAY AGAIN
              </button>
            </div>
          )}
        </div>

        <p className="font-rajdhani text-xs text-gray-600 text-center mt-4">
          Arrow Keys / WASD to move
        </p>
      </div>
    </div>
  );
}

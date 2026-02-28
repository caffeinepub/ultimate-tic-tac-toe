import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useSoundManager } from "../hooks/useSoundManager";
import SoundToggle from "../components/SoundToggle";

const COLS = 10;
const ROWS = 20;
const CELL = 30;
const W = COLS * CELL;
const H = ROWS * CELL;

type Board = (string | null)[][];
type Piece = { shape: number[][]; color: string; x: number; y: number };

const TETROMINOES = [
  { shape: [[1,1,1,1]], color: "#00ffff" },
  { shape: [[1,1],[1,1]], color: "#ffff00" },
  { shape: [[0,1,0],[1,1,1]], color: "#aa00ff" },
  { shape: [[1,0,0],[1,1,1]], color: "#ff8800" },
  { shape: [[0,0,1],[1,1,1]], color: "#0044ff" },
  { shape: [[0,1,1],[1,1,0]], color: "#00ff44" },
  { shape: [[1,1,0],[0,1,1]], color: "#ff0044" },
];

function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function randomPiece(): Piece {
  const t = TETROMINOES[Math.floor(Math.random() * TETROMINOES.length)];
  return { shape: t.shape, color: t.color, x: Math.floor(COLS / 2) - Math.floor(t.shape[0].length / 2), y: 0 };
}

function rotate(shape: number[][]): number[][] {
  return shape[0].map((_, i) => shape.map(row => row[i]).reverse());
}

function isValid(board: Board, piece: Piece, dx = 0, dy = 0, shape = piece.shape): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = piece.x + c + dx;
      const ny = piece.y + r + dy;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return false;
      if (ny >= 0 && board[ny][nx]) return false;
    }
  }
  return true;
}

function placePiece(board: Board, piece: Piece): Board {
  const b = board.map(r => [...r]);
  piece.shape.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (cell && piece.y + r >= 0) b[piece.y + r][piece.x + c] = piece.color;
    });
  });
  return b;
}

function clearLines(board: Board): { board: Board; lines: number } {
  const newBoard = board.filter(row => row.some(c => !c));
  const lines = ROWS - newBoard.length;
  const empty = Array.from({ length: lines }, () => Array(COLS).fill(null));
  return { board: [...empty, ...newBoard], lines };
}

export default function TetrisGame() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nextCanvasRef = useRef<HTMLCanvasElement>(null);
  const { playScore, playGameOver } = useSoundManager();

  const boardRef = useRef<Board>(emptyBoard());
  const pieceRef = useRef<Piece>(randomPiece());
  const nextPieceRef = useRef<Piece>(randomPiece());
  const runningRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const linesRef = useRef(0);

  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem("tetris_highscore") || "0"));
  const [gameState, setGameState] = useState<"idle" | "playing" | "over">("idle");

  const drawNextPiece = useCallback(() => {
    const canvas = nextCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#050510";
    ctx.fillRect(0, 0, 80, 80);
    const np = nextPieceRef.current;
    const cs = 16;
    const ox = Math.floor((5 - np.shape[0].length) / 2);
    const oy = Math.floor((5 - np.shape.length) / 2);
    np.shape.forEach((row, r) => row.forEach((cell, c) => {
      if (cell) {
        ctx.fillStyle = np.color;
        ctx.shadowBlur = 6;
        ctx.shadowColor = np.color;
        ctx.fillRect((ox + c) * cs + 1, (oy + r) * cs + 1, cs - 2, cs - 2);
        ctx.shadowBlur = 0;
      }
    }));
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#050510";
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = "rgba(0,200,255,0.05)";
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, H); ctx.stroke(); }
    for (let y = 0; y <= ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(W, y * CELL); ctx.stroke(); }

    // Board
    boardRef.current.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = cell;
          ctx.fillStyle = cell;
          ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
          ctx.shadowBlur = 0;
          ctx.strokeStyle = "rgba(255,255,255,0.2)";
          ctx.strokeRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
        }
      });
    });

    // Current piece
    const p = pieceRef.current;
    p.shape.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = p.color;
          ctx.fillStyle = p.color;
          ctx.fillRect((p.x + c) * CELL + 1, (p.y + r) * CELL + 1, CELL - 2, CELL - 2);
          ctx.shadowBlur = 0;
        }
      });
    });

    // Ghost piece
    let ghostY = p.y;
    while (isValid(boardRef.current, p, 0, ghostY - p.y + 1)) ghostY++;
    if (ghostY !== p.y) {
      p.shape.forEach((row, r) => {
        row.forEach((cell, c) => {
          if (cell) {
            ctx.fillStyle = `${p.color}33`;
            ctx.strokeStyle = `${p.color}66`;
            ctx.lineWidth = 1;
            ctx.fillRect((p.x + c) * CELL + 1, (ghostY + r) * CELL + 1, CELL - 2, CELL - 2);
            ctx.strokeRect((p.x + c) * CELL + 1, (ghostY + r) * CELL + 1, CELL - 2, CELL - 2);
          }
        });
      });
    }

    drawNextPiece();
  }, [drawNextPiece]);

  const lockAndNext = useCallback(() => {
    const placed = placePiece(boardRef.current, pieceRef.current);
    const { board: cleared, lines: clearedLines } = clearLines(placed);
    boardRef.current = cleared;

    if (clearedLines > 0) {
      playScore();
      const pts = [0, 100, 300, 500, 800][clearedLines] * levelRef.current;
      scoreRef.current += pts;
      linesRef.current += clearedLines;
      levelRef.current = Math.floor(linesRef.current / 10) + 1;
      setScore(scoreRef.current);
      setLines(linesRef.current);
      setLevel(levelRef.current);

      if (intervalRef.current) clearInterval(intervalRef.current);
      const speed = Math.max(100, 500 - (levelRef.current - 1) * 40);
      intervalRef.current = setInterval(() => {
        if (!runningRef.current) return;
        if (isValid(boardRef.current, pieceRef.current, 0, 1)) {
          pieceRef.current = { ...pieceRef.current, y: pieceRef.current.y + 1 };
        } else {
          lockAndNext();
        }
        draw();
      }, speed);
    }

    pieceRef.current = nextPieceRef.current;
    nextPieceRef.current = randomPiece();

    if (!isValid(boardRef.current, pieceRef.current)) {
      runningRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      playGameOver();
      setHighScore(prev => {
        const next = Math.max(prev, scoreRef.current);
        localStorage.setItem("tetris_highscore", String(next));
        return next;
      });
      setGameState("over");
    }
    draw();
  }, [draw, playScore, playGameOver]);

  const startGame = useCallback(() => {
    boardRef.current = emptyBoard();
    pieceRef.current = randomPiece();
    nextPieceRef.current = randomPiece();
    scoreRef.current = 0;
    levelRef.current = 1;
    linesRef.current = 0;
    runningRef.current = true;
    setScore(0); setLevel(1); setLines(0);
    setGameState("playing");
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (!runningRef.current) return;
      if (isValid(boardRef.current, pieceRef.current, 0, 1)) {
        pieceRef.current = { ...pieceRef.current, y: pieceRef.current.y + 1 };
      } else {
        lockAndNext();
      }
      draw();
    }, 500);
    draw();
  }, [lockAndNext, draw]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!runningRef.current) return;
      const p = pieceRef.current;
      if (e.key === "ArrowLeft" && isValid(boardRef.current, p, -1, 0)) {
        e.preventDefault();
        pieceRef.current = { ...p, x: p.x - 1 }; draw();
      } else if (e.key === "ArrowRight" && isValid(boardRef.current, p, 1, 0)) {
        e.preventDefault();
        pieceRef.current = { ...p, x: p.x + 1 }; draw();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (isValid(boardRef.current, p, 0, 1)) { pieceRef.current = { ...p, y: p.y + 1 }; draw(); }
        else lockAndNext();
      } else if (e.key === "ArrowUp" || e.key === "x" || e.key === "X") {
        e.preventDefault();
        const rotated = rotate(p.shape);
        if (isValid(boardRef.current, p, 0, 0, rotated)) { pieceRef.current = { ...p, shape: rotated }; draw(); }
      } else if (e.key === " ") {
        e.preventDefault();
        let ny = p.y;
        while (isValid(boardRef.current, p, 0, ny - p.y + 1)) ny++;
        pieceRef.current = { ...p, y: ny };
        lockAndNext();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [draw, lockAndNext]);

  useEffect(() => {
    draw();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [draw]);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="flex flex-col lg:flex-row gap-6 items-start justify-center w-full max-w-3xl">
        {/* Side panel */}
        <div className="flex flex-col gap-4 min-w-[140px]">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate({ to: "/" })} className="font-rajdhani text-gray-400 hover:text-neon-blue transition-colors text-sm">← Back</button>
            <SoundToggle />
          </div>
          <h1 className="font-orbitron text-xl font-black text-neon-blue" style={{ textShadow: '0 0 15px rgba(0,212,255,0.7)' }}>TETRIS</h1>
          {([["SCORE", score], ["BEST", highScore], ["LEVEL", level], ["LINES", lines]] as [string, number][]).map(([label, val]) => (
            <div key={label} className="bg-gray-900 border border-neon-blue/20 rounded-lg p-3 text-center">
              <div className="font-rajdhani text-xs text-gray-400">{label}</div>
              <div className="font-orbitron text-lg text-neon-blue">{val}</div>
            </div>
          ))}
          <div className="bg-gray-900 border border-neon-blue/20 rounded-lg p-3 text-center">
            <div className="font-rajdhani text-xs text-gray-400 mb-2">NEXT</div>
            <canvas ref={nextCanvasRef} width={80} height={80} className="mx-auto block" />
          </div>
          <div className="bg-gray-900 border border-neon-blue/20 rounded-lg p-3 text-xs font-rajdhani text-gray-500 space-y-1">
            <div>← → Move</div>
            <div>↑ / X Rotate</div>
            <div>↓ Soft drop</div>
            <div>Space Hard drop</div>
          </div>
        </div>

        {/* Canvas */}
        <div className="relative border border-neon-blue/30 rounded-xl overflow-hidden" style={{ width: W }}>
          <canvas ref={canvasRef} width={W} height={H} className="block" />
          {gameState === "idle" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75">
              <div className="text-5xl mb-4">🧱</div>
              <h2 className="font-orbitron text-2xl text-neon-blue mb-6">TETRIS</h2>
              <button onClick={startGame} className="px-8 py-3 bg-neon-blue/20 border border-neon-blue text-neon-blue font-orbitron rounded-lg hover:bg-neon-blue/30 transition-colors">START</button>
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
      </div>
    </div>
  );
}

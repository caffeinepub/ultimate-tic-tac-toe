import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useSoundManager } from "../hooks/useSoundManager";
import SoundToggle from "../components/SoundToggle";
import { awardXP } from "../utils/achievements";

const ROWS = 9;
const COLS = 9;
const MINES = 10;

interface Cell {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacent: number;
}

type Board = Cell[][];

function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ mine: false, revealed: false, flagged: false, adjacent: 0 }))
  );
}

function placeMines(board: Board, safeR: number, safeC: number): Board {
  const b = board.map(row => row.map(c => ({ ...c })));
  let placed = 0;
  while (placed < MINES) {
    const r = Math.floor(Math.random() * ROWS);
    const c = Math.floor(Math.random() * COLS);
    if (!b[r][c].mine && !(Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1)) {
      b[r][c].mine = true;
      placed++;
    }
  }
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (b[r][c].mine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr; const nc = c + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && b[nr][nc].mine) count++;
      }
      b[r][c].adjacent = count;
    }
  }
  return b;
}

function floodReveal(board: Board, r: number, c: number): Board {
  const b = board.map(row => row.map(cell => ({ ...cell })));
  const stack = [[r, c]];
  while (stack.length > 0) {
    const [cr, cc] = stack.pop()!;
    if (cr < 0 || cr >= ROWS || cc < 0 || cc >= COLS) continue;
    if (b[cr][cc].revealed || b[cr][cc].flagged || b[cr][cc].mine) continue;
    b[cr][cc].revealed = true;
    if (b[cr][cc].adjacent === 0) {
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        stack.push([cr + dr, cc + dc]);
      }
    }
  }
  return b;
}

const ADJ_COLORS = ["", "#6495ed", "#3cb371", "#dc143c", "#00008b", "#8b0000", "#20b2aa", "#000000", "#808080"];

export default function MinesweeperGame() {
  const navigate = useNavigate();
  const { playClick, playScore, playGameOver } = useSoundManager();

  const [board, setBoard] = useState<Board>(emptyBoard());
  const [gameState, setGameState] = useState<"idle" | "playing" | "won" | "lost">("idle");
  const [firstClick, setFirstClick] = useState(true);
  const [flagCount, setFlagCount] = useState(0);
  const [time, setTime] = useState(0);
  const [bestTime, setBestTime] = useState<number | null>(() => {
    const s = localStorage.getItem("minesweeper_highscore");
    return s ? parseInt(s) : null;
  });

  useEffect(() => {
    if (gameState !== "playing") return;
    const id = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [gameState]);

  const reveal = useCallback((r: number, c: number) => {
    if (gameState === "won" || gameState === "lost") return;
    setBoard(prev => {
      let b = prev.map(row => row.map(cell => ({ ...cell })));
      if (b[r][c].revealed || b[r][c].flagged) return prev;

      let isFirst = false;
      if (firstClick) {
        b = placeMines(b, r, c);
        setFirstClick(false);
        setGameState("playing");
        isFirst = true;
      }

      if (b[r][c].mine) {
        b = b.map(row => row.map(cell => ({ ...cell, revealed: cell.mine ? true : cell.revealed })));
        playGameOver();
        setGameState("lost");
        return b;
      }

      b = floodReveal(b, r, c);
      if (!isFirst) playClick();

      const unrevealed = b.flat().filter(cell => !cell.mine && !cell.revealed).length;
      if (unrevealed === 0) {
        playScore();
        awardXP(20);
        setGameState("won");
        setTime(t => {
          const finalTime = t;
          setBestTime(prev => {
            const next = prev === null ? finalTime : Math.min(prev, finalTime);
            localStorage.setItem("minesweeper_highscore", String(next));
            return next;
          });
          return finalTime;
        });
      }
      return b;
    });
  }, [gameState, firstClick, playClick, playScore, playGameOver]);

  const toggleFlag = useCallback((e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (gameState !== "playing" && gameState !== "idle") return;
    setBoard(prev => {
      const b = prev.map(row => row.map(cell => ({ ...cell })));
      if (b[r][c].revealed) return prev;
      b[r][c].flagged = !b[r][c].flagged;
      setFlagCount(fc => b[r][c].flagged ? fc + 1 : fc - 1);
      playClick();
      return b;
    });
  }, [gameState, playClick]);

  const reset = () => {
    setBoard(emptyBoard());
    setGameState("idle");
    setFirstClick(true);
    setFlagCount(0);
    setTime(0);
  };

  const getCellStyle = (cell: Cell) => {
    if (!cell.revealed) {
      return "bg-slate-700 hover:bg-slate-600 border-slate-500 cursor-pointer";
    }
    if (cell.mine) return "bg-red-900/60 border-red-500/50";
    return "bg-slate-900/80 border-slate-700/50";
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate({ to: "/" })} className="font-rajdhani text-gray-400 hover:text-neon-blue transition-colors text-sm">← Back</button>
          <h1 className="font-orbitron text-xl font-black text-neon-blue" style={{ textShadow: '0 0 15px rgba(0,212,255,0.7)' }}>MINESWEEPER</h1>
          <SoundToggle />
        </div>

        <div className="flex gap-4 justify-center mb-4">
          <div className="text-center bg-gray-900 border border-neon-blue/20 rounded-lg px-4 py-2">
            <div className="font-rajdhani text-xs text-gray-400">💣 MINES</div>
            <div className="font-orbitron text-lg text-red-400">{MINES - flagCount}</div>
          </div>
          <div className="text-center bg-gray-900 border border-neon-blue/20 rounded-lg px-4 py-2">
            <div className="font-rajdhani text-xs text-gray-400">⏱ TIME</div>
            <div className="font-orbitron text-lg text-neon-blue">{time}s</div>
          </div>
          <div className="text-center bg-gray-900 border border-neon-blue/20 rounded-lg px-4 py-2">
            <div className="font-rajdhani text-xs text-gray-400">🏆 BEST</div>
            <div className="font-orbitron text-lg text-neon-purple">{bestTime !== null ? `${bestTime}s` : "—"}</div>
          </div>
        </div>

        {(gameState === "won" || gameState === "lost") && (
          <div className={`text-center mb-4 p-3 rounded-lg border ${gameState === "won" ? "border-green-500/50 bg-green-900/20 text-green-400" : "border-red-500/50 bg-red-900/20 text-red-400"}`}>
            <span className="font-orbitron text-lg">{gameState === "won" ? "🎉 YOU WIN!" : "💥 BOOM!"}</span>
            {gameState === "won" && <span className="font-rajdhani text-sm ml-2">Time: {time}s</span>}
          </div>
        )}

        <div className="bg-gray-900 border border-neon-blue/20 rounded-xl p-4 mb-4">
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
            onContextMenu={e => e.preventDefault()}
          >
            {board.map((row, r) =>
              row.map((cell, c) => (
                <button
                  key={`${r}-${c}`}
                  className={`aspect-square flex items-center justify-center text-xs font-bold border rounded transition-colors ${getCellStyle(cell)}`}
                  style={{ minWidth: 0, fontSize: "11px", color: cell.revealed && !cell.mine ? ADJ_COLORS[cell.adjacent] : undefined }}
                  onClick={() => reveal(r, c)}
                  onContextMenu={e => toggleFlag(e, r, c)}
                >
                  {cell.flagged && !cell.revealed ? "🚩" : cell.revealed && cell.mine ? "💣" : cell.revealed && cell.adjacent > 0 ? cell.adjacent : ""}
                </button>
              ))
            )}
          </div>
        </div>

        <button onClick={reset} className="w-full py-2 bg-neon-blue/10 border border-neon-blue/30 text-neon-blue font-orbitron text-sm rounded-lg hover:bg-neon-blue/20 transition-colors">
          NEW GAME
        </button>
        <p className="font-rajdhani text-xs text-gray-600 text-center mt-3">Left click to reveal · Right click to flag</p>
      </div>
    </div>
  );
}

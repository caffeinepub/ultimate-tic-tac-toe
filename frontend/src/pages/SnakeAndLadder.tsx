import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import SoundToggle from '../components/SoundToggle';
import { useSoundManager } from '../hooks/useSoundManager';
import { recordGameStart, recordWin, recordSnlDiceRoll } from '../utils/achievements';

const BOARD_SIZE = 100;
const COLS = 10;
const ROWS = 10;

const SNAKES: Record<number, number> = {
  99: 54,
  70: 55,
  52: 42,
  25: 5,
  40: 3,
  17: 7,
};

const LADDERS: Record<number, number> = {
  4: 14,
  9: 31,
  20: 38,
  28: 84,
  51: 67,
  63: 81,
  71: 91,
};

type Player = 1 | 2;
type AnimationType = 'none' | 'snake' | 'ladder' | 'move';

interface GameState {
  positions: [number, number];
  displayPositions: [number, number];
  currentPlayer: Player;
  diceValue: number | null;
  winner: Player | null;
  message: string;
  eventType: 'none' | 'snake' | 'ladder' | 'win' | 'normal';
  gameStarted: boolean;
}

const initialState: GameState = {
  positions: [0, 0],
  displayPositions: [0, 0],
  currentPlayer: 1,
  diceValue: null,
  winner: null,
  message: "Player 1's turn — Roll the dice!",
  eventType: 'none',
  gameStarted: false,
};

function cellToGridPos(cell: number): { row: number; col: number } {
  if (cell <= 0) return { row: 9, col: -1 };
  const zeroIdx = cell - 1;
  const rowFromBottom = Math.floor(zeroIdx / COLS);
  const rowFromTop = ROWS - 1 - rowFromBottom;
  const isEvenRowFromBottom = rowFromBottom % 2 === 0;
  const col = isEvenRowFromBottom ? zeroIdx % COLS : COLS - 1 - (zeroIdx % COLS);
  return { row: rowFromTop, col };
}

function cellToPercent(cell: number): { x: number; y: number } {
  const { row, col } = cellToGridPos(cell);
  const x = (col + 0.5) * 10;
  const y = (row + 0.5) * 10;
  return { x, y };
}

const DICE_DOTS: Record<number, Array<{ x: number; y: number }>> = {
  1: [{ x: 50, y: 50 }],
  2: [{ x: 25, y: 25 }, { x: 75, y: 75 }],
  3: [{ x: 25, y: 25 }, { x: 50, y: 50 }, { x: 75, y: 75 }],
  4: [{ x: 25, y: 25 }, { x: 75, y: 25 }, { x: 25, y: 75 }, { x: 75, y: 75 }],
  5: [{ x: 25, y: 25 }, { x: 75, y: 25 }, { x: 50, y: 50 }, { x: 25, y: 75 }, { x: 75, y: 75 }],
  6: [{ x: 25, y: 20 }, { x: 75, y: 20 }, { x: 25, y: 50 }, { x: 75, y: 50 }, { x: 25, y: 80 }, { x: 75, y: 80 }],
};

interface DiceProps {
  value: number | null;
  isRolling: boolean;
}

const DiceDisplay: React.FC<DiceProps> = ({ value, isRolling }) => {
  const displayValue = value ?? 1;
  const dots = DICE_DOTS[displayValue] || DICE_DOTS[1];

  return (
    <div
      className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-neon-blue/60 bg-gray-900 shadow-neon-blue-sm flex items-center justify-center ${isRolling ? 'animate-dice-spin' : ''}`}
      style={{ transition: 'transform 0.1s' }}
    >
      <svg viewBox="0 0 100 100" className="w-12 h-12 sm:w-16 sm:h-16">
        {dots.map((dot, i) => (
          <circle
            key={i}
            cx={dot.x}
            cy={dot.y}
            r={9}
            fill="oklch(0.72 0.22 200)"
            style={{ filter: 'drop-shadow(0 0 4px oklch(0.72 0.22 200 / 0.8))' }}
          />
        ))}
      </svg>
    </div>
  );
};

interface TokenProps {
  player: Player;
  animType: AnimationType;
  isActive: boolean;
}

const PlayerToken: React.FC<TokenProps> = ({ player, animType, isActive }) => {
  const isP1 = player === 1;
  const animClass =
    animType === 'snake' ? 'animate-snake-bite' :
    animType === 'ladder' ? 'animate-ladder-climb' :
    animType === 'move' ? 'animate-token-move' : '';

  return (
    <div
      className={`
        flex items-center justify-center rounded-full font-orbitron font-bold text-white
        border-2 shadow-lg transition-all duration-300
        ${isP1
          ? 'bg-neon-blue/80 border-neon-blue text-xs'
          : 'bg-neon-purple/80 border-neon-purple text-xs'
        }
        ${isActive ? 'scale-110' : 'scale-90 opacity-80'}
        ${animClass}
        w-5 h-5 sm:w-6 sm:h-6 text-[8px] sm:text-[10px]
      `}
      style={{
        boxShadow: isP1
          ? '0 0 8px oklch(0.72 0.22 200 / 0.9), 0 0 16px oklch(0.72 0.22 200 / 0.5)'
          : '0 0 8px oklch(0.65 0.28 295 / 0.9), 0 0 16px oklch(0.65 0.28 295 / 0.5)',
      }}
    >
      P{player}
    </div>
  );
};

interface RungPoint {
  x: number;
  y: number;
}

const BoardOverlay: React.FC = () => {
  return (
    <svg
      viewBox="0 0 100 100"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 10 }}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="snakeGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff4444" />
          <stop offset="100%" stopColor="#ff8800" />
        </linearGradient>
        <linearGradient id="snakeGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff2222" />
          <stop offset="100%" stopColor="#ff6600" />
        </linearGradient>
        <linearGradient id="ladderGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#22ff88" />
          <stop offset="100%" stopColor="#00cc66" />
        </linearGradient>
        <linearGradient id="ladderGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#44ffaa" />
          <stop offset="100%" stopColor="#00aa55" />
        </linearGradient>
        <marker id="snakeHead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <circle cx="3" cy="3" r="2.5" fill="#ff4444" stroke="#ff8800" strokeWidth="0.5" />
        </marker>
        <filter id="glow">
          <feGaussianBlur stdDeviation="0.3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Draw Snakes */}
      {Object.entries(SNAKES).map(([from, to], idx) => {
        const fromCell = parseInt(from);
        const start = cellToPercent(fromCell);
        const end = cellToPercent(to);
        const gradId = idx % 2 === 0 ? 'snakeGrad1' : 'snakeGrad2';

        const midX = (start.x + end.x) / 2 + (idx % 2 === 0 ? 8 : -8);
        const midY = (start.y + end.y) / 2;
        const cp1x = start.x + (idx % 2 === 0 ? 10 : -10);
        const cp1y = start.y + (end.y - start.y) * 0.3;
        const cp2x = end.x + (idx % 2 === 0 ? -10 : 10);
        const cp2y = end.y + (start.y - end.y) * 0.3;

        return (
          <g key={`snake-${fromCell}`} filter="url(#glow)">
            <path
              d={`M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${midX} ${midY}, ${(start.x + end.x) / 2} ${(start.y + end.y) / 2} S ${cp2x} ${cp2y}, ${end.x} ${end.y}`}
              stroke={`url(#${gradId})`}
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
              opacity="0.85"
            />
            <circle cx={start.x} cy={start.y} r="2.2" fill="#ff4444" stroke="#ff8800" strokeWidth="0.4" />
            <circle cx={start.x - 0.8} cy={start.y - 0.8} r="0.5" fill="white" />
            <circle cx={start.x + 0.8} cy={start.y - 0.8} r="0.5" fill="white" />
            <circle cx={end.x} cy={end.y} r="1.2" fill="#ff8800" opacity="0.7" />
          </g>
        );
      })}

      {/* Draw Ladders */}
      {Object.entries(LADDERS).map(([from, to], idx) => {
        const fromCell = parseInt(from);
        const bottom = cellToPercent(fromCell);
        const top = cellToPercent(to);
        const gradId = idx % 2 === 0 ? 'ladderGrad1' : 'ladderGrad2';

        const offset = 1.2;
        const dx = top.x - bottom.x;
        const dy = top.y - bottom.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const perpX = (-dy / len) * offset;
        const perpY = (dx / len) * offset;

        const numRungs = Math.max(3, Math.floor(len / 8));
        const rungs: RungPoint[] = [];
        for (let i = 1; i < numRungs; i++) {
          const t = i / numRungs;
          const rx = bottom.x + dx * t;
          const ry = bottom.y + dy * t;
          rungs.push({ x: rx, y: ry });
        }

        return (
          <g key={`ladder-${fromCell}`} filter="url(#glow)">
            <line
              x1={bottom.x - perpX} y1={bottom.y - perpY}
              x2={top.x - perpX} y2={top.y - perpY}
              stroke={`url(#${gradId})`}
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.9"
            />
            <line
              x1={bottom.x + perpX} y1={bottom.y + perpY}
              x2={top.x + perpX} y2={top.y + perpY}
              stroke={`url(#${gradId})`}
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.9"
            />
            {rungs.map((rung, ri) => (
              <line
                key={ri}
                x1={rung.x - perpX * 1.5} y1={rung.y - perpY * 1.5}
                x2={rung.x + perpX * 1.5} y2={rung.y + perpY * 1.5}
                stroke={`url(#${gradId})`}
                strokeWidth="0.9"
                strokeLinecap="round"
                opacity="0.85"
              />
            ))}
            <circle cx={bottom.x} cy={bottom.y} r="1.8" fill="#22ff88" opacity="0.9" />
            <circle cx={top.x} cy={top.y} r="1.8" fill="#44ffaa" opacity="0.9" />
          </g>
        );
      })}
    </svg>
  );
};

const SnakeAndLadder: React.FC = () => {
  const navigate = useNavigate();
  const { playClick, playWin, playGameOver, playScore } = useSoundManager();
  const [state, setState] = useState<GameState>(initialState);
  const [isRolling, setIsRolling] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animType, setAnimType] = useState<AnimationType>('none');
  const [animatingPlayer, setAnimatingPlayer] = useState<Player | null>(null);
  const [rollingDiceValue, setRollingDiceValue] = useState<number>(1);
  const rollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRolling) {
      rollingIntervalRef.current = setInterval(() => {
        setRollingDiceValue(Math.floor(Math.random() * 6) + 1);
      }, 80);
    } else {
      if (rollingIntervalRef.current) {
        clearInterval(rollingIntervalRef.current);
        rollingIntervalRef.current = null;
      }
    }
    return () => {
      if (rollingIntervalRef.current) clearInterval(rollingIntervalRef.current);
    };
  }, [isRolling]);

  const rollDice = useCallback(() => {
    if (state.winner || isRolling || isAnimating) return;
    setIsRolling(true);

    if (!state.gameStarted) {
      recordGameStart('snakeladder');
    }

    setTimeout(() => {
      const dice = Math.floor(Math.random() * 6) + 1;
      setIsRolling(false);
      playClick();

      const player = state.currentPlayer;
      const idx = player - 1;
      const pos = state.positions[idx] + dice;

      if (dice === 6) {
        recordSnlDiceRoll(6);
      } else {
        recordSnlDiceRoll(dice);
      }

      setIsAnimating(true);
      setAnimatingPlayer(player);
      setAnimType('move');

      setState(prev => ({
        ...prev,
        diceValue: dice,
        displayPositions: [
          idx === 0 ? Math.min(pos, BOARD_SIZE) : prev.displayPositions[0],
          idx === 1 ? Math.min(pos, BOARD_SIZE) : prev.displayPositions[1],
        ] as [number, number],
        gameStarted: true,
      }));

      setTimeout(() => {
        let finalPos = pos;
        let msg = '';
        let eventType: GameState['eventType'] = 'normal';
        let anim: AnimationType = 'none';

        if (pos > BOARD_SIZE) {
          finalPos = state.positions[idx];
          msg = `Player ${player} rolled ${dice} — can't move, too far!`;
          eventType = 'normal';
          anim = 'none';
        } else if (pos === BOARD_SIZE) {
          finalPos = pos;
          playWin();
          recordWin('snakeladder');
          setState(prev => ({
            ...prev,
            positions: [
              idx === 0 ? finalPos : prev.positions[0],
              idx === 1 ? finalPos : prev.positions[1],
            ] as [number, number],
            displayPositions: [
              idx === 0 ? finalPos : prev.displayPositions[0],
              idx === 1 ? finalPos : prev.displayPositions[1],
            ] as [number, number],
            diceValue: dice,
            winner: player,
            message: `🎉 Player ${player} wins!`,
            eventType: 'win',
            gameStarted: true,
          }));
          setIsAnimating(false);
          setAnimType('none');
          setAnimatingPlayer(null);
          return;
        } else if (SNAKES[pos]) {
          const snakeTo = SNAKES[pos];
          finalPos = snakeTo;
          msg = `🐍 Player ${player} got bitten! ${pos} → ${snakeTo}`;
          eventType = 'snake';
          anim = 'snake';
          playGameOver();
        } else if (LADDERS[pos]) {
          const ladderTo = LADDERS[pos];
          finalPos = ladderTo;
          msg = `🪜 Player ${player} climbed a ladder! ${pos} → ${ladderTo}`;
          eventType = 'ladder';
          anim = 'ladder';
          playScore();
        } else {
          finalPos = pos;
          msg = `Player ${player} rolled ${dice} — moved to ${pos}`;
          eventType = 'normal';
          anim = 'none';
        }

        setAnimType(anim);

        if (anim !== 'none') {
          setState(prev => ({
            ...prev,
            displayPositions: [
              idx === 0 ? pos : prev.displayPositions[0],
              idx === 1 ? pos : prev.displayPositions[1],
            ] as [number, number],
          }));

          setTimeout(() => {
            const nextPlayer: Player = player === 1 ? 2 : 1;
            setState(prev => ({
              ...prev,
              positions: [
                idx === 0 ? finalPos : prev.positions[0],
                idx === 1 ? finalPos : prev.positions[1],
              ] as [number, number],
              displayPositions: [
                idx === 0 ? finalPos : prev.displayPositions[0],
                idx === 1 ? finalPos : prev.displayPositions[1],
              ] as [number, number],
              currentPlayer: nextPlayer,
              diceValue: dice,
              message: msg,
              eventType,
              gameStarted: true,
            }));
            setIsAnimating(false);
            setAnimType('none');
            setAnimatingPlayer(null);
          }, 700);
        } else {
          const nextPlayer: Player = player === 1 ? 2 : 1;
          setState(prev => ({
            ...prev,
            positions: [
              idx === 0 ? finalPos : prev.positions[0],
              idx === 1 ? finalPos : prev.positions[1],
            ] as [number, number],
            displayPositions: [
              idx === 0 ? finalPos : prev.displayPositions[0],
              idx === 1 ? finalPos : prev.displayPositions[1],
            ] as [number, number],
            currentPlayer: nextPlayer,
            diceValue: dice,
            message: msg,
            eventType,
            gameStarted: true,
          }));
          setIsAnimating(false);
          setAnimType('none');
          setAnimatingPlayer(null);
        }
      }, 400);
    }, 700);
  }, [state, isRolling, isAnimating, playClick, playWin, playGameOver, playScore]);

  const resetGame = useCallback(() => {
    setState(initialState);
    setIsRolling(false);
    setIsAnimating(false);
    setAnimType('none');
    setAnimatingPlayer(null);
    playClick();
  }, [playClick]);

  const renderBoard = () => {
    const cells: React.ReactNode[] = [];

    for (let row = 9; row >= 0; row--) {
      const isEvenRowFromBottom = (9 - row) % 2 === 0;
      for (let col = 0; col < 10; col++) {
        const actualCol = isEvenRowFromBottom ? col : 9 - col;
        const cellNum = row * 10 + actualCol + 1;

        const p1Pos = state.displayPositions[0];
        const p2Pos = state.displayPositions[1];
        const p1Here = p1Pos === cellNum;
        const p2Here = p2Pos === cellNum;
        const isSnakeHead = cellNum in SNAKES;
        const isLadderBottom = cellNum in LADDERS;
        const isSnakeTail = Object.values(SNAKES).includes(cellNum);
        const isLadderTop = Object.values(LADDERS).includes(cellNum);

        const rowFromBottom = 9 - row;
        const isAltCell = (rowFromBottom + actualCol) % 2 === 0;

        let cellBg = isAltCell ? 'bg-gray-800/60' : 'bg-gray-900/80';
        if (isSnakeHead) cellBg = 'bg-red-950/70';
        else if (isLadderBottom) cellBg = 'bg-green-950/70';

        const isSpecial = isSnakeHead || isLadderBottom || isSnakeTail || isLadderTop;

        cells.push(
          <div
            key={cellNum}
            className={`
              relative flex flex-col items-center justify-center
              border border-gray-700/20
              ${cellBg}
              ${isSpecial ? 'border-gray-600/40' : ''}
              aspect-square overflow-hidden
            `}
          >
            <span
              className={`
                font-orbitron font-bold leading-none select-none
                text-[clamp(6px,1.2vw,11px)]
                ${isSnakeHead ? 'text-red-400/90' : isLadderBottom ? 'text-green-400/90' : 'text-gray-500/80'}
                ${cellNum === 100 ? 'text-neon-blue' : ''}
              `}
            >
              {cellNum}
            </span>

            {isSnakeHead && (
              <span className="text-[clamp(8px,1.5vw,14px)] leading-none mt-0.5">🐍</span>
            )}
            {isLadderBottom && (
              <span className="text-[clamp(8px,1.5vw,14px)] leading-none mt-0.5">🪜</span>
            )}
            {cellNum === 100 && (
              <span className="text-[clamp(8px,1.5vw,14px)] leading-none mt-0.5">🏆</span>
            )}

            {(p1Here || p2Here) && (
              <div className={`absolute inset-0 flex items-end justify-center pb-0.5 gap-0.5 ${p1Here && p2Here ? 'flex-row' : ''}`}>
                {p1Here && (
                  <PlayerToken
                    player={1}
                    animType={animatingPlayer === 1 ? animType : 'none'}
                    isActive={state.currentPlayer === 1 && !state.winner}
                  />
                )}
                {p2Here && (
                  <PlayerToken
                    player={2}
                    animType={animatingPlayer === 2 ? animType : 'none'}
                    isActive={state.currentPlayer === 2 && !state.winner}
                  />
                )}
              </div>
            )}
          </div>
        );
      }
    }
    return cells;
  };

  const eventBannerColor =
    state.eventType === 'snake' ? 'border-red-500/60 bg-red-950/40 text-red-300' :
    state.eventType === 'ladder' ? 'border-green-500/60 bg-green-950/40 text-green-300' :
    state.eventType === 'win' ? 'border-neon-blue/60 bg-neon-blue/10 text-neon-blue' :
    'border-gray-700/30 bg-gray-900/40 text-gray-300';

  const isDisabled = isRolling || isAnimating || !!state.winner;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center py-4 px-3 sm:px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => { playClick(); navigate({ to: '/' }); }}
            className="text-gray-400 hover:text-white font-rajdhani text-sm transition-colors flex items-center gap-1 min-h-[44px] px-2"
          >
            ← Back
          </button>
          <h1 className="font-orbitron font-bold text-neon-blue text-sm sm:text-base tracking-widest neon-text-blue">
            SNAKE & LADDER
          </h1>
          <SoundToggle />
        </div>

        {/* Player Status Panel */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4">
          <div
            className={`
              relative p-3 rounded-xl border transition-all duration-300
              ${state.currentPlayer === 1 && !state.winner
                ? 'border-neon-blue/70 bg-neon-blue/10 shadow-neon-blue-sm'
                : 'border-gray-700/40 bg-gray-900/40'
              }
            `}
          >
            {state.currentPlayer === 1 && !state.winner && (
              <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-neon-blue animate-pulse" />
            )}
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-orbitron font-bold text-white text-xs border-2 border-neon-blue flex-shrink-0"
                style={{ background: 'oklch(0.72 0.22 200 / 0.7)', boxShadow: '0 0 8px oklch(0.72 0.22 200 / 0.6)' }}
              >
                P1
              </div>
              <div>
                <div className="font-orbitron text-xs font-bold text-white">Player 1</div>
                <div className="font-rajdhani text-xs text-gray-400">
                  Cell: <span className="text-neon-blue font-bold">{state.positions[0] || '—'}</span>
                </div>
              </div>
            </div>
            {state.winner === 1 && (
              <div className="text-xs font-orbitron text-neon-blue mt-1">🏆 WINNER!</div>
            )}
          </div>

          <div
            className={`
              relative p-3 rounded-xl border transition-all duration-300
              ${state.currentPlayer === 2 && !state.winner
                ? 'border-neon-purple/70 bg-neon-purple/10 shadow-neon-purple-sm'
                : 'border-gray-700/40 bg-gray-900/40'
              }
            `}
          >
            {state.currentPlayer === 2 && !state.winner && (
              <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-neon-purple animate-pulse" />
            )}
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-orbitron font-bold text-white text-xs border-2 border-neon-purple flex-shrink-0"
                style={{ background: 'oklch(0.65 0.28 295 / 0.7)', boxShadow: '0 0 8px oklch(0.65 0.28 295 / 0.6)' }}
              >
                P2
              </div>
              <div>
                <div className="font-orbitron text-xs font-bold text-white">Player 2</div>
                <div className="font-rajdhani text-xs text-gray-400">
                  Cell: <span className="text-neon-purple font-bold">{state.positions[1] || '—'}</span>
                </div>
              </div>
            </div>
            {state.winner === 2 && (
              <div className="text-xs font-orbitron text-neon-purple mt-1">🏆 WINNER!</div>
            )}
          </div>
        </div>

        {/* Board + Overlay */}
        <div
          className="relative w-full rounded-xl overflow-hidden border border-gray-700/50 mb-4"
          style={{ boxShadow: '0 0 30px oklch(0.72 0.22 200 / 0.15), 0 0 60px oklch(0.72 0.22 200 / 0.05)' }}
        >
          <div className="grid grid-cols-10 w-full">
            {renderBoard()}
          </div>
          <BoardOverlay />
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 mb-4 text-xs font-rajdhani">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1.5 rounded-full bg-red-500 opacity-80" />
            <span className="text-gray-400">Snake (slide down)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1.5 rounded-full bg-green-500 opacity-80" />
            <span className="text-gray-400">Ladder (climb up)</span>
          </div>
        </div>

        {/* Event Message + Dice */}
        <div className={`flex items-center gap-3 sm:gap-4 mb-4 p-3 sm:p-4 rounded-xl border transition-all duration-500 ${eventBannerColor}`}>
          <DiceDisplay
            value={isRolling ? rollingDiceValue : (state.diceValue ?? null)}
            isRolling={isRolling}
          />
          <div className="flex-1 min-w-0">
            <p className="font-rajdhani text-sm sm:text-base leading-snug break-words">
              {state.message}
            </p>
            {state.eventType === 'snake' && (
              <p className="text-red-400 text-xs mt-1 font-rajdhani animate-pulse">⚠ Bitten by a snake!</p>
            )}
            {state.eventType === 'ladder' && (
              <p className="text-green-400 text-xs mt-1 font-rajdhani animate-pulse">✨ Ladder boost!</p>
            )}
          </div>
        </div>

        {/* Controls */}
        {state.winner ? (
          <div className="space-y-3">
            <div
              className="text-center py-4 rounded-xl border border-neon-blue/60 bg-neon-blue/10 font-orbitron text-neon-blue text-lg animate-pulse"
              style={{ boxShadow: '0 0 20px oklch(0.72 0.22 200 / 0.3)' }}
            >
              🎉 Player {state.winner} Wins!
            </div>
            <button
              onClick={resetGame}
              className="w-full py-3 min-h-[44px] rounded-xl bg-neon-blue/20 border border-neon-blue/50 text-neon-blue font-orbitron text-sm hover:bg-neon-blue/30 transition-all"
            >
              Play Again
            </button>
          </div>
        ) : (
          <button
            onClick={rollDice}
            disabled={isDisabled}
            className={`
              w-full py-3 min-h-[44px] rounded-xl font-orbitron text-sm transition-all
              border border-neon-blue/50 text-neon-blue
              ${isDisabled
                ? 'opacity-50 cursor-not-allowed bg-neon-blue/10'
                : 'bg-neon-blue/20 hover:bg-neon-blue/30 hover:shadow-neon-blue-sm active:scale-95'
              }
            `}
          >
            {isRolling ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-neon-blue/40 border-t-neon-blue rounded-full animate-spin" />
                Rolling...
              </span>
            ) : isAnimating ? (
              'Moving...'
            ) : (
              `🎲 Roll Dice — Player ${state.currentPlayer}`
            )}
          </button>
        )}

        {/* Snakes & Ladders Reference */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3">
          <div className="p-3 rounded-xl border border-red-900/40 bg-red-950/20">
            <h3 className="font-orbitron text-xs text-red-400 mb-2">🐍 Snakes</h3>
            <div className="space-y-1">
              {Object.entries(SNAKES).map(([from, to]) => (
                <div key={from} className="flex items-center justify-between font-rajdhani text-xs text-gray-400">
                  <span className="text-red-400 font-bold">{from}</span>
                  <span className="text-gray-600">→</span>
                  <span>{to}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="p-3 rounded-xl border border-green-900/40 bg-green-950/20">
            <h3 className="font-orbitron text-xs text-green-400 mb-2">🪜 Ladders</h3>
            <div className="space-y-1">
              {Object.entries(LADDERS).map(([from, to]) => (
                <div key={from} className="flex items-center justify-between font-rajdhani text-xs text-gray-400">
                  <span className="text-green-400 font-bold">{from}</span>
                  <span className="text-gray-600">→</span>
                  <span>{to}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-6 text-center text-xs text-gray-600 font-rajdhani">
          Built with ❤️ using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neon-blue/60 hover:text-neon-blue transition-colors"
          >
            caffeine.ai
          </a>{' '}
          © {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
};

export default SnakeAndLadder;

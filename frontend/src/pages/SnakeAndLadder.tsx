import React, { useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Dices, RotateCcw } from 'lucide-react';

// Snakes: head -> tail (head > tail)
const SNAKES: Record<number, number> = {
  99: 54,
  87: 24,
  62: 19,
  56: 3,
  49: 11,
  48: 26,
};

// Ladders: bottom -> top (bottom < top)
const LADDERS: Record<number, number> = {
  4: 14,
  9: 31,
  20: 38,
  28: 84,
  40: 59,
  51: 67,
  63: 81,
  71: 91,
};

const BOARD_SIZE = 10;
const TOTAL_SQUARES = 100;

function getSquarePosition(square: number): { row: number; col: number } {
  if (square < 1 || square > 100) return { row: 0, col: 0 };
  const idx = square - 1;
  const row = Math.floor(idx / BOARD_SIZE);
  const col = idx % BOARD_SIZE;
  // Board goes bottom-to-top, alternating direction
  const boardRow = BOARD_SIZE - 1 - row;
  const boardCol = row % 2 === 0 ? col : BOARD_SIZE - 1 - col;
  return { row: boardRow, col: boardCol };
}

function getSquareNumber(row: number, col: number): number {
  const boardRow = BOARD_SIZE - 1 - row;
  const actualCol = boardRow % 2 === 0 ? col : BOARD_SIZE - 1 - col;
  return boardRow * BOARD_SIZE + actualCol + 1;
}

const PLAYER_COLORS = {
  1: { main: 'oklch(0.85 0.22 200)', glow: 'oklch(0.72 0.22 200 / 0.8)', bg: 'oklch(0.72 0.22 200 / 0.2)' },
  2: { main: 'oklch(0.82 0.25 340)', glow: 'oklch(0.7 0.25 340 / 0.8)', bg: 'oklch(0.7 0.25 340 / 0.2)' },
};

export function SnakeAndLadder() {
  const navigate = useNavigate();
  const [positions, setPositions] = useState<[number, number]>([1, 1]);
  const [currentPlayer, setCurrentPlayer] = useState<1 | 2>(1);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [winner, setWinner] = useState<1 | 2 | null>(null);
  const [message, setMessage] = useState<string>('');
  const [rollCount, setRollCount] = useState(0);

  const rollDice = useCallback(() => {
    if (isRolling || winner) return;
    setIsRolling(true);
    setMessage('');

    // Animate dice roll
    let ticks = 0;
    const maxTicks = 8;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      ticks++;
      if (ticks >= maxTicks) {
        clearInterval(interval);
        const finalRoll = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalRoll);
        setRollCount((c) => c + 1);

        setPositions((prev) => {
          const newPositions: [number, number] = [...prev] as [number, number];
          let newPos = prev[currentPlayer - 1] + finalRoll;

          if (newPos > TOTAL_SQUARES) {
            setMessage(`Need exact roll to finish! Stayed at ${prev[currentPlayer - 1]}.`);
            setIsRolling(false);
            setCurrentPlayer((p) => (p === 1 ? 2 : 1));
            return prev;
          }

          let extraMsg = '';
          if (LADDERS[newPos]) {
            extraMsg = `🪜 Ladder! Climbed from ${newPos} to ${LADDERS[newPos]}!`;
            newPos = LADDERS[newPos];
          } else if (SNAKES[newPos]) {
            extraMsg = `🐍 Snake! Slid from ${newPos} to ${SNAKES[newPos]}!`;
            newPos = SNAKES[newPos];
          }

          newPositions[currentPlayer - 1] = newPos;

          if (newPos >= TOTAL_SQUARES) {
            setWinner(currentPlayer);
            setMessage(`🏆 Player ${currentPlayer} wins!`);
          } else {
            setMessage(extraMsg || `Player ${currentPlayer} moved to ${newPos}.`);
            setCurrentPlayer((p) => (p === 1 ? 2 : 1));
          }

          setIsRolling(false);
          return newPositions;
        });
      }
    }, 80);
  }, [isRolling, winner, currentPlayer]);

  const restartGame = () => {
    setPositions([1, 1]);
    setCurrentPlayer(1);
    setDiceValue(null);
    setWinner(null);
    setMessage('');
    setRollCount(0);
    setIsRolling(false);
  };

  const renderBoard = () => {
    const cells: React.ReactNode[] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const squareNum = getSquareNumber(row, col);
        const isSnakeHead = squareNum in SNAKES;
        const isLadderBottom = squareNum in LADDERS;
        const isSnakeTail = Object.values(SNAKES).includes(squareNum);
        const isLadderTop = Object.values(LADDERS).includes(squareNum);
        const p1Here = positions[0] === squareNum;
        const p2Here = positions[1] === squareNum;

        let cellBg = 'oklch(0.12 0.02 265)';
        let cellBorder = 'oklch(0.22 0.03 265)';
        let numColor = 'oklch(0.5 0.04 265)';

        if (isSnakeHead) {
          cellBg = 'oklch(0.12 0.06 25)';
          cellBorder = 'oklch(0.65 0.25 25 / 0.5)';
          numColor = 'oklch(0.75 0.25 25)';
        } else if (isLadderBottom) {
          cellBg = 'oklch(0.12 0.06 155)';
          cellBorder = 'oklch(0.65 0.22 155 / 0.5)';
          numColor = 'oklch(0.75 0.22 155)';
        } else if (isSnakeTail) {
          cellBg = 'oklch(0.11 0.04 25)';
          cellBorder = 'oklch(0.65 0.25 25 / 0.25)';
        } else if (isLadderTop) {
          cellBg = 'oklch(0.11 0.04 155)';
          cellBorder = 'oklch(0.65 0.22 155 / 0.25)';
        }

        if (squareNum === 100) {
          cellBg = 'oklch(0.15 0.08 60)';
          cellBorder = 'oklch(0.75 0.2 55 / 0.6)';
          numColor = 'oklch(0.85 0.2 55)';
        }

        cells.push(
          <div
            key={squareNum}
            className="relative flex flex-col items-center justify-center"
            style={{
              background: cellBg,
              border: `1px solid ${cellBorder}`,
              aspectRatio: '1',
              minWidth: 0,
            }}
          >
            {/* Square number */}
            <span
              className="font-orbitron leading-none select-none"
              style={{
                fontSize: 'clamp(6px, 1.5vw, 11px)',
                color: numColor,
                fontWeight: squareNum === 100 ? 900 : 600,
              }}
            >
              {squareNum}
            </span>

            {/* Snake/Ladder indicator */}
            {isSnakeHead && (
              <span style={{ fontSize: 'clamp(8px, 1.8vw, 13px)', lineHeight: 1 }}>🐍</span>
            )}
            {isLadderBottom && (
              <span style={{ fontSize: 'clamp(8px, 1.8vw, 13px)', lineHeight: 1 }}>🪜</span>
            )}

            {/* Player tokens */}
            <div className="absolute inset-0 flex items-center justify-center gap-0.5">
              {p1Here && (
                <div
                  className="rounded-full flex items-center justify-center font-orbitron font-black"
                  style={{
                    width: 'clamp(10px, 2.5vw, 18px)',
                    height: 'clamp(10px, 2.5vw, 18px)',
                    background: PLAYER_COLORS[1].bg,
                    border: `1.5px solid ${PLAYER_COLORS[1].main}`,
                    color: PLAYER_COLORS[1].main,
                    fontSize: 'clamp(5px, 1.2vw, 8px)',
                    boxShadow: `0 0 6px ${PLAYER_COLORS[1].glow}`,
                  }}
                >
                  1
                </div>
              )}
              {p2Here && (
                <div
                  className="rounded-full flex items-center justify-center font-orbitron font-black"
                  style={{
                    width: 'clamp(10px, 2.5vw, 18px)',
                    height: 'clamp(10px, 2.5vw, 18px)',
                    background: PLAYER_COLORS[2].bg,
                    border: `1.5px solid ${PLAYER_COLORS[2].main}`,
                    color: PLAYER_COLORS[2].main,
                    fontSize: 'clamp(5px, 1.2vw, 8px)',
                    boxShadow: `0 0 6px ${PLAYER_COLORS[2].glow}`,
                  }}
                >
                  2
                </div>
              )}
            </div>
          </div>
        );
      }
    }
    return cells;
  };

  const diceEmoji = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

  return (
    <div className="min-h-screen bg-grid-pattern flex flex-col">
      {/* Ambient glow */}
      <div
        className="fixed top-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, oklch(0.7 0.25 340 / 0.06) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Header */}
      <header className="w-full py-4 px-4 flex items-center justify-between max-w-2xl mx-auto">
        <button
          onClick={() => navigate({ to: '/' })}
          className="flex items-center gap-2 font-rajdhani text-sm text-muted-foreground hover:text-neon-blue transition-colors duration-200 group"
        >
          <ArrowLeft size={16} className="transition-transform duration-200 group-hover:-translate-x-1" />
          Back to Home
        </button>
        <span
          className="font-orbitron font-bold text-sm tracking-widest"
          style={{ color: 'oklch(0.82 0.25 340)' }}
        >
          SNAKE & LADDER
        </span>
        <div className="w-24" />
      </header>

      <main className="flex-1 flex flex-col items-center px-3 py-4 gap-4 max-w-2xl mx-auto w-full">
        {/* Player info */}
        <div className="flex gap-3 w-full">
          {([1, 2] as const).map((p) => (
            <div
              key={p}
              className="flex-1 rounded-xl py-3 px-3 flex flex-col items-center gap-1 transition-all duration-300"
              style={{
                background: 'oklch(0.12 0.02 265)',
                border: `2px solid ${currentPlayer === p && !winner ? PLAYER_COLORS[p].main : 'oklch(0.22 0.03 265)'}`,
                boxShadow: currentPlayer === p && !winner ? `0 0 15px ${PLAYER_COLORS[p].glow}` : 'none',
              }}
            >
              <div
                className="font-orbitron font-bold text-sm tracking-wider"
                style={{ color: PLAYER_COLORS[p].main }}
              >
                PLAYER {p}
              </div>
              <div className="font-rajdhani text-xs text-muted-foreground">
                Square: <span style={{ color: PLAYER_COLORS[p].main }} className="font-bold">{positions[p - 1]}</span>
              </div>
              {currentPlayer === p && !winner && (
                <div
                  className="font-rajdhani text-xs tracking-wider animate-pulse"
                  style={{ color: PLAYER_COLORS[p].main }}
                >
                  ← YOUR TURN
                </div>
              )}
              {winner === p && (
                <div
                  className="font-orbitron text-xs font-bold tracking-wider"
                  style={{ color: 'oklch(0.85 0.2 55)' }}
                >
                  🏆 WINNER!
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Board */}
        <div
          className="w-full rounded-2xl p-2 sm:p-3"
          style={{
            background: 'oklch(0.1 0.015 265)',
            border: '1px solid oklch(0.25 0.04 265)',
            boxShadow: '0 0 30px oklch(0.7 0.25 340 / 0.1)',
          }}
        >
          <div
            className="grid w-full"
            style={{
              gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
              gap: '2px',
            }}
          >
            {renderBoard()}
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 flex-wrap justify-center">
          <div className="flex items-center gap-1.5 font-rajdhani text-xs text-muted-foreground">
            <span
              className="w-3 h-3 rounded-sm inline-block"
              style={{ background: 'oklch(0.12 0.06 25)', border: '1px solid oklch(0.65 0.25 25 / 0.5)' }}
            />
            🐍 Snake Head
          </div>
          <div className="flex items-center gap-1.5 font-rajdhani text-xs text-muted-foreground">
            <span
              className="w-3 h-3 rounded-sm inline-block"
              style={{ background: 'oklch(0.12 0.06 155)', border: '1px solid oklch(0.65 0.22 155 / 0.5)' }}
            />
            🪜 Ladder Bottom
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className="w-full rounded-xl px-4 py-3 text-center font-rajdhani text-sm"
            style={{
              background: 'oklch(0.12 0.02 265)',
              border: '1px solid oklch(0.25 0.04 265)',
              color: winner ? 'oklch(0.85 0.2 55)' : 'oklch(0.8 0.05 265)',
            }}
          >
            {message}
          </div>
        )}

        {/* Dice & Controls */}
        <div className="flex flex-col items-center gap-3 w-full">
          {/* Dice display */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl transition-all duration-200"
            style={{
              background: 'oklch(0.14 0.03 265)',
              border: `2px solid ${isRolling ? 'oklch(0.82 0.25 340 / 0.8)' : 'oklch(0.3 0.05 265)'}`,
              boxShadow: isRolling ? '0 0 20px oklch(0.7 0.25 340 / 0.5)' : 'none',
            }}
          >
            {diceValue ? diceEmoji[diceValue] : <Dices size={28} style={{ color: 'oklch(0.5 0.05 265)' }} />}
          </div>

          {!winner ? (
            <button
              onClick={rollDice}
              disabled={isRolling}
              className="flex items-center gap-2 font-orbitron font-bold text-sm tracking-wider px-8 py-3 rounded-xl transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: 'oklch(0.7 0.25 340 / 0.15)',
                border: '2px solid oklch(0.7 0.25 340 / 0.6)',
                color: 'oklch(0.82 0.25 340)',
                boxShadow: isRolling ? 'none' : '0 0 15px oklch(0.7 0.25 340 / 0.3)',
              }}
            >
              <Dices size={18} className={isRolling ? 'animate-spin' : ''} />
              {isRolling ? 'ROLLING...' : `ROLL DICE — PLAYER ${currentPlayer}`}
            </button>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div
                className="font-orbitron font-black text-2xl tracking-wider"
                style={{
                  color: 'oklch(0.85 0.2 55)',
                  textShadow: '0 0 20px oklch(0.75 0.2 55 / 0.8)',
                }}
              >
                🏆 PLAYER {winner} WINS!
              </div>
              <button
                onClick={restartGame}
                className="flex items-center gap-2 font-orbitron font-bold text-sm tracking-wider px-6 py-3 rounded-xl transition-all duration-300"
                style={{
                  background: 'oklch(0.72 0.22 200 / 0.15)',
                  border: '2px solid oklch(0.72 0.22 200 / 0.6)',
                  color: 'oklch(0.85 0.22 200)',
                }}
              >
                <RotateCcw size={16} />
                PLAY AGAIN
              </button>
            </div>
          )}

          {!winner && rollCount > 0 && (
            <button
              onClick={restartGame}
              className="flex items-center gap-1.5 font-rajdhani text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw size={13} />
              Restart Game
            </button>
          )}
        </div>

        {/* Snakes & Ladders reference */}
        <div
          className="w-full rounded-xl p-3 grid grid-cols-2 gap-3"
          style={{ background: 'oklch(0.1 0.015 265)', border: '1px solid oklch(0.2 0.03 265)' }}
        >
          <div>
            <div className="font-orbitron text-xs tracking-wider mb-2" style={{ color: 'oklch(0.75 0.25 25)' }}>
              🐍 SNAKES
            </div>
            {Object.entries(SNAKES).map(([head, tail]) => (
              <div key={head} className="font-rajdhani text-xs text-muted-foreground">
                {head} → {tail}
              </div>
            ))}
          </div>
          <div>
            <div className="font-orbitron text-xs tracking-wider mb-2" style={{ color: 'oklch(0.75 0.22 155)' }}>
              🪜 LADDERS
            </div>
            {Object.entries(LADDERS).map(([bottom, top]) => (
              <div key={bottom} className="font-rajdhani text-xs text-muted-foreground">
                {bottom} → {top}
              </div>
            ))}
          </div>
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

import React, { useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import SoundToggle from '../components/SoundToggle';
import { useSoundManager } from '../hooks/useSoundManager';

// ─── Board config ─────────────────────────────────────────────────────────────
const SNAKES: Record<number, number> = { 99: 78, 95: 56, 87: 24, 62: 19, 54: 34, 17: 7 };
const LADDERS: Record<number, number> = { 4: 25, 13: 46, 33: 49, 42: 63, 50: 69, 67: 91, 72: 92 };
const BOARD_SIZE = 100;

type PlayerColor = 'neon-blue' | 'neon-purple';
interface Player { id: number; name: string; pos: number; color: PlayerColor; emoji: string }

function rollDice(): number { return Math.floor(Math.random() * 6) + 1; }

const SnakeAndLadder: React.FC = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([
    { id: 0, name: 'Player 1', pos: 0, color: 'neon-blue', emoji: '🔵' },
    { id: 1, name: 'Player 2', pos: 0, color: 'neon-purple', emoji: '🟣' },
  ]);
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [message, setMessage] = useState('');
  const [winner, setWinner] = useState<Player | null>(null);
  const { playClick, playScore, playWin, playGameOver, playSpecial } = useSoundManager();

  const handleRoll = useCallback(() => {
    if (rolling || winner) return;
    playClick();
    setRolling(true);

    let count = 0;
    const interval = setInterval(() => {
      setDiceValue(rollDice());
      count++;
      if (count >= 8) {
        clearInterval(interval);
        const finalRoll = rollDice();
        setDiceValue(finalRoll);
        setRolling(false);

        setPlayers(prev => {
          const updated = [...prev];
          const p = { ...updated[currentPlayer] };
          let newPos = p.pos + finalRoll;

          if (newPos > BOARD_SIZE) {
            newPos = p.pos;
            setMessage(`${p.name} needs exact roll!`);
          } else if (newPos === BOARD_SIZE) {
            p.pos = newPos;
            updated[currentPlayer] = p;
            setWinner(p);
            playWin();
            setMessage(`🏆 ${p.name} wins!`);
            return updated;
          } else if (SNAKES[newPos] !== undefined) {
            const snakeTo = SNAKES[newPos];
            setMessage(`🐍 Snake! ${p.name} slides from ${newPos} to ${snakeTo}`);
            newPos = snakeTo;
            playGameOver();
          } else if (LADDERS[newPos] !== undefined) {
            const ladderTo = LADDERS[newPos];
            setMessage(`🪜 Ladder! ${p.name} climbs from ${newPos} to ${ladderTo}`);
            newPos = ladderTo;
            playSpecial();
          } else {
            setMessage(`${p.name} rolled ${finalRoll} → position ${newPos}`);
            playScore();
          }

          p.pos = newPos;
          updated[currentPlayer] = p;
          return updated;
        });

        setCurrentPlayer(prev => (prev + 1) % 2);
      }
    }, 80);
  }, [rolling, winner, currentPlayer, playClick, playWin, playGameOver, playSpecial, playScore]);

  const handleRestart = useCallback(() => {
    playClick();
    setPlayers([
      { id: 0, name: 'Player 1', pos: 0, color: 'neon-blue', emoji: '🔵' },
      { id: 1, name: 'Player 2', pos: 0, color: 'neon-purple', emoji: '🟣' },
    ]);
    setCurrentPlayer(0);
    setDiceValue(null);
    setRolling(false);
    setMessage('');
    setWinner(null);
  }, [playClick]);

  // Render board
  const renderBoard = (): React.ReactNode[] => {
    const cells: React.ReactNode[] = [];
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const rowFromBottom = 9 - row;
        const cellNum = rowFromBottom % 2 === 0
          ? rowFromBottom * 10 + col + 1
          : rowFromBottom * 10 + (9 - col) + 1;

        const hasSnake = SNAKES[cellNum] !== undefined;
        const hasLadder = LADDERS[cellNum] !== undefined;
        const playersHere = players.filter(p => p.pos === cellNum);

        cells.push(
          <div
            key={cellNum}
            className={[
              'relative flex flex-col items-center justify-center text-center',
              'border border-gray-800 text-xs',
              hasSnake ? 'bg-red-950/40 border-red-800/40' : '',
              hasLadder ? 'bg-green-950/40 border-green-800/40' : '',
              !hasSnake && !hasLadder ? 'bg-gray-900/60' : '',
            ].join(' ')}
            style={{ width: '10%', aspectRatio: '1' }}
          >
            <span className="font-orbitron text-gray-600" style={{ fontSize: '0.5rem' }}>{cellNum}</span>
            {hasSnake && <span style={{ fontSize: '0.7rem' }}>🐍</span>}
            {hasLadder && <span style={{ fontSize: '0.7rem' }}>🪜</span>}
            {playersHere.map(p => (
              <span key={p.id} style={{ fontSize: '0.8rem' }}>{p.emoji}</span>
            ))}
          </div>
        );
      }
    }
    return cells;
  };

  const DICE_FACES = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-neon-blue/20 bg-gray-950/80 backdrop-blur-sm">
        <button
          onClick={() => { playClick(); navigate({ to: '/' }); }}
          className="font-orbitron text-neon-blue hover:text-white transition-colors text-sm tracking-wider"
        >
          ← ARENA
        </button>
        <h1 className="font-orbitron text-white text-sm tracking-widest">SNAKE & LADDER</h1>
        <SoundToggle />
      </header>

      <main className="flex-1 flex flex-col items-center gap-4 p-4 max-w-lg mx-auto w-full">
        {/* Player status */}
        <div className="flex gap-4 w-full">
          {players.map((p, i) => (
            <div
              key={p.id}
              className={[
                'flex-1 flex items-center gap-2 p-3 rounded-xl border transition-all',
                i === currentPlayer && !winner
                  ? 'border-neon-blue/60 bg-neon-blue/10 shadow-[0_0_10px_rgba(0,212,255,0.2)]'
                  : 'border-gray-800 bg-gray-900/60',
              ].join(' ')}
            >
              <span className="text-xl">{p.emoji}</span>
              <div>
                <div className="font-orbitron text-white text-xs">{p.name}</div>
                <div className="font-rajdhani text-gray-400 text-xs">Pos: {p.pos || 'Start'}</div>
              </div>
              {i === currentPlayer && !winner && (
                <span className="ml-auto font-orbitron text-neon-blue text-xs">▶</span>
              )}
            </div>
          ))}
        </div>

        {/* Board */}
        <div className="w-full flex flex-wrap border border-gray-800 rounded-lg overflow-hidden">
          {renderBoard()}
        </div>

        {/* Message */}
        {message && (
          <div className="font-rajdhani text-gray-300 text-sm text-center px-4 py-2 rounded-lg bg-gray-900/80 border border-gray-800 w-full">
            {message}
          </div>
        )}

        {/* Dice & controls */}
        <div className="flex items-center gap-6">
          <div className={`text-5xl transition-all ${rolling ? 'animate-spin' : ''}`}>
            {diceValue ? DICE_FACES[diceValue] : '🎲'}
          </div>
          {!winner ? (
            <button
              onClick={handleRoll}
              disabled={rolling}
              className="font-orbitron text-sm px-6 py-3 rounded-xl border border-neon-blue/60 bg-neon-blue/10 text-neon-blue hover:bg-neon-blue/20 transition-all tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {rolling ? 'ROLLING...' : `ROLL — ${players[currentPlayer].name}`}
            </button>
          ) : (
            <button
              onClick={handleRestart}
              className="font-orbitron text-sm px-6 py-3 rounded-xl border border-green-500/60 bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all tracking-wider"
            >
              PLAY AGAIN
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

export default SnakeAndLadder;

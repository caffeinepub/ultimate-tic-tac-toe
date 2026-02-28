import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import SoundToggle from '../components/SoundToggle';
import { useSoundManager } from '../hooks/useSoundManager';

const CANVAS_W = 800;
const CANVAS_H = 500;
const PADDLE_W = 12;
const PADDLE_H = 80;
const BALL_SIZE = 12;
const PADDLE_SPEED = 6;
const AI_SPEED = 4;
const WIN_SCORE = 10;

type GamePhase = 'idle' | 'playing' | 'over';

interface GameState {
  p1Y: number;
  p2Y: number;
  ballX: number;
  ballY: number;
  ballVX: number;
  ballVY: number;
  score1: number;
  score2: number;
  phase: GamePhase;
  winner: number;
}

function makeInitialState(): GameState {
  return {
    p1Y: CANVAS_H / 2 - PADDLE_H / 2,
    p2Y: CANVAS_H / 2 - PADDLE_H / 2,
    ballX: CANVAS_W / 2,
    ballY: CANVAS_H / 2,
    ballVX: 4 * (Math.random() > 0.5 ? 1 : -1),
    ballVY: 3 * (Math.random() > 0.5 ? 1 : -1),
    score1: 0,
    score2: 0,
    phase: 'idle',
    winner: 0,
  };
}

const PongGame: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(makeInitialState());
  const keysRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number>(0);
  const loopRef = useRef<() => void>(() => {});

  const [displayScore1, setDisplayScore1] = useState(0);
  const [displayScore2, setDisplayScore2] = useState(0);
  const [gamePhase, setGamePhase] = useState<GamePhase>('idle');
  const [winner, setWinner] = useState(0);

  const { playScore, playGameOver, playClick } = useSoundManager();
  const soundRef = useRef({ playScore, playGameOver, playClick });
  soundRef.current = { playScore, playGameOver, playClick };

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = stateRef.current;

    // Background
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Center dashed line
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = 'rgba(0,212,255,0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(CANVAS_W / 2, 0);
    ctx.lineTo(CANVAS_W / 2, CANVAS_H);
    ctx.stroke();
    ctx.setLineDash([]);

    // Border
    ctx.strokeStyle = 'rgba(0,212,255,0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, CANVAS_W - 2, CANVAS_H - 2);

    // Player 1 paddle (cyan)
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#00d4ff';
    ctx.fillRect(20, s.p1Y, PADDLE_W, PADDLE_H);

    // Player 2 / AI paddle (magenta)
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(CANVAS_W - 20 - PADDLE_W, s.p2Y, PADDLE_W, PADDLE_H);

    // Ball
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(s.ballX - BALL_SIZE / 2, s.ballY - BALL_SIZE / 2, BALL_SIZE, BALL_SIZE);
    ctx.shadowBlur = 0;

    // Idle overlay
    if (s.phase === 'idle') {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#00d4ff';
      ctx.shadowColor = '#00d4ff';
      ctx.shadowBlur = 20;
      ctx.font = 'bold 32px Orbitron, monospace';
      ctx.fillText('PONG', CANVAS_W / 2, CANVAS_H / 2 - 40);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#cccccc';
      ctx.font = '14px Orbitron, monospace';
      ctx.fillText('Press SPACE or click START to play', CANVAS_W / 2, CANVAS_H / 2 + 5);
      ctx.fillStyle = '#00d4ff';
      ctx.font = '12px Orbitron, monospace';
      ctx.fillText('P1: W / S keys   |   P2 (AI): auto', CANVAS_W / 2, CANVAS_H / 2 + 35);
    }

    // Game over overlay
    if (s.phase === 'over') {
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      const winColor = s.winner === 1 ? '#00d4ff' : '#ff00ff';
      ctx.fillStyle = winColor;
      ctx.shadowColor = winColor;
      ctx.shadowBlur = 25;
      ctx.font = 'bold 28px Orbitron, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`PLAYER ${s.winner} WINS!`, CANVAS_W / 2, CANVAS_H / 2 - 20);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#aaaaaa';
      ctx.font = '13px Orbitron, monospace';
      ctx.fillText('Press SPACE or click RESTART', CANVAS_W / 2, CANVAS_H / 2 + 20);
    }
  }, []);

  const resetBall = (scorer: number) => {
    const s = stateRef.current;
    s.ballX = CANVAS_W / 2;
    s.ballY = CANVAS_H / 2;
    // Ball goes toward the player who just lost the point
    s.ballVX = 4 * (scorer === 1 ? -1 : 1);
    s.ballVY = 3 * (Math.random() > 0.5 ? 1 : -1);
  };

  const startGame = useCallback(() => {
    const s = stateRef.current;
    s.p1Y = CANVAS_H / 2 - PADDLE_H / 2;
    s.p2Y = CANVAS_H / 2 - PADDLE_H / 2;
    s.ballX = CANVAS_W / 2;
    s.ballY = CANVAS_H / 2;
    s.ballVX = 4 * (Math.random() > 0.5 ? 1 : -1);
    s.ballVY = 3 * (Math.random() > 0.5 ? 1 : -1);
    s.score1 = 0;
    s.score2 = 0;
    s.phase = 'playing';
    s.winner = 0;
    setDisplayScore1(0);
    setDisplayScore2(0);
    setGamePhase('playing');
    setWinner(0);
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(loopRef.current);
  }, []);

  // Main game loop — stored in a ref so it never goes stale
  useEffect(() => {
    loopRef.current = () => {
      const s = stateRef.current;

      if (s.phase === 'playing') {
        // Player 1 paddle (keyboard)
        if (keysRef.current.has('w') || keysRef.current.has('W')) {
          s.p1Y = Math.max(0, s.p1Y - PADDLE_SPEED);
        }
        if (keysRef.current.has('s') || keysRef.current.has('S')) {
          s.p1Y = Math.min(CANVAS_H - PADDLE_H, s.p1Y + PADDLE_SPEED);
        }

        // AI paddle (tracks ball)
        const aiCenter = s.p2Y + PADDLE_H / 2;
        if (aiCenter < s.ballY - 5) {
          s.p2Y = Math.min(CANVAS_H - PADDLE_H, s.p2Y + AI_SPEED);
        } else if (aiCenter > s.ballY + 5) {
          s.p2Y = Math.max(0, s.p2Y - AI_SPEED);
        }

        // Move ball
        s.ballX += s.ballVX;
        s.ballY += s.ballVY;

        // Top/bottom wall bounce
        if (s.ballY - BALL_SIZE / 2 <= 0) {
          s.ballY = BALL_SIZE / 2;
          s.ballVY = Math.abs(s.ballVY);
        }
        if (s.ballY + BALL_SIZE / 2 >= CANVAS_H) {
          s.ballY = CANVAS_H - BALL_SIZE / 2;
          s.ballVY = -Math.abs(s.ballVY);
        }

        // P1 paddle collision (left side)
        const p1Right = 20 + PADDLE_W;
        if (
          s.ballVX < 0 &&
          s.ballX - BALL_SIZE / 2 <= p1Right &&
          s.ballX + BALL_SIZE / 2 >= 20 &&
          s.ballY + BALL_SIZE / 2 >= s.p1Y &&
          s.ballY - BALL_SIZE / 2 <= s.p1Y + PADDLE_H
        ) {
          s.ballX = p1Right + BALL_SIZE / 2;
          const hitPos = (s.ballY - (s.p1Y + PADDLE_H / 2)) / (PADDLE_H / 2);
          const speed = Math.min(Math.abs(s.ballVX) * 1.05, 12);
          s.ballVX = speed;
          s.ballVY = hitPos * 7;
          soundRef.current.playClick();
        }

        // P2 paddle collision (right side)
        const p2X = CANVAS_W - 20 - PADDLE_W;
        if (
          s.ballVX > 0 &&
          s.ballX + BALL_SIZE / 2 >= p2X &&
          s.ballX - BALL_SIZE / 2 <= p2X + PADDLE_W &&
          s.ballY + BALL_SIZE / 2 >= s.p2Y &&
          s.ballY - BALL_SIZE / 2 <= s.p2Y + PADDLE_H
        ) {
          s.ballX = p2X - BALL_SIZE / 2;
          const hitPos = (s.ballY - (s.p2Y + PADDLE_H / 2)) / (PADDLE_H / 2);
          const speed = Math.min(Math.abs(s.ballVX) * 1.05, 12);
          s.ballVX = -speed;
          s.ballVY = hitPos * 7;
          soundRef.current.playClick();
        }

        // Scoring — ball exits left (P2 scores)
        if (s.ballX + BALL_SIZE / 2 < 0) {
          s.score2 += 1;
          setDisplayScore2(s.score2);
          soundRef.current.playScore();
          if (s.score2 >= WIN_SCORE) {
            s.phase = 'over';
            s.winner = 2;
            setGamePhase('over');
            setWinner(2);
            soundRef.current.playGameOver();
          } else {
            resetBall(2);
          }
        }

        // Scoring — ball exits right (P1 scores)
        if (s.ballX - BALL_SIZE / 2 > CANVAS_W) {
          s.score1 += 1;
          setDisplayScore1(s.score1);
          soundRef.current.playScore();
          if (s.score1 >= WIN_SCORE) {
            s.phase = 'over';
            s.winner = 1;
            setGamePhase('over');
            setWinner(1);
            soundRef.current.playGameOver();
          } else {
            resetBall(1);
          }
        }
      }

      drawCanvas();
      rafRef.current = requestAnimationFrame(loopRef.current);
    };
  });

  // Start the render loop on mount
  useEffect(() => {
    rafRef.current = requestAnimationFrame(loopRef.current);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Keyboard listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (e.key === ' ') {
        e.preventDefault();
        const s = stateRef.current;
        if (s.phase === 'idle' || s.phase === 'over') startGame();
      }
      if (['ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [startGame]);

  const handleStartRestart = () => {
    soundRef.current.playClick();
    startGame();
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-neon-blue/20 bg-gray-950/80 backdrop-blur-sm">
        <button
          onClick={() => { soundRef.current.playClick(); navigate({ to: '/' }); }}
          className="font-orbitron text-neon-blue hover:text-white transition-colors text-sm tracking-wider"
        >
          ← ARENA
        </button>
        <h1 className="font-orbitron text-white text-sm tracking-widest">PONG</h1>
        <SoundToggle />
      </header>

      {/* Score bar */}
      <div className="flex items-center justify-center gap-16 py-3 border-b border-gray-800">
        <div className="text-center">
          <div className="font-orbitron text-neon-blue text-2xl font-bold">{displayScore1}</div>
          <div className="font-rajdhani text-neon-blue/60 text-xs tracking-wider">PLAYER 1</div>
        </div>
        <div className="font-orbitron text-gray-600 text-lg">VS</div>
        <div className="text-center">
          <div className="font-orbitron text-[#ff00ff] text-2xl font-bold">{displayScore2}</div>
          <div className="font-rajdhani text-[#ff00ff]/60 text-xs tracking-wider">AI</div>
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
        <div
          className="relative border border-neon-blue/30 shadow-[0_0_30px_rgba(0,212,255,0.15)] overflow-hidden"
          style={{ maxWidth: '100%' }}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="block"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>

        <div className="flex gap-3 items-center">
          {(gamePhase === 'idle' || gamePhase === 'over') && (
            <button
              onClick={handleStartRestart}
              className="font-orbitron text-sm px-5 py-2 rounded-lg border border-neon-blue/60 bg-neon-blue/10 text-neon-blue hover:bg-neon-blue/20 transition-all tracking-wider shadow-[0_0_10px_rgba(0,212,255,0.2)]"
            >
              {gamePhase === 'idle' ? 'START GAME' : 'RESTART'}
            </button>
          )}
        </div>

        {winner > 0 && (
          <div className={`font-orbitron text-lg font-bold tracking-wider ${winner === 1 ? 'text-neon-blue' : 'text-[#ff00ff]'}`}>
            🏆 {winner === 1 ? 'Player 1' : 'AI'} Wins!
          </div>
        )}

        <div className="flex gap-8 font-rajdhani text-gray-600 text-xs tracking-wider text-center">
          <span className="text-neon-blue/60">P1: W / S keys</span>
          <span>•</span>
          <span className="text-[#ff00ff]/60">AI opponent</span>
          <span>•</span>
          <span>SPACE to start</span>
        </div>
      </main>
    </div>
  );
};

export default PongGame;

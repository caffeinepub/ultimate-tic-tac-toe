import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import SoundToggle from '../components/SoundToggle';
import { useSoundManager } from '../hooks/useSoundManager';

type Choice = 'rock' | 'paper' | 'scissors';
type GamePhase = 'idle' | 'shaking' | 'revealing' | 'done';
type Result = 'win' | 'lose' | 'draw';

const CHOICES: Choice[] = ['rock', 'paper', 'scissors'];
const CHOICE_EMOJI: Record<Choice, string> = { rock: '✊', paper: '✋', scissors: '✌️' };
const CHOICE_LABEL: Record<Choice, string> = { rock: 'ROCK', paper: 'PAPER', scissors: 'SCISSORS' };

function getResult(player: Choice, computer: Choice): Result {
  if (player === computer) return 'draw';
  if (
    (player === 'rock' && computer === 'scissors') ||
    (player === 'paper' && computer === 'rock') ||
    (player === 'scissors' && computer === 'paper')
  ) return 'win';
  return 'lose';
}

const RockPaperScissors: React.FC = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [computerChoice, setComputerChoice] = useState<Choice | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [scores, setScores] = useState<Record<Result, number>>({ win: 0, lose: 0, draw: 0 });
  const [particles, setParticles] = useState<{ id: number; angle: number }[]>([]);
  const { playClick, playWin, playGameOver, playScore } = useSoundManager();

  // Web Audio for RPS-specific sounds
  const audioCtxRef = useRef<AudioContext | null>(null);
  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioCtxRef.current;
  }, []);

  const playRPSSound = useCallback((type: 'shake' | 'reveal') => {
    try {
      const ctx = getAudioCtx();
      const now = ctx.currentTime;
      if (type === 'shake') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'square'; osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(400, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now); osc.stop(now + 0.15);
      } else if (type === 'reveal') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine'; osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
      }
    } catch { /* ignore */ }
  }, [getAudioCtx]);

  const handleChoice = useCallback((choice: Choice) => {
    if (phase !== 'idle') return;
    playClick();
    playRPSSound('shake');
    setPlayerChoice(choice);
    setPhase('shaking');

    setTimeout(() => {
      const comp = CHOICES[Math.floor(Math.random() * 3)];
      setComputerChoice(comp);
      setPhase('revealing');
      playRPSSound('reveal');

      setTimeout(() => {
        const res: Result = getResult(choice, comp);
        setResult(res);
        setPhase('done');
        // Update scores — res is always a valid Result here (never null)
        setScores(prev => ({ ...prev, [res]: prev[res] + 1 }));

        if (res === 'win') {
          playWin();
          setParticles(Array.from({ length: 12 }, (_, i) => ({ id: i, angle: (i / 12) * 360 })));
          setTimeout(() => setParticles([]), 800);
        } else if (res === 'lose') {
          playGameOver();
        } else {
          playScore();
        }
      }, 600);
    }, 800);
  }, [phase, playClick, playRPSSound, playWin, playGameOver, playScore]);

  const handleReset = useCallback(() => {
    playClick();
    setPhase('idle');
    setPlayerChoice(null);
    setComputerChoice(null);
    setResult(null);
    setParticles([]);
  }, [playClick]);

  const resultConfig: Record<Result, { text: string; color: string; glow: string }> = {
    win: { text: 'YOU WIN!', color: 'text-green-400', glow: 'shadow-[0_0_20px_rgba(74,222,128,0.5)]' },
    lose: { text: 'YOU LOSE', color: 'text-red-400', glow: 'shadow-[0_0_20px_rgba(248,113,113,0.5)]' },
    draw: { text: 'DRAW!', color: 'text-yellow-400', glow: 'shadow-[0_0_20px_rgba(250,204,21,0.5)]' },
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-neon-blue/20 bg-gray-950/80 backdrop-blur-sm">
        <button
          onClick={() => { playClick(); navigate({ to: '/' }); }}
          className="font-orbitron text-neon-blue hover:text-white transition-colors text-sm tracking-wider"
        >
          ← ARENA
        </button>
        <h1 className="font-orbitron text-white text-sm tracking-widest">ROCK PAPER SCISSORS</h1>
        <SoundToggle />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-6 p-4 max-w-md mx-auto w-full">
        {/* Score */}
        <div className="flex gap-6 w-full justify-center">
          {(['win', 'draw', 'lose'] as Result[]).map(k => (
            <div key={k} className="text-center">
              <div className={`font-orbitron text-2xl font-bold ${k === 'win' ? 'text-green-400' : k === 'lose' ? 'text-red-400' : 'text-yellow-400'}`}>
                {scores[k]}
              </div>
              <div className="font-rajdhani text-gray-500 text-xs tracking-wider uppercase">{k}</div>
            </div>
          ))}
        </div>

        {/* Battle area */}
        <div className="w-full flex items-center justify-between gap-4 py-6">
          {/* Player */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="font-rajdhani text-neon-blue text-xs tracking-widest">YOU</div>
            <div
              className={`text-6xl transition-all duration-300 ${
                phase === 'shaking' ? 'animate-bounce' : ''
              } ${phase === 'revealing' || phase === 'done' ? 'scale-110' : ''}`}
            >
              {phase === 'idle' ? '❓' : playerChoice ? CHOICE_EMOJI[playerChoice] : '❓'}
            </div>
            {(phase === 'done' || phase === 'revealing') && playerChoice && (
              <div className="font-orbitron text-xs text-gray-400">{CHOICE_LABEL[playerChoice]}</div>
            )}
          </div>

          {/* VS */}
          <div className="font-orbitron text-gray-600 text-lg font-bold">VS</div>

          {/* Computer */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="font-rajdhani text-neon-purple text-xs tracking-widest">CPU</div>
            <div
              className={`text-6xl transition-all duration-300 ${
                phase === 'shaking' ? 'animate-bounce' : ''
              } ${phase === 'revealing' || phase === 'done' ? 'scale-110' : ''}`}
            >
              {phase === 'idle' || phase === 'shaking' ? '❓' : computerChoice ? CHOICE_EMOJI[computerChoice] : '❓'}
            </div>
            {(phase === 'done' || phase === 'revealing') && computerChoice && (
              <div className="font-orbitron text-xs text-gray-400">{CHOICE_LABEL[computerChoice]}</div>
            )}
          </div>
        </div>

        {/* Result */}
        {phase === 'done' && result && (
          <div className={`relative font-orbitron text-2xl font-bold text-center py-3 px-8 rounded-xl border border-current/30 bg-current/10 ${resultConfig[result].color} ${resultConfig[result].glow}`}>
            {resultConfig[result].text}
            {/* Particles */}
            {particles.map(p => (
              <span
                key={p.id}
                className="absolute w-2 h-2 rounded-full bg-green-400 pointer-events-none"
                style={{
                  top: '50%', left: '50%',
                  transform: `rotate(${p.angle}deg) translateX(60px)`,
                  opacity: 0,
                  animation: 'rpsBurstParticle 0.8s ease-out forwards',
                  '--angle': `${p.angle}deg`,
                } as React.CSSProperties}
              />
            ))}
          </div>
        )}

        {/* Choice buttons */}
        {phase === 'idle' && (
          <div className="flex gap-4 w-full justify-center">
            {CHOICES.map(choice => (
              <button
                key={choice}
                onClick={() => handleChoice(choice)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-neon-blue/40 bg-gray-900/80 hover:border-neon-blue hover:bg-neon-blue/10 hover:shadow-[0_0_15px_rgba(0,212,255,0.3)] transition-all duration-200 cursor-pointer flex-1"
              >
                <span className="text-4xl">{CHOICE_EMOJI[choice]}</span>
                <span className="font-orbitron text-xs text-gray-400 tracking-wider">{CHOICE_LABEL[choice]}</span>
              </button>
            ))}
          </div>
        )}

        {phase === 'done' && (
          <button
            onClick={handleReset}
            className="font-orbitron text-sm px-6 py-2 rounded-lg border border-neon-blue/60 bg-neon-blue/10 text-neon-blue hover:bg-neon-blue/20 transition-all tracking-wider"
          >
            PLAY AGAIN
          </button>
        )}

        {phase === 'shaking' && (
          <div className="font-rajdhani text-gray-500 text-sm tracking-widest animate-pulse">
            CHOOSING...
          </div>
        )}
      </main>
    </div>
  );
};

export default RockPaperScissors;

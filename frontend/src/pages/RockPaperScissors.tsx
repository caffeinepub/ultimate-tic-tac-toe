import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, RotateCcw } from 'lucide-react';

type Choice = 'rock' | 'paper' | 'scissors';
type Result = 'win' | 'lose' | 'draw' | null;
type GamePhase = 'idle' | 'shaking' | 'revealing' | 'done';

const CHOICES: Choice[] = ['rock', 'paper', 'scissors'];

const CHOICE_EMOJI: Record<Choice, string> = {
  rock: '🪨',
  paper: '📄',
  scissors: '✂️',
};

const CHOICE_LABEL: Record<Choice, string> = {
  rock: 'ROCK',
  paper: 'PAPER',
  scissors: 'SCISSORS',
};

function getResult(player: Choice, computer: Choice): Result {
  if (player === computer) return 'draw';
  if (
    (player === 'rock' && computer === 'scissors') ||
    (player === 'paper' && computer === 'rock') ||
    (player === 'scissors' && computer === 'paper')
  ) {
    return 'win';
  }
  return 'lose';
}

function loadScore(key: string): number {
  const val = parseInt(localStorage.getItem(key) ?? '0', 10);
  return isNaN(val) ? 0 : val;
}

// Web Audio API sound helpers
function playWinSound() {
  try {
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    const freqs = [330, 440, 550, 660];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
      osc.connect(gain);
      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.18);
    });

    setTimeout(() => ctx.close(), 1000);
  } catch (_) {}
}

function playLoseSound() {
  try {
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    const freqs = [440, 330, 220, 150];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
      osc.connect(gain);
      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.18);
    });

    setTimeout(() => ctx.close(), 1000);
  } catch (_) {}
}

function playDrawSound() {
  try {
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    [300, 300].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
      osc.connect(gain);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.2);
    });

    setTimeout(() => ctx.close(), 800);
  } catch (_) {}
}

interface Particle {
  id: number;
  angle: number;
}

export function RockPaperScissors() {
  const navigate = useNavigate();

  const [playerWins, setPlayerWins] = useState(() => loadScore('rps-player-wins'));
  const [computerWins, setComputerWins] = useState(() => loadScore('rps-computer-wins'));
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [computerChoice, setComputerChoice] = useState<Choice | null>(null);
  const [result, setResult] = useState<Result>(null);
  const [gamePhase, setGamePhase] = useState<GamePhase>('idle');

  // Animation state
  const [showResult, setShowResult] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [winPulseActive, setWinPulseActive] = useState(false);
  const [playerScoreBounce, setPlayerScoreBounce] = useState(false);
  const [computerScoreBounce, setComputerScoreBounce] = useState(false);

  const prevPlayerWins = useRef(playerWins);
  const prevComputerWins = useRef(computerWins);
  const particleIdRef = useRef(0);

  // Trigger score bounce when scores change
  useEffect(() => {
    if (playerWins > prevPlayerWins.current) {
      setPlayerScoreBounce(true);
    }
    prevPlayerWins.current = playerWins;
  }, [playerWins]);

  useEffect(() => {
    if (computerWins > prevComputerWins.current) {
      setComputerScoreBounce(true);
    }
    prevComputerWins.current = computerWins;
  }, [computerWins]);

  const spawnParticles = useCallback(() => {
    const count = 12;
    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: particleIdRef.current++,
      angle: (360 / count) * i,
    }));
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 1000);
  }, []);

  const handleChoice = (choice: Choice) => {
    if (gamePhase !== 'idle') return;

    const compChoice = CHOICES[Math.floor(Math.random() * 3)];
    const roundResult = getResult(choice, compChoice);

    setPlayerChoice(choice);
    setComputerChoice(compChoice);
    setResult(roundResult);
    setShowResult(false);
    setGamePhase('shaking');

    // After shake (1s), reveal choices
    setTimeout(() => {
      setGamePhase('revealing');

      // After reveal (500ms), show result text + effects
      setTimeout(() => {
        setShowResult(true);
        setGamePhase('done');

        // Play sound
        if (roundResult === 'win') playWinSound();
        else if (roundResult === 'lose') playLoseSound();
        else playDrawSound();

        // Update scores
        if (roundResult === 'win') {
          const newVal = playerWins + 1;
          setPlayerWins(newVal);
          localStorage.setItem('rps-player-wins', String(newVal));
          spawnParticles();
          setWinPulseActive(true);
          setTimeout(() => setWinPulseActive(false), 1200);
        } else if (roundResult === 'lose') {
          const newVal = computerWins + 1;
          setComputerWins(newVal);
          localStorage.setItem('rps-computer-wins', String(newVal));
        }

        // Allow next round
        setTimeout(() => setGamePhase('idle'), 600);
      }, 500);
    }, 1000);
  };

  const handleReset = () => {
    setPlayerWins(0);
    setComputerWins(0);
    setPlayerChoice(null);
    setComputerChoice(null);
    setResult(null);
    setShowResult(false);
    setGamePhase('idle');
    setParticles([]);
    setWinPulseActive(false);
    localStorage.setItem('rps-player-wins', '0');
    localStorage.setItem('rps-computer-wins', '0');
  };

  const resultConfig: Record<NonNullable<Result>, { label: string; color: string; glow: string }> = {
    win: {
      label: '🏆 YOU WIN!',
      color: 'oklch(0.85 0.22 155)',
      glow: '0 0 20px oklch(0.75 0.22 155 / 0.6)',
    },
    lose: {
      label: '💀 YOU LOSE',
      color: 'oklch(0.75 0.25 25)',
      glow: '0 0 20px oklch(0.65 0.25 25 / 0.6)',
    },
    draw: {
      label: '🤝 DRAW!',
      color: 'oklch(0.85 0.2 55)',
      glow: '0 0 20px oklch(0.75 0.2 55 / 0.6)',
    },
  };

  const isShaking = gamePhase === 'shaking';
  const isRevealing = gamePhase === 'revealing' || gamePhase === 'done';
  const isAnimating = gamePhase !== 'idle';

  return (
    <div
      className={`min-h-screen bg-grid-pattern flex flex-col relative${winPulseActive ? ' rps-win-pulse' : ''}`}
    >
      {/* Background ambient blob */}
      <div
        className="fixed top-1/3 right-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, oklch(0.65 0.28 295 / 0.06) 0%, transparent 70%)',
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
          style={{ color: 'oklch(0.8 0.28 295)' }}
        >
          ROCK PAPER SCISSORS
        </span>
        <div className="w-16" />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-6 max-w-lg mx-auto w-full">
        {/* Scoreboard */}
        <div className="w-full flex gap-4">
          <div
            className="flex-1 rounded-xl py-4 text-center"
            style={{ background: 'oklch(0.12 0.02 265)', border: '1px solid oklch(0.72 0.22 200 / 0.3)' }}
          >
            <div className="font-rajdhani text-xs text-muted-foreground tracking-widest uppercase mb-1">You</div>
            <div
              className={`font-orbitron font-black text-3xl inline-block${playerScoreBounce ? ' rps-score-bounce' : ''}`}
              style={{ color: 'oklch(0.85 0.22 200)', textShadow: '0 0 10px oklch(0.72 0.22 200 / 0.8)' }}
              onAnimationEnd={() => setPlayerScoreBounce(false)}
            >
              {playerWins}
            </div>
          </div>
          <div className="flex items-center justify-center font-orbitron text-sm text-muted-foreground">
            VS
          </div>
          <div
            className="flex-1 rounded-xl py-4 text-center"
            style={{ background: 'oklch(0.12 0.02 265)', border: '1px solid oklch(0.65 0.28 295 / 0.3)' }}
          >
            <div className="font-rajdhani text-xs text-muted-foreground tracking-widest uppercase mb-1">CPU</div>
            <div
              className={`font-orbitron font-black text-3xl inline-block${computerScoreBounce ? ' rps-score-bounce' : ''}`}
              style={{ color: 'oklch(0.8 0.28 295)', textShadow: '0 0 10px oklch(0.65 0.28 295 / 0.8)' }}
              onAnimationEnd={() => setComputerScoreBounce(false)}
            >
              {computerWins}
            </div>
          </div>
        </div>

        {/* Battle Display */}
        <div
          className="w-full rounded-2xl p-6 flex flex-col items-center gap-4 relative overflow-visible"
          style={{ background: 'oklch(0.12 0.02 265)', border: '1px solid oklch(0.25 0.04 265)' }}
        >
          <div className="flex items-center justify-around w-full">
            {/* Player choice */}
            <div className="flex flex-col items-center gap-2 relative">
              <div className="font-rajdhani text-xs text-muted-foreground tracking-widest uppercase">You</div>
              <div
                className={`text-6xl relative${isShaking ? ' rps-hand-shake' : ''}${isRevealing && playerChoice ? ' rps-reveal' : ''}`}
                style={{
                  filter: isRevealing && playerChoice ? 'drop-shadow(0 0 12px oklch(0.72 0.22 200 / 0.8))' : 'none',
                }}
              >
                {isShaking ? '✊' : (playerChoice && isRevealing ? CHOICE_EMOJI[playerChoice] : (playerChoice && gamePhase === 'idle' && result ? CHOICE_EMOJI[playerChoice] : '❓'))}
              </div>

              {/* Win burst particles */}
              {particles.map((p) => (
                <div
                  key={p.id}
                  className="rps-burst-particle"
                  style={{
                    '--angle': `${p.angle}deg`,
                  } as React.CSSProperties}
                />
              ))}
            </div>

            <div
              className="font-orbitron font-black text-xl"
              style={{ color: 'oklch(0.5 0.05 265)' }}
            >
              VS
            </div>

            {/* Computer choice */}
            <div className="flex flex-col items-center gap-2">
              <div className="font-rajdhani text-xs text-muted-foreground tracking-widest uppercase">CPU</div>
              <div
                className={`text-6xl${isShaking ? ' rps-hand-shake rps-hand-shake-delay' : ''}${isRevealing && computerChoice ? ' rps-reveal' : ''}`}
                style={{
                  filter: isRevealing && computerChoice ? 'drop-shadow(0 0 12px oklch(0.65 0.28 295 / 0.8))' : 'none',
                  animationDelay: isShaking ? '0.08s' : undefined,
                }}
              >
                {isShaking ? '✊' : (computerChoice && isRevealing ? CHOICE_EMOJI[computerChoice] : (computerChoice && gamePhase === 'idle' && result ? CHOICE_EMOJI[computerChoice] : '❓'))}
              </div>
            </div>
          </div>

          {/* Result text */}
          {result && showResult && (
            <div
              className="font-orbitron font-black text-xl tracking-wider rps-result-reveal"
              style={{
                color: resultConfig[result].color,
                textShadow: resultConfig[result].glow,
              }}
            >
              {resultConfig[result].label}
            </div>
          )}
        </div>

        {/* Choice Buttons */}
        <div className="flex gap-3 w-full">
          {CHOICES.map((choice) => (
            <button
              key={choice}
              onClick={() => handleChoice(choice)}
              disabled={isAnimating}
              className="flex-1 flex flex-col items-center gap-2 py-4 rounded-xl transition-all duration-200 disabled:opacity-60 active:scale-95"
              style={{
                background: playerChoice === choice && !isAnimating ? 'oklch(0.65 0.28 295 / 0.2)' : 'oklch(0.12 0.02 265)',
                border: `2px solid ${playerChoice === choice && !isAnimating ? 'oklch(0.65 0.28 295 / 0.8)' : 'oklch(0.25 0.04 265)'}`,
                boxShadow: playerChoice === choice && !isAnimating ? '0 0 15px oklch(0.65 0.28 295 / 0.4)' : 'none',
              }}
            >
              <span className="text-3xl">{CHOICE_EMOJI[choice]}</span>
              <span
                className="font-orbitron font-bold text-xs tracking-wider"
                style={{ color: playerChoice === choice && !isAnimating ? 'oklch(0.8 0.28 295)' : 'oklch(0.6 0.05 265)' }}
              >
                {CHOICE_LABEL[choice]}
              </span>
            </button>
          ))}
        </div>

        {/* Reset */}
        <button
          onClick={handleReset}
          className="flex items-center gap-2 font-rajdhani text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <RotateCcw size={14} />
          Reset Scores
        </button>
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

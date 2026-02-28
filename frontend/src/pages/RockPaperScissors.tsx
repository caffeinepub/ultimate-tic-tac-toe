import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import SoundToggle from '../components/SoundToggle';
import { useSoundManager } from '../hooks/useSoundManager';
import { recordRpsResult, recordGameStart } from '../utils/achievements';
import { awardXP, incrementGamesPlayed, incrementWins } from '../utils/playerProfile';

type Choice = 'rock' | 'paper' | 'scissors';
type Result = 'win' | 'loss' | 'draw';

const CHOICES: Choice[] = ['rock', 'paper', 'scissors'];
const CHOICE_EMOJI: Record<Choice, string> = { rock: '✊', paper: '✋', scissors: '✌️' };
const CHOICE_LABEL: Record<Choice, string> = { rock: 'Rock', paper: 'Paper', scissors: 'Scissors' };

function getResult(player: Choice, computer: Choice): Result {
  if (player === computer) return 'draw';
  if (
    (player === 'rock' && computer === 'scissors') ||
    (player === 'paper' && computer === 'rock') ||
    (player === 'scissors' && computer === 'paper')
  ) return 'win';
  return 'loss';
}

const RockPaperScissors: React.FC = () => {
  const navigate = useNavigate();
  const { playClick, playWin, playGameOver } = useSoundManager();

  const [scores, setScores] = useState({ player: 0, computer: 0 });
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [computerChoice, setComputerChoice] = useState<Choice | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const handleChoice = (choice: Choice) => {
    if (isAnimating) return;
    if (!gameStarted) {
      recordGameStart('rps');
      setGameStarted(true);
    }

    setIsAnimating(true);
    setPlayerChoice(choice);
    setComputerChoice(null);
    setResult(null);
    playClick();

    setTimeout(() => {
      const compChoice = CHOICES[Math.floor(Math.random() * 3)];
      const roundResult = getResult(choice, compChoice);
      setComputerChoice(compChoice);
      setResult(roundResult);

      incrementGamesPlayed();

      if (roundResult === 'win') {
        setScores(prev => ({ ...prev, player: prev.player + 1 }));
        playWin();
        recordRpsResult('win');
        awardXP(20);
        incrementWins();
      } else if (roundResult === 'loss') {
        setScores(prev => ({ ...prev, computer: prev.computer + 1 }));
        playGameOver();
        recordRpsResult('loss');
        awardXP(5);
      } else {
        recordRpsResult('draw');
        awardXP(5);
      }

      setIsAnimating(false);
    }, 800);
  };

  const handleReset = () => {
    setScores({ player: 0, computer: 0 });
    setPlayerChoice(null);
    setComputerChoice(null);
    setResult(null);
    setGameStarted(false);
    playClick();
  };

  const resultColors: Record<Result, string> = {
    win: 'text-green-400',
    loss: 'text-red-400',
    draw: 'text-yellow-400',
  };
  const resultLabels: Record<Result, string> = {
    win: '🎉 You Win!',
    loss: '😔 You Lose',
    draw: '🤝 Draw!',
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => { playClick(); navigate({ to: '/' }); }}
            className="text-gray-400 hover:text-white font-rajdhani text-sm transition-colors"
          >
            ← Back
          </button>
          <h1 className="font-orbitron font-bold text-neon-blue text-base tracking-widest">
            ROCK PAPER SCISSORS
          </h1>
          <SoundToggle />
        </div>

        {/* Scoreboard */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="text-center p-3 rounded-xl border border-neon-blue/30 bg-gray-900/60">
            <div className="font-orbitron text-2xl font-bold text-neon-blue">{scores.player}</div>
            <div className="font-rajdhani text-xs text-gray-400 mt-1">YOU</div>
          </div>
          <div className="text-center p-3 rounded-xl border border-gray-700/50 bg-gray-900/40">
            <div className="font-orbitron text-lg font-bold text-gray-500">VS</div>
          </div>
          <div className="text-center p-3 rounded-xl border border-neon-purple/30 bg-gray-900/60">
            <div className="font-orbitron text-2xl font-bold text-neon-purple">{scores.computer}</div>
            <div className="font-rajdhani text-xs text-gray-400 mt-1">CPU</div>
          </div>
        </div>

        {/* Battle area */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-6 rounded-xl border border-neon-blue/20 bg-gray-900/40">
            <div
              className="text-5xl mb-2"
              style={{ animation: isAnimating ? 'rpsHandShake 0.4s ease-in-out' : undefined }}
            >
              {playerChoice ? CHOICE_EMOJI[playerChoice] : '❓'}
            </div>
            <div className="font-rajdhani text-xs text-gray-500">Your Choice</div>
          </div>
          <div className="text-center p-6 rounded-xl border border-neon-purple/20 bg-gray-900/40">
            <div
              className="text-5xl mb-2"
              style={{ animation: isAnimating ? 'rpsHandShake 0.4s ease-in-out' : undefined }}
            >
              {isAnimating ? '🤔' : computerChoice ? CHOICE_EMOJI[computerChoice] : '❓'}
            </div>
            <div className="font-rajdhani text-xs text-gray-500">CPU Choice</div>
          </div>
        </div>

        {/* Result */}
        <div className="text-center mb-6 h-8">
          {result && (
            <div
              className={`font-orbitron font-bold text-xl ${resultColors[result]}`}
              style={{ animation: 'rpsResultReveal 0.4s ease-out' }}
            >
              {resultLabels[result]}
            </div>
          )}
        </div>

        {/* Choice buttons */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {CHOICES.map(choice => (
            <button
              key={choice}
              onClick={() => handleChoice(choice)}
              disabled={isAnimating}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-700/50 bg-gray-900/40 hover:border-neon-blue/50 hover:bg-neon-blue/10 hover:shadow-[0_0_15px_rgba(0,212,255,0.2)] transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-3xl">{CHOICE_EMOJI[choice]}</span>
              <span className="font-rajdhani text-xs text-gray-400">{CHOICE_LABEL[choice]}</span>
            </button>
          ))}
        </div>

        <button
          onClick={handleReset}
          className="w-full py-2 rounded-lg border border-gray-700 text-gray-500 font-rajdhani text-sm hover:border-gray-500 hover:text-gray-300 transition-colors"
        >
          Reset Scores
        </button>
      </div>
    </div>
  );
};

export default RockPaperScissors;

import React from 'react';

export type Difficulty = 'easy' | 'medium' | 'hard';

interface DifficultySelectorProps {
  gameTitle: string;
  gameIcon: string;
  onSelect: (difficulty: Difficulty) => void;
  descriptions?: {
    easy?: string;
    medium?: string;
    hard?: string;
  };
}

const defaultDescriptions = {
  easy: 'Relaxed pace, perfect for beginners',
  medium: 'Balanced challenge for casual players',
  hard: 'Maximum intensity for experts',
};

const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  gameTitle,
  gameIcon,
  onSelect,
  descriptions = {},
}) => {
  const desc = { ...defaultDescriptions, ...descriptions };

  const difficulties: { key: Difficulty; label: string; color: string; glow: string; border: string }[] = [
    {
      key: 'easy',
      label: 'EASY',
      color: 'text-green-400',
      glow: 'shadow-[0_0_20px_rgba(74,222,128,0.4)]',
      border: 'border-green-500/60 hover:border-green-400',
    },
    {
      key: 'medium',
      label: 'MEDIUM',
      color: 'text-yellow-400',
      glow: 'shadow-[0_0_20px_rgba(250,204,21,0.4)]',
      border: 'border-yellow-500/60 hover:border-yellow-400',
    },
    {
      key: 'hard',
      label: 'HARD',
      color: 'text-red-400',
      glow: 'shadow-[0_0_20px_rgba(248,113,113,0.4)]',
      border: 'border-red-500/60 hover:border-red-400',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-neon-blue/5 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-neon-purple/5 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 px-6 py-10 max-w-md w-full">
        {/* Game icon & title */}
        <div className="flex flex-col items-center gap-3">
          <div className="text-6xl animate-bounce" style={{ animationDuration: '2s' }}>
            {gameIcon}
          </div>
          <h1 className="font-orbitron text-3xl font-bold text-white tracking-widest text-center">
            {gameTitle}
          </h1>
          <p className="font-rajdhani text-neon-blue/80 text-sm tracking-widest uppercase">
            Select Difficulty
          </p>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-neon-blue/40 to-transparent" />

        {/* Difficulty buttons */}
        <div className="flex flex-col gap-4 w-full">
          {difficulties.map(({ key, label, color, glow, border }) => (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={`
                group relative w-full py-4 px-6 rounded-xl border bg-gray-900/80
                font-orbitron font-bold text-lg tracking-widest
                transition-all duration-200 cursor-pointer
                hover:bg-gray-800/90 hover:scale-[1.02] active:scale-[0.98]
                ${color} ${border}
              `}
            >
              {/* Hover glow overlay */}
              <span
                className={`
                  absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100
                  transition-opacity duration-200 ${glow}
                `}
              />
              <span className="relative z-10 flex items-center justify-between">
                <span>{label}</span>
                <span className="font-rajdhani text-sm font-normal text-gray-400 group-hover:text-gray-300 normal-case tracking-normal">
                  {desc[key]}
                </span>
              </span>
            </button>
          ))}
        </div>

        {/* Footer hint */}
        <p className="font-rajdhani text-gray-600 text-xs tracking-wider text-center">
          You can change difficulty by restarting the game
        </p>
      </div>
    </div>
  );
};

export default DifficultySelector;

import React, { useState } from 'react';

// Re-exported so other pages (SinglePlayer, SnakeGame, etc.) can import it
export type Difficulty = 'easy' | 'medium' | 'hard';

export type CarType = 'muscle' | 'sports' | 'truck' | 'compact';

export interface CarTypeConfig {
  id: CarType;
  name: string;
  emoji: string;
  description: string;
  stats: {
    speed: string;
    handling: string;
    size: string;
  };
  speedModifier: number;
  accelerationFactor: number;
  width: number;
  height: number;
}

export const CAR_TYPES: CarTypeConfig[] = [
  {
    id: 'muscle',
    name: 'Muscle Car',
    emoji: '🚗',
    description: 'Raw power, wide body',
    stats: { speed: '★★★★☆', handling: '★★☆☆☆', size: 'Large' },
    speedModifier: 1.15,
    accelerationFactor: 1.2,
    width: 38,
    height: 70,
  },
  {
    id: 'sports',
    name: 'Sports Car',
    emoji: '🏎️',
    description: 'Fast & agile, low profile',
    stats: { speed: '★★★★★', handling: '★★★★★', size: 'Small' },
    speedModifier: 1.3,
    accelerationFactor: 1.5,
    width: 30,
    height: 60,
  },
  {
    id: 'truck',
    name: 'Truck',
    emoji: '🚛',
    description: 'Slow but unstoppable',
    stats: { speed: '★★☆☆☆', handling: '★★☆☆☆', size: 'XL' },
    speedModifier: 0.8,
    accelerationFactor: 0.7,
    width: 44,
    height: 80,
  },
  {
    id: 'compact',
    name: 'Compact',
    emoji: '🚕',
    description: 'Balanced everyday driver',
    stats: { speed: '★★★☆☆', handling: '★★★★☆', size: 'Medium' },
    speedModifier: 1.0,
    accelerationFactor: 1.0,
    width: 32,
    height: 64,
  },
];

interface DifficultySelectorProps {
  gameTitle: string;
  gameIcon: string;
  descriptions?: { easy: string; medium: string; hard: string };
  onSelect: (difficulty: Difficulty, carType?: CarType) => void;
  showCarSelection?: boolean;
}

const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  gameTitle,
  gameIcon,
  descriptions = {
    easy: 'Slower traffic, more room to breathe',
    medium: 'Balanced challenge for most players',
    hard: 'Dense traffic, high speed — survive!',
  },
  onSelect,
  showCarSelection = false,
}) => {
  const [step, setStep] = useState<'car' | 'difficulty'>(showCarSelection ? 'car' : 'difficulty');
  const [selectedCar, setSelectedCar] = useState<CarType>('compact');

  const difficulties: Array<{
    level: Difficulty;
    label: string;
    color: string;
    glow: string;
    bg: string;
  }> = [
    {
      level: 'easy',
      label: 'Easy',
      color: 'text-green-400',
      glow: 'shadow-[0_0_16px_rgba(74,222,128,0.5)]',
      bg: 'bg-green-900/30 border-green-500/50 hover:border-green-400',
    },
    {
      level: 'medium',
      label: 'Medium',
      color: 'text-yellow-400',
      glow: 'shadow-[0_0_16px_rgba(250,204,21,0.5)]',
      bg: 'bg-yellow-900/30 border-yellow-500/50 hover:border-yellow-400',
    },
    {
      level: 'hard',
      label: 'Hard',
      color: 'text-red-400',
      glow: 'shadow-[0_0_16px_rgba(248,113,113,0.5)]',
      bg: 'bg-red-900/30 border-red-500/50 hover:border-red-400',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 rounded-2xl border border-neon-blue/30 bg-gray-950/95 p-8 shadow-[0_0_40px_rgba(0,212,255,0.15)]">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">{gameIcon}</div>
          <h2 className="font-orbitron text-2xl font-bold text-neon-blue">{gameTitle}</h2>
          {step === 'car' && (
            <p className="text-gray-400 mt-2 font-rajdhani text-lg">Choose your vehicle</p>
          )}
          {step === 'difficulty' && (
            <p className="text-gray-400 mt-2 font-rajdhani text-lg">Select difficulty</p>
          )}
        </div>

        {/* Car Selection Step */}
        {step === 'car' && (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {CAR_TYPES.map((car) => (
                <button
                  key={car.id}
                  onClick={() => setSelectedCar(car.id)}
                  className={`relative rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                    selectedCar === car.id
                      ? 'border-neon-blue bg-neon-blue/10 shadow-[0_0_20px_rgba(0,212,255,0.3)]'
                      : 'border-gray-700 bg-gray-900/50 hover:border-gray-500'
                  }`}
                >
                  {selectedCar === car.id && (
                    <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-neon-blue shadow-[0_0_8px_rgba(0,212,255,0.8)]" />
                  )}
                  <div className="text-3xl mb-2">{car.emoji}</div>
                  <div className="font-orbitron text-sm font-bold text-white mb-1">{car.name}</div>
                  <div className="font-rajdhani text-xs text-gray-400 mb-3">{car.description}</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Speed</span>
                      <span className="text-yellow-400">{car.stats.speed}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Handling</span>
                      <span className="text-cyan-400">{car.stats.handling}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Size</span>
                      <span className="text-purple-400">{car.stats.size}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep('difficulty')}
              className="w-full py-3 rounded-xl font-orbitron font-bold text-black bg-neon-blue hover:bg-cyan-300 transition-colors shadow-[0_0_20px_rgba(0,212,255,0.4)]"
            >
              Next: Choose Difficulty →
            </button>
          </>
        )}

        {/* Difficulty Selection Step */}
        {step === 'difficulty' && (
          <>
            {showCarSelection && (
              <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-gray-900/60 border border-gray-700">
                <span className="text-2xl">{CAR_TYPES.find((c) => c.id === selectedCar)?.emoji}</span>
                <div>
                  <div className="font-orbitron text-sm text-neon-blue">
                    {CAR_TYPES.find((c) => c.id === selectedCar)?.name}
                  </div>
                  <button
                    onClick={() => setStep('car')}
                    className="text-xs text-gray-500 hover:text-gray-300 underline"
                  >
                    Change vehicle
                  </button>
                </div>
              </div>
            )}
            <div className="space-y-4">
              {difficulties.map(({ level, label, color, glow, bg }) => (
                <button
                  key={level}
                  onClick={() => onSelect(level, showCarSelection ? selectedCar : undefined)}
                  className={`w-full rounded-xl border-2 p-5 text-left transition-all duration-200 ${bg} hover:${glow}`}
                >
                  <div className={`font-orbitron text-xl font-bold ${color} mb-1`}>{label}</div>
                  <div className="font-rajdhani text-gray-400 text-sm">
                    {descriptions[level]}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DifficultySelector;

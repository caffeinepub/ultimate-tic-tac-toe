import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useSoundManager } from '../hooks/useSoundManager';

interface SoundToggleProps {
  className?: string;
}

const SoundToggle: React.FC<SoundToggleProps> = ({ className = '' }) => {
  const { muted, toggleMute } = useSoundManager();

  return (
    <button
      onClick={toggleMute}
      title={muted ? 'Unmute sounds' : 'Mute sounds'}
      className={`
        relative flex items-center justify-center w-10 h-10 rounded-lg border
        transition-all duration-200 cursor-pointer
        ${muted
          ? 'border-gray-600 bg-gray-800/60 text-gray-500 hover:border-gray-500 hover:text-gray-400'
          : 'border-neon-blue/60 bg-neon-blue/10 text-neon-blue hover:bg-neon-blue/20 shadow-[0_0_8px_rgba(0,212,255,0.3)]'
        }
        ${className}
      `}
    >
      {muted ? (
        <VolumeX className="w-5 h-5" />
      ) : (
        <Volume2 className="w-5 h-5" />
      )}
    </button>
  );
};

export default SoundToggle;

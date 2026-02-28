import React, { useEffect, useState } from 'react';

interface LevelUpOverlayProps {
  visible: boolean;
  newLevel: number;
  onDismiss: () => void;
}

export default function LevelUpOverlay({ visible, newLevel, onDismiss }: LevelUpOverlayProps) {
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (visible) {
      setTimeout(() => setAnimateIn(true), 50);
      const timer = setTimeout(() => {
        setAnimateIn(false);
        setTimeout(onDismiss, 400);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setAnimateIn(false);
    }
  }, [visible, onDismiss]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center pointer-events-none"
      style={{ background: animateIn ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0)', transition: 'background 0.3s ease' }}
      onClick={onDismiss}
    >
      <div
        className="pointer-events-auto text-center"
        style={{
          transform: animateIn ? 'scale(1) translateY(0)' : 'scale(0.5) translateY(40px)',
          opacity: animateIn ? 1 : 0,
          transition: 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease',
        }}
      >
        {/* Glow ring */}
        <div
          className="relative mx-auto mb-4 flex h-40 w-40 items-center justify-center rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(0,212,255,0.3) 0%, rgba(0,212,255,0.05) 70%, transparent 100%)',
            boxShadow: '0 0 60px rgba(0,212,255,0.8), 0 0 120px rgba(0,212,255,0.4), inset 0 0 40px rgba(0,212,255,0.2)',
            border: '2px solid rgba(0,212,255,0.6)',
            animation: animateIn ? 'levelUpPulse 0.8s ease-in-out infinite alternate' : 'none',
          }}
        >
          <div>
            <div className="font-orbitron text-5xl font-black text-neon-blue" style={{ textShadow: '0 0 30px rgba(0,212,255,1)' }}>
              {newLevel}
            </div>
          </div>
        </div>

        <div
          className="font-orbitron text-4xl font-black uppercase"
          style={{
            color: '#00d4ff',
            textShadow: '0 0 20px rgba(0,212,255,1), 0 0 40px rgba(0,212,255,0.6)',
            letterSpacing: '0.15em',
          }}
        >
          LEVEL UP!
        </div>
        <div className="mt-2 font-rajdhani text-lg text-gray-300">
          You reached <span className="text-neon-blue font-bold">Level {newLevel}</span>
        </div>
        <div className="mt-4 font-rajdhani text-sm text-gray-500">
          Click anywhere to continue
        </div>
      </div>

      <style>{`
        @keyframes levelUpPulse {
          from { box-shadow: 0 0 60px rgba(0,212,255,0.8), 0 0 120px rgba(0,212,255,0.4); }
          to { box-shadow: 0 0 80px rgba(0,212,255,1), 0 0 160px rgba(0,212,255,0.6); }
        }
      `}</style>
    </div>
  );
}

import { useState, useCallback, useEffect } from 'react';

type SoundType = 'click' | 'win' | 'gameOver' | 'score' | 'special';

// Generate sounds using Web Audio API as data URIs aren't reliable cross-browser
// We'll use programmatic audio generation
function createAudioContext(): AudioContext | null {
  try {
    return new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  } catch {
    return null;
  }
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  gainValue = 0.3,
  startTime?: number
) {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + (startTime || 0));
  gainNode.gain.setValueAtTime(gainValue, ctx.currentTime + (startTime || 0));
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (startTime || 0) + duration);
  oscillator.start(ctx.currentTime + (startTime || 0));
  oscillator.stop(ctx.currentTime + (startTime || 0) + duration);
}

function playSoundEffect(type: SoundType, muted: boolean) {
  if (muted) return;
  const ctx = createAudioContext();
  if (!ctx) return;

  switch (type) {
    case 'click': {
      playTone(ctx, 800, 0.08, 'square', 0.15);
      break;
    }
    case 'win': {
      // Ascending victory fanfare
      playTone(ctx, 523, 0.15, 'sine', 0.3, 0);
      playTone(ctx, 659, 0.15, 'sine', 0.3, 0.15);
      playTone(ctx, 784, 0.15, 'sine', 0.3, 0.3);
      playTone(ctx, 1047, 0.4, 'sine', 0.35, 0.45);
      break;
    }
    case 'gameOver': {
      // Descending sad tones
      playTone(ctx, 400, 0.2, 'sawtooth', 0.25, 0);
      playTone(ctx, 300, 0.2, 'sawtooth', 0.25, 0.2);
      playTone(ctx, 200, 0.4, 'sawtooth', 0.25, 0.4);
      break;
    }
    case 'score': {
      // Quick upward blip
      playTone(ctx, 600, 0.05, 'sine', 0.2, 0);
      playTone(ctx, 900, 0.1, 'sine', 0.2, 0.05);
      break;
    }
    case 'special': {
      // Special sparkle effect
      playTone(ctx, 1200, 0.1, 'sine', 0.25, 0);
      playTone(ctx, 1500, 0.1, 'sine', 0.25, 0.1);
      playTone(ctx, 1800, 0.1, 'sine', 0.25, 0.2);
      playTone(ctx, 2000, 0.2, 'sine', 0.3, 0.3);
      break;
    }
  }
}

const MUTE_KEY = 'gaming-arena-muted';

export function useSoundManager() {
  const [muted, setMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(MUTE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(MUTE_KEY, String(muted));
    } catch {
      // ignore
    }
  }, [muted]);

  const toggleMute = useCallback(() => {
    setMuted(prev => !prev);
  }, []);

  const playClick = useCallback(() => playSoundEffect('click', muted), [muted]);
  const playWin = useCallback(() => playSoundEffect('win', muted), [muted]);
  const playGameOver = useCallback(() => playSoundEffect('gameOver', muted), [muted]);
  const playScore = useCallback(() => playSoundEffect('score', muted), [muted]);
  const playSpecial = useCallback(() => playSoundEffect('special', muted), [muted]);

  return {
    muted,
    toggleMute,
    playClick,
    playWin,
    playGameOver,
    playScore,
    playSpecial,
  };
}

// Procedural Web Audio API sounds for Dark Trap Escape
import { useState, useCallback, useRef, useEffect } from 'react';

const MUTE_KEY = 'darkTrapEscape_muted';

function createCtx(): AudioContext | null {
  try {
    return new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  } catch {
    return null;
  }
}

function playTone(
  ctx: AudioContext,
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  gain = 0.25,
  startOffset = 0,
  freqEnd?: number
) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.connect(g);
  g.connect(ctx.destination);
  osc.type = type;
  const t = ctx.currentTime + startOffset;
  osc.frequency.setValueAtTime(freq, t);
  if (freqEnd !== undefined) {
    osc.frequency.linearRampToValueAtTime(freqEnd, t + duration);
  }
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.start(t);
  osc.stop(t + duration);
}

export function useDarkTrapEscapeSound() {
  const [muted, setMuted] = useState<boolean>(() => {
    try { return localStorage.getItem(MUTE_KEY) === 'true'; } catch { return false; }
  });

  const bgNodesRef = useRef<{ osc: OscillatorNode; gain: GainNode; ctx: AudioContext } | null>(null);
  const bgCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    try { localStorage.setItem(MUTE_KEY, String(muted)); } catch { /* ignore */ }
  }, [muted]);

  const toggleMute = useCallback(() => {
    setMuted(prev => {
      const next = !prev;
      if (bgNodesRef.current) {
        bgNodesRef.current.gain.gain.setValueAtTime(next ? 0 : 0.04, bgNodesRef.current.ctx.currentTime);
      }
      return next;
    });
  }, []);

  const playJumpSound = useCallback(() => {
    if (muted) return;
    const ctx = createCtx();
    if (!ctx) return;
    playTone(ctx, 300, 0.12, 'square', 0.18, 0, 600);
  }, [muted]);

  const playDeathSound = useCallback(() => {
    if (muted) return;
    const ctx = createCtx();
    if (!ctx) return;
    playTone(ctx, 440, 0.1, 'sawtooth', 0.3, 0, 100);
    playTone(ctx, 300, 0.15, 'sawtooth', 0.25, 0.1, 80);
    playTone(ctx, 150, 0.3, 'sawtooth', 0.2, 0.25, 50);
  }, [muted]);

  const playLevelCompleteSound = useCallback(() => {
    if (muted) return;
    const ctx = createCtx();
    if (!ctx) return;
    playTone(ctx, 523, 0.12, 'sine', 0.3, 0);
    playTone(ctx, 659, 0.12, 'sine', 0.3, 0.12);
    playTone(ctx, 784, 0.12, 'sine', 0.3, 0.24);
    playTone(ctx, 1047, 0.35, 'sine', 0.35, 0.36);
  }, [muted]);

  const playTrapSound = useCallback(() => {
    if (muted) return;
    const ctx = createCtx();
    if (!ctx) return;
    playTone(ctx, 200, 0.08, 'square', 0.2, 0, 400);
  }, [muted]);

  const startBackgroundMusic = useCallback(() => {
    if (bgNodesRef.current) return; // already running
    const ctx = createCtx();
    if (!ctx) return;
    bgCtxRef.current = ctx;

    // Low ambient drone
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(55, ctx.currentTime);
    gain.gain.setValueAtTime(muted ? 0 : 0.04, ctx.currentTime);
    osc.start();
    bgNodesRef.current = { osc, gain, ctx };

    // Subtle pulse effect
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.frequency.setValueAtTime(0.5, ctx.currentTime);
    lfoGain.gain.setValueAtTime(0.02, ctx.currentTime);
    lfo.start();
  }, [muted]);

  const stopBackgroundMusic = useCallback(() => {
    if (bgNodesRef.current) {
      try {
        bgNodesRef.current.osc.stop();
        bgNodesRef.current.ctx.close();
      } catch { /* ignore */ }
      bgNodesRef.current = null;
    }
  }, []);

  return {
    muted,
    toggleMute,
    playJumpSound,
    playDeathSound,
    playLevelCompleteSound,
    playTrapSound,
    startBackgroundMusic,
    stopBackgroundMusic,
  };
}

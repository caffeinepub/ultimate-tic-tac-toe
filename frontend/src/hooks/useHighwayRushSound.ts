import { useRef, useCallback, useEffect, useState } from 'react';

const MUTE_KEY = 'highwayRush_muted';

export function useHighwayRushSound() {
  const [muted, setMuted] = useState<boolean>(() => {
    try { return localStorage.getItem(MUTE_KEY) === 'true'; } catch { return false; }
  });
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  const ctxRef = useRef<AudioContext | null>(null);
  const engineOscRef = useRef<OscillatorNode | null>(null);
  const engineGainRef = useRef<GainNode | null>(null);
  const bgMusicNodesRef = useRef<(OscillatorNode | GainNode)[]>([]);
  const bgMusicIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bgMasterGainRef = useRef<GainNode | null>(null);

  const getCtx = useCallback((): AudioContext | null => {
    if (!ctxRef.current) {
      try {
        ctxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      } catch { return null; }
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume().catch(() => {});
    }
    return ctxRef.current;
  }, []);

  const startEngine = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    if (!ctx) return;
    if (engineOscRef.current) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const distortion = ctx.createWaveShaper();

    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1;
      curve[i] = (Math.PI + 200) * x / (Math.PI + 200 * Math.abs(x));
    }
    distortion.curve = curve;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);

    osc.connect(distortion);
    distortion.connect(gain);
    gain.connect(ctx.destination);
    osc.start();

    engineOscRef.current = osc;
    engineGainRef.current = gain;
  }, [getCtx]);

  const stopEngine = useCallback(() => {
    if (engineOscRef.current) {
      try { engineOscRef.current.stop(); } catch {}
      engineOscRef.current = null;
      engineGainRef.current = null;
    }
  }, []);

  const updateEngineSpeed = useCallback((speed: number) => {
    if (mutedRef.current) return;
    const ctx = ctxRef.current;
    if (!ctx || !engineOscRef.current || !engineGainRef.current) return;
    const freq = 80 + (speed - 10) * 2.4;
    engineOscRef.current.frequency.setTargetAtTime(Math.min(freq, 260), ctx.currentTime, 0.1);
  }, []);

  const startBackgroundMusic = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    if (!ctx) return;
    if (bgMasterGainRef.current) return;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.05, ctx.currentTime);
    masterGain.connect(ctx.destination);
    bgMasterGainRef.current = masterGain;

    const melody = [261, 329, 392, 523, 392, 329, 261, 196];
    let noteIdx = 0;

    const playNote = () => {
      if (!bgMasterGainRef.current || mutedRef.current) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(melody[noteIdx % melody.length], ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
      noteIdx++;
    };

    playNote();
    bgMusicIntervalRef.current = setInterval(playNote, 220);
  }, [getCtx]);

  const stopBackgroundMusic = useCallback(() => {
    if (bgMusicIntervalRef.current) {
      clearInterval(bgMusicIntervalRef.current);
      bgMusicIntervalRef.current = null;
    }
    if (bgMasterGainRef.current) {
      try { bgMasterGainRef.current.disconnect(); } catch {}
      bgMasterGainRef.current = null;
    }
    bgMusicNodesRef.current.forEach(n => { try { n.disconnect(); } catch {} });
    bgMusicNodesRef.current = [];
  }, []);

  const playCrash = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    if (!ctx) return;

    const bufferSize = ctx.sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.7, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.4);
    oscGain.gain.setValueAtTime(0.5, ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  }, [getCtx]);

  const playScreech = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    if (!ctx) return;
    const bufferSize = ctx.sampleRate * 0.2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3000, ctx.currentTime);
    filter.Q.setValueAtTime(5, ctx.currentTime);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  }, [getCtx]);

  const playCoin = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }, [getCtx]);

  const playBonus = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    if (!ctx) return;
    [440, 660, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.06);
      gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.06 + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.06);
      osc.stop(ctx.currentTime + i * 0.06 + 0.1);
    });
  }, [getCtx]);

  const playGameOver = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    if (!ctx) return;
    [440, 330, 220, 110].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.18);
      gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.18);
      osc.stop(ctx.currentTime + i * 0.18 + 0.16);
    });
  }, [getCtx]);

  const playClick = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }, [getCtx]);

  const playNearMiss = useCallback(() => {
    if (mutedRef.current) return;
    const ctx = getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.05);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }, [getCtx]);

  const toggleMute = useCallback(() => {
    setMuted(prev => {
      const next = !prev;
      try { localStorage.setItem(MUTE_KEY, String(next)); } catch {}
      if (next) {
        stopEngine();
        stopBackgroundMusic();
      }
      return next;
    });
  }, [stopEngine, stopBackgroundMusic]);

  useEffect(() => {
    return () => {
      stopEngine();
      stopBackgroundMusic();
      if (ctxRef.current) {
        ctxRef.current.close().catch(() => {});
        ctxRef.current = null;
      }
    };
  }, [stopEngine, stopBackgroundMusic]);

  return {
    muted,
    toggleMute,
    startEngine,
    stopEngine,
    updateEngineSpeed,
    startBackgroundMusic,
    stopBackgroundMusic,
    playCrash,
    playScreech,
    playCoin,
    playBonus,
    playGameOver,
    playClick,
    playNearMiss,
  };
}

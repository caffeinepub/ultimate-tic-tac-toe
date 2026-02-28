import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface InterstitialAdProps {
  onClose: () => void;
}

/**
 * InterstitialAd — Full-screen ad overlay shown after a complete Game Over.
 * Replace the placeholder div below with your real ad script when ready.
 */
const InterstitialAd: React.FC<InterstitialAdProps> = ({ onClose }) => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown <= 0) {
      onClose();
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90"
      role="dialog"
      aria-modal="true"
      aria-label="Advertisement"
    >
      {/* Close button — always visible */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 flex items-center gap-1.5 rounded-full bg-surface/80 border border-neon-blue/40 px-3 py-1.5 text-xs font-rajdhani text-muted-foreground hover:text-foreground hover:border-neon-blue transition-all"
        aria-label="Close advertisement"
      >
        <X size={14} />
        <span>Close in {countdown}s</span>
      </button>

      {/* Ad container */}
      <div className="relative w-full max-w-2xl mx-4 flex flex-col items-center gap-4">
        {/* Label */}
        <p className="text-xs font-rajdhani text-muted-foreground tracking-widest uppercase">
          Advertisement
        </p>

        {/*
         * ============================================================
         * AD PLACEHOLDER — Replace this block with your ad script
         * ============================================================
         * Google AdSense: paste your <ins class="adsbygoogle"> tag here
         * Adsterra: paste your Adsterra banner script here
         * ============================================================
         */}
        <div className="ad-placeholder-box w-full aspect-video max-h-[400px] flex flex-col items-center justify-center rounded-lg">
          <span className="ad-placeholder-label">Ad Space</span>
          <span className="text-xs text-muted-foreground mt-2 font-rajdhani">
            728 × 400 — Interstitial
          </span>
        </div>
        {/* ============================================================ */}

        {/* Countdown bar */}
        <div className="w-full h-1 bg-surface rounded-full overflow-hidden">
          <div
            className="h-full bg-neon-blue transition-all duration-1000 ease-linear"
            style={{ width: `${(countdown / 5) * 100}%` }}
          />
        </div>

        <p className="text-xs font-rajdhani text-muted-foreground">
          Returning to main menu in <span className="text-neon-blue font-bold">{countdown}</span>s
        </p>
      </div>
    </div>
  );
};

export default InterstitialAd;

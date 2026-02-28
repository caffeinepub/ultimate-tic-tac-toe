import React, { useEffect, useState } from 'react';
import { Play, X } from 'lucide-react';

interface RewardedAdProps {
  /** Called when the simulated ad finishes and the reward is granted */
  onRewardGranted: () => void;
  /** Whether the rewarded ad has already been used this session */
  disabled: boolean;
}

/**
 * RewardedAd — Shows a "Watch Ad to Continue" button after a crash.
 * Clicking it opens a 5-second simulated ad countdown.
 * Replace the placeholder div with your real rewarded ad SDK call.
 */
const RewardedAd: React.FC<RewardedAdProps> = ({ onRewardGranted, disabled }) => {
  const [watching, setWatching] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!watching) return;
    if (countdown <= 0) {
      setWatching(false);
      onRewardGranted();
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [watching, countdown, onRewardGranted]);

  const handleWatch = () => {
    /*
     * ============================================================
     * REWARDED AD INTEGRATION POINT
     * ============================================================
     * Google AdSense / AdMob: call window.adBreak({ type: 'reward', ... })
     * Adsterra: trigger your rewarded ad SDK here before setWatching(true)
     * ============================================================
     */
    setCountdown(5);
    setWatching(true);
  };

  if (disabled) return null;

  return (
    <>
      {/* Trigger button — shown after crash when ad not yet used */}
      {!watching && (
        <button
          onClick={handleWatch}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neon-blue/20 border border-neon-blue/60 text-neon-blue font-rajdhani font-semibold text-sm hover:bg-neon-blue/30 hover:border-neon-blue transition-all active:scale-95"
        >
          <Play size={14} className="fill-neon-blue" />
          Watch Ad to Continue (+1 Life)
        </button>
      )}

      {/* Full-screen countdown overlay while "watching" */}
      {watching && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90"
          role="dialog"
          aria-modal="true"
          aria-label="Rewarded advertisement"
        >
          <div className="relative w-full max-w-lg mx-4 flex flex-col items-center gap-4">
            {/* Label */}
            <p className="text-xs font-rajdhani text-muted-foreground tracking-widest uppercase">
              Rewarded Ad — Watch to earn +1 Life
            </p>

            {/*
             * ============================================================
             * REWARDED AD PLACEHOLDER — Replace with real ad content
             * ============================================================
             * Google AdSense rewarded: use adBreak({ type: 'reward' })
             * Adsterra rewarded: paste Adsterra rewarded script here
             * ============================================================
             */}
            <div className="ad-placeholder-box w-full aspect-video max-h-[320px] flex flex-col items-center justify-center rounded-lg">
              <span className="ad-placeholder-label">Ad Space</span>
              <span className="text-xs text-muted-foreground mt-2 font-rajdhani">
                Rewarded Video — 5s
              </span>
            </div>
            {/* ============================================================ */}

            {/* Countdown ring */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-14 h-14 rounded-full border-4 border-neon-blue/30 flex items-center justify-center relative">
                <span className="text-2xl font-orbitron font-bold text-neon-blue">{countdown}</span>
                {/* Animated ring */}
                <svg
                  className="absolute inset-0 w-full h-full -rotate-90"
                  viewBox="0 0 56 56"
                >
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-neon-blue"
                    strokeDasharray={`${2 * Math.PI * 24}`}
                    strokeDashoffset={`${2 * Math.PI * 24 * (countdown / 5)}`}
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                </svg>
              </div>
              <p className="text-xs font-rajdhani text-muted-foreground">
                Reward in <span className="text-neon-blue font-bold">{countdown}</span>s
              </p>
            </div>

            {/* Skip / close — only after countdown */}
            <button
              onClick={() => { setWatching(false); }}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-rajdhani transition-colors"
              aria-label="Cancel rewarded ad"
            >
              <X size={12} /> Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default RewardedAd;

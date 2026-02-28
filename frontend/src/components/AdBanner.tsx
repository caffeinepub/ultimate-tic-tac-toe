import React from 'react';

interface AdBannerProps {
  position: 'top' | 'bottom';
  className?: string;
}

/**
 * AdBanner — Sticky top or bottom banner ad placeholder.
 * Replace the inner div with your real ad script when ready.
 */
const AdBanner: React.FC<AdBannerProps> = ({ position, className = '' }) => {
  const isTop = position === 'top';

  return (
    <div
      className={`
        w-full z-40 flex items-center justify-center
        bg-surface/95 backdrop-blur-sm
        border-neon-blue/20
        ${isTop ? 'border-b' : 'border-t'}
        h-[60px] md:h-[90px]
        ${className}
      `}
      role="complementary"
      aria-label="Advertisement banner"
    >
      {/*
       * ============================================================
       * BANNER AD PLACEHOLDER — Replace with your real ad script
       * ============================================================
       * Google AdSense (728×90 leaderboard / 320×50 mobile):
       *   <ins class="adsbygoogle"
       *        style="display:block"
       *        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
       *        data-ad-slot="XXXXXXXXXX"
       *        data-ad-format="auto"
       *        data-full-width-responsive="true"></ins>
       *   <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
       *
       * Adsterra (728×90 / 320×50):
       *   Paste your Adsterra banner script tag here
       * ============================================================
       */}
      <div className="ad-placeholder-box h-[44px] md:h-[70px] w-[320px] md:w-[728px] max-w-full mx-auto flex items-center justify-center rounded">
        <span className="ad-placeholder-label text-xs md:text-sm">Ad Space</span>
        <span className="hidden md:inline text-xs text-muted-foreground ml-2 font-rajdhani">
          728×90
        </span>
        <span className="md:hidden text-xs text-muted-foreground ml-2 font-rajdhani">
          320×50
        </span>
      </div>
      {/* ============================================================ */}
    </div>
  );
};

export default AdBanner;

# Specification

## Summary
**Goal:** Integrate advertisement placeholder containers into the Ultimate Gaming Arena website, covering banner ads, interstitial ads, and rewarded ads — all using styled placeholders with comments for future real ad script integration.

**Planned changes:**
- Add a sticky top banner ad container in RootLayout, rendered below the navigation bar (90px tall on desktop, 60px on mobile), full width, with a styled "Ad Space" placeholder and HTML comments for AdSense/Adsterra scripts.
- Add a sticky bottom banner ad container in RootLayout, full width, mobile-friendly, that does not overlap game controls or canvas, with a styled "Ad Space" placeholder and HTML comments for AdSense/Adsterra scripts.
- Implement a full-screen interstitial ad overlay that triggers only on a full Game Over event (not mid-game crashes), with a visible 5-second countdown, a manual close (X) button, auto-close after 5 seconds, and navigation to the main menu on close; integrate with Endless Runner, Highway Rush, and any other game with a Game Over state.
- Implement a rewarded ad system triggered on player crash (not full Game Over): show a "Watch Ad to Continue" button, display a 5-second simulated countdown overlay when clicked, then grant 1 extra life and resume the game; limited to once per game session.
- Style all ad placeholder containers as semi-transparent dark boxes with neon accent borders and centered "Ad Space" text, consistent with the site theme; ensure no ad overlaps nav, game canvas, or controls; maintain responsive layout and smooth gameplay performance.

**User-visible outcome:** Users see styled "Ad Space" banner placeholders at the top and bottom of every page, a full-screen interstitial after Game Over with a countdown and close button, and a "Watch Ad to Continue" option after a crash that rewards one extra life — all ready for real ad scripts to be dropped in via marked HTML comments.

# Specification

## Summary
**Goal:** Build "Highway Rush," a 3D endless traffic driving game using React Three Fiber/Three.js, fully integrated into the existing app.

**Planned changes:**
- Create `frontend/src/pages/HighwayRushGame.tsx` with a full 3D endless scrolling highway scene, third-person camera, realistic road with lane markings, and smooth 60 FPS rendering
- Implement player car controls: Arrow Left/Right and A/D keys for lane switching on desktop; on-screen touch buttons on mobile; smooth lateral lane-switch animation across 3+ lanes
- Spawn randomized oncoming traffic cars with varied colors/shapes; traffic speed and spawn rate increase progressively over time; collision ends the game
- Day/night cycle transitioning sky, ambient lighting, and road appearance; motion blur post-processing effect activating at high speeds
- On collision: particle explosion, screen shake, and slow-motion effect; on near-miss: bonus points awarded and brief slow-motion effect shown
- HUD overlay showing live score (distance-based), high score (localStorage), speed meter, and coin count
- Collectible coins spawning on the road; car skins system with 3+ skins unlockable with coins; selected skin and coin count persisted in localStorage
- Difficulty escalation every 30 seconds increasing traffic density and speed cap, with brief on-screen notification
- Game screens: Main Menu (Play, Car Skins, High Scores), in-game Pause overlay (Resume/Restart), Game Over screen (score, high score, coins, Restart/Menu, rewarded-ad placeholder for Extra Life, interstitial-ad placeholder zone, banner-ad placeholder)
- All audio via Web Audio API (no external files): looping engine sound pitch-shifting with speed, crash sound, background music loop, button click sounds; mute toggle in HUD persisted in localStorage
- Register Highway Rush as a game card on `Home.tsx` linking to `/highway-rush`; add route to `App.tsx`
- Integrate with existing player profile/XP system: award XP at game over proportional to score, increment games-played counter, unlock milestone achievements at 1000/5000/10000 points

**User-visible outcome:** Players can launch Highway Rush from the home page, drive a 3D car down an endless highway avoiding traffic, collect coins to unlock car skins, experience day/night cycles and crash effects, and have their high score and progress saved locally.

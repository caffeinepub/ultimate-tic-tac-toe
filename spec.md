# Specification

## Summary
**Goal:** Add global sound effects with mute toggle, and difficulty selector screens with game-specific difficulty logic to the Ultimate Gaming Arena.

**Planned changes:**
- Create a global sound manager hook using HTML5 Audio API with sounds for click, win, game over, score increment, and special events; mute state persists in localStorage
- Add a mute/unmute toggle button (neon speaker icon) to all game pages and the Home page header/navbar
- Build a reusable `DifficultySelector` component (Easy / Medium / Hard) styled in the dark neon theme that appears before each applicable game starts
- Integrate the difficulty selector into Tic Tac Toe (SinglePlayer), Snake, and Traffic Car games
- Upgrade SinglePlayer Tic Tac Toe AI: Easy = random moves, Medium = mixed random/Minimax, Hard = full Minimax (unbeatable)
- Upgrade Snake game speed: Easy = ~200ms tick, Medium = ~130ms tick, Hard = ~70ms tick
- Upgrade Traffic Car game: Easy = slow/sparse traffic, Medium = current default, Hard = fast/dense traffic
- Display the selected difficulty label during gameplay for all three games
- Play appropriate sound effects on game events (food eaten, collision, win, game over, score milestones) across all games

**User-visible outcome:** Players are prompted to choose a difficulty before starting Tic Tac Toe (SinglePlayer), Snake, or Traffic Car, and experience matching AI/speed/traffic behavior along with sound feedback throughout all games. A mute button is always accessible to silence all sounds.

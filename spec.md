# Specification

## Summary
**Goal:** Build a fully client-side Ultimate Tic Tac Toe game with Single Player (vs random AI) and Two Player modes, a session scoreboard, and a modern dark neon UI.

**Planned changes:**
- Create a Home page with the title "Ultimate Tic Tac Toe" and two mode-selection buttons: "Single Player (Play vs Computer)" and "Two Player (Play with Friend)"
- Implement a 3x3 Tic Tac Toe game board with win and draw detection, winning cell highlighting, and smooth animations
- Single Player mode: human plays as X, computer plays as O using random move selection
- Two Player mode: two humans alternate turns (X and O) on the same device with current-turn indicator
- Session-only scoreboard tracking wins for both players/computer (resets on page refresh, no persistence)
- Dark theme with neon blue and purple glow effects, smooth hover transitions, and mobile-responsive layout
- Restart button to reset the board between rounds within a session

**User-visible outcome:** Users can play Tic Tac Toe solo against a random AI or with a friend on the same device, with a live scoreboard tracking wins across rounds in the session, all presented in a dark neon-styled responsive interface.

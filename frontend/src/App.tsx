import React from 'react';
import { RouterProvider, createRouter, createRoute, createRootRoute } from '@tanstack/react-router';
import { Home } from './pages/Home';
import { SinglePlayer } from './pages/SinglePlayer';
import { TwoPlayer } from './pages/TwoPlayer';
import { SnakeGame } from './pages/SnakeGame';
import { RockPaperScissors } from './pages/RockPaperScissors';
import { MemoryCardMatch } from './pages/MemoryCardMatch';
import { TrafficCarGame } from './pages/TrafficCarGame';
import { SnakeAndLadder } from './pages/SnakeAndLadder';
import { Leaderboard } from './pages/Leaderboard';

// Root route
const rootRoute = createRootRoute();

// Child routes
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Home,
});

const singlePlayerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/single-player',
  component: SinglePlayer,
});

const twoPlayerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/two-player',
  component: TwoPlayer,
});

const snakeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/snake',
  component: SnakeGame,
});

const rpsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/rps',
  component: RockPaperScissors,
});

const memoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/memory',
  component: MemoryCardMatch,
});

const trafficRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/traffic',
  component: TrafficCarGame,
});

const snakeLadderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/snake-ladder',
  component: SnakeAndLadder,
});

const leaderboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/leaderboard',
  component: Leaderboard,
});

// Route tree
const routeTree = rootRoute.addChildren([
  homeRoute,
  singlePlayerRoute,
  twoPlayerRoute,
  snakeRoute,
  rpsRoute,
  memoryRoute,
  trafficRoute,
  snakeLadderRoute,
  leaderboardRoute,
]);

// Router
const router = createRouter({ routeTree });

// Type declaration for router
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}

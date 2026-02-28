import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import RootLayout from "./components/RootLayout";

const Home = lazy(() => import("./pages/Home"));
const SinglePlayer = lazy(() => import("./pages/SinglePlayer"));
const TwoPlayer = lazy(() => import("./pages/TwoPlayer"));
const RockPaperScissors = lazy(() => import("./pages/RockPaperScissors"));
const MemoryCardMatch = lazy(() => import("./pages/MemoryCardMatch"));
const Game2048 = lazy(() => import("./pages/Game2048"));
const Connect4Game = lazy(() => import("./pages/Connect4Game"));
const SnakeGame = lazy(() => import("./pages/SnakeGame"));
const TrafficCarGame = lazy(() => import("./pages/TrafficCarGame"));
const SnakeAndLadder = lazy(() => import("./pages/SnakeAndLadder"));
const PongGame = lazy(() => import("./pages/PongGame"));
const FlappyBirdGame = lazy(() => import("./pages/FlappyBirdGame"));
const BrickBreakerGame = lazy(() => import("./pages/BrickBreakerGame"));
const Achievements = lazy(() => import("./pages/Achievements"));
const Profile = lazy(() => import("./pages/Profile"));
const EndlessRunnerGame = lazy(() => import("./pages/EndlessRunnerGame"));
const SnakeArcadeGame = lazy(() => import("./pages/SnakeArcadeGame"));
const TetrisGame = lazy(() => import("./pages/TetrisGame"));
const SpaceInvadersGame = lazy(() => import("./pages/SpaceInvadersGame"));
const MinesweeperGame = lazy(() => import("./pages/MinesweeperGame"));
const PacManGame = lazy(() => import("./pages/PacManGame"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const DarkTrapEscapeGame = lazy(() => import("./pages/DarkTrapEscapeGame"));
const HighwayRushGame = lazy(() => import("./pages/HighwayRushGame"));

const queryClient = new QueryClient();

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-neon-blue font-orbitron text-xl animate-pulse">LOADING...</div>
    </div>
  );
}

function withSuspense(Component: React.ComponentType) {
  return function SuspenseWrapper() {
    return <Suspense fallback={<PageLoader />}><Component /></Suspense>;
  };
}

const rootRoute = createRootRoute({ component: RootLayout });

const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: withSuspense(Home) });
const singlePlayerRoute = createRoute({ getParentRoute: () => rootRoute, path: "/single-player", component: withSuspense(SinglePlayer) });
const twoPlayerRoute = createRoute({ getParentRoute: () => rootRoute, path: "/two-player", component: withSuspense(TwoPlayer) });
const rockPaperScissorsRoute = createRoute({ getParentRoute: () => rootRoute, path: "/rock-paper-scissors", component: withSuspense(RockPaperScissors) });
const memoryCardMatchRoute = createRoute({ getParentRoute: () => rootRoute, path: "/memory-card-match", component: withSuspense(MemoryCardMatch) });
const game2048Route = createRoute({ getParentRoute: () => rootRoute, path: "/2048", component: withSuspense(Game2048) });
const connect4Route = createRoute({ getParentRoute: () => rootRoute, path: "/connect4", component: withSuspense(Connect4Game) });
const snakeRoute = createRoute({ getParentRoute: () => rootRoute, path: "/snake", component: withSuspense(SnakeGame) });
const trafficCarRoute = createRoute({ getParentRoute: () => rootRoute, path: "/traffic-car", component: withSuspense(TrafficCarGame) });
const snakeAndLadderRoute = createRoute({ getParentRoute: () => rootRoute, path: "/snake-and-ladder", component: withSuspense(SnakeAndLadder) });
const pongRoute = createRoute({ getParentRoute: () => rootRoute, path: "/pong", component: withSuspense(PongGame) });
const flappyBirdRoute = createRoute({ getParentRoute: () => rootRoute, path: "/flappy-bird", component: withSuspense(FlappyBirdGame) });
const brickBreakerRoute = createRoute({ getParentRoute: () => rootRoute, path: "/brick-breaker", component: withSuspense(BrickBreakerGame) });
const achievementsRoute = createRoute({ getParentRoute: () => rootRoute, path: "/achievements", component: withSuspense(Achievements) });
const profileRoute = createRoute({ getParentRoute: () => rootRoute, path: "/profile", component: withSuspense(Profile) });
const endlessRunnerRoute = createRoute({ getParentRoute: () => rootRoute, path: "/endless-runner", component: withSuspense(EndlessRunnerGame) });
const snakeArcadeRoute = createRoute({ getParentRoute: () => rootRoute, path: "/snake-arcade", component: withSuspense(SnakeArcadeGame) });
const tetrisRoute = createRoute({ getParentRoute: () => rootRoute, path: "/tetris", component: withSuspense(TetrisGame) });
const spaceInvadersRoute = createRoute({ getParentRoute: () => rootRoute, path: "/space-invaders", component: withSuspense(SpaceInvadersGame) });
const minesweeperRoute = createRoute({ getParentRoute: () => rootRoute, path: "/minesweeper", component: withSuspense(MinesweeperGame) });
const pacManRoute = createRoute({ getParentRoute: () => rootRoute, path: "/pac-man", component: withSuspense(PacManGame) });
const leaderboardRoute = createRoute({ getParentRoute: () => rootRoute, path: "/leaderboard", component: withSuspense(Leaderboard) });
const darkTrapEscapeRoute = createRoute({ getParentRoute: () => rootRoute, path: "/dark-trap-escape", component: withSuspense(DarkTrapEscapeGame) });
const highwayRushRoute = createRoute({ getParentRoute: () => rootRoute, path: "/highway-rush", component: withSuspense(HighwayRushGame) });

const routeTree = rootRoute.addChildren([
  homeRoute, singlePlayerRoute, twoPlayerRoute, rockPaperScissorsRoute,
  memoryCardMatchRoute, game2048Route, connect4Route, snakeRoute,
  trafficCarRoute, snakeAndLadderRoute, pongRoute, flappyBirdRoute,
  brickBreakerRoute, achievementsRoute, profileRoute, endlessRunnerRoute,
  snakeArcadeRoute, tetrisRoute, spaceInvadersRoute, minesweeperRoute,
  pacManRoute, leaderboardRoute, darkTrapEscapeRoute, highwayRushRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register { router: typeof router; }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

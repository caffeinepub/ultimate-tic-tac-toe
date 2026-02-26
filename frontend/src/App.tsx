import React from 'react';
import { RouterProvider, createRouter, createRoute, createRootRoute } from '@tanstack/react-router';
import { Home } from './pages/Home';
import { SinglePlayer } from './pages/SinglePlayer';
import { TwoPlayer } from './pages/TwoPlayer';

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

// Route tree
const routeTree = rootRoute.addChildren([homeRoute, singlePlayerRoute, twoPlayerRoute]);

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

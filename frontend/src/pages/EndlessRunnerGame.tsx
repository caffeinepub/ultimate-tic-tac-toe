import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import InterstitialAd from '../components/InterstitialAd';
import RewardedAd from '../components/RewardedAd';

// ─── Types ───────────────────────────────────────────────────────────────────
interface GameState {
  score: number;
  lives: number;
  speed: number;
  phase: 'menu' | 'playing' | 'crashed' | 'gameover';
  rewardedUsed: boolean;
  showInterstitial: boolean;
}

interface Obstacle {
  mesh: THREE.Mesh;
  lane: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const LANES = [-2.5, 0, 2.5];
const OBSTACLE_INTERVAL = 1.8; // seconds between spawns
const BASE_SPEED = 8;
const SPEED_INCREMENT = 0.002;
const JUMP_VELOCITY = 7;
const GRAVITY = -18;
const GROUND_Y = 0;
const PLAYER_Y_BASE = 0.5;

const EndlessRunnerGame: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // React UI state
  const [uiState, setUiState] = useState<GameState>({
    score: 0,
    lives: 3,
    speed: BASE_SPEED,
    phase: 'menu',
    rewardedUsed: false,
    showInterstitial: false,
  });

  // Refs for game loop (avoid stale closures)
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const playerRef = useRef<THREE.Mesh | null>(null);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const groundRef = useRef<THREE.Mesh | null>(null);
  const animFrameRef = useRef<number>(0);
  const clockRef = useRef(new THREE.Clock());

  const gameStateRef = useRef({
    phase: 'menu' as GameState['phase'],
    score: 0,
    lives: 3,
    speed: BASE_SPEED,
    rewardedUsed: false,
    lane: 1, // 0=left, 1=center, 2=right
    targetLaneX: 0,
    velY: 0,
    posY: PLAYER_Y_BASE,
    isJumping: false,
    obstacleTimer: 0,
    groundOffset: 0,
  });

  const syncUI = useCallback(() => {
    const s = gameStateRef.current;
    setUiState({
      score: Math.floor(s.score),
      lives: s.lives,
      speed: s.speed,
      phase: s.phase,
      rewardedUsed: s.rewardedUsed,
      showInterstitial: s.phase === 'gameover',
    });
  }, []);

  // ── Three.js setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050510);
    scene.fog = new THREE.Fog(0x050510, 20, 60);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      70,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 4, 8);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    scene.add(new THREE.AmbientLight(0x334466, 1.5));
    const dirLight = new THREE.DirectionalLight(0x88aaff, 2);
    dirLight.position.set(5, 10, 5);
    scene.add(dirLight);

    // Ground — tiled neon grid
    const groundGeo = new THREE.PlaneGeometry(10, 200, 10, 100);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a2a,
      wireframe: false,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = -90;
    scene.add(ground);
    groundRef.current = ground;

    // Grid lines overlay
    const gridHelper = new THREE.GridHelper(200, 40, 0x1a3a6a, 0x0d1f3a);
    gridHelper.position.z = -90;
    scene.add(gridHelper);

    // Lane dividers
    [-1.25, 1.25].forEach((x) => {
      const geo = new THREE.BoxGeometry(0.05, 0.02, 200);
      const mat = new THREE.MeshStandardMaterial({ color: 0x2244aa, emissive: 0x1122aa });
      const divider = new THREE.Mesh(geo, mat);
      divider.position.set(x, 0.01, -90);
      scene.add(divider);
    });

    // Player cube
    const playerGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const playerMat = new THREE.MeshStandardMaterial({
      color: 0x00aaff,
      emissive: 0x0055aa,
      emissiveIntensity: 0.8,
    });
    const player = new THREE.Mesh(playerGeo, playerMat);
    player.position.set(0, PLAYER_Y_BASE, 2);
    scene.add(player);
    playerRef.current = player;

    // Resize handler
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      // Clean up obstacles
      obstaclesRef.current.forEach((o) => scene.remove(o.mesh));
      obstaclesRef.current = [];
    };
  }, []);

  // ── Spawn obstacle ──────────────────────────────────────────────────────────
  const spawnObstacle = useCallback(() => {
    if (!sceneRef.current) return;
    const lane = Math.floor(Math.random() * 3);
    const geo = new THREE.BoxGeometry(0.9, 1.0, 0.9);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xff3333,
      emissive: 0xaa1111,
      emissiveIntensity: 0.6,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(LANES[lane], 0.5, -30);
    sceneRef.current.add(mesh);
    obstaclesRef.current.push({ mesh, lane });
  }, []);

  // ── Game loop ───────────────────────────────────────────────────────────────
  const loopRef = useRef<() => void>(() => {});

  loopRef.current = () => {
    const gs = gameStateRef.current;
    if (gs.phase !== 'playing') return;

    const delta = Math.min(clockRef.current.getDelta(), 0.05);
    gs.score += delta * 10;
    gs.speed = BASE_SPEED + gs.score * SPEED_INCREMENT;

    // Player lateral movement
    const player = playerRef.current!;
    const targetX = LANES[gs.lane];
    player.position.x += (targetX - player.position.x) * 0.2;

    // Jump physics
    if (gs.isJumping) {
      gs.velY += GRAVITY * delta;
      gs.posY += gs.velY * delta;
      if (gs.posY <= PLAYER_Y_BASE) {
        gs.posY = PLAYER_Y_BASE;
        gs.velY = 0;
        gs.isJumping = false;
      }
    }
    player.position.y = gs.posY;
    player.rotation.x += delta * 2;

    // Obstacle spawning
    gs.obstacleTimer += delta;
    if (gs.obstacleTimer >= OBSTACLE_INTERVAL) {
      gs.obstacleTimer = 0;
      spawnObstacle();
    }

    // Move obstacles
    const toRemove: number[] = [];
    obstaclesRef.current.forEach((obs, i) => {
      obs.mesh.position.z += gs.speed * delta;
      if (obs.mesh.position.z > 6) {
        sceneRef.current!.remove(obs.mesh);
        toRemove.push(i);
        return;
      }

      // AABB collision
      const dx = Math.abs(player.position.x - obs.mesh.position.x);
      const dy = Math.abs(player.position.y - obs.mesh.position.y);
      const dz = Math.abs(player.position.z - obs.mesh.position.z);
      if (dx < 0.8 && dy < 0.8 && dz < 0.8) {
        // Collision!
        sceneRef.current!.remove(obs.mesh);
        toRemove.push(i);
        gs.lives -= 1;

        if (gs.lives <= 0) {
          gs.phase = 'gameover';
        } else {
          gs.phase = 'crashed';
        }
        syncUI();
      }
    });
    // Remove in reverse order
    toRemove.sort((a, b) => b - a).forEach((i) => obstaclesRef.current.splice(i, 1));

    // Camera follow
    if (cameraRef.current) {
      cameraRef.current.position.x += (player.position.x * 0.3 - cameraRef.current.position.x) * 0.1;
    }

    // Render
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }

    // Update score in UI every ~30 frames
    if (Math.floor(gs.score) % 30 === 0) {
      setUiState((prev) => ({ ...prev, score: Math.floor(gs.score) }));
    }

    animFrameRef.current = requestAnimationFrame(() => loopRef.current());
  };

  // ── Start game ──────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    const gs = gameStateRef.current;
    gs.phase = 'playing';
    gs.score = 0;
    gs.lives = 3;
    gs.speed = BASE_SPEED;
    gs.rewardedUsed = false;
    gs.lane = 1;
    gs.targetLaneX = 0;
    gs.velY = 0;
    gs.posY = PLAYER_Y_BASE;
    gs.isJumping = false;
    gs.obstacleTimer = 0;

    // Clear obstacles
    obstaclesRef.current.forEach((o) => sceneRef.current?.remove(o.mesh));
    obstaclesRef.current = [];

    // Reset player
    if (playerRef.current) {
      playerRef.current.position.set(0, PLAYER_Y_BASE, 2);
      playerRef.current.rotation.set(0, 0, 0);
    }

    clockRef.current.start();
    syncUI();
    animFrameRef.current = requestAnimationFrame(() => loopRef.current());
  }, [syncUI]);

  // ── Resume after rewarded ad ────────────────────────────────────────────────
  const resumeAfterReward = useCallback(() => {
    const gs = gameStateRef.current;
    gs.lives += 1;
    gs.rewardedUsed = true;
    gs.phase = 'playing';

    // Reset player position
    if (playerRef.current) {
      playerRef.current.position.set(LANES[gs.lane], PLAYER_Y_BASE, 2);
    }

    clockRef.current.start();
    syncUI();
    animFrameRef.current = requestAnimationFrame(() => loopRef.current());
  }, [syncUI]);

  // ── Input handling ──────────────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const gs = gameStateRef.current;
      if (gs.phase !== 'playing') return;

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          gs.lane = Math.max(0, gs.lane - 1);
          break;
        case 'ArrowRight':
        case 'KeyD':
          gs.lane = Math.min(2, gs.lane + 1);
          break;
        case 'ArrowUp':
        case 'KeyW':
        case 'Space':
          if (!gs.isJumping) {
            gs.velY = JUMP_VELOCITY;
            gs.isJumping = true;
          }
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // ── Touch controls ──────────────────────────────────────────────────────────
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const gs = gameStateRef.current;
    if (gs.phase !== 'playing') return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 30) gs.lane = Math.min(2, gs.lane + 1);
      else if (dx < -30) gs.lane = Math.max(0, gs.lane - 1);
    } else if (dy < -30 && !gs.isJumping) {
      gs.velY = JUMP_VELOCITY;
      gs.isJumping = true;
    }
  };

  // ── Interstitial close → navigate home ─────────────────────────────────────
  const handleInterstitialClose = useCallback(() => {
    navigate({ to: '/' });
  }, [navigate]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-[calc(100vh-60px)] md:h-[calc(100vh-90px-56px)] min-h-[500px] bg-background overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Three.js mount */}
      <div ref={mountRef} className="absolute inset-0" />

      {/* HUD */}
      {uiState.phase === 'playing' && (
        <div className="absolute top-3 left-0 right-0 flex justify-between items-start px-4 pointer-events-none z-10">
          <div className="bg-black/60 rounded-lg px-3 py-1.5 font-orbitron text-neon-blue text-sm">
            {String(uiState.score).padStart(6, '0')}
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full border ${
                  i < uiState.lives
                    ? 'bg-neon-blue border-neon-blue shadow-[0_0_6px_#00aaff]'
                    : 'bg-transparent border-neon-blue/30'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Menu */}
      {uiState.phase === 'menu' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/70">
          <h1 className="font-orbitron text-3xl md:text-4xl font-bold text-neon-blue mb-2 text-center">
            ENDLESS RUNNER
          </h1>
          <p className="font-rajdhani text-muted-foreground mb-8 text-center px-4">
            Dodge obstacles across 3 lanes. Survive as long as you can!
          </p>
          <div className="grid grid-cols-3 gap-4 mb-8 text-center text-xs font-rajdhani text-muted-foreground">
            <div className="bg-surface/60 rounded-lg p-3">
              <div className="text-neon-blue font-bold mb-1">← →</div>
              <div>Change Lane</div>
            </div>
            <div className="bg-surface/60 rounded-lg p-3">
              <div className="text-neon-blue font-bold mb-1">↑ / Space</div>
              <div>Jump</div>
            </div>
            <div className="bg-surface/60 rounded-lg p-3">
              <div className="text-neon-blue font-bold mb-1">Swipe</div>
              <div>Mobile</div>
            </div>
          </div>
          <button
            onClick={startGame}
            className="px-8 py-3 bg-neon-blue/20 border border-neon-blue text-neon-blue font-orbitron font-bold rounded-lg hover:bg-neon-blue/30 transition-all hover:shadow-[0_0_20px_#00aaff44] active:scale-95"
          >
            START GAME
          </button>
          <Link to="/" className="mt-4 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-rajdhani transition-colors">
            <ArrowLeft size={12} /> Back to Games
          </Link>
        </div>
      )}

      {/* Crashed overlay — show rewarded ad option */}
      {uiState.phase === 'crashed' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/75">
          <h2 className="font-orbitron text-2xl font-bold text-red-400 mb-1">CRASHED!</h2>
          <p className="font-rajdhani text-muted-foreground mb-2">
            Lives remaining: <span className="text-neon-blue font-bold">{uiState.lives}</span>
          </p>
          <p className="font-rajdhani text-sm text-muted-foreground mb-6">
            Score: <span className="text-foreground font-bold">{uiState.score}</span>
          </p>

          {/* Rewarded ad — once per session */}
          {!uiState.rewardedUsed && (
            <div className="mb-4">
              <RewardedAd
                onRewardGranted={resumeAfterReward}
                disabled={uiState.rewardedUsed}
              />
            </div>
          )}

          <button
            onClick={() => {
              gameStateRef.current.phase = 'playing';
              clockRef.current.start();
              syncUI();
              animFrameRef.current = requestAnimationFrame(() => loopRef.current());
            }}
            className="px-6 py-2 bg-surface/60 border border-neon-blue/40 text-foreground font-rajdhani font-semibold rounded-lg hover:border-neon-blue transition-all text-sm"
          >
            Continue (–1 Life)
          </button>
        </div>
      )}

      {/* Game Over overlay */}
      {uiState.phase === 'gameover' && !uiState.showInterstitial && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/80">
          <h2 className="font-orbitron text-3xl font-bold text-red-400 mb-2">GAME OVER</h2>
          <p className="font-rajdhani text-muted-foreground mb-1">Final Score</p>
          <p className="font-orbitron text-4xl font-bold text-neon-blue mb-8">{uiState.score}</p>
          <button
            onClick={startGame}
            className="flex items-center gap-2 px-6 py-2.5 bg-neon-blue/20 border border-neon-blue text-neon-blue font-orbitron font-bold rounded-lg hover:bg-neon-blue/30 transition-all mb-3"
          >
            <RotateCcw size={16} /> PLAY AGAIN
          </button>
          <Link to="/" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-rajdhani transition-colors">
            <ArrowLeft size={12} /> Back to Games
          </Link>
        </div>
      )}

      {/* Mobile lane buttons */}
      {uiState.phase === 'playing' && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-between px-4 z-10 pointer-events-none">
          <button
            className="pointer-events-auto w-14 h-14 rounded-full bg-black/50 border border-neon-blue/40 flex items-center justify-center text-neon-blue text-xl active:bg-neon-blue/20"
            onTouchStart={() => { gameStateRef.current.lane = Math.max(0, gameStateRef.current.lane - 1); }}
          >
            ←
          </button>
          <button
            className="pointer-events-auto w-14 h-14 rounded-full bg-black/50 border border-neon-blue/40 flex items-center justify-center text-neon-blue text-xl active:bg-neon-blue/20"
            onTouchStart={() => {
              const gs = gameStateRef.current;
              if (!gs.isJumping) { gs.velY = JUMP_VELOCITY; gs.isJumping = true; }
            }}
          >
            ↑
          </button>
          <button
            className="pointer-events-auto w-14 h-14 rounded-full bg-black/50 border border-neon-blue/40 flex items-center justify-center text-neon-blue text-xl active:bg-neon-blue/20"
            onTouchStart={() => { gameStateRef.current.lane = Math.min(2, gameStateRef.current.lane + 1); }}
          >
            →
          </button>
        </div>
      )}

      {/* Interstitial ad — shown after full Game Over */}
      {uiState.showInterstitial && (
        <InterstitialAd onClose={handleInterstitialClose} />
      )}
    </div>
  );
};

export default EndlessRunnerGame;

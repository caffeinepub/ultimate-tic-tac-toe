import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import * as THREE from 'three';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Obstacle {
  mesh: THREE.Mesh;
  lane: number; // -1, 0, 1
}

// ─── Constants ───────────────────────────────────────────────────────────────
const LANE_WIDTH = 2.5;
const LANES = [-LANE_WIDTH, 0, LANE_WIDTH]; // x positions
const PLAYER_Y_GROUND = 0.5;
const JUMP_VELOCITY = 8;
const GRAVITY = -20;
const INITIAL_SPEED = 10;
const SPEED_INCREMENT = 0.5; // per second
const OBSTACLE_SPAWN_INTERVAL = 1.4; // seconds
const TRACK_TILE_LENGTH = 20;
const TRACK_TILE_COUNT = 6;

// ─── Component ───────────────────────────────────────────────────────────────
const EndlessRunnerGame: React.FC = () => {
  const navigate = useNavigate();
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game state refs (used inside animation loop)
  const gameStateRef = useRef<'idle' | 'playing' | 'gameover'>('idle');
  const scoreRef = useRef(0);
  const speedRef = useRef(INITIAL_SPEED);
  const playerLaneRef = useRef(1); // 0=left, 1=center, 2=right
  const playerYRef = useRef(PLAYER_Y_GROUND);
  const playerVYRef = useRef(0);
  const isJumpingRef = useRef(false);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const spawnTimerRef = useRef(0);
  const elapsedRef = useRef(0);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const keysRef = useRef<Record<string, boolean>>({});
  const keyProcessedRef = useRef<Record<string, boolean>>({});

  // React state for UI overlay
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);

  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const playerMeshRef = useRef<THREE.Mesh | null>(null);
  const trackTilesRef = useRef<THREE.Mesh[]>([]);
  const playerTargetXRef = useRef(0);

  // ─── Init Three.js ──────────────────────────────────────────────────────
  const initThree = useCallback(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050510);
    scene.fog = new THREE.Fog(0x050510, 20, 60);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 200);
    camera.position.set(0, 4, 8);
    camera.lookAt(0, 0, -5);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    canvasRef.current = renderer.domElement;
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x111133, 1.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x4488ff, 2);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Neon point lights
    const neonBlue = new THREE.PointLight(0x00d4ff, 3, 15);
    neonBlue.position.set(0, 3, 0);
    scene.add(neonBlue);

    const neonPurple = new THREE.PointLight(0xaa00ff, 2, 12);
    neonPurple.position.set(0, 2, -10);
    scene.add(neonPurple);

    // Track tiles
    buildTrack(scene);

    // Lane edge lines (neon rails)
    buildRails(scene);

    // Player cube
    const playerGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
    const playerMat = new THREE.MeshStandardMaterial({
      color: 0x00d4ff,
      emissive: 0x00d4ff,
      emissiveIntensity: 1.2,
      roughness: 0.2,
      metalness: 0.8,
    });
    const player = new THREE.Mesh(playerGeo, playerMat);
    player.position.set(LANES[1], PLAYER_Y_GROUND, 0);
    player.castShadow = true;
    scene.add(player);
    playerMeshRef.current = player;

    // Player glow light
    const playerLight = new THREE.PointLight(0x00d4ff, 2, 4);
    player.add(playerLight);

    // Grid floor lines
    buildGridLines(scene);

    // Stars
    buildStars(scene);
  }, []);

  const buildTrack = (scene: THREE.Scene) => {
    const tileGeo = new THREE.BoxGeometry(LANE_WIDTH * 3 + 1, 0.2, TRACK_TILE_LENGTH);
    const tileMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a2a,
      emissive: 0x0a0a2a,
      emissiveIntensity: 0.3,
      roughness: 0.9,
      metalness: 0.1,
    });

    for (let i = 0; i < TRACK_TILE_COUNT; i++) {
      const tile = new THREE.Mesh(tileGeo, tileMat);
      tile.position.set(0, -0.1, -i * TRACK_TILE_LENGTH + TRACK_TILE_LENGTH / 2);
      tile.receiveShadow = true;
      scene.add(tile);
      trackTilesRef.current.push(tile);
    }
  };

  const buildRails = (scene: THREE.Scene) => {
    const railMat = new THREE.MeshStandardMaterial({
      color: 0x00d4ff,
      emissive: 0x00d4ff,
      emissiveIntensity: 2,
    });
    const railGeo = new THREE.BoxGeometry(0.05, 0.05, 200);

    const offsets = [-LANE_WIDTH * 1.5 - 0.5, -LANE_WIDTH * 0.5, LANE_WIDTH * 0.5, LANE_WIDTH * 1.5 + 0.5];
    offsets.forEach(x => {
      const rail = new THREE.Mesh(railGeo, railMat);
      rail.position.set(x, 0, -90);
      scene.add(rail);
    });
  };

  const buildGridLines = (scene: THREE.Scene) => {
    const lineMat = new THREE.LineBasicMaterial({ color: 0x1a1a4a, transparent: true, opacity: 0.6 });
    for (let z = 0; z > -200; z -= 2) {
      const points = [
        new THREE.Vector3(-LANE_WIDTH * 1.5 - 0.5, 0, z),
        new THREE.Vector3(LANE_WIDTH * 1.5 + 0.5, 0, z),
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      scene.add(new THREE.Line(geo, lineMat));
    }
  };

  const buildStars = (scene: THREE.Scene) => {
    const starGeo = new THREE.BufferGeometry();
    const positions: number[] = [];
    for (let i = 0; i < 300; i++) {
      positions.push(
        (Math.random() - 0.5) * 100,
        Math.random() * 30 + 5,
        Math.random() * -200
      );
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.15, transparent: true, opacity: 0.8 });
    scene.add(new THREE.Points(starGeo, starMat));
  };

  // ─── Spawn Obstacle ─────────────────────────────────────────────────────
  const spawnObstacle = useCallback(() => {
    if (!sceneRef.current) return;

    const lane = Math.floor(Math.random() * 3); // 0, 1, 2
    const height = 0.5 + Math.random() * 0.8;
    const width = 0.8 + Math.random() * 0.4;

    const geo = new THREE.BoxGeometry(width, height, width);
    const colors = [0xff0066, 0xffaa00, 0xaa00ff, 0xff3300];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 1.0,
      roughness: 0.3,
      metalness: 0.7,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(LANES[lane], height / 2, -40);
    mesh.castShadow = true;

    // Glow light on obstacle
    const light = new THREE.PointLight(color, 1.5, 5);
    mesh.add(light);

    sceneRef.current.add(mesh);
    obstaclesRef.current.push({ mesh, lane });
  }, []);

  // ─── Reset Game ─────────────────────────────────────────────────────────
  const resetGame = useCallback(() => {
    // Clear obstacles
    obstaclesRef.current.forEach(o => {
      sceneRef.current?.remove(o.mesh);
      o.mesh.geometry.dispose();
      (o.mesh.material as THREE.Material).dispose();
    });
    obstaclesRef.current = [];

    // Reset player
    playerLaneRef.current = 1;
    playerTargetXRef.current = LANES[1];
    playerYRef.current = PLAYER_Y_GROUND;
    playerVYRef.current = 0;
    isJumpingRef.current = false;

    if (playerMeshRef.current) {
      playerMeshRef.current.position.set(LANES[1], PLAYER_Y_GROUND, 0);
    }

    // Reset game vars
    scoreRef.current = 0;
    speedRef.current = INITIAL_SPEED;
    spawnTimerRef.current = 0;
    elapsedRef.current = 0;
    lastTimeRef.current = 0;
    keysRef.current = {};
    keyProcessedRef.current = {};

    setScore(0);
    gameStateRef.current = 'playing';
    setGameState('playing');
  }, []);

  // ─── Game Loop ──────────────────────────────────────────────────────────
  const gameLoop = useCallback((timestamp: number) => {
    animFrameRef.current = requestAnimationFrame(gameLoop);

    if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !playerMeshRef.current) return;

    const delta = lastTimeRef.current === 0 ? 0.016 : Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = timestamp;

    if (gameStateRef.current === 'playing') {
      elapsedRef.current += delta;

      // Increase speed over time
      speedRef.current = INITIAL_SPEED + elapsedRef.current * SPEED_INCREMENT;

      // Score
      scoreRef.current += delta * 10 * (speedRef.current / INITIAL_SPEED);
      if (Math.floor(scoreRef.current) % 5 === 0) {
        setScore(Math.floor(scoreRef.current));
      }

      // ── Player lateral movement ──
      const keys = keysRef.current;
      if ((keys['ArrowLeft'] || keys['a'] || keys['A']) && !keyProcessedRef.current['left']) {
        if (playerLaneRef.current > 0) {
          playerLaneRef.current--;
          playerTargetXRef.current = LANES[playerLaneRef.current];
        }
        keyProcessedRef.current['left'] = true;
      }
      if (!(keys['ArrowLeft'] || keys['a'] || keys['A'])) {
        keyProcessedRef.current['left'] = false;
      }

      if ((keys['ArrowRight'] || keys['d'] || keys['D']) && !keyProcessedRef.current['right']) {
        if (playerLaneRef.current < 2) {
          playerLaneRef.current++;
          playerTargetXRef.current = LANES[playerLaneRef.current];
        }
        keyProcessedRef.current['right'] = true;
      }
      if (!(keys['ArrowRight'] || keys['d'] || keys['D'])) {
        keyProcessedRef.current['right'] = false;
      }

      // ── Jump ──
      if ((keys[' '] || keys['ArrowUp'] || keys['w'] || keys['W']) && !isJumpingRef.current && !keyProcessedRef.current['jump']) {
        playerVYRef.current = JUMP_VELOCITY;
        isJumpingRef.current = true;
        keyProcessedRef.current['jump'] = true;
      }
      if (!(keys[' '] || keys['ArrowUp'] || keys['w'] || keys['W'])) {
        keyProcessedRef.current['jump'] = false;
      }

      // ── Physics ──
      if (isJumpingRef.current) {
        playerVYRef.current += GRAVITY * delta;
        playerYRef.current += playerVYRef.current * delta;
        if (playerYRef.current <= PLAYER_Y_GROUND) {
          playerYRef.current = PLAYER_Y_GROUND;
          playerVYRef.current = 0;
          isJumpingRef.current = false;
        }
      }

      // ── Update player mesh ──
      const player = playerMeshRef.current;
      player.position.x += (playerTargetXRef.current - player.position.x) * Math.min(delta * 12, 1);
      player.position.y = playerYRef.current;
      player.rotation.y += delta * 1.5;

      // ── Camera follow ──
      const cam = cameraRef.current;
      const targetCamX = player.position.x * 0.3;
      cam.position.x += (targetCamX - cam.position.x) * Math.min(delta * 8, 1);
      cam.lookAt(player.position.x * 0.2, 1, -5);

      // ── Scroll track tiles ──
      trackTilesRef.current.forEach(tile => {
        tile.position.z += speedRef.current * delta;
        if (tile.position.z > TRACK_TILE_LENGTH * 1.5) {
          tile.position.z -= TRACK_TILE_COUNT * TRACK_TILE_LENGTH;
        }
      });

      // ── Spawn obstacles ──
      spawnTimerRef.current += delta;
      const spawnInterval = OBSTACLE_SPAWN_INTERVAL * (INITIAL_SPEED / speedRef.current);
      if (spawnTimerRef.current >= spawnInterval) {
        spawnTimerRef.current = 0;
        spawnObstacle();
      }

      // ── Move & cull obstacles ──
      const toRemove: Obstacle[] = [];
      obstaclesRef.current.forEach(obs => {
        obs.mesh.position.z += speedRef.current * delta;
        obs.mesh.rotation.y += delta * 2;

        if (obs.mesh.position.z > 5) {
          toRemove.push(obs);
        }
      });

      toRemove.forEach(obs => {
        sceneRef.current!.remove(obs.mesh);
        obs.mesh.geometry.dispose();
        (obs.mesh.material as THREE.Material).dispose();
        obstaclesRef.current = obstaclesRef.current.filter(o => o !== obs);
      });

      // ── Collision detection ──
      const playerBox = new THREE.Box3().setFromObject(player);
      // Shrink player box slightly to reduce false positives
      playerBox.min.addScalar(0.1);
      playerBox.max.addScalar(-0.1);

      for (const obs of obstaclesRef.current) {
        const obsBox = new THREE.Box3().setFromObject(obs.mesh);
        if (playerBox.intersectsBox(obsBox)) {
          // Game over
          gameStateRef.current = 'gameover';
          setFinalScore(Math.floor(scoreRef.current));
          setScore(Math.floor(scoreRef.current));
          setGameState('gameover');
          break;
        }
      }
    }

    rendererRef.current.render(sceneRef.current, cameraRef.current);
  }, [spawnObstacle]);

  // ─── Keyboard handlers ──────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key] = true;
      // Prevent page scroll
      if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // ─── Resize handler ─────────────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      rendererRef.current.setSize(w, h);
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ─── Mount / Unmount ────────────────────────────────────────────────────
  useEffect(() => {
    initThree();
    animFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (canvasRef.current && mountRef.current?.contains(canvasRef.current)) {
          mountRef.current.removeChild(canvasRef.current);
        }
      }
      obstaclesRef.current.forEach(o => {
        o.mesh.geometry.dispose();
        (o.mesh.material as THREE.Material).dispose();
      });
    };
  }, [initThree, gameLoop]);

  // ─── Touch / Button controls ────────────────────────────────────────────
  const handleMoveLeft = useCallback(() => {
    if (gameStateRef.current !== 'playing') return;
    if (playerLaneRef.current > 0) {
      playerLaneRef.current--;
      playerTargetXRef.current = LANES[playerLaneRef.current];
    }
  }, []);

  const handleMoveRight = useCallback(() => {
    if (gameStateRef.current !== 'playing') return;
    if (playerLaneRef.current < 2) {
      playerLaneRef.current++;
      playerTargetXRef.current = LANES[playerLaneRef.current];
    }
  }, []);

  const handleJump = useCallback(() => {
    if (gameStateRef.current !== 'playing') return;
    if (!isJumpingRef.current) {
      playerVYRef.current = JUMP_VELOCITY;
      isJumpingRef.current = true;
    }
  }, []);

  const handleStart = useCallback(() => {
    resetGame();
  }, [resetGame]);

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-screen bg-gray-950 overflow-hidden flex flex-col">
      {/* Back button */}
      <button
        onClick={() => navigate({ to: '/' })}
        className="absolute top-4 left-4 z-30 flex items-center gap-2 px-3 py-2 rounded-lg border border-neon-blue/40 bg-gray-950/80 text-neon-blue font-orbitron text-xs font-bold tracking-widest uppercase hover:bg-neon-blue/20 transition-all duration-200"
      >
        ← Back
      </button>

      {/* Score HUD */}
      {gameState === 'playing' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 text-center pointer-events-none">
          <div
            className="font-orbitron font-black text-2xl text-neon-blue tracking-widest"
            style={{ textShadow: '0 0 20px rgba(0,212,255,0.9), 0 0 40px rgba(0,212,255,0.5)' }}
          >
            {score.toString().padStart(5, '0')}
          </div>
          <div className="font-rajdhani text-gray-500 text-xs uppercase tracking-widest mt-0.5">Score</div>
        </div>
      )}

      {/* Three.js mount */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full" />

      {/* Idle / Start screen */}
      {gameState === 'idle' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-950/85 backdrop-blur-sm">
          <div
            className="font-orbitron font-black text-5xl md:text-6xl text-neon-blue mb-2 tracking-widest uppercase"
            style={{ textShadow: '0 0 30px rgba(0,212,255,1), 0 0 60px rgba(0,212,255,0.5)' }}
          >
            ENDLESS
          </div>
          <div
            className="font-orbitron font-black text-3xl md:text-4xl text-neon-purple mb-8 tracking-widest uppercase"
            style={{ textShadow: '0 0 20px rgba(170,0,255,0.9)' }}
          >
            RUNNER
          </div>
          <div className="font-rajdhani text-gray-400 text-sm mb-2 text-center px-6">
            Dodge obstacles. Survive as long as you can.
          </div>
          <div className="font-rajdhani text-gray-500 text-xs mb-8 text-center px-6">
            ← → Arrow keys to move &nbsp;|&nbsp; Space / ↑ to jump
          </div>
          <button
            onClick={handleStart}
            className="font-orbitron font-bold text-sm px-10 py-4 rounded-lg border-2 border-neon-blue text-neon-blue uppercase tracking-widest hover:bg-neon-blue/20 hover:shadow-[0_0_30px_rgba(0,212,255,0.6)] transition-all duration-200 active:scale-95"
          >
            START GAME
          </button>
        </div>
      )}

      {/* Game Over overlay */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-950/90 backdrop-blur-sm">
          <div
            className="font-orbitron font-black text-5xl md:text-6xl text-red-400 mb-2 tracking-widest uppercase"
            style={{ textShadow: '0 0 30px rgba(248,113,113,0.9), 0 0 60px rgba(248,113,113,0.4)' }}
          >
            GAME
          </div>
          <div
            className="font-orbitron font-black text-5xl md:text-6xl text-red-400 mb-8 tracking-widest uppercase"
            style={{ textShadow: '0 0 30px rgba(248,113,113,0.9), 0 0 60px rgba(248,113,113,0.4)' }}
          >
            OVER
          </div>
          <div className="font-rajdhani text-gray-400 text-sm uppercase tracking-widest mb-2">Final Score</div>
          <div
            className="font-orbitron font-black text-4xl text-neon-blue mb-10 tracking-widest"
            style={{ textShadow: '0 0 20px rgba(0,212,255,0.9)' }}
          >
            {finalScore.toString().padStart(5, '0')}
          </div>
          <button
            onClick={handleStart}
            className="font-orbitron font-bold text-sm px-10 py-4 rounded-lg border-2 border-neon-blue text-neon-blue uppercase tracking-widest hover:bg-neon-blue/20 hover:shadow-[0_0_30px_rgba(0,212,255,0.6)] transition-all duration-200 active:scale-95"
          >
            RESTART
          </button>
        </div>
      )}

      {/* Mobile touch controls */}
      {gameState === 'playing' && (
        <div className="absolute bottom-6 left-0 right-0 z-30 flex items-center justify-between px-6 pointer-events-none">
          {/* Left button */}
          <button
            onPointerDown={handleMoveLeft}
            className="pointer-events-auto w-16 h-16 rounded-xl border-2 border-neon-blue/60 bg-gray-950/70 text-neon-blue text-2xl font-bold flex items-center justify-center active:bg-neon-blue/30 active:scale-95 transition-all select-none"
            style={{ boxShadow: '0 0 15px rgba(0,212,255,0.3)' }}
            aria-label="Move Left"
          >
            ◀
          </button>

          {/* Jump button */}
          <button
            onPointerDown={handleJump}
            className="pointer-events-auto w-20 h-20 rounded-full border-2 border-neon-purple/70 bg-gray-950/70 text-neon-purple text-sm font-orbitron font-bold flex items-center justify-center active:bg-neon-purple/30 active:scale-95 transition-all select-none uppercase tracking-widest"
            style={{ boxShadow: '0 0 20px rgba(170,0,255,0.4)' }}
            aria-label="Jump"
          >
            JUMP
          </button>

          {/* Right button */}
          <button
            onPointerDown={handleMoveRight}
            className="pointer-events-auto w-16 h-16 rounded-xl border-2 border-neon-blue/60 bg-gray-950/70 text-neon-blue text-2xl font-bold flex items-center justify-center active:bg-neon-blue/30 active:scale-95 transition-all select-none"
            style={{ boxShadow: '0 0 15px rgba(0,212,255,0.3)' }}
            aria-label="Move Right"
          >
            ▶
          </button>
        </div>
      )}
    </div>
  );
};

export default EndlessRunnerGame;

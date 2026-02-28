import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import * as THREE from 'three';
import { useHighwayRushSound } from '../hooks/useHighwayRushSound';
import { awardXP, recordGameStart, unlockAchievement } from '../utils/achievements';

// ─── Constants ────────────────────────────────────────────────────────────────
const LANE_POSITIONS = [-3.5, 0, 3.5];
const NUM_LANES = 3;
const ROAD_WIDTH = 10;
const ROAD_SEGMENT_LENGTH = 30;
const NUM_ROAD_SEGMENTS = 8;
const INITIAL_SPEED = 12;
const MAX_SPEED = 60;
const SPEED_INCREMENT = 0.8; // per second
const TRAFFIC_SPAWN_INTERVAL_BASE = 1.8; // seconds
const COIN_SPAWN_INTERVAL = 2.5;
const NEAR_MISS_DISTANCE = 1.2;
const DIFFICULTY_INTERVAL = 30; // seconds
const DAY_NIGHT_CYCLE = 60; // seconds

const LS_HIGH_SCORE = 'highwayRush_highScore';
const LS_COINS = 'highwayRush_coins';
const LS_SKIN = 'highwayRush_selectedSkin';
const LS_UNLOCKED_SKINS = 'highwayRush_unlockedSkins';

// ─── Car Skins ────────────────────────────────────────────────────────────────
interface CarSkin {
  id: string;
  name: string;
  color: number;
  emissive: number;
  price: number;
}

const CAR_SKINS: CarSkin[] = [
  { id: 'default', name: 'Neon Blue', color: 0x0088ff, emissive: 0x0044aa, price: 0 },
  { id: 'red_racer', name: 'Red Racer', color: 0xff2200, emissive: 0x880000, price: 50 },
  { id: 'neon_green', name: 'Neon Green', color: 0x00ff88, emissive: 0x00aa44, price: 100 },
  { id: 'gold_rush', name: 'Gold Rush', color: 0xffcc00, emissive: 0xaa8800, price: 200 },
  { id: 'phantom', name: 'Phantom', color: 0xaa00ff, emissive: 0x550088, price: 300 },
];

// ─── Traffic Car Colors ───────────────────────────────────────────────────────
const TRAFFIC_COLORS = [0xff4444, 0xffaa00, 0x44ff88, 0xff44ff, 0x44aaff, 0xffffff, 0xff8800];

// ─── Types ────────────────────────────────────────────────────────────────────
interface TrafficCar {
  mesh: THREE.Group;
  lane: number;
  z: number;
  speed: number;
  passed: boolean;
  nearMissed: boolean;
}

interface Coin {
  mesh: THREE.Mesh;
  lane: number;
  z: number;
  collected: boolean;
}

interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
}

type GamePhase = 'menu' | 'skins' | 'playing' | 'paused' | 'gameOver' | 'interstitial';

// ─── Helper: load from localStorage ──────────────────────────────────────────
function lsGet(key: string, fallback: string): string {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
function lsSet(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch {}
}

// ─── Build car mesh ───────────────────────────────────────────────────────────
function buildCarMesh(color: number, emissive: number, isPlayer = false): THREE.Group {
  const group = new THREE.Group();

  // Body
  const bodyGeo = new THREE.BoxGeometry(1.6, 0.6, 3.2);
  const bodyMat = new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: 0.4, roughness: 0.3, metalness: 0.8 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.5;
  body.castShadow = true;
  group.add(body);

  // Cabin
  const cabinGeo = new THREE.BoxGeometry(1.3, 0.5, 1.8);
  const cabinMat = new THREE.MeshStandardMaterial({ color: 0x111122, emissive: 0x001133, emissiveIntensity: 0.3, roughness: 0.5, metalness: 0.5 });
  const cabin = new THREE.Mesh(cabinGeo, cabinMat);
  cabin.position.set(0, 1.05, -0.2);
  group.add(cabin);

  // Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 12);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
  const wheelPositions = [[-0.9, 0.3, 1.1], [0.9, 0.3, 1.1], [-0.9, 0.3, -1.1], [0.9, 0.3, -1.1]];
  wheelPositions.forEach(([x, y, z]) => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, y, z);
    group.add(wheel);
  });

  // Headlights / taillights
  if (isPlayer) {
    const headlightGeo = new THREE.BoxGeometry(0.3, 0.15, 0.05);
    const headlightMat = new THREE.MeshStandardMaterial({ color: 0xffffee, emissive: 0xffffee, emissiveIntensity: 3 });
    [-0.55, 0.55].forEach(x => {
      const hl = new THREE.Mesh(headlightGeo, headlightMat);
      hl.position.set(x, 0.5, 1.65);
      group.add(hl);
    });
    const headLight = new THREE.SpotLight(0xffffee, 3, 20, Math.PI / 6, 0.5);
    headLight.position.set(0, 1, 2);
    headLight.target.position.set(0, 0, 10);
    group.add(headLight);
    group.add(headLight.target);
  } else {
    // Taillights for traffic
    const tailGeo = new THREE.BoxGeometry(0.3, 0.15, 0.05);
    const tailMat = new THREE.MeshStandardMaterial({ color: 0xff2200, emissive: 0xff2200, emissiveIntensity: 2 });
    [-0.55, 0.55].forEach(x => {
      const tl = new THREE.Mesh(tailGeo, tailMat);
      tl.position.set(x, 0.5, 1.65);
      group.add(tl);
    });
  }

  return group;
}

// ─── Build coin mesh ──────────────────────────────────────────────────────────
function buildCoinMesh(): THREE.Mesh {
  const geo = new THREE.TorusGeometry(0.35, 0.12, 8, 16);
  const mat = new THREE.MeshStandardMaterial({ color: 0xffcc00, emissive: 0xffaa00, emissiveIntensity: 1.5, roughness: 0.2, metalness: 0.9 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HighwayRushGame() {
  const navigate = useNavigate();
  const mountRef = useRef<HTMLDivElement>(null);
  const sound = useHighwayRushSound();
  const soundRef = useRef(sound);
  soundRef.current = sound;

  // ── Game phase state ──
  const [phase, setPhase] = useState<GamePhase>('menu');
  const phaseRef = useRef<GamePhase>('menu');

  // ── HUD state ──
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => parseInt(lsGet(LS_HIGH_SCORE, '0')));
  const [coins, setCoins] = useState(() => parseInt(lsGet(LS_COINS, '0')));
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [difficulty, setDifficulty] = useState(1);
  const [nearMissMsg, setNearMissMsg] = useState(false);
  const [diffMsg, setDiffMsg] = useState(false);
  const [selectedSkin, setSelectedSkin] = useState(() => lsGet(LS_SKIN, 'default'));
  const [unlockedSkins, setUnlockedSkins] = useState<string[]>(() => {
    try { return JSON.parse(lsGet(LS_UNLOCKED_SKINS, '["default"]')); } catch { return ['default']; }
  });
  const [sessionCoins, setSessionCoins] = useState(0);

  // ── Three.js refs ──
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const playerCarRef = useRef<THREE.Group | null>(null);
  const roadSegmentsRef = useRef<THREE.Mesh[]>([]);
  const laneMarkingsRef = useRef<THREE.Mesh[]>([]);
  const trafficCarsRef = useRef<TrafficCar[]>([]);
  const coinsRef = useRef<Coin[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const skyColorRef = useRef<THREE.Color>(new THREE.Color(0x87ceeb));
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // ── Game logic refs ──
  const scoreRef = useRef(0);
  const speedRef = useRef(INITIAL_SPEED);
  const elapsedRef = useRef(0);
  const difficultyRef = useRef(1);
  const trafficSpawnTimerRef = useRef(0);
  const coinSpawnTimerRef = useRef(0);
  const dayNightTimerRef = useRef(0);
  const playerLaneRef = useRef(1);
  const playerTargetXRef = useRef(LANE_POSITIONS[1]);
  const keysRef = useRef<Set<string>>(new Set());
  const keyProcessedRef = useRef<Set<string>>(new Set());
  const shakeRef = useRef(0);
  const slowMoRef = useRef(1);
  const sessionCoinsRef = useRef(0);
  const coinsRef2 = useRef(parseInt(lsGet(LS_COINS, '0')));

  // ── Sync phase ref ──
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // ─── Init Three.js ──────────────────────────────────────────────────────────
  const initThree = useCallback(() => {
    if (!mountRef.current) return;
    const W = mountRef.current.clientWidth;
    const H = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.018);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 300);
    camera.position.set(0, 5, 12);
    camera.lookAt(0, 0, -5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambient);
    ambientLightRef.current = ambient;

    const dirLight = new THREE.DirectionalLight(0xfff5e0, 2.5);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    // Road
    buildRoad(scene);

    // Scenery
    buildScenery(scene);

    // Player car
    const skin = CAR_SKINS.find(s => s.id === lsGet(LS_SKIN, 'default')) || CAR_SKINS[0];
    const playerCar = buildCarMesh(skin.color, skin.emissive, true);
    playerCar.position.set(LANE_POSITIONS[1], 0, 0);
    scene.add(playerCar);
    playerCarRef.current = playerCar;

    // Resize handler
    const onResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const buildRoad = (scene: THREE.Scene) => {
    // Road surface
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x333340, roughness: 0.9, metalness: 0.1 });
    for (let i = 0; i < NUM_ROAD_SEGMENTS; i++) {
      const geo = new THREE.BoxGeometry(ROAD_WIDTH, 0.1, ROAD_SEGMENT_LENGTH);
      const mesh = new THREE.Mesh(geo, roadMat);
      mesh.position.set(0, -0.05, -i * ROAD_SEGMENT_LENGTH + ROAD_SEGMENT_LENGTH / 2);
      mesh.receiveShadow = true;
      scene.add(mesh);
      roadSegmentsRef.current.push(mesh);
    }

    // Road edges (curbs)
    const curbMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.8 });
    [-ROAD_WIDTH / 2 - 0.3, ROAD_WIDTH / 2 + 0.3].forEach(x => {
      const geo = new THREE.BoxGeometry(0.5, 0.2, ROAD_SEGMENT_LENGTH * NUM_ROAD_SEGMENTS);
      const mesh = new THREE.Mesh(geo, curbMat);
      mesh.position.set(x, 0, -ROAD_SEGMENT_LENGTH * NUM_ROAD_SEGMENTS / 2);
      scene.add(mesh);
    });

    // Lane markings
    buildLaneMarkings(scene);
  };

  const buildLaneMarkings = (scene: THREE.Scene) => {
    const dashMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5 });
    const totalLength = ROAD_SEGMENT_LENGTH * NUM_ROAD_SEGMENTS;
    const dashLength = 2;
    const dashGap = 3;
    const dashStep = dashLength + dashGap;

    // Center dashes between lanes
    [-1.75, 1.75].forEach(x => {
      for (let z = 0; z > -totalLength; z -= dashStep) {
        const geo = new THREE.BoxGeometry(0.12, 0.12, dashLength);
        const mesh = new THREE.Mesh(geo, dashMat);
        mesh.position.set(x, 0.06, z - dashLength / 2);
        scene.add(mesh);
        laneMarkingsRef.current.push(mesh);
      }
    });

    // Solid side lines
    const sideMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.3 });
    [-ROAD_WIDTH / 2 + 0.3, ROAD_WIDTH / 2 - 0.3].forEach(x => {
      const geo = new THREE.BoxGeometry(0.12, 0.12, totalLength);
      const mesh = new THREE.Mesh(geo, sideMat);
      mesh.position.set(x, 0.06, -totalLength / 2);
      scene.add(mesh);
    });
  };

  const buildScenery = (scene: THREE.Scene) => {
    // Trees on sides
    const treeMat = new THREE.MeshStandardMaterial({ color: 0x228833, roughness: 0.9 });
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x664422, roughness: 1 });
    for (let i = 0; i < 30; i++) {
      const z = -i * 15 - 5;
      [-8, 8].forEach(side => {
        const x = side + (Math.random() - 0.5) * 3;
        const trunkGeo = new THREE.CylinderGeometry(0.15, 0.2, 1.5, 6);
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.set(x, 0.75, z);
        scene.add(trunk);

        const topGeo = new THREE.ConeGeometry(0.8 + Math.random() * 0.4, 2 + Math.random(), 6);
        const top = new THREE.Mesh(topGeo, treeMat);
        top.position.set(x, 2.5, z);
        scene.add(top);
      });
    }
  };

  // ─── Spawn traffic car ──────────────────────────────────────────────────────
  const spawnTrafficCar = useCallback(() => {
    if (!sceneRef.current) return;

    // Pick a random lane, avoid clustering
    const existingLanes = trafficCarsRef.current
      .filter(c => c.z < -20 && c.z > -35)
      .map(c => c.lane);

    let lane = Math.floor(Math.random() * NUM_LANES);
    // Try to avoid same lane as recent cars
    for (let attempt = 0; attempt < 5; attempt++) {
      if (!existingLanes.includes(lane)) break;
      lane = Math.floor(Math.random() * NUM_LANES);
    }

    const colorIdx = Math.floor(Math.random() * TRAFFIC_COLORS.length);
    const color = TRAFFIC_COLORS[colorIdx];
    const carMesh = buildCarMesh(color, color >> 1, false);
    carMesh.rotation.y = Math.PI; // facing player
    carMesh.position.set(LANE_POSITIONS[lane], 0, -50);

    sceneRef.current.add(carMesh);
    trafficCarsRef.current.push({
      mesh: carMesh,
      lane,
      z: -50,
      speed: speedRef.current * (0.3 + Math.random() * 0.4),
      passed: false,
      nearMissed: false,
    });
  }, []);

  // ─── Spawn coin ─────────────────────────────────────────────────────────────
  const spawnCoin = useCallback(() => {
    if (!sceneRef.current) return;
    const lane = Math.floor(Math.random() * NUM_LANES);
    const coinMesh = buildCoinMesh();
    coinMesh.position.set(LANE_POSITIONS[lane], 0.8, -45);
    sceneRef.current.add(coinMesh);
    coinsRef.current.push({ mesh: coinMesh, lane, z: -45, collected: false });
  }, []);

  // ─── Spawn crash particles ──────────────────────────────────────────────────
  const spawnCrashParticles = useCallback((x: number, y: number, z: number) => {
    if (!sceneRef.current) return;
    const colors = [0xff4400, 0xff8800, 0xffcc00, 0xff0000, 0xffffff];
    for (let i = 0; i < 30; i++) {
      const geo = new THREE.SphereGeometry(0.1 + Math.random() * 0.15, 4, 4);
      const mat = new THREE.MeshStandardMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        emissive: 0xff4400,
        emissiveIntensity: 2,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      sceneRef.current.add(mesh);
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 6;
      particlesRef.current.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy: 3 + Math.random() * 5,
        vz: Math.sin(angle) * speed,
        life: 1,
      });
    }
  }, []);

  // ─── Reset game ─────────────────────────────────────────────────────────────
  const resetGame = useCallback(() => {
    // Clear traffic
    trafficCarsRef.current.forEach(c => {
      sceneRef.current?.remove(c.mesh);
    });
    trafficCarsRef.current = [];

    // Clear coins
    coinsRef.current.forEach(c => {
      sceneRef.current?.remove(c.mesh);
    });
    coinsRef.current = [];

    // Clear particles
    particlesRef.current.forEach(p => {
      sceneRef.current?.remove(p.mesh);
    });
    particlesRef.current = [];

    // Reset player
    playerLaneRef.current = 1;
    playerTargetXRef.current = LANE_POSITIONS[1];
    if (playerCarRef.current) {
      playerCarRef.current.position.set(LANE_POSITIONS[1], 0, 0);
    }

    // Reset game vars
    scoreRef.current = 0;
    speedRef.current = INITIAL_SPEED;
    elapsedRef.current = 0;
    difficultyRef.current = 1;
    trafficSpawnTimerRef.current = 0;
    coinSpawnTimerRef.current = 0;
    dayNightTimerRef.current = 0;
    shakeRef.current = 0;
    slowMoRef.current = 1;
    sessionCoinsRef.current = 0;
    lastTimeRef.current = 0;
    keysRef.current.clear();
    keyProcessedRef.current.clear();

    setScore(0);
    setSpeed(INITIAL_SPEED);
    setDifficulty(1);
    setSessionCoins(0);
  }, []);

  // ─── Game Over ──────────────────────────────────────────────────────────────
  const triggerGameOver = useCallback((finalScore: number) => {
    soundRef.current.stopEngine();
    soundRef.current.stopBackgroundMusic();
    soundRef.current.playCrash();

    // Save high score
    const hs = parseInt(lsGet(LS_HIGH_SCORE, '0'));
    if (finalScore > hs) {
      lsSet(LS_HIGH_SCORE, String(finalScore));
      setHighScore(finalScore);
    }

    // Save coins
    const totalCoins = coinsRef2.current + sessionCoinsRef.current;
    lsSet(LS_COINS, String(totalCoins));
    setCoins(totalCoins);
    coinsRef2.current = totalCoins;

    // XP & achievements
    recordGameStart();
    awardXP(Math.floor(finalScore / 10));
    if (finalScore >= 1000) unlockAchievement('highway_1000');
    if (finalScore >= 5000) unlockAchievement('highway_5000');
    if (finalScore >= 10000) unlockAchievement('highway_10000');

    setPhase('gameOver');
  }, []);

  // ─── Game Loop ──────────────────────────────────────────────────────────────
  const gameLoop = useCallback((timestamp: number) => {
    animFrameRef.current = requestAnimationFrame(gameLoop);

    if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !playerCarRef.current) return;

    const rawDelta = lastTimeRef.current === 0 ? 0.016 : Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = timestamp;

    // Render even when not playing
    if (phaseRef.current !== 'playing') {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      return;
    }

    const delta = rawDelta * slowMoRef.current;
    elapsedRef.current += delta;

    // ── Speed & difficulty ──
    speedRef.current = Math.min(INITIAL_SPEED + elapsedRef.current * SPEED_INCREMENT, MAX_SPEED);
    const newDiff = Math.floor(elapsedRef.current / DIFFICULTY_INTERVAL) + 1;
    if (newDiff > difficultyRef.current) {
      difficultyRef.current = newDiff;
      setDifficulty(newDiff);
      setDiffMsg(true);
      setTimeout(() => setDiffMsg(false), 2500);
    }

    // ── Score ──
    scoreRef.current += delta * speedRef.current * 0.5;
    setScore(Math.floor(scoreRef.current));
    setSpeed(Math.floor(speedRef.current));

    // ── Engine sound ──
    soundRef.current.updateEngineSpeed(speedRef.current);

    // ── Slow-mo decay ──
    if (slowMoRef.current < 1) {
      slowMoRef.current = Math.min(1, slowMoRef.current + rawDelta * 0.8);
    }

    // ── Player lane switching ──
    const keys = keysRef.current;
    if ((keys.has('ArrowLeft') || keys.has('KeyA')) && !keyProcessedRef.current.has('left')) {
      if (playerLaneRef.current > 0) {
        playerLaneRef.current--;
        playerTargetXRef.current = LANE_POSITIONS[playerLaneRef.current];
      }
      keyProcessedRef.current.add('left');
    }
    if (!(keys.has('ArrowLeft') || keys.has('KeyA'))) keyProcessedRef.current.delete('left');

    if ((keys.has('ArrowRight') || keys.has('KeyD')) && !keyProcessedRef.current.has('right')) {
      if (playerLaneRef.current < NUM_LANES - 1) {
        playerLaneRef.current++;
        playerTargetXRef.current = LANE_POSITIONS[playerLaneRef.current];
      }
      keyProcessedRef.current.add('right');
    }
    if (!(keys.has('ArrowRight') || keys.has('KeyD'))) keyProcessedRef.current.delete('right');

    // ── Player position lerp ──
    const player = playerCarRef.current;
    player.position.x += (playerTargetXRef.current - player.position.x) * Math.min(delta * 10, 1);

    // ── Camera follow with shake ──
    const cam = cameraRef.current;
    const shakeX = shakeRef.current > 0 ? (Math.random() - 0.5) * shakeRef.current * 0.5 : 0;
    const shakeY = shakeRef.current > 0 ? (Math.random() - 0.5) * shakeRef.current * 0.3 : 0;
    if (shakeRef.current > 0) shakeRef.current = Math.max(0, shakeRef.current - rawDelta * 8);
    cam.position.x += (player.position.x * 0.3 + shakeX - cam.position.x) * Math.min(delta * 6, 1);
    cam.position.y = 5 + shakeY;
    cam.lookAt(player.position.x * 0.2, 0, -5);

    // ── Scroll road ──
    const roadSpeed = speedRef.current * delta;
    roadSegmentsRef.current.forEach(seg => {
      seg.position.z += roadSpeed;
      if (seg.position.z > ROAD_SEGMENT_LENGTH * 1.5) {
        seg.position.z -= NUM_ROAD_SEGMENTS * ROAD_SEGMENT_LENGTH;
      }
    });
    laneMarkingsRef.current.forEach(mark => {
      mark.position.z += roadSpeed;
      if (mark.position.z > 5) {
        mark.position.z -= NUM_ROAD_SEGMENTS * ROAD_SEGMENT_LENGTH;
      }
    });

    // ── Day/night cycle ──
    dayNightTimerRef.current += delta;
    const cyclePhase = (dayNightTimerRef.current % DAY_NIGHT_CYCLE) / DAY_NIGHT_CYCLE;
    const isNight = cyclePhase > 0.5;
    const t = isNight ? (cyclePhase - 0.5) * 2 : cyclePhase * 2;
    const dayColor = new THREE.Color(0x87ceeb);
    const nightColor = new THREE.Color(0x050520);
    const currentSky = dayColor.clone().lerp(nightColor, isNight ? t : 1 - t);
    sceneRef.current.background = currentSky;
    sceneRef.current.fog = new THREE.FogExp2(currentSky.getHex(), 0.018);
    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = isNight ? 0.3 + (1 - t) * 0.9 : 0.3 + t * 0.9;
    }
    if (dirLightRef.current) {
      dirLightRef.current.intensity = isNight ? 0.2 + (1 - t) * 2.3 : 0.2 + t * 2.3;
    }

    // ── Spawn traffic ──
    trafficSpawnTimerRef.current += delta;
    const spawnInterval = TRAFFIC_SPAWN_INTERVAL_BASE / (1 + (difficultyRef.current - 1) * 0.3);
    if (trafficSpawnTimerRef.current >= spawnInterval) {
      trafficSpawnTimerRef.current = 0;
      spawnTrafficCar();
      // Extra car at higher difficulties
      if (difficultyRef.current >= 3 && Math.random() < 0.4) spawnTrafficCar();
    }

    // ── Spawn coins ──
    coinSpawnTimerRef.current += delta;
    if (coinSpawnTimerRef.current >= COIN_SPAWN_INTERVAL) {
      coinSpawnTimerRef.current = 0;
      spawnCoin();
    }

    // ── Move traffic ──
    const toRemoveTraffic: TrafficCar[] = [];
    for (const car of trafficCarsRef.current) {
      car.z += (speedRef.current + car.speed) * delta;
      car.mesh.position.z = car.z;

      // Near-miss check
      if (!car.passed && !car.nearMissed && car.z > -2 && car.z < 3) {
        const dx = Math.abs(player.position.x - LANE_POSITIONS[car.lane]);
        if (dx < NEAR_MISS_DISTANCE * 2 && dx > 0.8) {
          car.nearMissed = true;
          scoreRef.current += 50;
          soundRef.current.playNearMiss();
          setNearMissMsg(true);
          setTimeout(() => setNearMissMsg(false), 1200);
          slowMoRef.current = 0.4;
          setTimeout(() => { slowMoRef.current = 1; }, 800);
        }
      }
      if (car.z > 5) {
        car.passed = true;
        toRemoveTraffic.push(car);
      }
    }
    toRemoveTraffic.forEach(car => {
      sceneRef.current!.remove(car.mesh);
      trafficCarsRef.current = trafficCarsRef.current.filter(c => c !== car);
    });

    // ── Move coins ──
    const toRemoveCoins: Coin[] = [];
    for (const coin of coinsRef.current) {
      coin.z += speedRef.current * delta;
      coin.mesh.position.z = coin.z;
      coin.mesh.rotation.z += delta * 3;
      if (coin.z > 5) toRemoveCoins.push(coin);
    }
    toRemoveCoins.forEach(coin => {
      sceneRef.current!.remove(coin.mesh);
      coinsRef.current = coinsRef.current.filter(c => c !== coin);
    });

    // ── Update particles ──
    const toRemoveParticles: Particle[] = [];
    for (const p of particlesRef.current) {
      p.mesh.position.x += p.vx * rawDelta;
      p.mesh.position.y += p.vy * rawDelta;
      p.mesh.position.z += p.vz * rawDelta;
      p.vy -= 9.8 * rawDelta;
      p.life -= rawDelta * 1.5;
      (p.mesh.material as THREE.MeshStandardMaterial).opacity = Math.max(0, p.life);
      (p.mesh.material as THREE.MeshStandardMaterial).transparent = true;
      if (p.life <= 0) toRemoveParticles.push(p);
    }
    toRemoveParticles.forEach(p => {
      sceneRef.current!.remove(p.mesh);
      particlesRef.current = particlesRef.current.filter(x => x !== p);
    });

    // ── Collision detection ──
    const playerBox = new THREE.Box3().setFromObject(player);
    playerBox.min.addScalar(0.2);
    playerBox.max.addScalar(-0.2);

    for (const car of trafficCarsRef.current) {
      if (car.z < -5 || car.z > 4) continue;
      const carBox = new THREE.Box3().setFromObject(car.mesh);
      if (playerBox.intersectsBox(carBox)) {
        spawnCrashParticles(player.position.x, player.position.y + 0.5, player.position.z);
        shakeRef.current = 3;
        slowMoRef.current = 0.2;
        const finalScore = Math.floor(scoreRef.current);
        setTimeout(() => triggerGameOver(finalScore), 600);
        phaseRef.current = 'gameOver';
        setPhase('gameOver');
        return;
      }
    }

    // ── Coin collection ──
    for (const coin of coinsRef.current) {
      if (coin.collected) continue;
      if (coin.z < -3 || coin.z > 3) continue;
      const dx = Math.abs(player.position.x - LANE_POSITIONS[coin.lane]);
      const dz = Math.abs(coin.z - player.position.z);
      if (dx < 1.2 && dz < 1.5) {
        coin.collected = true;
        sceneRef.current!.remove(coin.mesh);
        coinsRef.current = coinsRef.current.filter(c => c !== coin);
        sessionCoinsRef.current++;
        setSessionCoins(prev => prev + 1);
        soundRef.current.playCoin();
        scoreRef.current += 25;
      }
    }

    rendererRef.current.render(sceneRef.current, cameraRef.current);
  }, [spawnTrafficCar, spawnCoin, spawnCrashParticles, triggerGameOver]);

  // ─── Mount Three.js ─────────────────────────────────────────────────────────
  useEffect(() => {
    const cleanup = initThree();
    animFrameRef.current = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      cleanup?.();
    };
  }, [initThree, gameLoop]);

  // ─── Keyboard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.code);
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.key)) {
        e.preventDefault();
      }
      if (e.code === 'Escape') {
        if (phaseRef.current === 'playing') {
          setPhase('paused');
          soundRef.current.stopEngine();
          soundRef.current.stopBackgroundMusic();
        } else if (phaseRef.current === 'paused') {
          setPhase('playing');
          soundRef.current.startEngine();
          soundRef.current.startBackgroundMusic();
        }
      }
    };
    const onUp = (e: KeyboardEvent) => keysRef.current.delete(e.code);
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  // ─── Actions ────────────────────────────────────────────────────────────────
  const handlePlay = useCallback(() => {
    soundRef.current.playClick();
    resetGame();
    setPhase('playing');
    soundRef.current.startEngine();
    soundRef.current.startBackgroundMusic();
  }, [resetGame]);

  const handlePause = useCallback(() => {
    soundRef.current.playClick();
    setPhase('paused');
    soundRef.current.stopEngine();
    soundRef.current.stopBackgroundMusic();
  }, []);

  const handleResume = useCallback(() => {
    soundRef.current.playClick();
    setPhase('playing');
    soundRef.current.startEngine();
    soundRef.current.startBackgroundMusic();
  }, []);

  const handleRestart = useCallback(() => {
    soundRef.current.playClick();
    soundRef.current.stopEngine();
    soundRef.current.stopBackgroundMusic();
    resetGame();
    setPhase('playing');
    soundRef.current.startEngine();
    soundRef.current.startBackgroundMusic();
  }, [resetGame]);

  const handleMainMenu = useCallback(() => {
    soundRef.current.playClick();
    soundRef.current.stopEngine();
    soundRef.current.stopBackgroundMusic();
    resetGame();
    setPhase('menu');
  }, [resetGame]);

  const handleInterstitialDone = useCallback(() => {
    soundRef.current.playClick();
    setPhase('menu');
  }, []);

  const handleExtraLife = useCallback(() => {
    soundRef.current.playClick();
    // Rewarded ad placeholder: just restart
    handleRestart();
  }, [handleRestart]);

  const handleBuySkin = useCallback((skinId: string) => {
    soundRef.current.playClick();
    const skin = CAR_SKINS.find(s => s.id === skinId);
    if (!skin) return;
    const currentCoins = coinsRef2.current;
    if (currentCoins < skin.price) return;
    const newCoins = currentCoins - skin.price;
    coinsRef2.current = newCoins;
    lsSet(LS_COINS, String(newCoins));
    setCoins(newCoins);
    const newUnlocked = [...unlockedSkins, skinId];
    setUnlockedSkins(newUnlocked);
    lsSet(LS_UNLOCKED_SKINS, JSON.stringify(newUnlocked));
  }, [unlockedSkins]);

  const handleSelectSkin = useCallback((skinId: string) => {
    soundRef.current.playClick();
    setSelectedSkin(skinId);
    lsSet(LS_SKIN, skinId);
    // Update player car color
    if (playerCarRef.current) {
      const skin = CAR_SKINS.find(s => s.id === skinId);
      if (skin) {
        playerCarRef.current.traverse(child => {
          if (child instanceof THREE.Mesh) {
            const mat = child.material as THREE.MeshStandardMaterial;
            if (mat.color && mat.color.getHex() !== 0x111122 && mat.color.getHex() !== 0x222222) {
              mat.color.setHex(skin.color);
              mat.emissive.setHex(skin.emissive);
            }
          }
        });
      }
    }
  }, []);

  const handleTouchLeft = useCallback(() => {
    if (phaseRef.current !== 'playing') return;
    if (playerLaneRef.current > 0) {
      playerLaneRef.current--;
      playerTargetXRef.current = LANE_POSITIONS[playerLaneRef.current];
    }
  }, []);

  const handleTouchRight = useCallback(() => {
    if (phaseRef.current !== 'playing') return;
    if (playerLaneRef.current < NUM_LANES - 1) {
      playerLaneRef.current++;
      playerTargetXRef.current = LANE_POSITIONS[playerLaneRef.current];
    }
  }, []);

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
      {/* Three.js mount */}
      <div ref={mountRef} className="absolute inset-0" />

      {/* ── MAIN MENU ── */}
      {phase === 'menu' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-10">
          {/* Banner Ad Placeholder */}
          <div className="absolute bottom-0 left-0 right-0 h-14 bg-gray-900/80 border-t border-gray-700 flex items-center justify-center">
            <span className="text-gray-500 text-xs font-mono">[ BANNER AD PLACEHOLDER ]</span>
          </div>

          <div className="text-center px-4 max-w-lg w-full">
            <div className="text-6xl mb-2">🏎️</div>
            <h1 className="font-orbitron text-5xl font-black text-yellow-400 mb-1" style={{ textShadow: '0 0 20px #facc15, 0 0 40px #f59e0b' }}>
              HIGHWAY RUSH
            </h1>
            <p className="font-rajdhani text-gray-300 text-lg mb-6">Dodge traffic at high speeds. How far can you go?</p>

            <div className="flex gap-3 justify-center mb-4">
              <div className="bg-gray-800/80 border border-yellow-500/30 rounded-xl px-4 py-2 text-center">
                <div className="text-yellow-400 font-orbitron text-lg font-bold">{highScore}</div>
                <div className="text-gray-400 text-xs font-rajdhani">BEST SCORE</div>
              </div>
              <div className="bg-gray-800/80 border border-yellow-500/30 rounded-xl px-4 py-2 text-center">
                <div className="text-yellow-400 font-orbitron text-lg font-bold">{coins}</div>
                <div className="text-gray-400 text-xs font-rajdhani">COINS</div>
              </div>
            </div>

            <div className="flex flex-col gap-3 mb-4">
              <button
                onClick={handlePlay}
                className="w-full py-4 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-orbitron font-black text-xl transition-all hover:scale-105 active:scale-95 shadow-lg"
                style={{ boxShadow: '0 0 20px rgba(234,179,8,0.5)' }}
              >
                🚀 PLAY NOW
              </button>
              <button
                onClick={() => { soundRef.current.playClick(); setPhase('skins'); }}
                className="w-full py-3 rounded-xl bg-gray-800 hover:bg-gray-700 border border-yellow-500/40 text-yellow-400 font-orbitron font-bold text-sm transition-all hover:scale-105"
              >
                🎨 CAR SKINS
              </button>
              <button
                onClick={() => navigate({ to: '/' })}
                className="w-full py-2 rounded-xl bg-transparent border border-gray-600 text-gray-400 font-rajdhani text-sm hover:border-gray-400 transition-all"
              >
                ← Back to Arcade
              </button>
            </div>

            <div className="text-gray-500 text-xs font-rajdhani">
              Arrow Keys / A-D to switch lanes • Avoid traffic • Collect coins
            </div>
          </div>
        </div>
      )}

      {/* ── SKINS SCREEN ── */}
      {phase === 'skins' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10 p-4">
          <div className="bg-gray-900 border border-yellow-500/30 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-orbitron text-2xl font-bold text-yellow-400">CAR SKINS</h2>
              <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-1">
                <span className="text-yellow-400">🪙</span>
                <span className="text-yellow-400 font-orbitron font-bold">{coins}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {CAR_SKINS.map(skin => {
                const isUnlocked = unlockedSkins.includes(skin.id);
                const isSelected = selectedSkin === skin.id;
                const canAfford = coins >= skin.price;
                return (
                  <div
                    key={skin.id}
                    className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-yellow-400 bg-yellow-500/10'
                        : 'border-gray-700 bg-gray-800/50 hover:border-gray-500'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex-shrink-0"
                      style={{ backgroundColor: `#${skin.color.toString(16).padStart(6, '0')}`, boxShadow: `0 0 10px #${skin.color.toString(16).padStart(6, '0')}` }}
                    />
                    <div className="flex-1">
                      <div className="font-orbitron text-sm font-bold text-white">{skin.name}</div>
                      {skin.price > 0 && (
                        <div className="text-yellow-400 text-xs font-rajdhani">🪙 {skin.price} coins</div>
                      )}
                      {skin.price === 0 && <div className="text-green-400 text-xs font-rajdhani">FREE</div>}
                    </div>
                    {isSelected ? (
                      <span className="text-yellow-400 font-orbitron text-xs font-bold">ACTIVE</span>
                    ) : isUnlocked ? (
                      <button
                        onClick={() => handleSelectSkin(skin.id)}
                        className="px-3 py-1 rounded-lg bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 font-orbitron text-xs hover:bg-yellow-500/30 transition-all"
                      >
                        SELECT
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBuySkin(skin.id)}
                        disabled={!canAfford}
                        className={`px-3 py-1 rounded-lg font-orbitron text-xs transition-all ${
                          canAfford
                            ? 'bg-yellow-500 text-black hover:bg-yellow-400'
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        BUY
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => { soundRef.current.playClick(); setPhase('menu'); }}
              className="w-full mt-4 py-3 rounded-xl bg-gray-800 border border-gray-600 text-gray-300 font-orbitron text-sm hover:bg-gray-700 transition-all"
            >
              ← BACK
            </button>
          </div>
        </div>
      )}

      {/* ── PLAYING HUD ── */}
      {phase === 'playing' && (
        <>
          {/* Top HUD */}
          <div className="absolute top-0 left-0 right-0 flex items-start justify-between p-3 z-10 pointer-events-none">
            <div className="flex flex-col gap-1">
              <div className="bg-black/60 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-yellow-500/30">
                <div className="text-yellow-400 font-orbitron text-xl font-black">{score.toLocaleString()}</div>
                <div className="text-gray-400 text-xs font-rajdhani">SCORE</div>
              </div>
              <div className="bg-black/60 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-gray-600/30">
                <div className="text-gray-300 font-orbitron text-sm font-bold">{highScore.toLocaleString()}</div>
                <div className="text-gray-500 text-xs font-rajdhani">BEST</div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-1">
              {/* Speed meter */}
              <div className="bg-black/60 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-blue-500/30 text-center">
                <div className="text-blue-400 font-orbitron text-lg font-black">{speed}</div>
                <div className="text-gray-400 text-xs font-rajdhani">KM/H</div>
              </div>
              <div className="bg-black/60 backdrop-blur-sm rounded-xl px-2 py-1 border border-orange-500/30 text-center">
                <div className="text-orange-400 font-orbitron text-xs font-bold">LVL {difficulty}</div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <div className="bg-black/60 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-yellow-500/30">
                <div className="text-yellow-400 font-orbitron text-lg font-black">🪙 {sessionCoins}</div>
                <div className="text-gray-400 text-xs font-rajdhani">COINS</div>
              </div>
              {/* Mute & Pause buttons */}
              <div className="flex gap-2 pointer-events-auto">
                <button
                  onClick={() => soundRef.current.toggleMute()}
                  className="bg-black/60 backdrop-blur-sm rounded-lg p-2 border border-gray-600/40 text-gray-300 hover:text-white transition-all text-sm"
                >
                  {sound.muted ? '🔇' : '🔊'}
                </button>
                <button
                  onClick={handlePause}
                  className="bg-black/60 backdrop-blur-sm rounded-lg p-2 border border-gray-600/40 text-gray-300 hover:text-white transition-all text-sm"
                >
                  ⏸
                </button>
              </div>
            </div>
          </div>

          {/* Near miss notification */}
          {nearMissMsg && (
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
              <div className="font-orbitron text-2xl font-black text-yellow-300 animate-bounce" style={{ textShadow: '0 0 20px #facc15' }}>
                ⚡ NEAR MISS! +50
              </div>
            </div>
          )}

          {/* Difficulty notification */}
          {diffMsg && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
              <div className="font-orbitron text-xl font-black text-red-400 text-center animate-pulse" style={{ textShadow: '0 0 20px #f87171' }}>
                🔥 DIFFICULTY UP!<br />
                <span className="text-base">Level {difficulty}</span>
              </div>
            </div>
          )}

          {/* Mobile touch controls */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-between px-6 z-10 md:hidden">
            <button
              onTouchStart={handleTouchLeft}
              onClick={handleTouchLeft}
              className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/30 text-white text-3xl flex items-center justify-center active:bg-white/20 transition-all"
            >
              ◀
            </button>
            <button
              onTouchStart={handleTouchRight}
              onClick={handleTouchRight}
              className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/30 text-white text-3xl flex items-center justify-center active:bg-white/20 transition-all"
            >
              ▶
            </button>
          </div>
        </>
      )}

      {/* ── PAUSED ── */}
      {phase === 'paused' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-10">
          <div className="bg-gray-900 border border-yellow-500/40 rounded-2xl p-8 text-center max-w-sm w-full mx-4">
            <div className="text-5xl mb-3">⏸</div>
            <h2 className="font-orbitron text-3xl font-black text-yellow-400 mb-2">PAUSED</h2>
            <div className="text-gray-400 font-rajdhani mb-6">Score: <span className="text-white font-bold">{score.toLocaleString()}</span></div>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleResume}
                className="w-full py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-orbitron font-black text-lg transition-all hover:scale-105"
              >
                ▶ RESUME
              </button>
              <button
                onClick={handleRestart}
                className="w-full py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-orbitron font-bold text-sm transition-all"
              >
                🔄 RESTART
              </button>
              <button
                onClick={handleMainMenu}
                className="w-full py-2 rounded-xl bg-transparent border border-gray-600 text-gray-400 font-rajdhani text-sm hover:border-gray-400 transition-all"
              >
                ← Main Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── GAME OVER ── */}
      {phase === 'gameOver' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10">
          {/* Banner Ad Placeholder */}
          <div className="absolute bottom-0 left-0 right-0 h-14 bg-gray-900/80 border-t border-gray-700 flex items-center justify-center">
            <span className="text-gray-500 text-xs font-mono">[ BANNER AD PLACEHOLDER ]</span>
          </div>

          <div className="bg-gray-900 border border-red-500/40 rounded-2xl p-6 max-w-sm w-full mx-4 mb-16">
            <div className="text-5xl mb-2 text-center">💥</div>
            <h2 className="font-orbitron text-3xl font-black text-red-400 text-center mb-4" style={{ textShadow: '0 0 20px #f87171' }}>
              GAME OVER
            </h2>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-800 rounded-xl p-3 text-center">
                <div className="text-white font-orbitron text-xl font-black">{score.toLocaleString()}</div>
                <div className="text-gray-400 text-xs font-rajdhani">SCORE</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-3 text-center">
                <div className="text-yellow-400 font-orbitron text-xl font-black">{highScore.toLocaleString()}</div>
                <div className="text-gray-400 text-xs font-rajdhani">BEST</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-3 text-center">
                <div className="text-yellow-400 font-orbitron text-xl font-black">🪙 {sessionCoins}</div>
                <div className="text-gray-400 text-xs font-rajdhani">COINS EARNED</div>
              </div>
              <div className="bg-gray-800 rounded-xl p-3 text-center">
                <div className="text-blue-400 font-orbitron text-xl font-black">{difficulty}</div>
                <div className="text-gray-400 text-xs font-rajdhani">MAX LEVEL</div>
              </div>
            </div>

            {score >= highScore && score > 0 && (
              <div className="text-center text-yellow-400 font-orbitron text-sm font-bold mb-3 animate-pulse">
                🏆 NEW HIGH SCORE!
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={handleRestart}
                className="w-full py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-orbitron font-black text-lg transition-all hover:scale-105"
                style={{ boxShadow: '0 0 15px rgba(234,179,8,0.4)' }}
              >
                🔄 PLAY AGAIN
              </button>

              {/* Rewarded Ad Placeholder */}
              <button
                onClick={handleExtraLife}
                className="w-full py-3 rounded-xl bg-green-800/50 border border-green-500/50 text-green-400 font-orbitron font-bold text-sm transition-all hover:bg-green-800/70 flex items-center justify-center gap-2"
              >
                📺 WATCH AD FOR EXTRA LIFE
              </button>

              <button
                onClick={() => { soundRef.current.playClick(); setPhase('interstitial'); }}
                className="w-full py-2 rounded-xl bg-transparent border border-gray-600 text-gray-400 font-rajdhani text-sm hover:border-gray-400 transition-all"
              >
                ← Main Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── INTERSTITIAL AD ── */}
      {phase === 'interstitial' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
          <div className="text-center max-w-sm w-full mx-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 mb-4">
              <div className="text-gray-500 text-xs font-mono mb-2">[ INTERSTITIAL AD PLACEHOLDER ]</div>
              <div className="w-full h-40 bg-gray-800 rounded-xl flex items-center justify-center mb-4">
                <span className="text-gray-600 font-mono text-sm">AD CONTENT HERE</span>
              </div>
              <div className="text-gray-400 font-rajdhani text-sm">Advertisement</div>
            </div>
            <button
              onClick={handleInterstitialDone}
              className="w-full py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-orbitron font-black text-lg transition-all"
            >
              CONTINUE →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

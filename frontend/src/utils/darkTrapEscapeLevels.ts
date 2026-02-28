// Level definitions for Dark Trap Escape
// Each level has platforms, hazards, spawn point, and exit door

export type PlatformType = 'static' | 'fake' | 'moving' | 'hidden_trap';
export type HazardType = 'spike' | 'surprise_trap' | 'crusher';

export interface Platform {
  id: string;
  type: PlatformType;
  x: number;
  y: number;
  width: number;
  height: number;
  // For moving platforms
  moveAxis?: 'x' | 'y';
  moveMin?: number;
  moveMax?: number;
  moveSpeed?: number;
  // For fake platforms (fall delay in ms)
  fallDelay?: number;
  // Color override
  color?: string;
}

export interface Hazard {
  id: string;
  type: HazardType;
  x: number;
  y: number;
  width: number;
  height: number;
  // For surprise traps: trigger radius
  triggerRadius?: number;
  // For crushers: move axis and range
  moveAxis?: 'x' | 'y';
  moveMin?: number;
  moveMax?: number;
  moveSpeed?: number;
}

export interface ExitDoor {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LevelData {
  levelNumber: number;
  worldWidth: number;
  worldHeight: number;
  spawnPoint: { x: number; y: number };
  exitDoor: ExitDoor;
  platforms: Platform[];
  hazards: Hazard[];
  bgColor: string;
}

// World is 2400x900 for most levels, player is 28x36
const LEVELS: LevelData[] = [
  // ─── LEVEL 1 ─── Tutorial: simple static platforms, one spike
  {
    levelNumber: 1,
    worldWidth: 2400,
    worldHeight: 900,
    spawnPoint: { x: 80, y: 700 },
    exitDoor: { x: 2280, y: 620, width: 50, height: 80 },
    bgColor: '#050510',
    platforms: [
      { id: 'ground', type: 'static', x: 0, y: 800, width: 2400, height: 40 },
      { id: 'p1', type: 'static', x: 200, y: 700, width: 160, height: 20 },
      { id: 'p2', type: 'static', x: 450, y: 620, width: 160, height: 20 },
      { id: 'p3', type: 'static', x: 700, y: 540, width: 160, height: 20 },
      { id: 'p4', type: 'static', x: 950, y: 620, width: 160, height: 20 },
      { id: 'p5', type: 'static', x: 1200, y: 700, width: 200, height: 20 },
      { id: 'p6', type: 'static', x: 1500, y: 620, width: 160, height: 20 },
      { id: 'p7', type: 'static', x: 1750, y: 540, width: 160, height: 20 },
      { id: 'p8', type: 'static', x: 2000, y: 620, width: 200, height: 20 },
      { id: 'p9', type: 'static', x: 2200, y: 700, width: 200, height: 20 },
    ],
    hazards: [
      { id: 'sp1', type: 'spike', x: 850, y: 780, width: 30, height: 20 },
    ],
  },

  // ─── LEVEL 2 ─── Introduce fake platforms
  {
    levelNumber: 2,
    worldWidth: 2400,
    worldHeight: 900,
    spawnPoint: { x: 80, y: 700 },
    exitDoor: { x: 2280, y: 580, width: 50, height: 80 },
    bgColor: '#050510',
    platforms: [
      { id: 'ground', type: 'static', x: 0, y: 800, width: 400, height: 40 },
      { id: 'ground2', type: 'static', x: 2000, y: 800, width: 400, height: 40 },
      { id: 'p1', type: 'static', x: 200, y: 680, width: 140, height: 20 },
      { id: 'p2', type: 'fake', x: 420, y: 600, width: 120, height: 20, fallDelay: 600 },
      { id: 'p3', type: 'static', x: 620, y: 520, width: 140, height: 20 },
      { id: 'p4', type: 'fake', x: 840, y: 600, width: 120, height: 20, fallDelay: 500 },
      { id: 'p5', type: 'static', x: 1040, y: 680, width: 140, height: 20 },
      { id: 'p6', type: 'fake', x: 1260, y: 580, width: 120, height: 20, fallDelay: 700 },
      { id: 'p7', type: 'static', x: 1460, y: 500, width: 140, height: 20 },
      { id: 'p8', type: 'fake', x: 1680, y: 580, width: 120, height: 20, fallDelay: 400 },
      { id: 'p9', type: 'static', x: 1880, y: 660, width: 140, height: 20 },
      { id: 'p10', type: 'static', x: 2100, y: 580, width: 200, height: 20 },
      { id: 'p11', type: 'static', x: 2200, y: 660, width: 200, height: 20 },
    ],
    hazards: [
      { id: 'sp1', type: 'spike', x: 560, y: 780, width: 30, height: 20 },
      { id: 'sp2', type: 'spike', x: 980, y: 780, width: 30, height: 20 },
    ],
  },

  // ─── LEVEL 3 ─── Moving platforms
  {
    levelNumber: 3,
    worldWidth: 2400,
    worldHeight: 900,
    spawnPoint: { x: 80, y: 700 },
    exitDoor: { x: 2280, y: 560, width: 50, height: 80 },
    bgColor: '#050510',
    platforms: [
      { id: 'ground', type: 'static', x: 0, y: 800, width: 300, height: 40 },
      { id: 'ground2', type: 'static', x: 2100, y: 800, width: 300, height: 40 },
      { id: 'p1', type: 'static', x: 150, y: 680, width: 140, height: 20 },
      { id: 'mp1', type: 'moving', x: 380, y: 620, width: 120, height: 20, moveAxis: 'x', moveMin: 380, moveMax: 580, moveSpeed: 1.5 },
      { id: 'p2', type: 'static', x: 680, y: 540, width: 140, height: 20 },
      { id: 'mp2', type: 'moving', x: 900, y: 620, width: 120, height: 20, moveAxis: 'y', moveMin: 500, moveMax: 680, moveSpeed: 1.2 },
      { id: 'p3', type: 'static', x: 1100, y: 700, width: 140, height: 20 },
      { id: 'mp3', type: 'moving', x: 1320, y: 560, width: 120, height: 20, moveAxis: 'x', moveMin: 1320, moveMax: 1560, moveSpeed: 2 },
      { id: 'p4', type: 'static', x: 1660, y: 480, width: 140, height: 20 },
      { id: 'mp4', type: 'moving', x: 1880, y: 600, width: 120, height: 20, moveAxis: 'y', moveMin: 480, moveMax: 660, moveSpeed: 1.8 },
      { id: 'p5', type: 'static', x: 2080, y: 680, width: 200, height: 20 },
      { id: 'p6', type: 'static', x: 2200, y: 640, width: 200, height: 20 },
    ],
    hazards: [
      { id: 'sp1', type: 'spike', x: 600, y: 780, width: 30, height: 20 },
      { id: 'sp2', type: 'spike', x: 1000, y: 780, width: 30, height: 20 },
      { id: 'sp3', type: 'spike', x: 1580, y: 780, width: 30, height: 20 },
    ],
  },

  // ─── LEVEL 4 ─── Hidden traps introduced
  {
    levelNumber: 4,
    worldWidth: 2400,
    worldHeight: 900,
    spawnPoint: { x: 80, y: 700 },
    exitDoor: { x: 2280, y: 540, width: 50, height: 80 },
    bgColor: '#050510',
    platforms: [
      { id: 'ground', type: 'static', x: 0, y: 800, width: 2400, height: 40 },
      { id: 'p1', type: 'static', x: 150, y: 680, width: 140, height: 20 },
      { id: 'ht1', type: 'hidden_trap', x: 380, y: 620, width: 120, height: 20 },
      { id: 'p2', type: 'static', x: 580, y: 540, width: 140, height: 20 },
      { id: 'ht2', type: 'hidden_trap', x: 800, y: 620, width: 120, height: 20 },
      { id: 'p3', type: 'static', x: 1000, y: 700, width: 140, height: 20 },
      { id: 'ht3', type: 'hidden_trap', x: 1220, y: 580, width: 120, height: 20 },
      { id: 'p4', type: 'static', x: 1420, y: 500, width: 140, height: 20 },
      { id: 'p5', type: 'static', x: 1640, y: 580, width: 140, height: 20 },
      { id: 'ht4', type: 'hidden_trap', x: 1860, y: 660, width: 120, height: 20 },
      { id: 'p6', type: 'static', x: 2060, y: 580, width: 140, height: 20 },
      { id: 'p7', type: 'static', x: 2200, y: 620, width: 200, height: 20 },
    ],
    hazards: [
      { id: 'sp1', type: 'spike', x: 500, y: 780, width: 30, height: 20 },
      { id: 'sp2', type: 'spike', x: 920, y: 780, width: 30, height: 20 },
      { id: 'st1', type: 'surprise_trap', x: 1340, y: 760, width: 40, height: 40, triggerRadius: 60 },
    ],
  },

  // ─── LEVEL 5 ─── Mix of all types, tighter gaps
  {
    levelNumber: 5,
    worldWidth: 2600,
    worldHeight: 900,
    spawnPoint: { x: 80, y: 700 },
    exitDoor: { x: 2480, y: 520, width: 50, height: 80 },
    bgColor: '#050510',
    platforms: [
      { id: 'ground', type: 'static', x: 0, y: 800, width: 300, height: 40 },
      { id: 'ground2', type: 'static', x: 2300, y: 800, width: 300, height: 40 },
      { id: 'p1', type: 'static', x: 150, y: 680, width: 120, height: 20 },
      { id: 'mp1', type: 'moving', x: 360, y: 600, width: 100, height: 20, moveAxis: 'x', moveMin: 360, moveMax: 520, moveSpeed: 2 },
      { id: 'p2', type: 'fake', x: 620, y: 520, width: 100, height: 20, fallDelay: 500 },
      { id: 'ht1', type: 'hidden_trap', x: 800, y: 600, width: 100, height: 20 },
      { id: 'p3', type: 'static', x: 980, y: 520, width: 120, height: 20 },
      { id: 'mp2', type: 'moving', x: 1180, y: 600, width: 100, height: 20, moveAxis: 'y', moveMin: 480, moveMax: 660, moveSpeed: 2.2 },
      { id: 'p4', type: 'fake', x: 1380, y: 540, width: 100, height: 20, fallDelay: 400 },
      { id: 'p5', type: 'static', x: 1560, y: 460, width: 120, height: 20 },
      { id: 'ht2', type: 'hidden_trap', x: 1760, y: 540, width: 100, height: 20 },
      { id: 'mp3', type: 'moving', x: 1960, y: 620, width: 100, height: 20, moveAxis: 'x', moveMin: 1960, moveMax: 2160, moveSpeed: 2.5 },
      { id: 'p6', type: 'static', x: 2260, y: 540, width: 120, height: 20 },
      { id: 'p7', type: 'static', x: 2380, y: 600, width: 200, height: 20 },
    ],
    hazards: [
      { id: 'sp1', type: 'spike', x: 540, y: 780, width: 30, height: 20 },
      { id: 'sp2', type: 'spike', x: 900, y: 780, width: 30, height: 20 },
      { id: 'sp3', type: 'spike', x: 1480, y: 780, width: 30, height: 20 },
      { id: 'st1', type: 'surprise_trap', x: 1100, y: 760, width: 40, height: 40, triggerRadius: 55 },
      { id: 'st2', type: 'surprise_trap', x: 2080, y: 760, width: 40, height: 40, triggerRadius: 55 },
    ],
  },

  // ─── LEVEL 6 ─── Vertical challenge
  {
    levelNumber: 6,
    worldWidth: 2600,
    worldHeight: 1100,
    spawnPoint: { x: 80, y: 900 },
    exitDoor: { x: 2480, y: 200, width: 50, height: 80 },
    bgColor: '#050510',
    platforms: [
      { id: 'ground', type: 'static', x: 0, y: 1000, width: 300, height: 40 },
      { id: 'p1', type: 'static', x: 150, y: 880, width: 120, height: 20 },
      { id: 'mp1', type: 'moving', x: 360, y: 780, width: 100, height: 20, moveAxis: 'y', moveMin: 680, moveMax: 820, moveSpeed: 2 },
      { id: 'p2', type: 'fake', x: 560, y: 680, width: 100, height: 20, fallDelay: 500 },
      { id: 'p3', type: 'static', x: 740, y: 580, width: 120, height: 20 },
      { id: 'ht1', type: 'hidden_trap', x: 940, y: 480, width: 100, height: 20 },
      { id: 'mp2', type: 'moving', x: 1140, y: 560, width: 100, height: 20, moveAxis: 'x', moveMin: 1140, moveMax: 1340, moveSpeed: 2.5 },
      { id: 'p4', type: 'static', x: 1440, y: 460, width: 120, height: 20 },
      { id: 'p5', type: 'fake', x: 1640, y: 360, width: 100, height: 20, fallDelay: 400 },
      { id: 'ht2', type: 'hidden_trap', x: 1840, y: 280, width: 100, height: 20 },
      { id: 'mp3', type: 'moving', x: 2040, y: 340, width: 100, height: 20, moveAxis: 'y', moveMin: 240, moveMax: 400, moveSpeed: 3 },
      { id: 'p6', type: 'static', x: 2240, y: 240, width: 120, height: 20 },
      { id: 'p7', type: 'static', x: 2380, y: 280, width: 200, height: 20 },
    ],
    hazards: [
      { id: 'sp1', type: 'spike', x: 480, y: 980, width: 30, height: 20 },
      { id: 'sp2', type: 'spike', x: 860, y: 560, width: 30, height: 20 },
      { id: 'sp3', type: 'spike', x: 1360, y: 440, width: 30, height: 20 },
      { id: 'sp4', type: 'spike', x: 1760, y: 340, width: 30, height: 20 },
      { id: 'st1', type: 'surprise_trap', x: 660, y: 960, width: 40, height: 40, triggerRadius: 60 },
      { id: 'st2', type: 'surprise_trap', x: 1960, y: 960, width: 40, height: 40, triggerRadius: 60 },
    ],
  },

  // ─── LEVEL 7 ─── Dense hazards
  {
    levelNumber: 7,
    worldWidth: 2600,
    worldHeight: 900,
    spawnPoint: { x: 80, y: 700 },
    exitDoor: { x: 2480, y: 480, width: 50, height: 80 },
    bgColor: '#050510',
    platforms: [
      { id: 'ground', type: 'static', x: 0, y: 800, width: 200, height: 40 },
      { id: 'ground2', type: 'static', x: 2400, y: 800, width: 200, height: 40 },
      { id: 'p1', type: 'static', x: 100, y: 680, width: 100, height: 20 },
      { id: 'mp1', type: 'moving', x: 290, y: 600, width: 90, height: 20, moveAxis: 'x', moveMin: 290, moveMax: 450, moveSpeed: 2.5 },
      { id: 'ht1', type: 'hidden_trap', x: 550, y: 520, width: 90, height: 20 },
      { id: 'p2', type: 'fake', x: 730, y: 600, width: 90, height: 20, fallDelay: 350 },
      { id: 'mp2', type: 'moving', x: 920, y: 520, width: 90, height: 20, moveAxis: 'y', moveMin: 420, moveMax: 580, moveSpeed: 2.8 },
      { id: 'ht2', type: 'hidden_trap', x: 1110, y: 600, width: 90, height: 20 },
      { id: 'p3', type: 'static', x: 1300, y: 520, width: 100, height: 20 },
      { id: 'p4', type: 'fake', x: 1490, y: 440, width: 90, height: 20, fallDelay: 300 },
      { id: 'mp3', type: 'moving', x: 1680, y: 520, width: 90, height: 20, moveAxis: 'x', moveMin: 1680, moveMax: 1880, moveSpeed: 3 },
      { id: 'ht3', type: 'hidden_trap', x: 1980, y: 440, width: 90, height: 20 },
      { id: 'p5', type: 'static', x: 2170, y: 520, width: 100, height: 20 },
      { id: 'p6', type: 'static', x: 2360, y: 560, width: 200, height: 20 },
    ],
    hazards: [
      { id: 'sp1', type: 'spike', x: 460, y: 780, width: 30, height: 20 },
      { id: 'sp2', type: 'spike', x: 650, y: 780, width: 30, height: 20 },
      { id: 'sp3', type: 'spike', x: 840, y: 780, width: 30, height: 20 },
      { id: 'sp4', type: 'spike', x: 1220, y: 500, width: 30, height: 20 },
      { id: 'sp5', type: 'spike', x: 1600, y: 780, width: 30, height: 20 },
      { id: 'st1', type: 'surprise_trap', x: 1000, y: 760, width: 40, height: 40, triggerRadius: 50 },
      { id: 'st2', type: 'surprise_trap', x: 2090, y: 760, width: 40, height: 40, triggerRadius: 50 },
    ],
  },

  // ─── LEVEL 8 ─── Fast movers + many hidden traps
  {
    levelNumber: 8,
    worldWidth: 2800,
    worldHeight: 900,
    spawnPoint: { x: 80, y: 700 },
    exitDoor: { x: 2680, y: 460, width: 50, height: 80 },
    bgColor: '#050510',
    platforms: [
      { id: 'ground', type: 'static', x: 0, y: 800, width: 200, height: 40 },
      { id: 'ground2', type: 'static', x: 2600, y: 800, width: 200, height: 40 },
      { id: 'p1', type: 'static', x: 100, y: 680, width: 100, height: 20 },
      { id: 'ht1', type: 'hidden_trap', x: 290, y: 600, width: 90, height: 20 },
      { id: 'mp1', type: 'moving', x: 480, y: 520, width: 90, height: 20, moveAxis: 'x', moveMin: 480, moveMax: 680, moveSpeed: 3.5 },
      { id: 'p2', type: 'fake', x: 780, y: 600, width: 90, height: 20, fallDelay: 300 },
      { id: 'ht2', type: 'hidden_trap', x: 970, y: 520, width: 90, height: 20 },
      { id: 'mp2', type: 'moving', x: 1160, y: 600, width: 90, height: 20, moveAxis: 'y', moveMin: 460, moveMax: 640, moveSpeed: 3.2 },
      { id: 'p3', type: 'fake', x: 1360, y: 520, width: 90, height: 20, fallDelay: 250 },
      { id: 'ht3', type: 'hidden_trap', x: 1550, y: 440, width: 90, height: 20 },
      { id: 'mp3', type: 'moving', x: 1740, y: 520, width: 90, height: 20, moveAxis: 'x', moveMin: 1740, moveMax: 1980, moveSpeed: 4 },
      { id: 'p4', type: 'fake', x: 2080, y: 440, width: 90, height: 20, fallDelay: 200 },
      { id: 'ht4', type: 'hidden_trap', x: 2270, y: 520, width: 90, height: 20 },
      { id: 'p5', type: 'static', x: 2460, y: 540, width: 100, height: 20 },
      { id: 'p6', type: 'static', x: 2600, y: 540, width: 200, height: 20 },
    ],
    hazards: [
      { id: 'sp1', type: 'spike', x: 400, y: 780, width: 30, height: 20 },
      { id: 'sp2', type: 'spike', x: 700, y: 780, width: 30, height: 20 },
      { id: 'sp3', type: 'spike', x: 1080, y: 780, width: 30, height: 20 },
      { id: 'sp4', type: 'spike', x: 1280, y: 500, width: 30, height: 20 },
      { id: 'sp5', type: 'spike', x: 1660, y: 780, width: 30, height: 20 },
      { id: 'sp6', type: 'spike', x: 2000, y: 420, width: 30, height: 20 },
      { id: 'st1', type: 'surprise_trap', x: 880, y: 760, width: 40, height: 40, triggerRadius: 50 },
      { id: 'st2', type: 'surprise_trap', x: 1860, y: 760, width: 40, height: 40, triggerRadius: 50 },
      { id: 'st3', type: 'surprise_trap', x: 2380, y: 760, width: 40, height: 40, triggerRadius: 50 },
    ],
  },

  // ─── LEVEL 9 ─── Gauntlet
  {
    levelNumber: 9,
    worldWidth: 3000,
    worldHeight: 900,
    spawnPoint: { x: 80, y: 700 },
    exitDoor: { x: 2880, y: 440, width: 50, height: 80 },
    bgColor: '#050510',
    platforms: [
      { id: 'ground', type: 'static', x: 0, y: 800, width: 180, height: 40 },
      { id: 'ground2', type: 'static', x: 2820, y: 800, width: 180, height: 40 },
      { id: 'p1', type: 'static', x: 90, y: 680, width: 90, height: 20 },
      { id: 'mp1', type: 'moving', x: 270, y: 600, width: 80, height: 20, moveAxis: 'x', moveMin: 270, moveMax: 430, moveSpeed: 4 },
      { id: 'ht1', type: 'hidden_trap', x: 530, y: 520, width: 80, height: 20 },
      { id: 'p2', type: 'fake', x: 710, y: 600, width: 80, height: 20, fallDelay: 250 },
      { id: 'mp2', type: 'moving', x: 890, y: 520, width: 80, height: 20, moveAxis: 'y', moveMin: 400, moveMax: 580, moveSpeed: 3.5 },
      { id: 'ht2', type: 'hidden_trap', x: 1070, y: 440, width: 80, height: 20 },
      { id: 'p3', type: 'fake', x: 1250, y: 520, width: 80, height: 20, fallDelay: 200 },
      { id: 'mp3', type: 'moving', x: 1430, y: 440, width: 80, height: 20, moveAxis: 'x', moveMin: 1430, moveMax: 1630, moveSpeed: 4.5 },
      { id: 'ht3', type: 'hidden_trap', x: 1730, y: 360, width: 80, height: 20 },
      { id: 'p4', type: 'fake', x: 1910, y: 440, width: 80, height: 20, fallDelay: 180 },
      { id: 'mp4', type: 'moving', x: 2090, y: 520, width: 80, height: 20, moveAxis: 'y', moveMin: 380, moveMax: 560, moveSpeed: 4 },
      { id: 'ht4', type: 'hidden_trap', x: 2270, y: 440, width: 80, height: 20 },
      { id: 'p5', type: 'fake', x: 2450, y: 360, width: 80, height: 20, fallDelay: 150 },
      { id: 'p6', type: 'static', x: 2630, y: 440, width: 90, height: 20 },
      { id: 'p7', type: 'static', x: 2780, y: 520, width: 200, height: 20 },
    ],
    hazards: [
      { id: 'sp1', type: 'spike', x: 450, y: 780, width: 30, height: 20 },
      { id: 'sp2', type: 'spike', x: 630, y: 780, width: 30, height: 20 },
      { id: 'sp3', type: 'spike', x: 810, y: 780, width: 30, height: 20 },
      { id: 'sp4', type: 'spike', x: 990, y: 420, width: 30, height: 20 },
      { id: 'sp5', type: 'spike', x: 1170, y: 500, width: 30, height: 20 },
      { id: 'sp6', type: 'spike', x: 1650, y: 780, width: 30, height: 20 },
      { id: 'sp7', type: 'spike', x: 1830, y: 420, width: 30, height: 20 },
      { id: 'sp8', type: 'spike', x: 2370, y: 420, width: 30, height: 20 },
      { id: 'st1', type: 'surprise_trap', x: 350, y: 760, width: 40, height: 40, triggerRadius: 45 },
      { id: 'st2', type: 'surprise_trap', x: 1350, y: 760, width: 40, height: 40, triggerRadius: 45 },
      { id: 'st3', type: 'surprise_trap', x: 2010, y: 760, width: 40, height: 40, triggerRadius: 45 },
      { id: 'st4', type: 'surprise_trap', x: 2550, y: 760, width: 40, height: 40, triggerRadius: 45 },
    ],
  },

  // ─── LEVEL 10 ─── Final boss level — everything combined
  {
    levelNumber: 10,
    worldWidth: 3200,
    worldHeight: 900,
    spawnPoint: { x: 80, y: 700 },
    exitDoor: { x: 3080, y: 400, width: 50, height: 80 },
    bgColor: '#050510',
    platforms: [
      { id: 'ground', type: 'static', x: 0, y: 800, width: 160, height: 40 },
      { id: 'ground2', type: 'static', x: 3040, y: 800, width: 160, height: 40 },
      { id: 'p1', type: 'static', x: 80, y: 680, width: 80, height: 20 },
      { id: 'mp1', type: 'moving', x: 250, y: 600, width: 80, height: 20, moveAxis: 'x', moveMin: 250, moveMax: 420, moveSpeed: 4.5 },
      { id: 'ht1', type: 'hidden_trap', x: 520, y: 520, width: 80, height: 20 },
      { id: 'p2', type: 'fake', x: 700, y: 600, width: 80, height: 20, fallDelay: 200 },
      { id: 'mp2', type: 'moving', x: 880, y: 520, width: 80, height: 20, moveAxis: 'y', moveMin: 380, moveMax: 560, moveSpeed: 4 },
      { id: 'ht2', type: 'hidden_trap', x: 1060, y: 440, width: 80, height: 20 },
      { id: 'p3', type: 'fake', x: 1240, y: 520, width: 80, height: 20, fallDelay: 180 },
      { id: 'mp3', type: 'moving', x: 1420, y: 440, width: 80, height: 20, moveAxis: 'x', moveMin: 1420, moveMax: 1620, moveSpeed: 5 },
      { id: 'ht3', type: 'hidden_trap', x: 1720, y: 360, width: 80, height: 20 },
      { id: 'p4', type: 'fake', x: 1900, y: 440, width: 80, height: 20, fallDelay: 150 },
      { id: 'mp4', type: 'moving', x: 2080, y: 360, width: 80, height: 20, moveAxis: 'y', moveMin: 280, moveMax: 440, moveSpeed: 4.5 },
      { id: 'ht4', type: 'hidden_trap', x: 2260, y: 440, width: 80, height: 20 },
      { id: 'p5', type: 'fake', x: 2440, y: 360, width: 80, height: 20, fallDelay: 120 },
      { id: 'mp5', type: 'moving', x: 2620, y: 440, width: 80, height: 20, moveAxis: 'x', moveMin: 2620, moveMax: 2820, moveSpeed: 5.5 },
      { id: 'ht5', type: 'hidden_trap', x: 2920, y: 360, width: 80, height: 20 },
      { id: 'p6', type: 'static', x: 3000, y: 480, width: 200, height: 20 },
    ],
    hazards: [
      { id: 'sp1', type: 'spike', x: 440, y: 780, width: 30, height: 20 },
      { id: 'sp2', type: 'spike', x: 620, y: 780, width: 30, height: 20 },
      { id: 'sp3', type: 'spike', x: 800, y: 780, width: 30, height: 20 },
      { id: 'sp4', type: 'spike', x: 980, y: 420, width: 30, height: 20 },
      { id: 'sp5', type: 'spike', x: 1160, y: 500, width: 30, height: 20 },
      { id: 'sp6', type: 'spike', x: 1340, y: 780, width: 30, height: 20 },
      { id: 'sp7', type: 'spike', x: 1640, y: 420, width: 30, height: 20 },
      { id: 'sp8', type: 'spike', x: 1820, y: 420, width: 30, height: 20 },
      { id: 'sp9', type: 'spike', x: 2000, y: 340, width: 30, height: 20 },
      { id: 'sp10', type: 'spike', x: 2360, y: 340, width: 30, height: 20 },
      { id: 'sp11', type: 'spike', x: 2540, y: 780, width: 30, height: 20 },
      { id: 'sp12', type: 'spike', x: 2840, y: 340, width: 30, height: 20 },
      { id: 'st1', type: 'surprise_trap', x: 340, y: 760, width: 40, height: 40, triggerRadius: 45 },
      { id: 'st2', type: 'surprise_trap', x: 1000, y: 760, width: 40, height: 40, triggerRadius: 45 },
      { id: 'st3', type: 'surprise_trap', x: 1640, y: 760, width: 40, height: 40, triggerRadius: 45 },
      { id: 'st4', type: 'surprise_trap', x: 2200, y: 760, width: 40, height: 40, triggerRadius: 45 },
      { id: 'st5', type: 'surprise_trap', x: 2840, y: 760, width: 40, height: 40, triggerRadius: 45 },
    ],
  },
];

export default LEVELS;
export { LEVELS };

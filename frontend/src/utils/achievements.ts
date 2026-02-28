// Achievement tracking utility with localStorage persistence

export interface Achievement {
  id: string;
  title: string;
  name: string; // alias for title, kept for backward compat
  description: string;
  icon: string;
  category: "global" | "tictactoe" | "snake" | "rps" | "memory" | "runner" | "traffic" | "snakeladder" | "highway";
  unlocked: boolean;
  unlockedAt?: number;
}

const ACHIEVEMENT_LIST: Omit<Achievement, "unlocked" | "unlockedAt">[] = [
  { id: "first_game", title: "First Steps", name: "First Steps", description: "Play your first game", icon: "🎮", category: "global" },
  { id: "win_streak_3", title: "On Fire", name: "On Fire", description: "Win 3 games in a row", icon: "🔥", category: "global" },
  { id: "xp_100", title: "Level Up", name: "Level Up", description: "Earn 100 XP", icon: "⭐", category: "global" },
  { id: "xp_500", title: "Veteran", name: "Veteran", description: "Earn 500 XP", icon: "🏆", category: "global" },
  { id: "ttt_win", title: "Tic Tac Toe Master", name: "Tic Tac Toe Master", description: "Win a Tic Tac Toe game", icon: "⭕", category: "tictactoe" },
  { id: "ttt_ai_hard", title: "AI Slayer", name: "AI Slayer", description: "Beat the AI on Hard difficulty", icon: "🤖", category: "tictactoe" },
  { id: "snake_50", title: "Snake Charmer", name: "Snake Charmer", description: "Score 50 points in Snake", icon: "🐍", category: "snake" },
  { id: "snake_100", title: "Serpent King", name: "Serpent King", description: "Score 100 points in Snake", icon: "👑", category: "snake" },
  { id: "rps_win", title: "Rock Solid", name: "Rock Solid", description: "Win a Rock Paper Scissors game", icon: "✊", category: "rps" },
  { id: "rps_streak", title: "Unbeatable", name: "Unbeatable", description: "Win 5 RPS games in a row", icon: "🎯", category: "rps" },
  { id: "memory_win", title: "Memory Master", name: "Memory Master", description: "Complete a Memory Match game", icon: "🃏", category: "memory" },
  { id: "runner_100", title: "Speed Demon", name: "Speed Demon", description: "Score 100 in Endless Runner", icon: "🏃", category: "runner" },
  { id: "highway_1000", title: "Road Warrior", name: "Road Warrior", description: "Reach 1000 points in Highway Rush", icon: "🏎️", category: "highway" },
  { id: "highway_5000", title: "Highway Star", name: "Highway Star", description: "Reach 5000 points in Highway Rush", icon: "⭐", category: "highway" },
  { id: "highway_10000", title: "Untouchable", name: "Untouchable", description: "Reach 10000 points in Highway Rush", icon: "🏆", category: "highway" },
];

// Export as ACHIEVEMENT_DEFINITIONS for backward compat with useAchievementNotifications
export const ACHIEVEMENT_DEFINITIONS = ACHIEVEMENT_LIST;

const STORAGE_KEY = "achievements";
const XP_KEY = "player_xp";

type NotificationCallback = (achievement: Achievement) => void;
let notificationCallback: NotificationCallback | null = null;

export function registerNotificationCallback(cb: NotificationCallback) {
  notificationCallback = cb;
}

// Alias for backward compat
export function setNotificationCallback(cb: NotificationCallback) {
  notificationCallback = cb;
}

export function getAchievements(): Achievement[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const storedMap: Record<string, Partial<Achievement>> = stored ? JSON.parse(stored) : {};
    return ACHIEVEMENT_LIST.map(a => ({
      ...a,
      unlocked: storedMap[a.id]?.unlocked ?? false,
      unlockedAt: storedMap[a.id]?.unlockedAt,
    }));
  } catch {
    return ACHIEVEMENT_LIST.map(a => ({ ...a, unlocked: false }));
  }
}

// Alias for backward compat
export function getAllAchievements(): Achievement[] {
  return getAchievements();
}

function saveAchievements(achievements: Achievement[]) {
  const map: Record<string, Partial<Achievement>> = {};
  achievements.forEach(a => { map[a.id] = { unlocked: a.unlocked, unlockedAt: a.unlockedAt }; });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function unlockAchievement(id: string): boolean {
  const achievements = getAchievements();
  const achievement = achievements.find(a => a.id === id);
  if (!achievement || achievement.unlocked) return false;
  achievement.unlocked = true;
  achievement.unlockedAt = Date.now();
  saveAchievements(achievements);
  if (notificationCallback) notificationCallback(achievement);
  return true;
}

export function getXP(): number {
  return parseInt(localStorage.getItem(XP_KEY) || "0");
}

export function awardXP(amount: number): number {
  const current = getXP();
  const newXP = current + amount;
  localStorage.setItem(XP_KEY, String(newXP));
  if (newXP >= 100) unlockAchievement("xp_100");
  if (newXP >= 500) unlockAchievement("xp_500");
  return newXP;
}

// recordGameStart accepts optional game name for backward compat
export function recordGameStart(_game?: string) {
  unlockAchievement("first_game");
  awardXP(5);
}

export function recordWin(game: string, difficulty?: string) {
  awardXP(20);
  if (game === "tictactoe") {
    unlockAchievement("ttt_win");
    if (difficulty === "hard") unlockAchievement("ttt_ai_hard");
  }
  if (game === "rps") unlockAchievement("rps_win");
  if (game === "memory") unlockAchievement("memory_win");
}

// recordRpsResult: won can be boolean or string ('win'/'loss'/'draw'), streak is optional
export function recordRpsResult(won: boolean | string, streak?: number) {
  const isWin = won === true || won === "win";
  const isLoss = won === false || won === "loss";
  if (isWin) {
    unlockAchievement("rps_win");
    if (streak !== undefined && streak >= 5) unlockAchievement("rps_streak");
    awardXP(10);
  } else if (isLoss) {
    awardXP(2);
  } else {
    // draw
    awardXP(2);
  }
}

// recordScore: accepts (score) or (game, score) for backward compat
export function recordScore(gameOrScore: string | number, score?: number) {
  const actualScore = typeof gameOrScore === "number" ? gameOrScore : (score ?? 0);
  const game = typeof gameOrScore === "string" ? gameOrScore : "runner";
  if (game === "runner" && actualScore >= 100) unlockAchievement("runner_100");
}

export function checkSnakeLength(score: number) {
  if (score >= 50) unlockAchievement("snake_50");
  if (score >= 100) unlockAchievement("snake_100");
}

// recordSnlDiceRoll: stub for backward compat with SnakeAndLadder
export function recordSnlDiceRoll(_roll?: number) {
  // no-op, kept for backward compat
}

export function resetAchievements() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(XP_KEY);
}

// Alias for backward compat
export function resetAllAchievements() {
  resetAchievements();
}

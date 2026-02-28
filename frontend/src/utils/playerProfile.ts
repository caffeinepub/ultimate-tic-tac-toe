export interface PlayerProfile {
  username: string;
  avatarId: number;
  totalXP: number;
  level: number;
  gamesPlayed: number;
  wins: number;
  totalScore: number;
  achievementsUnlocked: number;
}

export type RankTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

const PROFILE_KEY = 'uga_player_profile';

export function getPlayerProfile(): PlayerProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PlayerProfile;
  } catch {
    return null;
  }
}

export function savePlayerProfile(profile: PlayerProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function createDefaultProfile(username: string, avatarId: number): PlayerProfile {
  return {
    username,
    avatarId,
    totalXP: 0,
    level: 1,
    gamesPlayed: 0,
    wins: 0,
    totalScore: 0,
    achievementsUnlocked: 0,
  };
}

export function getRank(level: number): RankTier {
  if (level <= 3) return 'Bronze';
  if (level <= 6) return 'Silver';
  if (level <= 10) return 'Gold';
  return 'Platinum';
}

export function getRankImagePath(rank: RankTier): string {
  return `/assets/generated/rank-${rank.toLowerCase()}.dim_64x64.png`;
}

export function getAvatarImagePath(avatarId: number): string {
  return `/assets/generated/avatar-${avatarId}.dim_128x128.png`;
}

export interface AwardXPResult {
  leveledUp: boolean;
  newLevel: number;
  oldLevel: number;
}

export function awardXP(amount: number): AwardXPResult {
  const profile = getPlayerProfile();
  if (!profile) return { leveledUp: false, newLevel: 1, oldLevel: 1 };

  const oldLevel = profile.level;
  const newTotalXP = profile.totalXP + amount;
  const newLevel = Math.floor(newTotalXP / 100) + 1;

  const updatedProfile: PlayerProfile = {
    ...profile,
    totalXP: newTotalXP,
    level: newLevel,
  };

  savePlayerProfile(updatedProfile);

  const leveledUp = newLevel > oldLevel;
  if (leveledUp) {
    window.dispatchEvent(new CustomEvent('levelup', { detail: { newLevel, oldLevel } }));
  }

  return { leveledUp, newLevel, oldLevel };
}

export function incrementGamesPlayed(): void {
  const profile = getPlayerProfile();
  if (!profile) return;
  savePlayerProfile({ ...profile, gamesPlayed: profile.gamesPlayed + 1 });
}

export function incrementWins(): void {
  const profile = getPlayerProfile();
  if (!profile) return;
  savePlayerProfile({ ...profile, wins: profile.wins + 1 });
}

export function addToTotalScore(points: number): void {
  const profile = getPlayerProfile();
  if (!profile) return;
  savePlayerProfile({ ...profile, totalScore: profile.totalScore + points });
}

export function incrementAchievementsUnlocked(): void {
  const profile = getPlayerProfile();
  if (!profile) return;
  savePlayerProfile({ ...profile, achievementsUnlocked: profile.achievementsUnlocked + 1 });
}

export function syncAchievementsCount(): void {
  const profile = getPlayerProfile();
  if (!profile) return;
  try {
    const raw = localStorage.getItem('uga_achievements');
    if (!raw) return;
    const achievements = JSON.parse(raw);
    const count = Array.isArray(achievements)
      ? achievements.filter((a: { unlocked?: boolean }) => a.unlocked).length
      : 0;
    savePlayerProfile({ ...profile, achievementsUnlocked: count });
  } catch {
    // ignore
  }
}

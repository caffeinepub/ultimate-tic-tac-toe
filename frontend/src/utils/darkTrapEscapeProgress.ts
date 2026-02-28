// Progress management for Dark Trap Escape — persists to localStorage

const STORAGE_KEY = 'darkTrapEscape_unlockedLevels';

export function getUnlockedLevels(): number[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return [1];
}

export function unlockLevel(levelNumber: number): void {
  try {
    const current = getUnlockedLevels();
    if (!current.includes(levelNumber)) {
      current.push(levelNumber);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    }
  } catch {
    // ignore
  }
}

export function isLevelUnlocked(levelNumber: number): boolean {
  return getUnlockedLevels().includes(levelNumber);
}

export function resetProgress(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([1]));
  } catch {
    // ignore
  }
}

import { useState, useCallback } from 'react';

export interface Scores {
  x: number;
  o: number;
}

export function useScoreboard() {
  const [scores, setScores] = useState<Scores>({ x: 0, o: 0 });

  const incrementScore = useCallback((player: 'X' | 'O') => {
    setScores((prev) => ({
      ...prev,
      [player.toLowerCase()]: prev[player.toLowerCase() as 'x' | 'o'] + 1,
    }));
  }, []);

  const resetScores = useCallback(() => {
    setScores({ x: 0, o: 0 });
  }, []);

  return { scores, incrementScore, resetScores };
}

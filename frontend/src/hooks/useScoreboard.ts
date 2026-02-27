import { useState, useCallback } from 'react';

export interface Scores {
  x: number;
  o: number;
}

const LS_KEY_X = 'tictactoe-score-x';
const LS_KEY_O = 'tictactoe-score-o';

function loadScores(): Scores {
  const x = parseInt(localStorage.getItem(LS_KEY_X) ?? '0', 10);
  const o = parseInt(localStorage.getItem(LS_KEY_O) ?? '0', 10);
  return {
    x: isNaN(x) ? 0 : x,
    o: isNaN(o) ? 0 : o,
  };
}

export function useScoreboard() {
  const [scores, setScores] = useState<Scores>(loadScores);

  const incrementScore = useCallback((player: 'X' | 'O') => {
    setScores((prev) => {
      const key = player.toLowerCase() as 'x' | 'o';
      const newVal = prev[key] + 1;
      const next = { ...prev, [key]: newVal };
      localStorage.setItem(player === 'X' ? LS_KEY_X : LS_KEY_O, String(newVal));
      return next;
    });
  }, []);

  const resetScores = useCallback(() => {
    localStorage.setItem(LS_KEY_X, '0');
    localStorage.setItem(LS_KEY_O, '0');
    setScores({ x: 0, o: 0 });
  }, []);

  return { scores, incrementScore, resetScores };
}

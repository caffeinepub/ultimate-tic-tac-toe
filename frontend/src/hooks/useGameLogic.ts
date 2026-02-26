import { useState, useCallback } from 'react';

export type CellValue = 'X' | 'O' | null;
export type Board = CellValue[];
export type GameStatus = 'playing' | 'won' | 'draw';

export interface GameState {
  board: Board;
  currentPlayer: 'X' | 'O';
  status: GameStatus;
  winner: CellValue;
  winningCells: number[];
}

const WINNING_COMBINATIONS = [
  [0, 1, 2], // top row
  [3, 4, 5], // middle row
  [6, 7, 8], // bottom row
  [0, 3, 6], // left column
  [1, 4, 7], // middle column
  [2, 5, 8], // right column
  [0, 4, 8], // diagonal
  [2, 4, 6], // anti-diagonal
];

function checkWinner(board: Board): { winner: CellValue; winningCells: number[] } {
  for (const combo of WINNING_COMBINATIONS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], winningCells: combo };
    }
  }
  return { winner: null, winningCells: [] };
}

function checkDraw(board: Board): boolean {
  return board.every((cell) => cell !== null);
}

const initialState: GameState = {
  board: Array(9).fill(null),
  currentPlayer: 'X',
  status: 'playing',
  winner: null,
  winningCells: [],
};

export function useGameLogic() {
  const [gameState, setGameState] = useState<GameState>(initialState);

  const makeMove = useCallback((index: number): boolean => {
    setGameState((prev) => {
      if (prev.board[index] !== null || prev.status !== 'playing') return prev;

      const newBoard = [...prev.board];
      newBoard[index] = prev.currentPlayer;

      const { winner, winningCells } = checkWinner(newBoard);

      if (winner) {
        return {
          ...prev,
          board: newBoard,
          status: 'won',
          winner,
          winningCells,
        };
      }

      if (checkDraw(newBoard)) {
        return {
          ...prev,
          board: newBoard,
          status: 'draw',
          winner: null,
          winningCells: [],
        };
      }

      return {
        ...prev,
        board: newBoard,
        currentPlayer: prev.currentPlayer === 'X' ? 'O' : 'X',
      };
    });

    return true;
  }, []);

  const resetGame = useCallback(() => {
    setGameState(initialState);
  }, []);

  const getAvailableCells = useCallback((board: Board): number[] => {
    return board.reduce<number[]>((acc, cell, idx) => {
      if (cell === null) acc.push(idx);
      return acc;
    }, []);
  }, []);

  return {
    gameState,
    makeMove,
    resetGame,
    getAvailableCells,
  };
}

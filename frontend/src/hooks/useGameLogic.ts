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

function createInitialState(): GameState {
  return {
    board: Array(9).fill(null) as CellValue[],
    currentPlayer: 'X',
    status: 'playing',
    winner: null,
    winningCells: [],
  };
}

export function useGameLogic() {
  const [gameState, setGameState] = useState<GameState>(createInitialState);

  const makeMove = useCallback((index: number): boolean => {
    let moveMade = false;

    setGameState((prev) => {
      // Validate: cell must be empty and game must be in progress
      if (prev.board[index] !== null || prev.status !== 'playing') {
        return prev;
      }

      const newBoard = [...prev.board] as CellValue[];
      newBoard[index] = prev.currentPlayer;

      const { winner, winningCells } = checkWinner(newBoard);

      if (winner) {
        moveMade = true;
        return {
          board: newBoard,
          currentPlayer: prev.currentPlayer,
          status: 'won',
          winner,
          winningCells,
        };
      }

      if (checkDraw(newBoard)) {
        moveMade = true;
        return {
          board: newBoard,
          currentPlayer: prev.currentPlayer,
          status: 'draw',
          winner: null,
          winningCells: [],
        };
      }

      moveMade = true;
      return {
        board: newBoard,
        currentPlayer: prev.currentPlayer === 'X' ? 'O' : 'X',
        status: 'playing',
        winner: null,
        winningCells: [],
      };
    });

    return moveMade;
  }, []);

  const resetGame = useCallback(() => {
    setGameState(createInitialState());
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

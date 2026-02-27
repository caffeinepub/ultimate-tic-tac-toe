export type Board = (string | null)[];

function getWinner(board: Board): string | null {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

function minimax(board: Board, isMaximizing: boolean, aiMark: string, humanMark: string): number {
  const winner = getWinner(board);
  if (winner === aiMark) return 10;
  if (winner === humanMark) return -10;
  if (board.every(cell => cell !== null)) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = aiMark;
        best = Math.max(best, minimax(board, false, aiMark, humanMark));
        board[i] = null;
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = humanMark;
        best = Math.min(best, minimax(board, true, aiMark, humanMark));
        board[i] = null;
      }
    }
    return best;
  }
}

/**
 * Returns the best move index for the AI using Minimax.
 * @param board - Current board state (9 cells, null = empty)
 * @param aiMark - The AI's mark ('X' or 'O')
 * @param humanMark - The human's mark ('X' or 'O')
 * @returns Index of the best move
 */
export function getBestMove(board: Board, aiMark: string, humanMark: string): number {
  let bestScore = -Infinity;
  let bestMove = -1;
  for (let i = 0; i < 9; i++) {
    if (board[i] === null) {
      board[i] = aiMark;
      const score = minimax(board, false, aiMark, humanMark);
      board[i] = null;
      if (score > bestScore) {
        bestScore = score;
        bestMove = i;
      }
    }
  }
  return bestMove;
}

/**
 * Returns a random valid move index.
 */
export function getRandomMove(board: Board): number {
  const empty = board.map((v, i) => (v === null ? i : -1)).filter(i => i !== -1);
  return empty[Math.floor(Math.random() * empty.length)];
}

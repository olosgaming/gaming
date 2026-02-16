/**
 * Game rules and end conditions
 */

import { Board, GameResult, PieceColor } from './types';
import { getPiecesByColor } from './board';
import { getLegalMoves } from './moves';

/**
 * Check if the game is over and determine the result
 */
export type GameResult = 'draw' | 'red-wins' | 'black-wins' | null;
export function checkGameOver(
  board: Board,
  currentPlayer: PieceColor,
  movesWithoutCapture: number
): { isOver: boolean; result: GameResult | null } {
  // Check for 50-move rule (50 moves without a capture = draw)
  if (movesWithoutCapture >= 50) {
    return { isOver: true, result: 'draw' };
  }

  // Check if current player has any legal moves
  const legalMoves = getLegalMoves(board, currentPlayer);
  if (legalMoves.length === 0) {
    const opponent = currentPlayer === 'red' ? 'black' : 'red';
  const opponentMoves = getLegalMoves(board, opponent);
  if (opponentMoves.length === 0) {
    return { isOver: true, result: 'draw' };
  }
    // Current player cannot move - opponent wins
    const winner = currentPlayer === 'red' ? 'black-wins' : 'red-wins';
    return { isOver: true, result: winner };
  }

  // Check if current player has no pieces left
  const pieces = getPiecesByColor(board, currentPlayer);
  if (pieces.length === 0) {
    const winner = currentPlayer === 'red' ? 'black-wins' : 'red-wins';
    return { isOver: true, result: winner };
  }

  // Game continues
  return { isOver: false, result: null };
}

/**
 * Check if a specific color has won
 */
export function hasWon(board: Board, color: PieceColor): boolean {
  const opponentColor = color === 'red' ? 'black' : 'red';
  const opponentPieces = getPiecesByColor(board, opponentColor);
  const opponentMoves = getLegalMoves(board, opponentColor);

  return opponentPieces.length === 0 || opponentMoves.length === 0;
}

/**
 * Check if the game is a draw
 */
export function isDraw(movesWithoutCapture: number): boolean {
  return movesWithoutCapture >= 50;
}

/**
 * Calculate game score for AI evaluation (if needed later)
 */
export function evaluatePosition(board: Board, color: PieceColor): number {
  let score = 0;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const p = board[row][col];
      if (p !== 0) {
        const isKing = p === 3 || p === 4;
        const pieceValue = isKing ? 3 : 1;
        const pieceColor = (p === 1 || p === 3) ? 'red' : 'black';
        const multiplier = pieceColor === color ? 1 : -1;
        score += pieceValue * multiplier;
      }
    }
  }

  return score;
}
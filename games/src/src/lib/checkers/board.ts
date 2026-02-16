/**
 * Board creation and utility functions
 */

import { Board, Piece, PieceColor, Position } from './types';

export const BOARD_SIZE = 8;

/**
 * Creates an initial checkers board setup
 * Black pieces on top (rows 0-2), red pieces on bottom (rows 5-7)
 */
export function createInitialBoard(): Board {
  const board: Board = Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(null));

  let pieceId = 0;

  // Place black pieces (rows 0-2)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      // Only place pieces on dark squares (checkerboard pattern)
      if ((row + col) % 2 === 1) {
        board[row][col] = {
          id: `black-${pieceId++}`,
          color: 'black',
          type: 'man',
          position: { row, col },
        };
      }
    }
  }

  pieceId = 0;

  // Place red pieces (rows 5-7)
  for (let row = 5; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if ((row + col) % 2 === 1) {
        board[row][col] = {
          id: `red-${pieceId++}`,
          color: 'red',
          type: 'man',
          position: { row, col },
        };
      }
    }
  }

  return board;
}

/**
 * Deep copy a board state
 */
export function copyBoard(board: Board): Board {
  return board.map((row) =>
    row.map((piece) => (piece ? { ...piece, position: { ...piece.position } } : null))
  );
}

/**
 * Get piece at a specific position
 */
export function getPieceAt(board: Board, pos: Position): Piece | null {
  if (!isValidPosition(pos)) return null;
  return board[pos.row][pos.col];
}

/**
 * Check if a position is within board bounds
 */
export function isValidPosition(pos: Position): boolean {
  return pos.row >= 0 && pos.row < BOARD_SIZE && pos.col >= 0 && pos.col < BOARD_SIZE;
}

/**
 * Check if two positions are equal
 */
export function positionsEqual(pos1: Position, pos2: Position): boolean {
  return pos1.row === pos2.row && pos1.col === pos2.col;
}

/**
 * Check if a square is a dark square (playable)
 */
export function isDarkSquare(pos: Position): boolean {
  return (pos.row + pos.col) % 2 === 1;
}

/**
 * Get all pieces of a specific color from the board
 */
export function getPiecesByColor(board: Board, color: PieceColor): Piece[] {
  const pieces: Piece[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        pieces.push(piece);
      }
    }
  }
  return pieces;
}

/**
 * Count pieces by color
 */
export function countPieces(board: Board): { red: number; black: number } {
  let red = 0;
  let black = 0;

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      if (piece) {
        if (piece.color === 'red') red++;
        else black++;
      }
    }
  }

  return { red, black };
}

/**
 * Get the opponent's color
 */
export function getOpponentColor(color: PieceColor): PieceColor {
  return color === 'red' ? 'black' : 'red';
}
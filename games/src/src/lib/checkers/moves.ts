/**
 * Move generation and validation logic
 * Implements official checkers rules including mandatory captures
 */

import {
  Board,
  Move,
  Piece,
  PieceColor,
  Position,
} from './types';

import {
  BOARD_SIZE,
  copyBoard,
  getPieceAt,
  getPiecesByColor,
  getOpponentColor,
  isValidPosition,
  positionsEqual,
} from './board';

// Helpers
function getPieceColor(piece: Piece): PieceColor {
  return (piece === 1 || piece === 3) ? 'red' : 'black';
}

function isKing(piece: Piece): boolean {
  return piece === 3 || piece === 4;
}

/**
 * Get all legal moves for the current player
 */
export function getLegalMoves(board: Board, color: PieceColor): Move[] {
  const positions = getPiecesByColor(board, color);
  const allCaptures: Move[] = [];
  const allNormalMoves: Move[] = [];

  for (const pos of positions) {
    const piece = getPieceAt(board, pos)!;
    const captures = getCaptureMoves(board, pos, piece);
    const normalMoves = getNormalMoves(board, pos, piece);
    allCaptures.push(...captures);
    allNormalMoves.push(...normalMoves);
  }

  return allCaptures.length > 0 ? allCaptures : allNormalMoves;
}

/**
 * Get legal moves for a specific position
 */
export function getLegalMovesForPiece(board: Board, position: Position): Move[] {
  const piece = getPieceAt(board, position);
  if (!piece) return [];

  const captures = getCaptureMoves(board, position, piece);
  if (captures.length > 0) return captures;

  return getNormalMoves(board, position, piece);
}

/**
 * Get normal (non-capture) moves for a position
 */
function getNormalMoves(board: Board, position: Position, piece: Piece): Move[] {
  const moves: Move[] = [];
  const { row, col } = position;

  const king = isKing(piece);
  const color = getPieceColor(piece);

  const directions = getMoveDirections(king, color);

  for (const [dRow, dCol] of directions) {
    const newRow = row + dRow;
    const newCol = col + dCol;
    const newPos: Position = { row: newRow, col: newCol };

    if (isValidPosition(newPos) && !getPieceAt(board, newPos)) {
      moves.push({
        from: position,
        to: newPos,
        isCapture: false,
        promotesToKing: willPromote(piece, newPos),
      });
    }
  }

  return moves;
}

/**
 * Get all possible capture moves for a position (including multi-jumps)
 */
function getCaptureMoves(board: Board, position: Position, piece: Piece): Move[] {
  const captures: Move[] = [];
  exploreCaptures(board, position, piece, [], captures);
  return captures;
}

/**
 * Recursively explore all possible capture sequences
 */
function exploreCaptures(
  board: Board,
  currentPos: Position,
  piece: Piece,
  capturedSoFar: Position[],
  allCaptures: Move[]
): void {
  const directions = getJumpDirections(isKing(piece));
  let foundCapture = false;

  for (const [dRow, dCol] of directions) {
    const jumpedRow = currentPos.row + dRow;
    const jumpedCol = currentPos.col + dCol;
    const landingRow = currentPos.row + 2 * dRow;
    const landingCol = currentPos.col + 2 * dCol;

    const jumpedPos: Position = { row: jumpedRow, col: jumpedCol };
    const landingPos: Position = { row: landingRow, col: landingCol };

    if (
      isValidPosition(jumpedPos) &&
      isValidPosition(landingPos) &&
      !isAlreadyCaptured(jumpedPos, capturedSoFar)
    ) {
      const jumpedPiece = getPieceAt(board, jumpedPos);
      const landingPiece = getPieceAt(board, landingPos);

      if (
        jumpedPiece &&
        getPieceColor(jumpedPiece) !== getPieceColor(piece) &&
        !landingPiece
      ) {
        foundCapture = true;
        const newCaptured = [...capturedSoFar, jumpedPos];

        exploreCaptures(
          board,
          landingPos,
          piece,
          newCaptured,
          allCaptures
        );
      }
    }
  }

  if (!foundCapture && capturedSoFar.length > 0) {
    allCaptures.push({
      from: currentPos,
      to: currentPos,
      capturedPieces: capturedSoFar,
      isCapture: true,
      promotesToKing: willPromote(piece, currentPos),
    });
  }
}

/**
 * Check if a position is already in the captured list
 */
function isAlreadyCaptured(pos: Position, captured: Position[]): boolean {
  return captured.some((c) => positionsEqual(c, pos));
}

/**
 * Get move directions (one square)
 */
function getMoveDirections(isKing: boolean, color: PieceColor): [number, number][] {
  if (isKing) {
    return [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];
  }
  return color === 'red' ? [
    [-1, -1],
    [-1, 1],
  ] : [
    [1, -1],
    [1, 1],
  ];
}

/**
 * Get jump directions (two squares)
 */
function getJumpDirections(isKing: boolean): [number, number][] {
  if (isKing) {
    return [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];
  }
  return [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];
}

/**
 * Check if a piece will be promoted
 */
function willPromote(piece: Piece, position: Position): boolean {
  if (isKing(piece)) return false;

  const color = getPieceColor(piece);
  return color === 'red' ? position.row === 0 : position.row === BOARD_SIZE - 1;
}

/**
 * Apply a move to the board
 */
export function applyMove(board: Board, move: Move): Board {
  const newBoard = copyBoard(board);
  const pieceValue = getPieceAt(newBoard, move.from);

  if (!pieceValue) return newBoard;

  // Remove captured pieces
  if (move.capturedPieces) {
    for (const capturedPos of move.capturedPieces) {
      newBoard[capturedPos.row][capturedPos.col] = 0;
    }
  }

  // Move piece
  newBoard[move.from.row][move.from.col] = 0;

  let newPieceValue = pieceValue;
  if (move.promotesToKing) {
    newPieceValue = pieceValue === 1 ? 3 : pieceValue === 2 ? 4 : pieceValue;
  }

  newBoard[move.to.row][move.to.col] = newPieceValue;

  return newBoard;
}

/**
 * Check if a move has additional capture opportunities
 */
export function hasFollowUpCapture(board: Board, move: Move): boolean {
  if (!move.isCapture) return false;

  const newBoard = applyMove(board, move);
  const piece = getPieceAt(newBoard, move.to);

  if (!piece) return false;

  const additional = getCaptureMoves(newBoard, move.to, piece);
  return additional.length > 0;
}
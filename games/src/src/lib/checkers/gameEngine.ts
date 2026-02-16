/**
 * CheckersEngine - Main game state machine
 * Pure TypeScript class with no framework dependencies
 */

import {
  Board,
  GameResult,
  GameState,
  GameStatus,
  Move,
  MoveValidation,
  PieceColor,
  Position,
} from './types';
import {
  createInitialBoard,
  copyBoard,
  getPieceAt,
  positionsEqual,
} from './board';
import {
  applyMove,
  getLegalMoves,
  getLegalMovesForPiece,
  hasFollowUpCapture,
} from './moves';
import { checkGameOver } from './rules';

export class CheckersEngine {
  private state: GameState;

  constructor() {
    this.state = this.createInitialState();
  }

  /**
   * Create the initial game state
   */
  private createInitialState(): GameState {
    return {
      board: createInitialBoard(),
      currentPlayer: 'red', // Red always starts
      status: 'playing',
      result: null,
      moveHistory: [],
      selectedPiece: null,
      legalMoves: [],
      mustContinueCapture: false,
      captureChainPiece: null,
      moveCount: 0,
      movesWithoutCapture: 0,
    };
  }

  /**
   * Reset the game to initial state
   */
  public reset(): void {
    this.state = this.createInitialState();
  }

  /**
   * Get the current game state (immutable copy)
   */
  public getState(): Readonly<GameState> {
    return {
      ...this.state,
      board: copyBoard(this.state.board),
      moveHistory: [...this.state.moveHistory],
    };
  }

  /**
   * Select a piece at the given position
   */
  public selectPiece(position: Position): boolean {
    const piece = getPieceAt(this.state.board, position);

    // Can't select if game is over
    if (this.state.status === 'finished') return false;

    // Can't select empty square
    if (!piece) {
      this.state.selectedPiece = null;
      this.state.legalMoves = [];
      return false;
    }

    // Can't select opponent's piece
    if (piece.color !== this.state.currentPlayer) return false;

    // If must continue capture, can only select that specific piece
    if (this.state.mustContinueCapture && this.state.captureChainPiece) {
      if (!positionsEqual(position, this.state.captureChainPiece)) {
        return false;
      }
    }

    // Select the piece and calculate legal moves
    this.state.selectedPiece = position;
    this.state.legalMoves = getLegalMovesForPiece(this.state.board, position);

    // Check if any pieces have mandatory captures
    const allMoves = getLegalMoves(this.state.board, this.state.currentPlayer);
    const hasCaptures = allMoves.some((m) => m.isCapture);

    // If captures exist but this piece has no captures, it can't move
    if (hasCaptures && !this.state.legalMoves.some((m) => m.isCapture)) {
      this.state.legalMoves = [];
    }

    return true;
  }

  /**
   * Attempt to move the selected piece to the target position
   */
  public makeMove(to: Position): MoveValidation {
    if (!this.state.selectedPiece) {
      return { valid: false, error: 'No piece selected' };
    }

    if (this.state.status === 'finished') {
      return { valid: false, error: 'Game is over' };
    }

    // Find the matching legal move
    const move = this.state.legalMoves.find((m) => positionsEqual(m.to, to));

    if (!move) {
      return { valid: false, error: 'Illegal move' };
    }

    // Apply the move
    this.state.board = applyMove(this.state.board, move);
    this.state.moveHistory.push(move);
    this.state.moveCount++;

    // Update moves without capture counter
    if (move.isCapture) {
      this.state.movesWithoutCapture = 0;
    } else {
      this.state.movesWithoutCapture++;
    }

    // Check if this capture has a follow-up
    if (move.isCapture && hasFollowUpCapture(this.state.board, move)) {
      // Must continue capturing with the same piece
      this.state.mustContinueCapture = true;
      this.state.captureChainPiece = move.to;
      this.state.selectedPiece = move.to;
      this.state.legalMoves = getLegalMovesForPiece(this.state.board, move.to);
      // Don't switch players yet
    } else {
      // Move complete, switch players
      this.state.mustContinueCapture = false;
      this.state.captureChainPiece = null;
      this.state.selectedPiece = null;
      this.state.legalMoves = [];
      this.switchPlayer();
    }

    // Check for game over
    this.checkForGameEnd();

    return { valid: true };
  }

  /**
   * Get legal moves for the currently selected piece
   */
  public getSelectedPieceMoves(): Move[] {
    return [...this.state.legalMoves];
  }

  /**
   * Get all legal moves for the current player
   */
  public getAllLegalMoves(): Move[] {
    return getLegalMoves(this.state.board, this.state.currentPlayer);
  }

  /**
   * Switch to the other player
   */
  private switchPlayer(): void {
    this.state.currentPlayer = this.state.currentPlayer === 'red' ? 'black' : 'red';
  }

  /**
   * Check if the game has ended
   */
  private checkForGameEnd(): void {
    const { isOver, result } = checkGameOver(
      this.state.board,
      this.state.currentPlayer,
      this.state.movesWithoutCapture
    );

    if (isOver) {
      this.state.status = 'finished';
      this.state.result = result;
    }
  }

  /**
   * Deselect the currently selected piece
   */
  public deselectPiece(): void {
    if (!this.state.mustContinueCapture) {
      this.state.selectedPiece = null;
      this.state.legalMoves = [];
    }
  }

  /**
   * Get the current player
   */
  public getCurrentPlayer(): PieceColor {
    return this.state.currentPlayer;
  }

  /**
   * Get game status
   */
  public getStatus(): GameStatus {
    return this.state.status;
  }

  /**
   * Get game result
   */
  public getResult(): GameResult {
    return this.state.result;
  }

  /**
   * Check if a piece is selected
   */
  public hasSelectedPiece(): boolean {
    return this.state.selectedPiece !== null;
  }

  /**
   * Get the selected piece position
   */
  public getSelectedPiece(): Position | null {
    return this.state.selectedPiece ? { ...this.state.selectedPiece } : null;
  }

  /**
   * Export state for external use (e.g., saving, multiplayer)
   */
  public exportState(): string {
    return JSON.stringify(this.state);
  }

  /**
   * Import state from external source
   */
  public importState(stateJson: string): boolean {
    try {
      const imported = JSON.parse(stateJson);
      this.state = imported;
      return true;
    } catch {
      return false;
    }
  }
}
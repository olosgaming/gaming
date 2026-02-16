/**
 * Play Scene - Main game scene
 */

import Phaser from 'phaser';
import { CheckersEngine } from '@/lib/checkers/gameEngine';
import { Position } from '@/lib/checkers/types';
import { BoardRenderer } from '@/lib/phaser/objects/BoardRenderer';
import { CheckerPiece } from '@/lib/phaser/objects/CheckerPiece';

export class PlayScene extends Phaser.Scene {
  private engine!: CheckersEngine;
  private boardRenderer!: BoardRenderer;
  private pieces: Map<string, CheckerPiece>;
  private onStateChange?: () => void;
  private turnText!: Phaser.GameObjects.Text;


  constructor() {
    super({ key: 'PlayScene' });
    this.pieces = new Map();
  }

  create(): void {
  // Initialize game engine
  this.engine = new CheckersEngine();

  // Create board renderer (no x,y — it centers itself)
  this.boardRenderer = new BoardRenderer(this);
  this.add.existing(this.boardRenderer);

  // Turn text (centered on canvas)
  this.turnText = this.add.text(this.scale.width / 2, 50, "Red's Turn", {
    fontSize: '28px',
    color: '#ffffff',
    fontFamily: 'Arial',
    stroke: '#000000',
    strokeThickness: 4,
  }).setOrigin(0.5);

  // Setup input handling
  this.input.on('pointerdown', this.handleBoardClick, this);

  // Render initial game state
  this.renderGameState();
  this.notifyStateChange();
}


  /**
   * Set callback for state changes (to update React UI)
   */
  public setStateChangeCallback(callback: () => void): void {
    this.onStateChange = callback;
  }

  /**
   * Handle click on the board
   */
  private handleBoardClick(pointer: Phaser.Input.Pointer): void {
    const boardPos = this.boardRenderer.screenToBoard(pointer.x, pointer.y);

    if (!boardPos) return;

    try {
    const state = this.engine.getState();

    if (state.selectedPiece) {
      const result = this.engine.makeMove(boardPos);
      if (result.valid) {
        this.renderGameState();
        this.notifyStateChange();
      } else if (this.engine.selectPiece(boardPos)) {
        this.renderGameState();
        this.notifyStateChange();
      }
    } else {
      if (this.engine.selectPiece(boardPos)) {
        this.renderGameState();
        this.notifyStateChange();
      }
    }
  } catch (err) {
  console.error('Move error:', err);
  const errorText = this.add.text(400, 100, 'Invalid move!', {
    color: '#ff4444',
    fontSize: '24px',
    backgroundColor: '#000000aa',
    padding: { left: 12, right: 12, top: 8, bottom: 8 },
  })
    .setOrigin(0.5)
    .setDepth(100);

  this.time.delayedCall(2000, () => errorText.destroy());
}
}

  /**
   * Render the current game state
   */
  private renderGameState(): void {
    const state = this.engine.getState();

    // Clear existing pieces
    this.pieces.forEach((piece) => piece.destroy());
    this.pieces.clear();

    // Render board highlights
    this.boardRenderer.clearHighlights();

    // Highlight selected piece
    if (state.selectedPiece) {
      this.boardRenderer.highlightSquare(
        state.selectedPiece.row,
        state.selectedPiece.col,
        0xffff00,
        0.3
      );

      // Highlight legal move destinations
      state.legalMoves.forEach((move: { to: { row: any; col: any; }; isCapture: any; }) => {
        this.boardRenderer.highlightSquare(
          move.to.row,
          move.to.col,
          move.isCapture ? 0xff4444 : 0x44ff44,
          0.4
        );
      });
    }

    // Render all pieces
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = state.board[row][col];
        if (piece) {
          const screenPos = this.boardRenderer.boardToScreen(row, col);
          const checkerPiece = new CheckerPiece(
            this,
            screenPos.x,
            screenPos.y,
            piece
          );
          this.add.existing(checkerPiece);
          this.pieces.set(`${row},${col}`, checkerPiece);
        }
      }
    }
    this.turnText.setText(
      state.currentPlayer === 1 ? "Red's Turn" : "Black's Turn"
    );

    // Check for game over
    const gameOver = this.engine.isGameOver?.() || { over: false };

    if (gameOver.over) {
      const message =
        gameOver.winner === 'draw'
          ? 'Draw!'
          : `${gameOver.winner === 1 ? 'Red' : 'Black'} Wins!`;

      this.add.text(400, 300, message, {
        fontSize: '48px',
        color: '#ffd700',
        stroke: '#000000',
        strokeThickness: 6,
      })
        .setOrigin(0.5)
        .setDepth(100);

      this.input.off('pointerdown', this.handleBoardClick, this);
      this.notifyStateChange();
    }

    
  }

  /**
   * Get the game engine for external access
   */
  public getEngine(): CheckersEngine {
    return this.engine;
  }

  /**
   * Reset the game
   */
  public resetGame(): void {
    this.engine.reset();
    this.renderGameState();
    this.notifyStateChange();
  }

  /**
   * Notify React that state has changed
   */
  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange();
    }
  }

  update(): void {
    // Game loop updates if needed
  }
}
/**
 * BoardRenderer - Draws the checkerboard and highlights
 */

import Phaser from 'phaser';

const SQUARE_SIZE = 60;
const BOARD_SIZE = 8;

export class BoardRenderer extends Phaser.GameObjects.Container {
  private graphics: Phaser.GameObjects.Graphics;
  private highlightGraphics: Phaser.GameObjects.Graphics;
  private offsetX: number = 0;
  private offsetY: number = 0;

 constructor(scene: Phaser.Scene) {
  super(scene, 0, 0);

  this.graphics = scene.add.graphics();
  this.highlightGraphics = scene.add.graphics();

  this.add(this.graphics);
  this.add(this.highlightGraphics);

  this.highlightGraphics.setDepth(-1);
  this.graphics.setDepth(-2);

  // Center first (sets offsetX/Y)
  this.centerBoard();
  scene.scale.on('resize', this.centerBoard, this);

  // Then draw board with correct offsets
  this.drawBoard();
}

private centerBoard(): void {
  const canvasW = this.scene.scale.width;
  const canvasH = this.scene.scale.height;
  const boardW = BOARD_SIZE * SQUARE_SIZE;
  const boardH = BOARD_SIZE * SQUARE_SIZE;

  // Center the container itself
  this.x = (canvasW - boardW) / 2;
  this.y = (canvasH - boardH) / 2;

  // Offsets are relative to container origin (top-left)
  this.offsetX = -boardW / 2;
  this.offsetY = -boardH / 2;
}

  /**
   * Draw the checkerboard pattern
   */
  private drawBoard(): void {
    this.graphics.clear();

    // Draw border
    this.graphics.lineStyle(4, 0x8b4513, 1);
    this.graphics.strokeRect(
      this.offsetX - 4,
      this.offsetY - 4,
      BOARD_SIZE * SQUARE_SIZE + 8,
      BOARD_SIZE * SQUARE_SIZE + 8
    );

    // Draw squares
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const x = this.offsetX + col * SQUARE_SIZE;
        const y = this.offsetY + row * SQUARE_SIZE;

        // Alternate between light and dark squares
        const isLight = (row + col) % 2 === 0;
        const color = isLight ? 0xf0d9b5 : 0xb58863;

        this.graphics.fillStyle(color, 1);
        this.graphics.fillRect(x, y, SQUARE_SIZE, SQUARE_SIZE);

        // Add subtle grid lines
        this.graphics.lineStyle(1, 0x000000, 0.1);
        this.graphics.strokeRect(x, y, SQUARE_SIZE, SQUARE_SIZE);
      }
    }

    // Add coordinate labels
    this.addCoordinateLabels();
  }

  /**
   * Add row and column labels to the board
   */
  private addCoordinateLabels(): void {
    const labelStyle = {
      font: '14px Arial',
      color: '#666666',
    };

    // Column labels (A-H)
    for (let col = 0; col < BOARD_SIZE; col++) {
      const label = String.fromCharCode(65 + col); // A, B, C, ...
      const x = this.offsetX + col * SQUARE_SIZE + SQUARE_SIZE / 2;
      const y = this.offsetY - 20;

      const text = this.scene.add.text(x, y, label, labelStyle);
      text.setOrigin(0.5, 0.5);
      this.add(text);
    }

    // Row labels (1-8)
    for (let row = 0; row < BOARD_SIZE; row++) {
      const label = (8 - row).toString();
      const x = this.offsetX - 20;
      const y = this.offsetY + row * SQUARE_SIZE + SQUARE_SIZE / 2;

      const text = this.scene.add.text(x, y, label, labelStyle);
      text.setOrigin(0.5, 0.5);
      this.add(text);
    }
  }

  /**
   * Highlight a square
   */
  public highlightSquare(
    row: number,
    col: number,
    color: number,
    alpha: number
  ): void {
    const x = this.offsetX + col * SQUARE_SIZE;
    const y = this.offsetY + row * SQUARE_SIZE;

    this.highlightGraphics.fillStyle(color, alpha);
    this.highlightGraphics.fillRect(x, y, SQUARE_SIZE, SQUARE_SIZE);
  }

  /**
   * Clear all highlights
   */
  public clearHighlights(): void {
    this.highlightGraphics.clear();
  }

  /**
   * Convert screen coordinates to board position
   */
  public screenToBoard(screenX: number, screenY: number): { row: number; col: number } | null {
    const localX = screenX - this.x;
    const localY = screenY - this.y;

    const col = Math.floor((localX - this.offsetX) / SQUARE_SIZE);
    const row = Math.floor((localY - this.offsetY) / SQUARE_SIZE);

    if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
      return { row, col };
    }

    return null;
  }

  /**
   * Convert board position to screen coordinates (center of square)
   */
  public boardToScreen(row: number, col: number): { x: number; y: number } {
    return {
      x: this.offsetX + col * SQUARE_SIZE + SQUARE_SIZE / 2,
      y: this.offsetY + row * SQUARE_SIZE + SQUARE_SIZE / 2,
    };
  }

  /**
   * Get square size
   */
  public getSquareSize(): number {
    return SQUARE_SIZE;
  }
}
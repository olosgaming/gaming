/**
 * CheckerPiece - Visual representation of a game piece
 */

import Phaser from 'phaser';
import { Piece } from '@/lib/checkers/types';

const PIECE_RADIUS = 22;

export class CheckerPiece extends Phaser.GameObjects.Container {
  private piece: Piece;
  private circle: Phaser.GameObjects.Graphics;
  private crownGraphics?: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, piece: Piece) {
    super(scene, x, y);
    this.piece = piece;

    this.circle = scene.add.graphics();
    this.add(this.circle);

    this.drawPiece();
  }

  private getColorAndType(): { color: 'red' | 'black'; isKing: boolean } {
    switch (this.piece) {
      case 1: return { color: 'red', isKing: false };
      case 3: return { color: 'red', isKing: true };
      case 2: return { color: 'black', isKing: false };
      case 4: return { color: 'black', isKing: true };
      default: return { color: 'black', isKing: false };
    }
  }

  private drawPiece(): void {
    this.circle.clear();

    const { color, isKing } = this.getColorAndType();

    const mainColor = color === 'red' ? 0xdc143c : 0x2c2c2c;
    const highlightColor = color === 'red' ? 0xff6b6b : 0x4a4a4a;
    const shadowColor = color === 'red' ? 0x8b0000 : 0x0a0a0a;

    // Shadow
    this.circle.fillStyle(shadowColor, 0.3);
    this.circle.fillCircle(2, 2, PIECE_RADIUS);

    // Main body
    this.circle.fillStyle(mainColor, 1);
    this.circle.fillCircle(0, 0, PIECE_RADIUS);

    // Highlight
    this.circle.fillStyle(highlightColor, 0.6);
    this.circle.fillCircle(-6, -6, 8);

    // Border
    this.circle.lineStyle(3, 0x000000, 0.5);
    this.circle.strokeCircle(0, 0, PIECE_RADIUS);

    // Inner ring
    this.circle.lineStyle(2, highlightColor, 0.3);
    this.circle.strokeCircle(0, 0, PIECE_RADIUS - 4);

    if (isKing) {
      this.drawCrown();
    }
  }

  private drawCrown(): void {
    if (this.crownGraphics) {
      this.crownGraphics.clear();
    } else {
      this.crownGraphics = this.scene.add.graphics();
      this.add(this.crownGraphics);
    }

    const crownColor = this.piece === 3 || this.piece === 1 ? 0xffd700 : 0xffffff;

    this.crownGraphics.fillStyle(crownColor, 1);
    this.crownGraphics.lineStyle(1.5, 0x000000, 0.7);

    this.crownGraphics.beginPath();
    this.crownGraphics.moveTo(-12, 0);
    this.crownGraphics.lineTo(-8, -12);
    this.crownGraphics.lineTo(-4, 0);
    this.crownGraphics.lineTo(0, -14);
    this.crownGraphics.lineTo(4, 0);
    this.crownGraphics.lineTo(8, -12);
    this.crownGraphics.lineTo(12, 0);
    this.crownGraphics.closePath();
    this.crownGraphics.fillPath();
    this.crownGraphics.strokePath();

    // Jewels
    [-8, 0, 8].forEach((x) => {
      this.crownGraphics!.fillStyle(0x00ffff, 0.8);
      this.crownGraphics!.fillCircle(x, x === 0 ? -14 : -12, 3);
    });
  }

  public getPieceData(): Piece {
    return this.piece;
  }
}
/**
 * Boot Scene - Initial setup
 */

import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Set up any initial configurations
    this.cameras.main.setBackgroundColor('#1a1a2e');
  }

  create(): void {
    // Move to preload scene
    this.scene.start('PreloadScene');
  }
}
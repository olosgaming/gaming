'use client';

import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { BootScene } from '@/lib/phaser/scenes/BootScene';
import { PreloadScene } from '@/lib/phaser/scenes/PreloadScene';
import { PlayScene } from '@/lib/phaser/scenes/PlayScene';

interface PhaserGameProps {
  onStateChange?: () => void;
}

export default function PhaserGame({ onStateChange }: PhaserGameProps) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: containerRef.current?.clientWidth || 800,
      height: containerRef.current?.clientHeight || 600,
      backgroundColor: '#1a1a2e',
      scene: [BootScene, PreloadScene, PlayScene],
      physics: {
        default: 'arcade',
        arcade: {
          debug: process.env.NODE_ENV === 'development',
        },
      },
      scale: {
        mode: Phaser.Scale.RESIZE,          
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    gameRef.current = new Phaser.Game(config);

    gameRef.current.events.once('ready', () => {
    setIsReady(true);
    
    if (onStateChange) {
      const playScene = gameRef.current?.scene.getScene('PlayScene') as PlayScene | undefined;
      playScene?.setStateChangeCallback?.(onStateChange);
    }
  });

  const handleResize = () => {
    if (gameRef.current && containerRef.current) {
      gameRef.current.scale.resize(
        containerRef.current.clientWidth,
        containerRef.current.clientHeight
      );
    }
  };

  window.addEventListener('resize', handleResize);
  handleResize();

  return () => {
    window.removeEventListener('resize', handleResize);
    if (gameRef.current) {
      gameRef.current.destroy(true);
      gameRef.current = null;
    }
  };
}, [onStateChange]);

  /**
   * Get the Play scene for external access
   */
  const getPlayScene = (): PlayScene | null => {
    if (!gameRef.current || !isReady) return null;
    return gameRef.current.scene.getScene('PlayScene') as PlayScene;
  };

  return (
    <div className="flex items-center justify-center w-full h-full">
      <div ref={containerRef} className="rounded-lg overflow-hidden shadow-2xl w-full max-w-[90vw] aspect-square sm:aspect-[4/3]" />
    </div>
  );
}

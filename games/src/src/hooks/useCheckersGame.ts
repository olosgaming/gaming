'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { GameState } from '@/lib/checkers/types';
import { PlayScene } from '@/lib/phaser/scenes/PlayScene';

export function useCheckersGame() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const playSceneRef = useRef<PlayScene | null>(null);

  /**
   * Set the Phaser play scene reference
   */
  const setPlayScene = useCallback((scene: PlayScene) => {
    playSceneRef.current = scene;
    updateGameState();
  }, []);

  /**
   * Update game state from engine
   */
  const updateGameState = useCallback(() => {
    if (playSceneRef.current) {
      const engine = playSceneRef.current.getEngine();
      setGameState(engine.getState());
    }
  }, []);

  /**
   * Reset the game
   */
  const resetGame = useCallback(() => {
    if (playSceneRef.current) {
      playSceneRef.current.resetGame();
      updateGameState();
    }
  }, [updateGameState]);

  /**
   * Get current player
   */
  const getCurrentPlayer = useCallback(() => {
    if (playSceneRef.current) {
      return playSceneRef.current.getEngine().getCurrentPlayer();
    }
    return null;
  }, []);

  /**
   * Get game status
   */
  const getStatus = useCallback(() => {
    if (playSceneRef.current) {
      return playSceneRef.current.getEngine().getStatus();
    }
    return null;
  }, []);

  /**
   * Check if game is over
   */
  const isGameOver = useCallback(() => {
    return gameState?.status === 'finished';
  }, [gameState]);

  return {
    gameState,
    setPlayScene,
    updateGameState,
    resetGame,
    getCurrentPlayer,
    getStatus,
    isGameOver,
  };
}
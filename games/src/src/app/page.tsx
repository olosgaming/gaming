'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useCheckersGame } from '@/hooks/useCheckersGame';
import GameHUD from '@/components/GameHUD';
import Link from 'next/link';

// Dynamically import PhaserGame to avoid SSR issues
const PhaserGame = dynamic(() => import('@/components/PhaserGame'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-screen bg-gradient-to-br from-slate-900 to-purple-900">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-bounce">🎮</div>
        <p className="text-white text-xl font-semibold">Loading game...</p>
      </div>
    </div>
  ),
});

export default function GamePage() {
  const { gameState, updateGameState, resetGame } = useCheckersGame();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative">
      {/* Back button */}
      <div className="absolute top-6 left-6 z-10">
        <Link href="/">
          <button className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 border border-white/20">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Menu
            </span>
          </button>
        </Link>
      </div>

      {/* Game HUD Overlay */}
      <GameHUD 
        gameState={gameState} 
        onReset={resetGame}
      />

      {/* Phaser Game Canvas */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <PhaserGame onStateChange={updateGameState} />
      </div>

      {/* Game Instructions */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 max-w-2xl mx-4">
        <div className="flex items-start gap-3 text-white text-sm">
          <div className="text-2xl">💡</div>
          <div>
            <p className="font-semibold mb-1">How to Play:</p>
            <ul className="space-y-1 text-gray-300">
              <li>• Click a piece to select it, then click a highlighted square to move</li>
              <li>• Captures are mandatory - you must jump if possible</li>
              <li>• Multi-jumps are required when available</li>
              <li>• Reach the opposite end to promote your piece to a King 👑</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
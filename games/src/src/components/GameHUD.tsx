'use client';

import { GameState, PieceColor } from '@/lib/checkers/types';

interface GameHUDProps {
  gameState: GameState | null;
  onReset: () => void;
  onResign?: () => void;
}

export default function GameHUD({ gameState, onReset, onResign }: GameHUDProps) {
  if (!gameState) return null;

  const getPlayerName = (color: PieceColor): string => {
    return color === 'red' ? 'Red' : 'Black';
  };

  const getCurrentPlayerColor = (): string => {
    return gameState.currentPlayer === 'red' 
      ? 'text-red-500' 
      : 'text-gray-800';
  };

  const getStatusMessage = (): string => {
    if (gameState.status === 'finished') {
      if (gameState.result === 'red-wins') return '🏆 Red Wins!';
      if (gameState.result === 'black-wins') return '🏆 Black Wins!';
      if (gameState.result === 'draw') return '🤝 Draw!';
    }
    return gameState.mustContinueCapture 
      ? 'Continue capturing!' 
      : 'Make your move';
  };

  const pieceCount = {
    red: 0,
    black: 0,
  };

  // Count pieces
  gameState.board.forEach(row => {
    row.forEach(piece => {
      if (piece) {
        pieceCount[piece.color]++;
      }
    });
  });

  return (
    <div className="absolute top-0 left-0 right-0 p-6 pointer-events-none">
      <div className="max-w-4xl mx-auto flex items-center justify-between pointer-events-auto">
        {/* Left side - Game info */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border-2 border-gray-200">
          <div className="flex items-center gap-6">
            {/* Current turn indicator */}
            <div className="text-center">
              <div className="text-sm font-medium text-gray-500 mb-2">Current Turn</div>
              <div className={`text-2xl font-bold ${getCurrentPlayerColor()}`}>
                {getPlayerName(gameState.currentPlayer)}
              </div>
              {gameState.status === 'playing' && (
                <div className="mt-2">
                  <div className="w-3 h-3 rounded-full bg-green-500 mx-auto animate-pulse" />
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="w-px h-16 bg-gray-300" />

            {/* Piece counts */}
            <div className="text-center">
              <div className="text-sm font-medium text-gray-500 mb-2">Pieces</div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-red-500 border-2 border-red-700" />
                  <span className="font-bold text-lg">{pieceCount.red}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-800 border-2 border-black" />
                  <span className="font-bold text-lg">{pieceCount.black}</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="w-px h-16 bg-gray-300" />

            {/* Move count */}
            <div className="text-center">
              <div className="text-sm font-medium text-gray-500 mb-2">Moves</div>
              <div className="text-2xl font-bold text-gray-800">
                {gameState.moveCount}
              </div>
            </div>
          </div>

          {/* Status message */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-center font-semibold text-gray-700">
              {getStatusMessage()}
            </div>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onReset}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
          >
            New Game
          </button>
          
          {gameState.status === 'playing' && onResign && (
            <button
              onClick={onResign}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Resign
            </button>
          )}
        </div>
      </div>

      {/* Game over overlay */}
      {gameState.status === 'finished' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center pointer-events-auto z-50">
          <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full mx-4 transform scale-100 animate-in fade-in zoom-in duration-300">
            <div className="text-center">
              <div className="text-6xl mb-4">
                {gameState.result === 'draw' ? '🤝' : '🏆'}
              </div>
              <h2 className="text-4xl font-bold mb-4 text-gray-800">
                {gameState.result === 'red-wins' && 'Red Wins!'}
                {gameState.result === 'black-wins' && 'Black Wins!'}
                {gameState.result === 'draw' && "It's a Draw!"}
              </h2>
              <p className="text-gray-600 mb-8">
                Game finished in {gameState.moveCount} moves
              </p>
              <button
                onClick={onReset}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 w-full"
              >
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
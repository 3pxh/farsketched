import { GameState } from '../types';

interface GameOverStageProps {
  gameState: GameState;
}

export function GameOverStage({ gameState }: GameOverStageProps) {
  return (
    <div className="game-over-stage">
      <h2>Game Over</h2>
      {/* Add game over stage content here */}
    </div>
  );
} 
import { GameState } from '../types';

interface GuessingStageProps {
  gameState: GameState;
}

export function GuessingStage({ gameState }: GuessingStageProps) {
  return (
    <div className="guessing-stage">
      <h2>Guessing Stage</h2>
      {/* Add guessing stage content here */}
    </div>
  );
} 
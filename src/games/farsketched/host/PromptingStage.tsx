import { GameState } from '../types';

interface PromptingStageProps {
  gameState: GameState;
}

export function PromptingStage({ gameState }: PromptingStageProps) {
  return (
    <div className="prompting-stage">
      <h2>Prompting Stage</h2>
      {/* Add prompting stage content here */}
    </div>
  );
} 
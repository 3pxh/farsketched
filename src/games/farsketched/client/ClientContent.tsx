import { GameStage, GameState } from '../types';
import { useClientGameState } from '@/contexts/GameState';
import { PlayerSetup } from './PlayerSetup';
import { PromptingStage } from './PromptingStage';
import { FoolingStage } from './FoolingStage';
import { GuessingStage } from './GuessingStage';
import { Timer } from '../components/Timer';

export function ClientContent() {
  const gameStateContext = useClientGameState<GameState>();
  const gameState = gameStateContext.state;

  const renderStage = () => {
    switch (gameState.stage) {
      case GameStage.LOBBY:
        return <PlayerSetup />;
      case GameStage.PROMPTING:
        return <PromptingStage />;
      case GameStage.FOOLING:
        return <FoolingStage />;
      case GameStage.GUESSING:
        return <GuessingStage />;
      case GameStage.SCORING:
        return <p>Scoring Stage</p>;
      case GameStage.GAME_OVER:
        return <p>Game Over Stage</p>;
      default:
        return <p>Unknown Stage</p>;
    }
  };

  return (
    <div className="game-container">
      <h1>Farsketched</h1>
      {renderStage()}
      {gameState.timer.isRunning && (
        <div className="timer-wrapper">
          <Timer 
            startTime={gameState.timer.startTime} 
            duration={gameState.timer.duration} 
          />
        </div>
      )}
    </div>
  );
} 
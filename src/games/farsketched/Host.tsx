import { useEffect } from 'react';
import { GameStage, GameConfig, GameMessage, GameState } from '@/games/farsketched/types';
import { farsketchedReducer, initialState } from './reducer';
import { HostLobby } from '@/games/farsketched/HostLobby';
import { usePeer } from '@/contexts/PeerContext';
import { HostGameStateProvider, useHostGameState } from '@/contexts/GameState';
import { Timer } from './components/Timer';
import { ScoringStage } from './host/ScoringStage';
import { FoolingStage, PromptingStage, GuessingStage, GameOverStage } from './host/index';
import './Host.css';

interface HostProps {
  gameConfig: GameConfig;
}

function HostContent({ gameConfig }: HostProps) {
  // Get synchronized game state from the context
  const { state: gameState, updateState } = useHostGameState<GameState>();
  const { messages, markRead, sendSelfMessage } = usePeer<GameMessage>();

  // TODO: move this out; it will be used by all games
  useEffect(() => {
    messages.forEach(msg => {
      try {
        updateState(currentState => farsketchedReducer(currentState, msg, sendSelfMessage));
        markRead(msg);
      } catch (error) {
        console.error('Error processing game message:', error);
      }
    });
  }, [messages, markRead, updateState]);

  const renderStage = () => {
    switch (gameState.stage) {
      case GameStage.LOBBY:
        return (
          <HostLobby
            gameConfig={gameConfig}
            players={Object.values(gameState.players)}
          />
        );
      case GameStage.PROMPTING:
        return <PromptingStage gameState={gameState} />;
      case GameStage.FOOLING:
        return <FoolingStage gameState={gameState} />;
      case GameStage.GUESSING:
        return <GuessingStage gameState={gameState} />;
      case GameStage.SCORING:
        return <ScoringStage gameState={gameState} />;
      case GameStage.GAME_OVER:
        return <GameOverStage gameState={gameState} />;
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

export default function Host({ gameConfig }: HostProps) {
  return (
    <HostGameStateProvider<GameState> 
      initialState={initialState} 
      debug={true}
      syncInterval={100}
    >
      <HostContent gameConfig={gameConfig} />
    </HostGameStateProvider>
  );
}
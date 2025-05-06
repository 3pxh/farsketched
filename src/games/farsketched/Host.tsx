import { useEffect } from 'react';
import { GameStage, GameConfig, GameMessage, GameState } from '@/games/farsketched/types';
import { farsketchedReducer, initialState } from './reducer';
import { HostLobby } from '@/components/HostLobby';
import { usePeer } from '@/contexts/PeerContext';
import { HostGameStateProvider, useHostGameState } from '@/contexts/GameState';

interface HostProps {
  gameConfig: GameConfig;
}

function HostContent({ gameConfig }: HostProps) {
  // Get synchronized game state from the context
  const { state: gameState, updateState } = useHostGameState<GameState>();
  const { messages, markRead } = usePeer();

  // Process unread messages and dispatch game state updates
  useEffect(() => {
    const unreadMessages = messages.filter(msg => !msg.isRead);
    
    unreadMessages.forEach(msg => {
      try {
        const gameMessage = JSON.parse(msg.content) as GameMessage;
        
        // Update state using the reducer pattern but through the host state context
        updateState(currentState => farsketchedReducer(currentState, gameMessage));
        
        markRead(msg.id);
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
        return <p>Prompting Stage</p>;
      case GameStage.FOOLING:
        return <p>Fooling Stage</p>;
      case GameStage.GUESSING:
        return <p>Guessing Stage</p>;
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
      
      {/* Debug information if needed */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-2 bg-gray-100 rounded">
          <details>
            <summary className="cursor-pointer font-bold">Debug: Game State</summary>
            <pre className="text-xs mt-2 overflow-auto max-h-64">
              {JSON.stringify(gameState, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

export default function Host({ gameConfig }: HostProps) {
  // Create an initial state that includes the game config
  const mergedInitialState = {
    ...initialState,
    // config: gameConfig
  };
  
  return (
    <HostGameStateProvider<GameState> 
      initialState={mergedInitialState} 
      debug={true}
      syncInterval={100} // Adjust based on your needs
    >
      <HostContent gameConfig={gameConfig} />
    </HostGameStateProvider>
  );
}
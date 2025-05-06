import { useReducer, useEffect } from 'react';
import { GameStage, GameConfig, GameMessage } from '@/types';
import { farsketchedReducer, initialState } from './reducer';
import { usePeer } from '@/contexts/PeerContext';
import { PlayerSetup } from './PlayerSetup';

interface ClientProps {
  gameConfig: GameConfig;
}

export function Client({ gameConfig }: ClientProps) {
  const [gameState, dispatch] = useReducer(farsketchedReducer, {
    ...initialState,
    config: gameConfig
  });
  const { messages, markRead } = usePeer();

  // Process unread messages and dispatch game state updates
  useEffect(() => {
    const unreadMessages = messages.filter(msg => !msg.isRead);
    
    unreadMessages.forEach(msg => {
      try {
        const gameMessage = JSON.parse(msg.content) as GameMessage;
        dispatch(gameMessage);
        markRead(msg.id);
      } catch (error) {
        console.error('Error processing game message:', error);
      }
    });
  }, [messages, markRead]);

  const renderStage = () => {
    switch (gameState.stage) {
      case GameStage.LOBBY:
        return <PlayerSetup />;
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
    </div>
  );
} 
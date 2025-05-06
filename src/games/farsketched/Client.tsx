import { GameStage, GameMessage, GameState } from '@/types';
import { usePeer } from '@/contexts/PeerContext';
import { PlayerSetup } from './PlayerSetup';
import { useClientGameState } from '@/contexts/GameState';
import { ClientGameStateProvider } from '@/contexts/GameState';
import { initialState } from '@/games/farsketched/reducer';

function ClientContent() {
  const { sendMessage } = usePeer();
  const gameStateContext = useClientGameState<GameState>();
  const gameState = gameStateContext.state;


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

export function Client() {
  return (
    <ClientGameStateProvider<GameState> initialState={initialState} debug={true}>
      <ClientContent />
    </ClientGameStateProvider>
  );
}
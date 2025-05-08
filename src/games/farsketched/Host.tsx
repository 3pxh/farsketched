import { useEffect } from 'react';
import { GameStage, GameConfig, GameMessage, GameState } from '@/games/farsketched/types';
import { farsketchedReducer, initialState } from './reducer';
import { HostLobby } from '@/games/farsketched/HostLobby';
import { usePeer } from '@/contexts/PeerContext';
import { HostGameStateProvider, useHostGameState } from '@/contexts/GameState';
import { Timer } from './components/Timer';
import './Host.css';

interface HostProps {
  gameConfig: GameConfig;
}

function FoolingStage({ gameState }: { gameState: GameState }) {
  if (!gameState.activeImage) return <p>No active image</p>;

  const image = gameState.images[gameState.activeImage.imageId];
  if (!image) return <p>Image not found</p>;

  return (
    <div className="fooling-stage">
      <h2>Fooling Stage</h2>
      <div className="active-image">
        <img 
          src={URL.createObjectURL(image.imageBlob)} 
          alt="Generated image for fooling"
          style={{ maxWidth: '512px', maxHeight: '512px' }}
        />
        <p>Real prompt: {image.prompt}</p>
      </div>
    </div>
  );
}

function ScoringStage({ gameState }: { gameState: GameState }) {
  if (!gameState.activeImage) return <p>No active image to score</p>;

  const image = gameState.images[gameState.activeImage.imageId];
  if (!image) return <p>Image not found</p>;

  // Group guesses by promptId
  const guessesByPrompt = gameState.activeImage.guesses.reduce((acc, guess) => {
    if (!acc[guess.promptId]) {
      acc[guess.promptId] = [];
    }
    acc[guess.promptId].push(guess.playerId);
    return acc;
  }, {} as Record<string, string[]>);

  // Get all prompts (real + fake)
  const allPrompts = [
    { id: 'real', text: image.prompt, isReal: true },
    ...gameState.activeImage.fakePrompts.map(fp => ({
      id: fp.id,
      text: fp.text,
      isReal: false
    }))
  ];

  return (
    <div className="scoring-stage">
      <h2>Scoring Stage</h2>
      <div className="active-image">
        <img 
          src={URL.createObjectURL(image.imageBlob)} 
          alt="Generated image"
          style={{ maxWidth: '512px', maxHeight: '512px' }}
        />
      </div>
      <div className="prompt-results">
        <h3>Results:</h3>
        {allPrompts.map(prompt => (
          <div key={prompt.id} className={`prompt-result ${prompt.isReal ? 'real-prompt' : ''}`}>
            <div className="prompt-text">
              <strong>{prompt.isReal ? '✓ Real Prompt: ' : 'Fake Prompt: '}</strong>
              {prompt.text}
            </div>
            <div className="guesses">
              {guessesByPrompt[prompt.id]?.map(playerId => (
                <span key={playerId} className="player-guess">
                  {gameState.players[playerId]?.name || 'Unknown Player'}
                </span>
              )) || <span className="no-guesses">No guesses</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
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
        return <p>Prompting Stage</p>;
      case GameStage.FOOLING:
        return <FoolingStage gameState={gameState} />;
      case GameStage.GUESSING:
        return <p>Guessing Stage</p>;
      case GameStage.SCORING:
        return <ScoringStage gameState={gameState} />;
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
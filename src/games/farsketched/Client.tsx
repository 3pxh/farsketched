import { GameStage, GameState, MessageType, GameMessage } from '@/games/farsketched/types';
import { PlayerSetup } from './PlayerSetup';
import { useClientGameState } from '@/contexts/GameState';
import { ClientGameStateProvider } from '@/contexts/GameState';
import { initialState } from '@/games/farsketched/reducer';
import { useState, useMemo, useEffect } from 'react';
import { usePeer } from '@/contexts/PeerContext';
import './Client.css';

function PromptingStage() {
  const [prompt, setPrompt] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const gameStateContext = useClientGameState<GameState>();
  const gameState = gameStateContext.state;
  const { peerId, sendMessage } = usePeer<GameMessage>();

  // Find the player's image in the current round
  const playerImage = useMemo(() => {
    const currentRoundImages = gameState.roundImages[gameState.currentRound] || [];
    for (const imageId of currentRoundImages) {
      const image = gameState.images[imageId];
      if (image && image.creatorId === peerId) {
        return image;
      }
    }
    return null;
  }, [gameState.roundImages, gameState.currentRound, gameState.images, peerId]);

  // Convert blob to data URL when image is complete
  useEffect(() => {
    if (playerImage?.status === 'complete' && playerImage.imageBlob) {
      // Convert Uint8Array to Blob
      const blob = new Blob([playerImage.imageBlob], { type: 'image/webp' });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(blob);
    }
  }, [playerImage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const message: GameMessage = {
      type: MessageType.SUBMIT_PROMPT,
      playerId: peerId,
      prompt: prompt.trim(),
      timestamp: Date.now(),
      messageId: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    };

    sendMessage(message);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="prompting-stage">
        <h2>Your prompt was sent!</h2>
        {playerImage && (
          <div>
            <h3>Your generated image:</h3>
            {playerImage.status === 'pending' ? (
              <div className="loading-container">
                <p>Generating your image...</p>
                <div className="loading-placeholder"></div>
              </div>
            ) : playerImage.status === 'complete' && imageUrl ? (
              <div className="image-container">
                <img 
                  src={imageUrl} 
                  alt={playerImage.prompt}
                  className="generated-image"
                />
                <p className="image-prompt">Prompt: {playerImage.prompt}</p>
              </div>
            ) : (
              <div className="error-message">
                <p>Error generating image. Please try again.</p>
              </div>
            )}
          </div>
        )}
        <p>Waiting for other players...</p>
      </div>
    );
  }

  return (
    <div className="prompting-stage">
      <h2>Enter your prompt</h2>
      <form onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the image you want to generate..."
          rows={4}
        />
        <button 
          type="submit"
          disabled={!prompt.trim()}
        >
          Generate Image
        </button>
      </form>
    </div>
  );
}

function ClientContent() {
  const gameStateContext = useClientGameState<GameState>();
  const gameState = gameStateContext.state;

  const renderStage = () => {
    switch (gameState.stage) {
      case GameStage.LOBBY:
        return <PlayerSetup />;
      case GameStage.PROMPTING:
        return <PromptingStage />;
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

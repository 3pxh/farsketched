import { useState, useMemo, useEffect } from 'react';
import { GameState, MessageType, GameMessage } from '../types';
import { useClientGameState } from '@/contexts/GameState';
import { usePeer } from '@/contexts/PeerContext';
import './PromptingStage.css';
import './shared.css';

export function PromptingStage() {
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

  // Reset isSubmitted when a new round starts
  useEffect(() => {
    setIsSubmitted(false);
  }, [gameState.currentRound]);

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

  if (isSubmitted || playerImage) {
    return (
      <div className="prompting-stage">
        <h2>Your prompt was sent!</h2>
        <div>
          <h3>Your generated image:</h3>
          {!playerImage ? (
            <div className="loading-container">
              <p>Waiting for server confirmation...</p>
              <div className="loading-placeholder"></div>
            </div>
          ) : playerImage.status === 'pending' ? (
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
        <p>Waiting for other players...</p>
      </div>
    );
  }

  return (
    <div className="prompting-stage">
      <h2>Enter your prompt</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the image you want to generate..."
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
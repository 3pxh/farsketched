import { useState, useEffect } from 'react';
import { GameState, MessageType, GameMessage } from '../types';
import { useClientGameState } from '@/contexts/GameState';
import { usePeer } from '@/contexts/PeerContext';
import './FoolingStage.css';
import './shared.css';

export function FoolingStage() {
  const [fakePrompt, setFakePrompt] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const gameStateContext = useClientGameState<GameState>();
  const gameState = gameStateContext.state;
  const { peerId, sendMessage } = usePeer<GameMessage>();

  if (!gameState.activeImage) return <p>No active image to fool with</p>;

  const image = gameState.images[gameState.activeImage.imageId];
  if (!image) return <p>Image not found</p>;

  // Check if this player is the image creator
  const isImageCreator = image.creatorId === peerId;

  // Convert blob to data URL when image is available
  useEffect(() => {
    if (image.imageBlob) {
      const blob = new Blob([image.imageBlob], { type: 'image/webp' });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(blob);
    }
  }, [image.imageBlob]);

  // Check if this player has already submitted a fake prompt
  const hasSubmitted = gameState.activeImage.fakePrompts.some(
    prompt => prompt.authorId === peerId
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fakePrompt.trim()) return;

    const message: GameMessage = {
      type: MessageType.SUBMIT_FAKE_PROMPT,
      playerId: peerId,
      imageId: gameState.activeImage!.imageId,
      fakePrompt: fakePrompt.trim(),
      timestamp: Date.now(),
      messageId: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    };

    sendMessage(message);
    setIsSubmitted(true);
  };

  if (isSubmitted || hasSubmitted || isImageCreator) {
    return (
      <div className="fooling-stage">
        <h2>Fooling Stage</h2>
        <div className="active-image">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt="Image to fool with"
              className="generated-image"
            />
          ) : (
            <div className="loading-placeholder">Loading image...</div>
          )}
        </div>
        {isImageCreator ? (
          <p>This is your image! Waiting for other players to submit fake prompts...</p>
        ) : (
          <>
            <p>Your fake prompt has been submitted!</p>
            <p>Waiting for other players...</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="fooling-stage">
      <h2>Fooling Stage</h2>
      <div className="active-image">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt="Image to fool with"
            className="generated-image"
          />
        ) : (
          <div className="loading-placeholder">Loading image...</div>
        )}
      </div>
      <form onSubmit={handleSubmit}>
        <h3>Write a convincing fake prompt for this image:</h3>
        <textarea
          value={fakePrompt}
          onChange={(e) => setFakePrompt(e.target.value)}
          placeholder="Write a prompt that could have generated this image..."
          rows={4}
        />
        <button 
          type="submit"
          disabled={!fakePrompt.trim()}
        >
          Submit Fake Prompt
        </button>
      </form>
    </div>
  );
} 
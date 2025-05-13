import { useState, useEffect, useMemo } from 'react';
import { GameState, MessageType, GameMessage } from '../types';
import { useClientGameState } from '@/contexts/GameState';
import { usePeer } from '@/contexts/PeerContext';
import './GuessingStage.css';
import './shared.css';

export function GuessingStage() {
  const [hasGuessed, setHasGuessed] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const gameStateContext = useClientGameState<GameState>();
  const gameState = gameStateContext.state;
  const { peerId, sendMessage } = usePeer<GameMessage>();

  if (!gameState.activeImage) return <p>No active image to guess for</p>;

  const image = gameState.images[gameState.activeImage.imageId];
  if (!image) return <p>Image not found</p>;

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

  // Check if this player has already submitted a guess
  const hasSubmitted = gameState.activeImage.guesses.some(
    guess => guess.playerId === peerId
  );

  // Create array of all prompts (real + fake)
  const allPrompts = useMemo(() => {
    const prompts = [
      { id: 'real', text: image.prompt, isReal: true },
      ...gameState.activeImage!.fakePrompts.map(fp => ({
        id: fp.id,
        text: fp.text,
        isReal: false
      }))
    ];
    // Shuffle the prompts
    return prompts.sort(() => Math.random() - 0.5);
  }, [image.prompt, gameState.activeImage!.fakePrompts]);

  const handleGuess = (promptId: string) => {
    const message: GameMessage = {
      type: MessageType.SUBMIT_GUESS,
      playerId: peerId,
      imageId: gameState.activeImage!.imageId,
      promptId,
      timestamp: Date.now(),
      messageId: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    };

    sendMessage(message);
    setHasGuessed(true);
  };

  if (hasGuessed || hasSubmitted) {
    return (
      <div className="guessing-stage">
        <h2>Guessing Stage</h2>
        <div className="active-image">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt="Image to guess for"
              className="generated-image"
            />
          ) : (
            <div className="loading-placeholder">Loading image...</div>
          )}
        </div>
        <p>Your guess has been submitted!</p>
        <p>Waiting for other players...</p>
      </div>
    );
  }

  return (
    <div className="guessing-stage">
      <h2>Guessing Stage</h2>
      <div className="active-image">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt="Image to guess for"
            className="generated-image"
          />
        ) : (
          <div className="loading-placeholder">Loading image...</div>
        )}
      </div>
      <div className="prompt-options">
        <h3>Which prompt do you think generated this image?</h3>
        <div className="prompt-list">
          {allPrompts.map(prompt => (
            <button
              key={prompt.id}
              onClick={() => handleGuess(prompt.id)}
              className="prompt-option"
            >
              {prompt.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
} 
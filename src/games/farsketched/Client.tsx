import { GameStage, GameState, MessageType, GameMessage } from '@/games/farsketched/types';
import { PlayerSetup } from './PlayerSetup';
import { useClientGameState } from '@/contexts/GameState';
import { ClientGameStateProvider } from '@/contexts/GameState';
import { initialState } from '@/games/farsketched/reducer';
import { useState, useMemo, useEffect } from 'react';
import { usePeer } from '@/contexts/PeerContext';
import { Timer } from './components/Timer';
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

function FoolingStage() {
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
              style={{ maxWidth: '512px', maxHeight: '512px' }}
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
            style={{ maxWidth: '512px', maxHeight: '512px' }}
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

function GuessingStage() {
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
              style={{ maxWidth: '512px', maxHeight: '512px' }}
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
            style={{ maxWidth: '512px', maxHeight: '512px' }}
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

export function Client() {
  return (
    <ClientGameStateProvider<GameState> initialState={initialState} debug={true}>
      <ClientContent />
    </ClientGameStateProvider>
  );
}

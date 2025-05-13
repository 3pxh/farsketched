import { GameState } from '../types';

interface FoolingStageProps {
  gameState: GameState;
}

export function FoolingStage({ gameState }: FoolingStageProps) {
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
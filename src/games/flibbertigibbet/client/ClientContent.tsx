import { GameStage, GameState } from '../types';
import { useClientGameState } from '@/contexts/GameState';
import { PlayerSetup } from './PlayerSetup';
import { PromptingStage } from './PromptingStage';
import { FoolingStage } from './FoolingStage';
import { GuessingStage } from './GuessingStage';
import { Timer } from '../components/Timer';
import { GameOverStage } from './GameOverStage';
import { ScoringStage } from './ScoringStage';
import { Box } from '@mui/material';

export function ClientContent() {
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
        return <ScoringStage />;
      case GameStage.GAME_OVER:
        return <GameOverStage />;
      default:
        return <p>Unknown Stage</p>;
    }
  };

  return (
    <Box 
      id="flibbertigibbet-game-container"
      sx={{ 
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box 
        id="flibbertigibbet-game-content"
        sx={{ flex: 1, overflow: 'auto' }}
      >
        {renderStage()}
      </Box>
      {gameState.timer.isRunning && (
        <Box 
          id="flibbertigibbet-timer-wrapper"
          sx={{
            position: 'sticky',
            bottom: 16,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        >
          <Box 
            id="flibbertigibbet-timer-container"
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(8px)',
              borderRadius: 2,
              p: 1,
              pointerEvents: 'auto',
            }}
          >
            <Timer 
              startTime={gameState.timer.startTime} 
              duration={gameState.timer.duration} 
            />
          </Box>
        </Box>
      )}
    </Box>
  );
} 
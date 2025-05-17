import { useEffect, useMemo } from 'react';
import { GameStage, GameConfig, GameMessage, GameState } from '../types';
import { flibbertigibbetReducer, initialState } from '../reducer';
import { HostLobby } from './HostLobby';
import { usePeer } from '@/contexts/PeerContext';
import { HostGameStateProvider, useHostGameState } from '@/contexts/GameState';
import { Timer } from '../components/Timer';
import { ScoringStage } from './ScoringStage';
import { FoolingStage, PromptingStage, GuessingStage, GameOverStage } from './index';
import { Paper, Box, ThemeProvider } from '@mui/material';
import { createHostTheme } from '@/HostApp';

const gameConfig: GameConfig = {
  maxPlayers: 10,
  minPlayers: 3,
  roundCount: 3,
  promptTimerSeconds: 45,
  foolingTimerSeconds: 45,
  guessingTimerSeconds: 20,
  scoringDisplaySeconds: 10,
  room: ''
};

export function HostContent() {
  // Get synchronized game state from the context
  const { state: gameState, updateState } = useHostGameState<GameState>();
  const { messages, markRead, sendSelfMessage } = usePeer<GameMessage>();


  /*
  Message consumption by different components:
  - a component can subscribe to message types
  - they will be passed to a callback by the peer context and marked read
  e.g. peerContext.subscribe('farsketched.game.xxx', (msg) => {...})
  */

  // TODO: move this out; it will be used by all games
  useEffect(() => {
    messages.forEach(msg => {
      try {
        console.log("HOST pre-reducer", msg, gameState)
        const newState = flibbertigibbetReducer(gameState, msg, sendSelfMessage);
        updateState(newState);
        console.log("HOST post-reducer", newState)
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
        return <PromptingStage />;
      case GameStage.FOOLING:
        return <FoolingStage gameState={gameState} />;
      case GameStage.GUESSING:
        return <GuessingStage />;
      case GameStage.SCORING:
        return <ScoringStage gameState={gameState} />;
      case GameStage.GAME_OVER:
        return <GameOverStage gameState={gameState} />;
      default:
        return <p>Unknown Stage</p>;
    }
  };

  return (
    <Box 
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #f8cdda 0%, #a1c4fd 100%)',
        backgroundAttachment: 'fixed',
        position: 'relative'
      }}
      id="game-container"
    >
      {renderStage()}
      {gameState.timer.isRunning && gameState.stage !== GameStage.SCORING && (
        <Paper 
          elevation={3}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
            padding: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(4px)',
            borderRadius: 2,
            minWidth: 120,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <Timer 
            startTime={gameState.timer.startTime} 
            duration={gameState.timer.duration} 
          />
        </Paper>
      )}
    </Box>
  );
}

export default function FlibbertigibbetHost() {
  const theme = useMemo(() => createHostTheme(), []);
  
  return (
    <ThemeProvider theme={theme}>
      <HostGameStateProvider<GameState> 
        initialState={initialState} 
        debug={true}
        syncInterval={100}
      >
        <HostContent />
      </HostGameStateProvider>
    </ThemeProvider>
  );
}
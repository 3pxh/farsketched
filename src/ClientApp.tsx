import { useState, useEffect } from 'react';
import { PeerProvider } from '@/contexts/PeerContext';
import { usePeer } from '@/contexts/PeerContext';
import { Client as FarsketchedClient } from '@/games/farsketched/client/Client';
import { Client as FlibbertigibbetClient } from '@/games/flibbertigibbet/client/Client';
import { AudioProvider } from './contexts/AudioProvider';
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Game } from '@/types/games';
import { Box } from '@mui/material';

export const clientTheme = responsiveFontSizes(createTheme({
  typography: {
    fontFamily: '"Space Grotesk", Arial, sans-serif',
    fontSize: 16,
  },
  palette: {
    mode: 'light',
    primary: {
      main: '#00bcd4',
    },
    secondary: {
      main: '#ff4081',
    },
    background: {
      default: '#f8f8ff',
      paper: 'rgba(255,255,255,0.8)',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 48,
          fontWeight: 600,
          fontSize: '1.2rem',
          borderRadius: 8,
        },
      },
    },
  },
}));

function ClientContent() {
  const { isConnected, setHostPeerId, connectToHost, peerId } = usePeer();
  const [hasAttemptedConnection, setHasAttemptedConnection] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  useEffect(() => {
    // Get room and game from URL
    const urlParams = new URLSearchParams(window.location.search);
    const room = urlParams.get('room');
    const game = urlParams.get('game') as Game | null;
    
    if (room && peerId && isConnected && !hasAttemptedConnection) {
      console.log('Setting host peer ID to:', room);
      setHostPeerId(room);
      setHasAttemptedConnection(true);
      setSelectedGame(game);
    }
  }, [setHostPeerId, isConnected, hasAttemptedConnection, peerId]);

  // Separate effect for connecting after hostPeerId is set
  useEffect(() => {
    if (hasAttemptedConnection && !isConnected) {
      console.log('Attempting to connect to host...');
      connectToHost();
    }
  }, [hasAttemptedConnection, isConnected, connectToHost]);

  const renderGameComponent = (game: Game) => {
    switch (game) {
      case Game.FARSKETCHED:
        return <FarsketchedClient />;
      case Game.FLIBBERTIGIBBET:
        return <FlibbertigibbetClient />;
      default:
        return <div>Invalid game selected</div>;
    }
  };

  return (
    <Box
      id="client-app-container"
      sx={{
        height: '100dvh', // dynamic viewport height for mobile browsers
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <Box
        id="client-app-content"
        component="main"
        sx={{
          flex: 1,
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch', // smooth scrolling on iOS
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {isConnected ? (
          selectedGame ? (
            renderGameComponent(selectedGame)
          ) : (
            <div>No game selected</div>
          )
        ) : (
          <div className="connection-status">Connecting to host...</div>
        )}
      </Box>
    </Box>
  );
}

function ClientApp() {
  return (
    <ThemeProvider theme={clientTheme}>
      <CssBaseline />
      <PeerProvider isHost={false}>
        <AudioProvider>
          <ClientContent />
        </AudioProvider>
      </PeerProvider>
    </ThemeProvider>
  );
}

export default ClientApp;


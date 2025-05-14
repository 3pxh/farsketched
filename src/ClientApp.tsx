import { useState, useEffect } from 'react';
import { PeerProvider } from '@/contexts/PeerContext';
import { usePeer } from '@/contexts/PeerContext';
import { Client } from '@/games/farsketched/Client';
import { AudioProvider } from './contexts/AudioProvider';
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const clientTheme = responsiveFontSizes(createTheme({
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

  useEffect(() => {
    // Get roomCode from URL
    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get('roomCode');
    
    if (roomCode && peerId && !isConnected && !hasAttemptedConnection) {
      console.log('Setting host peer ID to:', roomCode);
      setHostPeerId(roomCode);
      setHasAttemptedConnection(true);
    }
  }, [setHostPeerId, isConnected, hasAttemptedConnection, peerId]);

  // Separate effect for connecting after hostPeerId is set
  useEffect(() => {
    if (hasAttemptedConnection && !isConnected) {
      console.log('Attempting to connect to host...');
      connectToHost();
    }
  }, [hasAttemptedConnection, isConnected, connectToHost]);

  return (
    <main className="container">
      {isConnected ? (
        <Client />
      ) : (
        <div className="connection-status">Connecting to host...</div>
      )}
    </main>
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


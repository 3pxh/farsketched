import { useState, useEffect } from 'react';
import { PeerProvider } from '@/contexts/PeerContext';
import { usePeer } from '@/contexts/PeerContext';
import { Client as FarsketchedClient } from '@/games/farsketched/client/Client';
import { Client as FlibbertigibbetClient } from '@/games/flibbertigibbet/client/Client';
import { AudioProvider } from './contexts/AudioProvider';
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Game } from '@/types/games';
import { Box, Typography } from '@mui/material';

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

// Fun background component with floating emojis
function FunBackground() {
  const [emojis, setEmojis] = useState<Array<{id: number, emoji: string, x: number, y: number, scale: number, opacity: number}>>([]);
  
  // Array of fun emojis
  const emojiOptions = ['🎮', '🎲', '🎯', '🎨', '🎭', '🎪', '🎡', '🎢', '🎠', '🎪', '🎯', '🎲', '🎮', '🎨', '🎭'];
  
  useEffect(() => {
    // Function to create a new random emoji
    const createEmoji = () => {
      return {
        id: Math.random(),
        emoji: emojiOptions[Math.floor(Math.random() * emojiOptions.length)],
        x: Math.random() * 100, // Random position from 0-100% of screen width
        y: Math.random() * 100, // Random position from 0-100% of screen height
        scale: 1 + Math.random() * 2, // Random scale between 1 and 3
        opacity: 0.2 + Math.random() * 0.3 // Random opacity between 0.2 and 0.5
      };
    };
    
    // Add a new emoji every 800ms
    const intervalId = setInterval(() => {
      setEmojis((current) => [...current, createEmoji()]);
    }, 800);
    
    // Remove emojis after they fade out
    const fadeIntervalId = setInterval(() => {
      setEmojis((current) => 
        current.map((emoji) => 
          emoji.opacity > 0 ? { ...emoji, opacity: emoji.opacity - 0.02 } : emoji
        ).filter((emoji) => emoji.opacity > 0)
      );
    }, 50);
    
    return () => {
      clearInterval(intervalId);
      clearInterval(fadeIntervalId);
    };
  }, []);
  
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none', // Make sure it doesn't interfere with clicks
        zIndex: 0,
        overflow: 'hidden'
      }}
    >
      {emojis.map((emoji) => (
        <Box
          key={emoji.id}
          sx={{
            position: 'absolute',
            left: `${emoji.x}%`,
            top: `${emoji.y}%`,
            fontSize: `${emoji.scale}rem`,
            opacity: emoji.opacity,
            transition: 'opacity 2s ease-out, transform 0.5s ease-out',
            transform: `scale(${emoji.opacity * 1.5})`,
            animation: 'float 3s ease-in-out infinite',
          }}
        >
          {emoji.emoji}
        </Box>
      ))}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(10deg);
          }
        }
      `}</style>
    </Box>
  );
}

function ClientContent() {
  const { isConnected, setHostPeerId, connectToHost, peerId } = usePeer();
  const [hasAttemptedConnection, setHasAttemptedConnection] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  useEffect(() => {
    // Get room and game from URL
    const urlParams = new URLSearchParams(window.location.search);
    const room = urlParams.get('room');
    const game = urlParams.get('game') as Game | null;
    
    if (room && peerId && !isConnected && !hasAttemptedConnection) {
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
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, rgba(0,188,212,0.2) 0%, rgba(255,64,129,0.2) 50%, rgba(0,188,212,0.2) 100%)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.6) 100%)',
                  zIndex: 0
                }
              }}
            >
              <FunBackground />
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                  textAlign: 'center',
                  position: 'relative',
                  zIndex: 1,
                  px: 2,
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                No game selected
              </Typography>
            </Box>
          )
        ) : (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, rgba(0,188,212,0.2) 0%, rgba(255,64,129,0.2) 50%, rgba(0,188,212,0.2) 100%)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.6) 100%)',
                zIndex: 0
              }
            }}
          >
            <FunBackground />
            <Typography
              variant="h4"
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                textAlign: 'center',
                position: 'relative',
                zIndex: 1,
                px: 2,
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              Connecting to host...
            </Typography>
          </Box>
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


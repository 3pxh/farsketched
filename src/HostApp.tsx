import { useState, useEffect, useMemo } from "react";
import { initializeDatabase } from './apis/database';
import { PeerProvider } from '@/contexts/PeerContext';
import { GameConfig } from '@/games/farsketched/types';
import Host from '@/games/farsketched/host/Host';
import FlibbertigibbetHost from '@/games/flibbertigibbet/host/Host';
import { Settings } from './components/Settings';
import { GameSelection } from './components/GameSelection';
import { Game } from '@/types/games';
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import { IconButton, CssBaseline, Box } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import '@fontsource/space-grotesk/300.css';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/700.css';

const defaultGameConfig: GameConfig = {
  maxPlayers: 10,
  minPlayers: 3,
  roundCount: 3,
  promptTimerSeconds: 45,
  foolingTimerSeconds: 45,
  guessingTimerSeconds: 20,
  scoringDisplaySeconds: 10,
  apiProvider: 'openai',
  apiKey: '',
  room: ''
};

export const createHostTheme = () => {
  const baseTheme = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#90caf9',
      },
      secondary: {
        main: '#f48fb1',
      },
    },
    typography: {
      fontFamily: '"Space Grotesk", "Helvetica", "Arial", sans-serif',
      fontSize: 16,
      htmlFontSize: 16,
      button: {
        fontSize: '1rem', // 24px
        fontWeight: 600,
        letterSpacing: '0.02em',
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 600,
            padding: '12px 24px',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
            },
          },
        },
      },
    },
  });

  return responsiveFontSizes(baseTheme, {
    breakpoints: ['xs', 'sm', 'md', 'lg', 'xl'],
    factor: 2,
    variants: [
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'subtitle1',
      'subtitle2',
      'body1',
      'body2',
      'button',
    ],
  });
};

function HostApp() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [gameConfig, setGameConfig] = useState<GameConfig>(defaultGameConfig);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  const theme = useMemo(() => createHostTheme(), []);

  useEffect(() => {
    // Initialize database
    const initDb = async () => {
      try {
        await initializeDatabase();
        setDbInitialized(true);
      } catch (error) {
        console.error('Error initializing database:', error);
      }
    };
    initDb();
  }, []);

  const handleSaveSettings = (newConfig: GameConfig) => {
    setGameConfig(newConfig);
    // Here you might want to save the config to localStorage or your database
  };

  const renderGameComponent = (game: Game) => {
    switch (game) {
      case Game.FARSKETCHED:
        return <Host gameConfig={gameConfig} />;
      case Game.FLIBBERTIGIBBET:
        return <FlibbertigibbetHost gameConfig={gameConfig} />;
      default:
        return "That game doesn't exist yet.";
    }
  };

  if (!dbInitialized) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className="container">Initializing database...</div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <PeerProvider isHost={true}>
        <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
          <IconButton 
            onClick={() => setShowSettings(true)}
            aria-label="Settings"
            color="primary"
            size="large"
            sx={{
              position: 'fixed',
              top: 16,
              right: 16,
              zIndex: 1000,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
              },
            }}
          >
            <SettingsIcon />
          </IconButton>
          {!selectedGame ? (
            <GameSelection onGameSelect={setSelectedGame} />
          ) : (
            renderGameComponent(selectedGame)
          )}
          {showSettings && (
            <Settings
              gameConfig={gameConfig}
              onSave={handleSaveSettings}
              onClose={() => setShowSettings(false)}
            />
          )}
        </Box>
      </PeerProvider>
    </ThemeProvider>
  );
}

export default HostApp; 
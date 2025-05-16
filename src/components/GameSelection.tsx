import { Box, Button, Typography } from '@mui/material';
import { Game } from '@/types/games';

interface GameSelectionProps {
  onGameSelect: (game: Game) => void;
}

export const GameSelection = ({ onGameSelect }: GameSelectionProps) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: 4,
      }}
    >
      <Typography variant="h2" component="h1" gutterBottom>
        Select a Game
      </Typography>
      <Button
        variant="contained"
        size="large"
        onClick={() => onGameSelect(Game.FARSKETCHED)}
        sx={{
          minWidth: 200,
          py: 2,
        }}
      >
        Farsketched
      </Button>
      <Button
        variant="contained"
        size="large"
        onClick={() => {onGameSelect(Game.FLIBBERTIGIBBET)}}
        sx={{
          minWidth: 200,
          py: 2,
        }}
      >
        Flibbertigibbet
      </Button>
    </Box>
  );
}; 
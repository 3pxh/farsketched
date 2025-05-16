import { GameState } from '../types';
import { Box, Typography, Paper } from '@mui/material';
import { TextDisplay } from '../client/TextDisplay';

interface FoolingStageProps {
  gameState: GameState;
}

export function FoolingStage({ gameState }: FoolingStageProps) {
  if (!gameState.activeText) return <Typography>No active text</Typography>;

  const text = gameState.texts[gameState.activeText.textId];
  if (!text) return <Typography>Text not found</Typography>;

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh" px={2}>
      <Paper elevation={3} sx={{ p: 3, width: '100%', maxWidth: 600, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.8)' }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>Fooling Stage</Typography>
        <Box mt={2} mb={2} display="flex" flexDirection="column" alignItems="center">
          <TextDisplay text={text.text} />
        </Box>
      </Paper>
    </Box>
  );
} 
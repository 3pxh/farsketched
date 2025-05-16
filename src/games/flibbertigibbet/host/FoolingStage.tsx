import { GameState } from '../types';
import { Box, Typography, Paper } from '@mui/material';

interface FoolingStageProps {
  gameState: GameState;
}

export function FoolingStage({ gameState }: FoolingStageProps) {
  if (!gameState.activeImage) return <Typography>No active image</Typography>;

  const image = gameState.images[gameState.activeImage.imageId];
  if (!image) return <Typography>Image not found</Typography>;

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh" px={2}>
      <Paper elevation={3} sx={{ p: 3, width: '100%', maxWidth: 520, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.8)' }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>Fooling Stage</Typography>
        <Box mt={2} mb={2} display="flex" flexDirection="column" alignItems="center">
          <Box
            component="img"
            src={URL.createObjectURL(image.imageBlob)}
            alt="Generated image for fooling"
            sx={{
              width: '100%',
              maxWidth: 384,
              maxHeight: 384,
              borderRadius: 2,
              boxShadow: 2,
              mb: 2,
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
} 
import { useState, useMemo, useEffect } from 'react';
import { GameState, MessageType, GameMessage } from '../types';
import { useClientGameState } from '@/contexts/GameState';
import { usePeer } from '@/contexts/PeerContext';
import {
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  CircularProgress,
} from '@mui/material';

export function PromptingStage() {
  const [prompt, setPrompt] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const gameStateContext = useClientGameState<GameState>();
  const gameState = gameStateContext.state;
  const { peerId, sendMessage } = usePeer<GameMessage>();

  // Find the player's image in the current round
  const playerImage = useMemo(() => {
    const currentRoundImages = gameState.roundImages[gameState.currentRound] || [];
    for (const imageId of currentRoundImages) {
      const image = gameState.images[imageId];
      if (image && image.creatorId === peerId) {
        return image;
      }
    }
    return null;
  }, [gameState.roundImages, gameState.currentRound, gameState.images, peerId]);

  // Reset isSubmitted when a new round starts
  useEffect(() => {
    setIsSubmitted(false);
  }, [gameState.currentRound]);

  // Convert blob to data URL when image is complete
  useEffect(() => {
    if (playerImage?.status === 'complete' && playerImage.imageBlob) {
      // Convert Uint8Array to Blob
      const blob = new Blob([playerImage.imageBlob], { type: 'image/webp' });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(blob);
    }
  }, [playerImage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const message: GameMessage = {
      type: MessageType.SUBMIT_PROMPT,
      playerId: peerId,
      prompt: prompt.trim(),
      timestamp: Date.now(),
      messageId: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    };

    sendMessage(message);
    setIsSubmitted(true);
  };

  if (isSubmitted || playerImage) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh" px={2}>
        <Paper elevation={3} sx={{ p: 3, width: '100%', maxWidth: 420, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.8)' }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>Your prompt was sent!</Typography>
          <Box mt={2}>
            <Typography variant="subtitle1" gutterBottom>Your generated image:</Typography>
            {!playerImage ? (
              <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                <Typography variant="body2">Waiting for server confirmation...</Typography>
                <CircularProgress />
              </Box>
            ) : playerImage.status === 'pending' ? (
              <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                <Typography variant="body2">Generating your image...</Typography>
                <CircularProgress />
              </Box>
            ) : playerImage.status === 'complete' && imageUrl ? (
              <Box className="image-container" mt={2}>
                <Box
                  component="img"
                  src={imageUrl}
                  alt={playerImage.prompt}
                  sx={{
                    width: '100%',
                    maxWidth: 320,
                    borderRadius: 2,
                    boxShadow: 2,
                  }}
                />
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Prompt: {playerImage.prompt}
                </Typography>
              </Box>
            ) : (
              <Box color="error.main" mt={2}>
                <Typography variant="body2">Error generating image. Please try again.</Typography>
              </Box>
            )}
          </Box>
          <Typography variant="body1" mt={3}>Waiting for other players...</Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh" px={2}>
      <Paper elevation={3} sx={{ p: 3, width: '100%', maxWidth: 420, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.8)' }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>Enter your prompt</Typography>
        <Box component="form" onSubmit={handleSubmit} mt={2}>
          <TextField
            fullWidth
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate..."
            variant="outlined"
            size="medium"
            autoFocus
            sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.6)' }}
            inputProps={{ maxLength: 120 }}
            disabled={isSubmitted}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            disabled={!prompt.trim()}
            sx={{ fontWeight: 700, py: 1.5 }}
          >
            Generate Image
          </Button>
        </Box>
      </Paper>
    </Box>
  );
} 
import { useState, useEffect } from 'react';
import { GameState, MessageType, GameMessage } from '../types';
import { useClientGameState } from '@/contexts/GameState';
import { usePeer } from '@/contexts/PeerContext';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  CircularProgress,
} from '@mui/material';

export function FoolingStage() {
  const [fakePrompt, setFakePrompt] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const gameStateContext = useClientGameState<GameState>();
  const gameState = gameStateContext.state;
  const { peerId, sendMessage } = usePeer<GameMessage>();

  if (!gameState.activeImage) return <Typography>No active image to fool with</Typography>;

  const image = gameState.images[gameState.activeImage.imageId];
  if (!image) return <Typography>Image not found</Typography>;

  // Check if this player is the image creator
  const isImageCreator = image.creatorId === peerId;

  // Convert blob to data URL when image is available
  useEffect(() => {
    if (image.imageBlob) {
      const blob = new Blob([image.imageBlob], { type: 'image/webp' });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(blob);
    }
  }, [image.imageBlob]);

  // Check if this player has already submitted a fake prompt
  const hasSubmitted = gameState.activeImage.fakePrompts.some(
    prompt => prompt.authorId === peerId
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fakePrompt.trim()) return;

    const message: GameMessage = {
      type: MessageType.SUBMIT_FAKE_PROMPT,
      playerId: peerId,
      imageId: gameState.activeImage!.imageId,
      fakePrompt: fakePrompt.trim(),
      timestamp: Date.now(),
      messageId: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    };

    sendMessage(message);
    setIsSubmitted(true);
  };

  if (isSubmitted || hasSubmitted || isImageCreator) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh" px={2}>
        <Paper elevation={3} sx={{ p: 3, width: '100%', maxWidth: 420, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.8)' }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>Fooling Stage</Typography>
          <Box mt={2} mb={2} display="flex" flexDirection="column" alignItems="center">
            {imageUrl ? (
              <Box
                component="img"
                src={imageUrl}
                alt="Image to fool with"
                sx={{
                  width: '100%',
                  maxWidth: 320,
                  borderRadius: 2,
                  boxShadow: 2,
                  mb: 2,
                }}
              />
            ) : (
              <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                <CircularProgress />
                <Typography variant="body2">Loading image...</Typography>
              </Box>
            )}
          </Box>
          {isImageCreator ? (
            <Typography variant="body1">This is your image! Waiting for other players to submit fake prompts...</Typography>
          ) : (
            <>
              <Typography variant="body1">Your fake prompt has been submitted!</Typography>
              <Typography variant="body2" color="text.secondary">Waiting for other players...</Typography>
            </>
          )}
        </Paper>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh" px={2}>
      <Paper elevation={3} sx={{ p: 3, width: '100%', maxWidth: 420, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.8)' }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>Fooling Stage</Typography>
        <Box mt={2} mb={2} display="flex" flexDirection="column" alignItems="center">
          {imageUrl ? (
            <Box
              component="img"
              src={imageUrl}
              alt="Image to fool with"
              sx={{
                width: '100%',
                maxWidth: 320,
                borderRadius: 2,
                boxShadow: 2,
                mb: 2,
              }}
            />
          ) : (
            <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
              <CircularProgress />
              <Typography variant="body2">Loading image...</Typography>
            </Box>
          )}
        </Box>
        <Box component="form" onSubmit={handleSubmit}>
          <Typography variant="subtitle1" gutterBottom>Write a convincing fake prompt for this image:</Typography>
          <TextField
            fullWidth
            value={fakePrompt}
            onChange={(e) => setFakePrompt(e.target.value)}
            placeholder="What could have generated this image?"
            autoComplete="off"
            variant="outlined"
            sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.6)' }}
            inputProps={{ maxLength: 120 }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            disabled={!fakePrompt.trim()}
            sx={{ fontWeight: 700, py: 1.5 }}
          >
            Submit Fake Prompt
          </Button>
        </Box>
      </Paper>
    </Box>
  );
} 
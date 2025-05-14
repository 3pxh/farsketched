import { useState, useEffect, useMemo } from 'react';
import { GameState, MessageType, GameMessage } from '../types';
import { useClientGameState } from '@/contexts/GameState';
import { usePeer } from '@/contexts/PeerContext';
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
} from '@mui/material';

export function GuessingStage() {
  const [hasGuessed, setHasGuessed] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const gameStateContext = useClientGameState<GameState>();
  const gameState = gameStateContext.state;
  const { peerId, sendMessage } = usePeer<GameMessage>();

  if (!gameState.activeImage) return <Typography>No active image to guess for</Typography>;

  const image = gameState.images[gameState.activeImage.imageId];
  if (!image) return <Typography>Image not found</Typography>;

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

  // Check if this player has already submitted a guess
  const hasSubmitted = gameState.activeImage.guesses.some(
    guess => guess.playerId === peerId
  );

  // Create array of all prompts (real + fake)
  const allPrompts = useMemo(() => {
    const prompts = [
      { id: 'real', text: image.prompt, isReal: true },
      ...gameState.activeImage!.fakePrompts.map(fp => ({
        id: fp.id,
        text: fp.text,
        isReal: false
      }))
    ];
    // Shuffle the prompts
    return prompts.sort(() => Math.random() - 0.5);
  }, [image.prompt, gameState.activeImage!.fakePrompts]);

  const handleGuess = (promptId: string) => {
    const message: GameMessage = {
      type: MessageType.SUBMIT_GUESS,
      playerId: peerId,
      imageId: gameState.activeImage!.imageId,
      promptId,
      timestamp: Date.now(),
      messageId: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    };

    sendMessage(message);
    setHasGuessed(true);
  };

  if (hasGuessed || hasSubmitted) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh" px={2}>
        <Paper elevation={3} sx={{ p: 3, width: '100%', maxWidth: 420, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.8)' }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>Guessing Stage</Typography>
          <Box mt={2} mb={2} display="flex" flexDirection="column" alignItems="center">
            {imageUrl ? (
              <Box
                component="img"
                src={imageUrl}
                alt="Image to guess for"
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
          <Typography variant="body1">Your guess has been submitted!</Typography>
          <Typography variant="body2" color="text.secondary">Waiting for other players...</Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh" px={2}>
      <Paper elevation={3} sx={{ p: 3, width: '100%', maxWidth: 420, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.8)' }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>Guessing Stage</Typography>
        <Box mt={2} mb={2} display="flex" flexDirection="column" alignItems="center">
          {imageUrl ? (
            <Box
              component="img"
              src={imageUrl}
              alt="Image to guess for"
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
        <Box mt={2}>
          <Typography variant="subtitle1" gutterBottom>Which prompt do you think generated this image?</Typography>
          <Box display="flex" flexDirection="column" gap={2}>
            {allPrompts.map(prompt => (
              <Button
                key={prompt.id}
                onClick={() => handleGuess(prompt.id)}
                variant="outlined"
                color="primary"
                fullWidth
                sx={{ fontWeight: 600, fontSize: '1.1rem', py: 1.5 }}
              >
                {prompt.text}
              </Button>
            ))}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
} 
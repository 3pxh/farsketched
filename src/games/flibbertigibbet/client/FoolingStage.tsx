import { useState } from 'react';
import { GameState, MessageType, GameMessage } from '../types';
import { useClientGameState } from '@/contexts/GameState';
import { usePeer } from '@/contexts/PeerContext';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
} from '@mui/material';
import { TextDisplay } from './TextDisplay';

export function FoolingStage() {
  const [fakePrompt, setFakePrompt] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const gameStateContext = useClientGameState<GameState>();
  const gameState = gameStateContext.state;
  const { peerId, sendMessage } = usePeer<GameMessage>();

  if (!gameState.activeText) return <Typography>No active text to fool with</Typography>;

  const text = gameState.texts[gameState.activeText.textId];
  if (!text) return <Typography>Text not found</Typography>;

  // Check if this player is the text creator
  const isTextCreator = text.creatorId === peerId;

  // Check if this player has already submitted a fake prompt
  const hasSubmitted = gameState.activeText.fakePrompts.some(
    prompt => prompt.authorId === peerId
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fakePrompt.trim()) return;

    const message: GameMessage = {
      type: MessageType.SUBMIT_FAKE_PROMPT,
      playerId: peerId,
      textId: gameState.activeText!.textId,
      fakePrompt: fakePrompt.trim(),
      timestamp: Date.now(),
      messageId: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    };

    sendMessage(message);
    setIsSubmitted(true);
  };

  if (isSubmitted || hasSubmitted || isTextCreator) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" px={2}>
        <Paper elevation={3} sx={{ p: 3, width: '100%', maxWidth: 600, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.8)' }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>Fooling Stage</Typography>
          <Box mt={2} mb={2} display="flex" flexDirection="column" alignItems="center">
            <TextDisplay text={text.text} />
          </Box>
          {isTextCreator ? (
            <Typography variant="body1">This is your text! Waiting for other players to submit fake prompts...</Typography>
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
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" px={2}>
      <Paper elevation={3} sx={{ p: 3, width: '100%', maxWidth: 600, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.8)' }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>Fooling Stage</Typography>
        <Box mt={2} mb={2} display="flex" flexDirection="column" alignItems="center">
          <TextDisplay text={text.text} />
        </Box>
        <Box component="form" onSubmit={handleSubmit}>
          <Typography variant="subtitle1" gutterBottom>Write a convincing fake prompt for this text:</Typography>
          <TextField
            fullWidth
            value={fakePrompt}
            onChange={(e) => setFakePrompt(e.target.value)}
            placeholder="What could have generated this text?"
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
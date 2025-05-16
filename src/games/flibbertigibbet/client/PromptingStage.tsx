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
} from '@mui/material';
import { TextDisplay } from './TextDisplay';
import { PlayersSubmitted } from './PlayersSubmitted';

export function PromptingStage() {
  const [prompt, setPrompt] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const gameStateContext = useClientGameState<GameState>();
  const gameState = gameStateContext.state;
  const { peerId, sendMessage } = usePeer<GameMessage>();
  const player = gameState.players[peerId];
  const avatarUrl = player?.avatarUrl;

  // Find the player's text in the current round
  const playerText = useMemo(() => {
    const currentRoundTexts = gameState.roundTexts[gameState.currentRound] || [];
    for (const textId of currentRoundTexts) {
      const text = gameState.texts[textId];
      if (text && text.creatorId === peerId) {
        return text;
      }
    }
    return null;
  }, [gameState.roundTexts, gameState.currentRound, gameState.texts, peerId]);

  // Reset isSubmitted when a new round starts
  useEffect(() => {
    setIsSubmitted(false);
  }, [gameState.currentRound]);

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

  if (isSubmitted || playerText) {
    const currentRoundTextIds = gameState.roundTexts[gameState.currentRound] || [];
    const submittedCount = currentRoundTextIds
      .map(id => gameState.texts[id])
      .filter(text => !!text && !!text.prompt)
      .length;
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh" px={2}>
        <Paper elevation={3} sx={{ p: 3, width: '100%', maxWidth: 600, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.8)' }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            {!playerText ? 'Your prompt was sent!' : 'Here is your generated text!'}
          </Typography>
          <Box mt={2}>
            {!playerText ? (
              <TextDisplay text="waiting for server confirmation..." showSpinner/>
            ) : playerText.status === 'pending' ? (
              <TextDisplay text="generating text..." showSpinner/>
            ) : playerText.status === 'complete' ? (
              <Box mt={2}>
                <TextDisplay text={playerText.text} />
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Prompt: "{playerText.prompt}"
                </Typography>
              </Box>
            ) : (
              <Box color="error.main" mt={2}>
                <Typography variant="body2">Error generating text. Please try again.</Typography>
              </Box>
            )}
          </Box>
          <PlayersSubmitted count={submittedCount} avatarUrl={avatarUrl} />
        </Paper>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh" px={2}>
      <Paper elevation={3} sx={{ p: 3, width: '100%', maxWidth: 600, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.8)' }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>Enter your prompt</Typography>
        
        <TextDisplay text="future text here"/>

        <Box component="form" onSubmit={handleSubmit} mt={2}>
          <TextField
            fullWidth
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the text you want to generate..."
            autoComplete="off"
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
            Generate Text
          </Button>
        </Box>
      </Paper>
    </Box>
  );
} 
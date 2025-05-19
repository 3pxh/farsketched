import { useState, useMemo } from 'react';
import { GameState, MessageType, GameMessage } from '../types';
import { useClientGameState } from '@/contexts/GameState';
import { usePeer } from '@/contexts/PeerContext';
import {
  Box,
  Typography,
  Button,
  Paper,
  Tooltip,
} from '@mui/material';
import { TextDisplay } from './TextDisplay';

export function GuessingStage() {
  const [hasGuessed, setHasGuessed] = useState(false);
  const gameStateContext = useClientGameState<GameState>();
  const gameState = gameStateContext.state;
  const { peerId, sendMessage } = usePeer<GameMessage>();

  if (!gameState.activeText) return <Typography>No active text to guess for</Typography>;

  const text = gameState.texts[gameState.activeText.textId];
  if (!text) return <Typography>Text not found</Typography>;

  // Determine if the current player is the creator of this text
  const isTextCreator = text.creatorId === peerId;

  // Check if this player has already submitted a guess
  const hasSubmitted = gameState.activeText.guesses.some(
    guess => guess.playerId === peerId
  );

  // Create array of all prompts (real + fake) and mark the one written by this player
  const allPrompts = useMemo(() => {
    const prompts = [
      { id: 'real', text: text.prompt, isReal: true, isPlayersOwn: false },
      ...gameState.activeText!.fakePrompts.map(fp => ({
        id: fp.id,
        text: fp.text,
        isReal: false,
        isPlayersOwn: fp.authorId === peerId
      }))
    ];
    // Sort prompts alphabetically
    return prompts.sort((a, b) => a.text.localeCompare(b.text));
  }, [text.prompt, gameState.activeText!.fakePrompts, peerId]);

  const handleGuess = (promptId: string) => {
    const message: GameMessage = {
      type: MessageType.SUBMIT_GUESS,
      playerId: peerId,
      textId: gameState.activeText!.textId,
      promptId,
      timestamp: Date.now(),
      messageId: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    };

    sendMessage(message);
    setHasGuessed(true);
  };

  // Display a different message if the player is the creator of the text
  if (isTextCreator) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" px={2}>
        <Paper elevation={3} sx={{ p: 3, width: '100%', maxWidth: 600, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.8)' }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>Guessing Stage</Typography>
          <Box mt={2} mb={2} display="flex" flexDirection="column" alignItems="center">
            <TextDisplay text={text.text} />
          </Box>
          <Typography variant="h6" gutterBottom>This is your text!</Typography>
          <Typography variant="body1">Since you created this text, you don't need to guess the prompt.</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Waiting for other players to make their guesses...</Typography>
          
          <Box mt={4}>
            <Typography variant="subtitle1" gutterBottom>All prompts:</Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              {allPrompts.map(prompt => (
                <Paper
                  key={prompt.id}
                  elevation={1}
                  sx={{
                    p: 2,
                    bgcolor: 'rgba(0, 0, 0, 0.04)',
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="body1" textAlign="center">
                    {prompt.text}
                  </Typography>
                </Paper>
              ))}
            </Box>
          </Box>
        </Paper>
      </Box>
    );
  }

  if (hasGuessed || hasSubmitted) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" px={2}>
        <Paper elevation={3} sx={{ p: 3, width: '100%', maxWidth: 600, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.8)' }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>Guessing Stage</Typography>
          <Box mt={2} mb={2} display="flex" flexDirection="column" alignItems="center">
            <TextDisplay text={text.text} />
          </Box>
          <Typography variant="body1">Your guess has been submitted!</Typography>
          <Typography variant="body2" color="text.secondary">Waiting for other players...</Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" px={2}>
      <Paper elevation={3} sx={{ p: 3, width: '100%', maxWidth: 600, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.8)' }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>Guessing Stage</Typography>
        <Box mt={2} mb={2} display="flex" flexDirection="column" alignItems="center">
          <TextDisplay text={text.text} />
        </Box>
        <Box mt={2}>
          <Typography variant="subtitle1" gutterBottom>Which prompt do you think generated this text?</Typography>
          <Box display="flex" flexDirection="column" gap={2}>
            {allPrompts.map(prompt => (
              prompt.isPlayersOwn ? (
                <Tooltip 
                  key={prompt.id}
                  title="You can't choose the prompt you wrote" 
                  arrow
                  placement="right"
                >
                  <Box sx={{ position: 'relative' }}>
                    <Button
                      disabled={true}
                      variant="outlined"
                      color="primary"
                      fullWidth
                      sx={{ 
                        fontWeight: 600, 
                        fontSize: '1.1rem', 
                        py: 1.5,
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        opacity: 0.7,
                        textAlign: 'left',
                        justifyContent: 'flex-start',
                        pl: 2
                      }}
                    >
                      {prompt.text}
                    </Button>
                    <Box 
                      sx={{ 
                        position: 'absolute', 
                        right: 10, 
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        color: 'text.secondary'
                      }}
                    >
                      <Typography variant="caption">Your prompt</Typography>
                    </Box>
                  </Box>
                </Tooltip>
              ) : (
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
              )
            ))}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
} 
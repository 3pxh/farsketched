import { useClientGameState } from '@/contexts/GameState';
import { GameState } from '../types';
import { Box, Paper, Avatar, Typography, Stack } from '@mui/material';
import { usePeer } from '@/contexts/PeerContext';

export function ScoringStage() {
  const { state: gameState } = useClientGameState<GameState>();
  const { peerId } = usePeer();
  const player = gameState.players[peerId];
  
  // Calculate round score breakdown for the current player
  let promptScore = 0;
  let guessScore = 0;
  if (gameState.activeText) {
    // Points for text creator (real prompt)
    if (gameState.texts[gameState.activeText.textId]?.creatorId === peerId) {
      const correctGuesses = gameState.activeText.guesses.filter(g => g.isCorrect).length;
      promptScore += correctGuesses * 5;
    }
    // Points for fake prompt authors
    for (const fakePrompt of gameState.activeText.fakePrompts) {
      if (fakePrompt.authorId === peerId) {
        const guessesForThisFake = gameState.activeText.guesses.filter(
          guess => guess.promptId === fakePrompt.id
        ).length;
        promptScore += guessesForThisFake * 3;
      }
    }
    // Points for guessing correctly
    const playerGuess = gameState.activeText.guesses.find(
      guess => guess.playerId === peerId
    );
    if (playerGuess && playerGuess.isCorrect) {
      guessScore += 5;
    }
  }
  const roundScore = promptScore + guessScore;

  // Sort players by points in descending order
  const sortedPlayers = Object.values(gameState.players)
    .sort((a, b) => b.points - a.points);

  return (
    <Box sx={{ p: 2, width: '100%', maxWidth: 600, mx: 'auto' }}>
      <Paper elevation={3} sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.8)' }}>
        <Box display="flex" flexDirection="column" alignItems="center" sx={{ mb: 2 }}>
          <Avatar
            src={player?.avatarUrl}
            alt={player?.name}
            sx={{ width: 64, height: 64, mb: 1 }}
          />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {player?.name}
          </Typography>
          <Typography variant="subtitle1" align="center">
            Your score this round: <b>{roundScore}</b>
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary">
            • Prompt score: <b>{promptScore}</b><br />
            • Guess score: <b>{guessScore}</b>
          </Typography>
        </Box>
        <Typography variant="h5" gutterBottom align="center" sx={{ mb: 3 }}>
          Current Standings
        </Typography>
        <Stack spacing={2}>
          {sortedPlayers.map((player, index) => (
            <Paper 
              key={player.id} 
              elevation={1} 
              sx={{ 
                p: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                bgcolor: 'rgba(255,255,255,0.6)'
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  minWidth: 32,
                  fontWeight: 'bold',
                  color: index === 0 ? 'gold' : index === 1 ? '#A0A0A0' : index === 2 ? '#CD7F32' : 'inherit'
                }}
              >
                #{index + 1}
              </Typography>
              <Avatar 
                src={player.avatarUrl} 
                alt={player.name}
                sx={{ 
                  width: 48, 
                  height: 48,
                  border: '2px solid #fff',
                  boxShadow: 1
                }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6">
                  {player.name}
                </Typography>
              </Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 'bold',
                  color: 'primary.main'
                }}
              >
                {player.points} pts
              </Typography>
            </Paper>
          ))}
        </Stack>
      </Paper>
    </Box>
  );
} 
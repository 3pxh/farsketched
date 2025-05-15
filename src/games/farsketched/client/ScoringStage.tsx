import { useClientGameState } from '@/contexts/GameState';
import { GameState } from '../types';
import { Box, Paper, Avatar, Typography, Stack } from '@mui/material';

export function ScoringStage() {
  const { state: gameState } = useClientGameState<GameState>();
  
  // Sort players by points in descending order
  const sortedPlayers = Object.values(gameState.players)
    .sort((a, b) => b.points - a.points);

  return (
    <Box sx={{ p: 2, width: '100%', maxWidth: 600, mx: 'auto' }}>
      <Paper elevation={3} sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.8)' }}>
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
import { GameState } from '../types';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Avatar,
  Paper,
  Stack,
} from '@mui/material';

interface LeaderboardProps {
  gameState: GameState;
}

export function Leaderboard({ gameState }: LeaderboardProps) {
  // Sort players by score
  const sortedPlayers = Object.values(gameState.players)
    .sort((a, b) => b.points - a.points);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Paper 
        elevation={3} 
        sx={{ 
          p: { xs: 2, md: 3 }, 
          bgcolor: 'rgba(255,255,255,0.8)',
          width: { xs: '100%', md: '50%' },
          minWidth: { md: 512 },
        }}
      >
        <Typography 
          variant="h4" 
          sx={{ 
            textAlign: 'center', 
            mb: 3,
            fontWeight: 600,
            color: 'primary.main'
          }}
        >
          Leaderboard
        </Typography>
        <Stack spacing={2}>
          {sortedPlayers.map((player, index) => (
            <Box
              key={player.id}
              component={motion.div}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                bgcolor: 'grey.100',
                borderRadius: 2,
                p: 2,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Rank */}
              <Typography
                sx={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'primary.main',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '1.2rem',
                }}
              >
                #{index + 1}
              </Typography>
              
              {/* Player Info */}
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 5, flex: 1 }}>
                <Avatar
                  src={player.avatarUrl}
                  alt={player.name}
                  sx={{ 
                    width: 48, 
                    height: 48, 
                    border: '2px solid #fff', 
                    boxShadow: 1,
                    mr: 2
                  }}
                />
                <Typography 
                  sx={{ 
                    flex: 1,
                    fontWeight: 500,
                    fontSize: '1.2rem',
                  }}
                >
                  {player.name}
                </Typography>
                <Typography 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: '1.5rem',
                    color: 'primary.main',
                    minWidth: 60,
                    textAlign: 'right'
                  }}
                >
                  {player.points}
                </Typography>
              </Box>
            </Box>
          ))}
        </Stack>
      </Paper>
    </motion.div>
  );
} 
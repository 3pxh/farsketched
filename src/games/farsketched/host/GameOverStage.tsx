import { GameState, AchievementType } from '../types';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Stack,
} from '@mui/material';
import { useEffect, useState } from 'react';
import EndCredits from '../../../components/EndCredits';

interface GameOverStageProps {
  gameState: GameState;
}

const ACHIEVEMENT_TITLES: Record<AchievementType, string> = {
  [AchievementType.MOST_ACCURATE]: 'Realist',
  [AchievementType.BEST_BULLSHITTER]: 'Bullshitter',
  [AchievementType.THE_CHAOTICIAN]: 'Chaotician',
  [AchievementType.THE_PAINTER]: 'Painter'
};

const ACHIEVEMENT_DESCRIPTIONS: Record<AchievementType, string> = {
  [AchievementType.MOST_ACCURATE]: 'Guessed the truth the most times',
  [AchievementType.BEST_BULLSHITTER]: 'Fooled the most people with lies',
  [AchievementType.THE_CHAOTICIAN]: 'Created chaotic voting patterns',
  [AchievementType.THE_PAINTER]: 'Your images were guessed correctly'
};

export function GameOverStage({ gameState }: GameOverStageProps) {
  const [showCredits, setShowCredits] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowCredits(true);
    }, 25000);

    return () => clearTimeout(timer);
  }, []);

  if (showCredits) {
    const credits = [
      { role: 'Game Design', name: 'george' },
      { role: 'Development', name: 'george + benjamin' },
      { role: 'Design + Usability', name: 'benjamin' },
      { role: 'Testing', name: 'The Farsketched Community, i.e. all of you!' },
    ];

    return <EndCredits credits={credits} highlights={[]} />;
  }

  // Calculate max points for score visualization
  const maxPoints = Math.max(...Object.values(gameState.players).map(p => p.points));
  
  // Sort players by points in ascending order
  const sortedPlayers = Object.values(gameState.players)
    .sort((a, b) => a.points - b.points);

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100%" px={2} pt={2}>
      <Paper elevation={3} sx={{ p: { xs: 3, md: 6 }, width: '100%', maxWidth: { xs: 600, md: 900 }, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.8)' }}>
        {/* Achievements Section */}
        <Box mt={{ xs: 1, md: 0 }} mb={{ xs: 4, md: 6 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom sx={{ fontSize: { xs: '1.3rem', md: '2rem' } }}>Achievements</Typography>
          <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }} gap={{ xs: 2, md: 3 }}>
            {gameState.achievements.map((achievement) => (
              <Paper key={achievement.type} elevation={1} sx={{ p: { xs: 1.5, md: 2 }, display: 'flex', flexDirection: 'column', alignItems: 'center', bgcolor: 'rgba(255,255,255,0.7)' }}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ fontSize: { xs: '1rem', md: '1.3rem' }, mb: 0.5, textAlign: 'center' }}>
                  {ACHIEVEMENT_TITLES[achievement.type]}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.9rem', md: '1.1rem' }, mb: 1, textAlign: 'center' }}>
                  {ACHIEVEMENT_DESCRIPTIONS[achievement.type]}
                </Typography>
                <Stack direction="row" spacing={-1} alignItems="center" justifyContent="center" sx={{ mb: 1 }}>
                  {achievement.playerIds.map(playerId => {
                    const player = gameState.players[playerId];
                    return (
                      <Avatar
                        key={playerId}
                        src={player.avatarUrl}
                        alt={player.name}
                        sx={{ width: { xs: 36, md: 48 }, height: { xs: 36, md: 48 }, border: '2px solid #fff', boxShadow: 1 }}
                      />
                    );
                  })}
                </Stack>
                <Typography variant="body2" color="primary" fontWeight={500} sx={{ fontSize: { xs: '0.95rem', md: '1.1rem' }, textAlign: 'center' }}>
                  {achievement.playerIds.map(playerId => gameState.players[playerId].name).join(' & ')}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Box>
        {/* Scores Section */}
        <Box>
          <Typography variant="h5" fontWeight={600} gutterBottom sx={{ fontSize: { xs: '1.3rem', md: '2rem' } }}>Final Scores</Typography>
          <Box display="flex" justifyContent="center" alignItems="end" gap={{ xs: 2, md: 4 }} sx={{ minHeight: { xs: 180, md: 260 }, mt: { xs: 2, md: 4 } }}>
            {sortedPlayers.map((player) => {
              const heightPercentage = (player.points / maxPoints) * 100;
              return (
                <Box key={player.id} display="flex" flexDirection="column" alignItems="center" width={{ xs: 48, md: 64 }}>
                  <Box
                    sx={{
                      height: { xs: 120, md: 180 },
                      width: '100%',
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                    }}
                  >
                    <Box
                      sx={{
                        width: { xs: 28, md: 40 },
                        height: `${heightPercentage}%`,
                        bgcolor: 'primary.main',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                        transition: 'height 0.5s',
                        position: 'relative',
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#000',
                          fontWeight: 700,
                          position: 'absolute',
                          top: -28,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          whiteSpace: 'nowrap',
                          fontSize: { xs: '1rem', md: '1.3rem' },
                        }}
                      >
                        {player.points}
                      </Typography>
                    </Box>
                  </Box>
                  <Avatar
                    src={player.avatarUrl}
                    alt={player.name}
                    sx={{ width: { xs: 40, md: 56 }, height: { xs: 40, md: 56 }, mt: 1, border: '2px solid #fff', boxShadow: 1 }}
                  />
                </Box>
              );
            })}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
} 
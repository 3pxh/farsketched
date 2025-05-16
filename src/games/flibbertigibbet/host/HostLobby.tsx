import { Player, GameConfig } from '../types';
import { usePeer } from '@/contexts/PeerContext';
import {
  Box,
  Typography,
  Paper,
  Avatar,
} from '@mui/material';
import { JoinGameQR } from '@/components/JoinGameQR';
import { Game } from '@/types/games';

interface HostLobbyProps {
  gameConfig: GameConfig;
  players: Player[];
}

export const HostLobby = ({ gameConfig, players }: HostLobbyProps) => {
  const { peerId } = usePeer();

  return (
    <Box sx={{ p: 3, height: '100%', maxWidth: '100vw', overflowX: 'auto' }}>
      <h1>Flibbertigibbet</h1>
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
        gap: 4,
        height: '100%',
        maxWidth: '100%',
        minWidth: 0,
      }}>
        {/* Players Section */}
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(8px)',
            minWidth: 0,
            maxWidth: '100%',
          }}
        >
          <Typography variant="h4" gutterBottom>
            Players ({players.length}/{gameConfig.maxPlayers})
          </Typography>
          <Box sx={{ 
            mt: 2, 
            flex: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 2,
            alignContent: 'start',
            minWidth: 0,
            maxWidth: '100%',
          }}>
            {players.map((player) => (
              <Box
                key={player.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 1,
                  borderRadius: 1,
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  minWidth: 0,
                  overflow: 'hidden',
                }}
              >
                <Avatar
                  src={player.avatarUrl}
                  alt={player.name}
                  sx={{ width: 48, height: 48 }}
                />
                <Typography
                  variant="h6"
                  sx={{
                    textDecoration: player.connected ? 'none' : 'line-through',
                    opacity: player.connected ? 1 : 0.7,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    minWidth: 0,
                  }}
                >
                  {player.name}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>

        {/* QR Section */}
        {peerId && <JoinGameQR peerId={peerId} gameName={Game.FLIBBERTIGIBBET} />}
      </Box>
    </Box>
  );
}; 

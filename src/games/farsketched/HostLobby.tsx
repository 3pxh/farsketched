import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Player, GameConfig } from '@/games/farsketched/types';
import { usePeer } from '@/contexts/PeerContext';
import {
  Box,
  Typography,
  Button,
  Paper,
  Avatar,
  Snackbar,
  Alert,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

interface HostLobbyProps {
  gameConfig: GameConfig;
  players: Player[];
}

export const HostLobby = ({ gameConfig, players }: HostLobbyProps) => {
  const { peerId } = usePeer();
  const [joinUrl, setJoinUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (peerId) {
      const url = new URL('http://localhost:8000/clientindex.html');
      url.searchParams.set('roomCode', peerId);
      setJoinUrl(url.toString());
    }
  }, [peerId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setIsCopied(true);
  };

  return (
    <Box sx={{ p: 3, height: '100%', maxWidth: '100vw', overflowX: 'auto' }}>
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
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(8px)',
            minWidth: 0,
            maxWidth: '100%',
          }}
        >
          <Typography variant="h4" gutterBottom>
            Scan to Join
          </Typography>
          {joinUrl && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Box
                sx={{
                  p: 0.5,
                  bgcolor: 'white',
                  borderRadius: 2,
                  display: 'inline-block',
                  maxWidth: '100%',
                  minWidth: 0,
                }}
              >
                <QRCodeSVG
                  value={joinUrl}
                  size={256}
                  level="H"
                  marginSize={4}
                />
              </Box>
              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<ContentCopyIcon />}
                  onClick={handleCopyLink}
                  size="large"
                >
                  Copy Link
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      </Box>

      <Snackbar
        open={isCopied}
        autoHideDuration={2000}
        onClose={() => setIsCopied(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity="success" 
          variant="filled"
          sx={{ 
            bgcolor: '#00c853',
            color: 'white',
            '& .MuiAlert-icon': {
              display: 'none'
            }
          }}
        >
          Link copied to clipboard!
        </Alert>
      </Snackbar>
    </Box>
  );
}; 

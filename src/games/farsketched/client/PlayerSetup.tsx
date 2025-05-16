import { useState, useEffect } from 'react';
import { usePeer } from '@/contexts/PeerContext';
import { MessageType, GameMessage } from '../types';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  IconButton,
  Slide,
  Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { UniqueEmoji } from '@/games/lobby/UniqueEmoji';

// RoboHash sets - each provides a different style of avatar
const AVATAR_SETS = [
  'set1', // Robots
  'set2', // Monsters
  'set3', // Robot Heads
  'set4', // Cats
] as const;

type AvatarSet = typeof AVATAR_SETS[number];

export const PlayerSetup = () => {
  const { peerId, sendMessage } = usePeer<GameMessage>();
  const [name, setName] = useState('');
  const [avatarSet, setAvatarSet] = useState<AvatarSet>('set1');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showMiniGame, setShowMiniGame] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [scoringOpen, setScoringOpen] = useState(false);

  // Helper function to generate avatar URL
  const getAvatarUrl = (seed: string, set: AvatarSet) => {
    return `https://robohash.org/${encodeURIComponent(seed)}.png?set=${set}&size=200x200&bgset=bg1`;
  };

  // Generate preview URL using current name or a default seed
  const getPreviewUrl = (set: AvatarSet) => {
    const seed = name.trim() || 'preview';
    return getAvatarUrl(seed, set);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown !== null && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (countdown === 0) {
      const message: GameMessage = {
        type: MessageType.REQUEST_START_GAME,
        playerId: peerId,
        timestamp: Date.now(),
        messageId: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      };
      sendMessage(message);
      setCountdown(null);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown, peerId, sendMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const message: GameMessage = {
      type: MessageType.SET_PLAYER_INFO,
      playerId: peerId,
      name: name.trim(),
      avatarUrl: getAvatarUrl(name, avatarSet),
      timestamp: Date.now(),
      messageId: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    };

    sendMessage(message);
    setIsSubmitted(true);
  };

  const handleStartGame = () => {
    setCountdown(5);
  };

  const handleCancelStart = () => {
    setCountdown(null);
    const message: GameMessage = {
      type: MessageType.CANCEL_START_GAME,
      playerId: peerId,
      timestamp: Date.now(),
      messageId: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    };
    sendMessage(message);
  };

  const handleLeaveGame = () => {
    const message: GameMessage = {
      type: MessageType.PLAYER_LEFT,
      playerId: peerId,
      timestamp: Date.now(),
      messageId: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    };
    sendMessage(message);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const currentTouch = e.touches[0].clientY;
    const diff = currentTouch - touchStart;
    
    if (diff > 100) {
      setShowMiniGame(false);
      setTouchStart(null);
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };

  if (isSubmitted) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          width: '100%',
          background: 'linear-gradient(135deg, #f8cdda 0%, #a1c4fd 100%)',
          backgroundAttachment: 'fixed',
        }}
      >
        <Container
          maxWidth="xs"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            textAlign: 'center',
            p: 3,
          }}
        >
          <Paper elevation={3} sx={{ p: 4, width: '100%', bgcolor: 'rgba(255,255,255,0.8)', borderRadius: 2 }}>
            <Typography variant="h4" gutterBottom>
              Welcome, {name}!
            </Typography>
            {/* Single fixed avatar */}
            <Box sx={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              overflow: 'hidden',
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3
            }}>
              <Box 
                component="img"
                src={getAvatarUrl(name, avatarSet)}
                alt={name}
                sx={{ 
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </Box>
            {countdown !== null ? (
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Game starting in {countdown} seconds...
                </Typography>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleCancelStart}
                  fullWidth
                >
                  Cancel
                </Button>
              </Box>
            ) : (
              <Box sx={{ width: '100%'}}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Waiting for the host to start the game...
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleStartGame}
                  fullWidth
                  sx={{ mb: 1 }}
                >
                  Start Game
                </Button>
                {!showMiniGame && (
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => setShowMiniGame(true)}
                    fullWidth
                    sx={{ mb: 1 }}
                    startIcon={<SportsEsportsIcon />}
                  >
                    Play while you wait
                  </Button>
                )}
                <Button
                  variant="outlined"
                  color="info"
                  onClick={() => setScoringOpen(true)}
                  fullWidth
                  startIcon={<InfoOutlinedIcon />}
                  sx={{ mb: 1 }}
                >
                  Scoring Rules
                </Button>
              </Box>
            )}
            <Button
              variant="outlined"
              color="error"
              onClick={handleLeaveGame}
              fullWidth
              sx={{ mt: 2 }}
            >
              Leave Game
            </Button>
            {/* Scoring Rules Modal */}
            <Dialog open={scoringOpen} onClose={() => setScoringOpen(false)}>
              <DialogTitle>Scoring Rules</DialogTitle>
              <DialogContent>
                <Typography variant="body1" gutterBottom>
                  <b>How do you earn points?</b>
                </Typography>
                <ul style={{ marginLeft: 16, marginBottom: 0 }}>
                  <li><b>+5 points</b> for each correct guess on your real prompt (as image creator)</li>
                  <li><b>+3 points</b> for each player who guesses your fake prompt</li>
                  <li><b>+5 points</b> if you guess the real prompt correctly</li>
                </ul>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Try to fool others with your fake prompts, but also spot the real one to maximize your score!
                </Typography>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setScoringOpen(false)} color="primary" autoFocus>
                  Close
                </Button>
              </DialogActions>
            </Dialog>
          </Paper>
        </Container>

        <Slide direction="up" in={showMiniGame} mountOnEnter unmountOnExit>
          <Box
            sx={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              height: '100vh',
              boxShadow: 3,
              p: 2,
              display: 'flex',
              flexDirection: 'column',
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
              <IconButton onClick={() => setShowMiniGame(false)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
            <UniqueEmoji />
          </Box>
        </Slide>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        background: 'linear-gradient(135deg, #f8cdda 0%, #a1c4fd 100%)',
        backgroundAttachment: 'fixed',
      }}
    >
      <Container
        maxWidth="xs"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          p: 3,
        }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            width: '100%', 
            bgcolor: 'rgba(255,255,255,0.8)',
            borderRadius: 2
          }}
        >
          <Typography variant="h4" gutterBottom>
            Join Game
          </Typography>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              width: '100%',
              mt: 2,
            }}
          >
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              mb: 2
            }}>
              {/* Main selected avatar */}
              <Box sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                overflow: 'hidden',
                bgcolor: 'background.paper',
                border: 1,
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Box
                  component="img"
                  src={getAvatarUrl(name || 'default', avatarSet)}
                  alt="Avatar"
                  sx={{ 
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </Box>

              {/* Avatar selection row */}
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                justifyContent: 'center'
              }}>
                {AVATAR_SETS.map((set) => (
                  <Box
                    key={set}
                    onClick={() => setAvatarSet(set)}
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      overflow: 'hidden',
                      bgcolor: 'background.paper',
                      border: 2,
                      borderColor: avatarSet === set ? 'primary.main' : 'divider',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, border-color 0.2s',
                      '&:hover': {
                        transform: 'scale(1.1)',
                      },
                    }}
                  >
                    <Box
                      component="img"
                      src={getPreviewUrl(set)}
                      alt={`Avatar style ${set}`}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </Box>

            <TextField
              fullWidth
              label="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              variant="outlined"
              autoFocus
              sx={{ bgcolor: 'rgba(255,255,255,0.6)' }}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={!name.trim()}
              sx={{ mt: 2 }}
            >
              Join
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}; 

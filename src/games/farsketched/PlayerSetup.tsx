import { useState, useEffect } from 'react';
import { usePeer } from '@/contexts/PeerContext';
import { MessageType, GameMessage } from '@/games/farsketched/types';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Avatar,
  CircularProgress,
} from '@mui/material';
import AutorenewIcon from '@mui/icons-material/Autorenew';

export const PlayerSetup = () => {
  const { peerId, sendMessage } = usePeer<GameMessage>();
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(
    'https://api.dicebear.com/7.x/avataaars/svg?seed=default'
  );
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

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
      avatarUrl,
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
    // Consider redirecting or updating UI state after leaving
  };

  const generateRandomAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    setAvatarUrl(
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`
    );
  };

  if (isSubmitted) {
    return (
      <Container
        maxWidth="xs"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          textAlign: 'center',
          p: 3,
        }}
      >
        <Typography variant="h4" gutterBottom>
          Welcome, {name}!
        </Typography>
        <Avatar
          src={avatarUrl}
          alt={name}
          sx={{ width: 100, height: 100, mb: 2 }}
        />
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
      </Container>
    );
  }

  return (
    <Container
      maxWidth="xs"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        p: 3,
      }}
    >
      <Typography variant="h4" component="h1" gutterBottom>
        Join the Game
      </Typography>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ width: '100%', mt: 1 }}
      >
        <TextField
          margin="normal"
          required
          fullWidth
          id="name"
          label="Your Name"
          name="name"
          autoComplete="off"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          inputProps={{ maxLength: 20 }}
        />

        <Box sx={{ my: 2, textAlign: 'center' }}>
          <Typography variant="subtitle1" gutterBottom>
            Your Avatar
          </Typography>
          <Avatar
            src={avatarUrl}
            alt="Your avatar"
            sx={{ width: 100, height: 100, margin: 'auto', mb: 1 }}
          />
          <Button
            type="button"
            variant="outlined"
            onClick={generateRandomAvatar}
            startIcon={<AutorenewIcon />}
          >
            Randomize Avatar
          </Button>
        </Box>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={!name.trim()}
          sx={{ mt: 3, mb: 2 }}
        >
          Join Game
        </Button>
      </Box>
    </Container>
  );
}; 

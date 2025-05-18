import { Player } from '../types';
import { usePeer } from '@/contexts/PeerContext';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  TextField,
  Button,
  Stack,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { JoinGameQR } from '@/components/JoinGameQR';
import { Game } from '@/types/games';
import CloseIcon from '@mui/icons-material/Close';

const PRESET_INSTRUCTIONS = [
  {
    title: "Flibbertigibbet",
    summary: "A dictionary for made up words",
    ai: "Provide dictionary definitions for silly sounding made up words, but make the definition not reference the sound of the word directly. Provide the part of speech, definition, and example sentence. Do not include the word in any of your output, use underscores to indicate a blank in the example sentence.",
    human: "Write a silly sounding made-up word",
  },
  {
    title: "Tresmojis",
    summary: "3 emojis to describe anything",
    ai: "Respond with a category which the text belongs to followed by three emojis representing the text. For example 'The Matrix' outputs [movie] 💊💻🕶️ . Never repeat the user request in your response.",
    human: "Name anything. A movie, a book, describe a memory, a person, and get 3 emojis back.",
  },
  {
    title: "Gisticle",
    summary: "Among the 5 best reasons to love a robot",
    ai: "Write a list of 5 items of 'The 5 best <user request>' but do not repeat the topic itself and do not give a title to the list.",
    human: "The 5 best...",
  },
  {
    title: "Haikool",
    summary: "five-seven-five; say more with less",
    ai: "Write a haiku about the topic, but do not repeat the topic itself. The poem should be somewhat cryptic.",
    human: "What would you like a haiku about?",
  },
];

interface HostLobbyProps {
  players: Player[];
  setInstructions: (instructions: {ai: string, human: string}) => void;
  instructions: {ai: string, human: string};
}

export const HostLobby = ({ players, setInstructions, instructions }: HostLobbyProps) => {
  const { peerId } = usePeer();

  return (
    <Box sx={{ p: 3, height: '100%', maxWidth: '100vw', overflowX: 'auto' }}>
      <h1>Flibbertigibbet</h1>
      
      {!instructions.ai && (
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          sx={{ mb: 3 }}
        >
          {PRESET_INSTRUCTIONS.map((preset) => (
            <Button
              key={preset.title}
              variant="outlined"
              onClick={() => setInstructions({ai: preset.ai, human: preset.human})}
              sx={{
                flex: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.4)',
                },
                color: 'black',
                whiteSpace: 'normal',
                height: 'auto',
                py: 2,
                px: 3,
              }}
            >
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {preset.title}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {preset.summary}
                </Typography>
              </Box>
            </Button>
          ))}
        </Stack>
      )}

      {instructions.ai && (
        <>
          <Typography variant="h5" sx={{ mb: 2 }}>
            {PRESET_INSTRUCTIONS.find(preset => preset.ai === instructions.ai)?.title || 'Custom Instructions'}
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Instructions for the AI"
              value={instructions.ai}
              onChange={(e) => setInstructions({ai: e.target.value, human: instructions.human})}
              InputProps={{
                endAdornment: (
                  <InputAdornment 
                    position="end" 
                    sx={{ 
                      position: 'absolute',
                      top: -5,
                      right: -5,
                      height: 'auto',
                      margin: 0,
                      padding: '2px',
                    }}
                  >
                    <IconButton
                      onClick={() => setInstructions({ai: '', human: ''})}
                      edge="end"
                      size="small"
                      sx={{ 
                        color: 'rgba(0, 0, 0, 0.6)',
                        '&:hover': {
                          color: 'rgba(0, 0, 0, 0.8)',
                        }
                      }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(8px)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  },
                  paddingTop: '8px',
                },
              }}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Instructions for the Players"
              value={instructions.human}
              onChange={(e) => setInstructions({ai: instructions.ai, human: e.target.value})}
              InputProps={{
                endAdornment: (
                  <InputAdornment 
                    position="end" 
                    sx={{ 
                      position: 'absolute',
                      top: -5,
                      right: -5,
                      height: 'auto',
                      margin: 0,
                      padding: '2px',
                    }}
                  >
                    <IconButton
                      onClick={() => setInstructions({ai: '', human: ''})}
                      edge="end"
                      size="small"
                      sx={{ 
                        color: 'rgba(0, 0, 0, 0.6)',
                        '&:hover': {
                          color: 'rgba(0, 0, 0, 0.8)',
                        }
                      }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(8px)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  },
                  paddingTop: '8px',
                },
              }}
            />
          </Stack>
        </>
      )}

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
            {players.length} Players in lobby
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

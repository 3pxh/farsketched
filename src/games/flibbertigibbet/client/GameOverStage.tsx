import { useState, useMemo } from 'react';
import { GameState } from '../types';
import { useClientGameState } from '@/contexts/GameState';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Snackbar,
  Collapse,
  CardActions,
  Tooltip,
  Avatar,
} from '@mui/material';
import IosShareIcon from '@mui/icons-material/IosShare';
import ShareIcon from '@mui/icons-material/Share';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { TextDisplay } from './TextDisplay';

// Platform detection
const getPlatform = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'ios';
  } else if (/android/.test(userAgent)) {
    return 'android';
  }
  return 'desktop';
};

interface TextCardProps {
  text: GameState['texts'][string];
  creator: GameState['players'][string];
  onShare: () => void;
}

function TextCard({ text, creator, onShare }: TextCardProps) {
  const [expanded, setExpanded] = useState(false);
  const gameStateContext = useClientGameState<GameState>();
  const gameState = gameStateContext.state;

  // Find the history entry for this text
  const historyEntry = gameState.history.find(entry => entry.textId === text.id);
  const fakePrompts = historyEntry?.fakePrompts || [];

  // Determine which share icon to use based on platform
  const ShareButton = useMemo(() => {
    const platform = getPlatform();
    const canShare = navigator.share !== undefined;

    let Icon = FileDownloadIcon;
    let tooltipText = 'Download text';

    if (canShare) {
      if (platform === 'ios') {
        Icon = IosShareIcon;
        tooltipText = 'Share text';
      } else if (platform === 'android') {
        Icon = ShareIcon;
        tooltipText = 'Share text';
      }
    }

    return (
      <Tooltip title={tooltipText}>
        <IconButton 
          onClick={onShare}
          aria-label={tooltipText}
          size="small"
          sx={{ 
            ml: 1,
            color: 'primary.main',
            '&:hover': {
              backgroundColor: 'primary.main',
              color: 'white',
            }
          }}
        >
          <Icon fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  }, [onShare]);

  return (
    <Card>
      <CardContent>
        <TextDisplay text={text.text} />
      </CardContent>
      <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          overflow: 'hidden',
          flex: 1,
          mr: 1
        }}>
          <Avatar
            src={creator?.avatarUrl}
            alt={creator?.name || 'Unknown'}
            sx={{ width: 24, height: 24, flexShrink: 0 }}
          />
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            minWidth: 0 // Enables text truncation
          }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {creator?.name || 'Unknown'}
            </Typography>
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ 
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {text.prompt}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ flexShrink: 0 }}>
          <Tooltip title="Show details">
            <IconButton 
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              aria-label="show details"
              size="small"
            >
              {expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          </Tooltip>
          {ShareButton}
        </Box>
      </CardActions>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent sx={{ pt: 0 }}>
          {fakePrompts.map((fake) => {
            const fakeAuthor = gameState.players[fake.authorId];
            return (
              <Box 
                key={fake.id} 
                sx={{ 
                  mb: 2,
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  '&:last-child': {
                    mb: 0
                  }
                }}
              >
                <Avatar
                  src={fakeAuthor?.avatarUrl}
                  alt={fakeAuthor?.name || 'Unknown'}
                  sx={{ width: 24, height: 24, flexShrink: 0 }}
                />
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  minWidth: 0 // Enables text truncation
                }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {fakeAuthor?.name || 'Unknown'}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                  >
                    {fake.text}
                  </Typography>
                </Box>
              </Box>
            );
          })}
          {fakePrompts.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              No fake prompts were submitted
            </Typography>
          )}
        </CardContent>
      </Collapse>
    </Card>
  );
}

export function GameOverStage() {
  const gameStateContext = useClientGameState<GameState>();
  const gameState = gameStateContext.state;
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Convert all texts to an array and sort by round index
  const allTexts = Object.values(gameState.texts)
    .sort((a, b) => a.roundIndex - b.roundIndex);

  // Function to share a specific text
  const shareText = async (textId: string) => {
    const text = gameState.texts[textId];
    if (!text) return;
    const sanitizedPrompt = text.prompt
      .replace(/[^a-z0-9]/gi, '-') // Replace non-alphanumeric chars with hyphens
      .toLowerCase()
      .substring(0, 50); // Limit length to avoid too long filenames
    const textName = `${sanitizedPrompt}.txt`;
    try {
      // Create a text file for sharing
      const textFile = new File([text.text], textName, {
        type: 'text/plain',
      });

      // Check if the Web Share API is available
      if (navigator.share) {
        await navigator.share({
          files: [textFile],
          title: 'Generated Text',
          text: `Check out this text generated from the prompt: "${text.prompt}"`,
        });
      } else {
        // Fallback to download
        const url = URL.createObjectURL(textFile);
        const a = document.createElement('a');
        a.href = url;
        a.download = textName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Error sharing text:', error);
    }
  };

  return (
    <Box sx={{ p: 2, width: '100%', maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
        Game Over!
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {allTexts.map(text => (
          <TextCard
            key={text.id}
            text={text}
            creator={gameState.players[text.creatorId]}
            onShare={() => shareText(text.id)}
          />
        ))}
      </Box>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message="Text downloaded successfully"
      />
    </Box>
  );
} 
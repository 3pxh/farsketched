import { useState, useMemo } from 'react';
import { GameState } from '../types';
import { useClientGameState } from '@/contexts/GameState';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
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

interface ImageCardProps {
  image: GameState['images'][string];
  creator: GameState['players'][string];
  onShare: () => void;
}

function ImageCard({ image, creator, onShare }: ImageCardProps) {
  const [expanded, setExpanded] = useState(false);
  let imageUrl = '';
  if (image.imageBlob instanceof Blob) {
    imageUrl = URL.createObjectURL(image.imageBlob);
  } else if (ArrayBuffer.isView(image.imageBlob)) {
    const blob = new Blob([image.imageBlob], { type: 'image/webp' });
    imageUrl = URL.createObjectURL(blob);
  } else {
    imageUrl = '';
  }
  const gameStateContext = useClientGameState<GameState>();
  const gameState = gameStateContext.state;

  // Find the history entry for this image
  const historyEntry = gameState.history.find(entry => entry.imageId === image.id);
  const fakePrompts = historyEntry?.fakePrompts || [];

  // Determine which share icon to use based on platform
  const ShareButton = useMemo(() => {
    const platform = getPlatform();
    const canShare = navigator.share !== undefined;

    let Icon = FileDownloadIcon;
    let tooltipText = 'Download image';

    if (canShare) {
      if (platform === 'ios') {
        Icon = IosShareIcon;
        tooltipText = 'Share image';
      } else if (platform === 'android') {
        Icon = ShareIcon;
        tooltipText = 'Share image';
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
      <>
        {!expanded ? (
          <CardMedia
            component="img"
            height="200"
            image={imageUrl}
            alt={image.prompt}
            sx={{ objectFit: 'cover' }}
          />
        ) : (
          <Box
            component="img"
            src={imageUrl}
            alt={image.prompt}
            sx={{
              width: '100%',
              height: 'auto',
              maxHeight: '70vh',
              objectFit: 'contain',
              display: 'block',
              background: '#eee',
            }}
          />
        )}
      </>
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
              {image.prompt}
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

  // Convert all images to an array and sort by round index
  const allImages = Object.values(gameState.images)
    .sort((a, b) => a.roundIndex - b.roundIndex);

  // Function to share a specific image
  const shareImage = async (imageId: string) => {
    const image = gameState.images[imageId];
    if (!image) return;
    const sanitizedPrompt = image.prompt
      .replace(/[^a-z0-9]/gi, '-') // Replace non-alphanumeric chars with hyphens
      .toLowerCase()
      .substring(0, 50); // Limit length to avoid too long filenames
    const imageName = `${sanitizedPrompt}.webp`;
    try {
      // Convert Blob to File for sharing
      const imageFile = new File([image.imageBlob], imageName, {
        type: 'image/webp',
      });

      // Check if the Web Share API is available
      if (navigator.share) {
        await navigator.share({
          title: 'Farsketched Image',
          text: `Check out this AI-generated image from Farsketched! The prompt was: "${image.prompt}"`,
          files: [imageFile],
        });
      } else {
        // Fallback for browsers that don't support Web Share API
        const url = URL.createObjectURL(image.imageBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = imageName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      setSnackbarOpen(true);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom align="center">
        Game Over!
      </Typography>
      
      <Typography variant="h6" gutterBottom align="center" sx={{ mb: 4 }}>
        Gallery of All Images
      </Typography>

      <Box 
        sx={{ 
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)'
          },
          gap: 3
        }}
      >
        {allImages.map((image) => {
          const creator = gameState.players[image.creatorId];
          return (
            <ImageCard
              key={image.id}
              image={image}
              creator={creator}
              onShare={() => shareImage(image.id)}
            />
          );
        })}
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message="Image downloaded successfully!"
      />
    </Box>
  );
} 
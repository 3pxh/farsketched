import { Box, CircularProgress } from '@mui/material';
import { useMemo } from 'react';

interface PlaceholderImageProps {
  text: string;
  showSpinner?: boolean;
}

const EMOJIS = ['🎨', '🖼️', '🌈', '🎭', '✨', '💫', '🌟', '⭐', '🎪', '🎯', '🎲', '🎸', '🎺', '🎭', '🎪', '🎨', '🖼️', '🌈'];

interface EmojiPosition {
  emoji: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  opacity: number;
}

export function PlaceholderImage({ text, showSpinner = false }: PlaceholderImageProps) {
  // Generate random emoji positions
  const emojiPositions = useMemo(() => {
    const positions: EmojiPosition[] = [];
    for (let i = 0; i < 12; i++) {
      positions.push({
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
        x: Math.random() * 100,
        y: Math.random() * 100,
        rotation: Math.random() * 360,
        scale: 0.8 + Math.random() * 1.2,
        opacity: 0.1 + Math.random() * 0.3
      });
    }
    return positions;
  }, []);

  return (
    <Box
      sx={{
        aspectRatio: '1',
        bgcolor: 'rgba(0,0,0,0.05)',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        color: 'text.secondary',
        textAlign: 'center',
        fontSize: '0.9rem',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background emojis */}
      {emojiPositions.map((pos, index) => (
        <Box
          key={index}
          sx={{
            position: 'absolute',
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            transform: `translate(-50%, -50%) rotate(${pos.rotation}deg) scale(${pos.scale})`,
            fontSize: '2rem',
            opacity: pos.opacity,
            pointerEvents: 'none',
            userSelect: 'none'
          }}
        >
          {pos.emoji}
        </Box>
      ))}
      
      {/* Content */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {showSpinner && <CircularProgress size={24} sx={{ mb: 2 }} />}
        {text}
      </Box>
    </Box>
  );
} 
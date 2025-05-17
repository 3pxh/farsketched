import { Box, CircularProgress } from '@mui/material';
import { useMemo } from 'react';

interface TextDisplayProps {
  text: string;
  showSpinner?: boolean;
}

const DECORATIONS = ['📝', '✍️', '📚', '📖', '📜', '📄', '📋', '📓', '📔', '📒', '📑', '🔖', '📌', '📍', '✏️', '✒️', '🖋️', '🖊️'];

interface DecorationPosition {
  decoration: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  opacity: number;
}

export function TextDisplay({ text, showSpinner = false }: TextDisplayProps) {
  // Calculate font size based on text length
  const fontSize = useMemo(() => {
    return `${Math.max(1, 3-(text.length/50))}rem`

  }, [text.length]);

  // Generate random decoration positions
  const decorationPositions = useMemo(() => {
    const positions: DecorationPosition[] = [];
    for (let i = 0; i < 8; i++) {
      positions.push({
        decoration: DECORATIONS[Math.floor(Math.random() * DECORATIONS.length)],
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
        width: '100%',
        minHeight: '200px',
        bgcolor: 'rgba(0,0,0,0.05)',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        color: 'text.secondary',
        textAlign: 'center',
        fontSize,
        position: 'relative',
        overflow: 'hidden',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
      }}
    >
      {/* Background decorations */}
      {decorationPositions.map((pos, index) => (
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
          {pos.decoration}
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
          justifyContent: 'center',
          width: '100%',
          maxWidth: '800px'
        }}
      >
        {showSpinner && <CircularProgress size={24} sx={{ mb: 2 }} />}
        {text}
      </Box>
    </Box>
  );
} 
import { useState, useEffect } from 'react';
import { Box } from '@mui/material';

// Emoji animation component
function EmojiAnimation() {
  const [emojis, setEmojis] = useState<Array<{id: number, emoji: string, x: number, y: number, scale: number, opacity: number}>>([]);
  
  // Array of question mark and surprise themed emojis
  const emojiOptions = ['❓', '❔', '⁉️', '‼️', '❗', '❕', '⭐', '🎯', '🧩', '🤔', '🧐', '😮', '😲', '😯', '🤷‍♀️', '🤷‍♂️'];
  
  useEffect(() => {
    // Function to create a new random emoji
    const createEmoji = () => {
      return {
        id: Math.random(),
        emoji: emojiOptions[Math.floor(Math.random() * emojiOptions.length)],
        x: Math.random() * 100, // Random position from 0-100% of screen width
        y: Math.random() * 100, // Random position from 0-100% of screen height
        scale: 2 + Math.random() * 4, // Random scale between 2 and 6 (much bigger than before)
        opacity: 1
      };
    };
    
    // Add a new emoji every 800ms
    const intervalId = setInterval(() => {
      setEmojis((current) => [...current, createEmoji()]);
    }, 800);
    
    // Remove emojis after they fade out
    const fadeIntervalId = setInterval(() => {
      setEmojis((current) => 
        current.map((emoji) => 
          emoji.opacity > 0 ? { ...emoji, opacity: emoji.opacity - 0.02 } : emoji
        ).filter((emoji) => emoji.opacity > 0)
      );
    }, 50);
    
    return () => {
      clearInterval(intervalId);
      clearInterval(fadeIntervalId);
    };
  }, []);
  
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none', // Make sure it doesn't interfere with clicks
        zIndex: 10,
        overflow: 'hidden'
      }}
    >
      {emojis.map((emoji) => (
        <Box
          key={emoji.id}
          sx={{
            position: 'absolute',
            left: `${emoji.x}%`,
            top: `${emoji.y}%`,
            fontSize: `${emoji.scale}rem`,
            opacity: emoji.opacity,
            transition: 'opacity 2s ease-out, transform 0.5s ease-out',
            transform: `scale(${emoji.opacity * 1.5})`,
            animation: 'pop-in 0.3s ease-out',
          }}
        >
          {emoji.emoji}
        </Box>
      ))}
      <style>{`
        @keyframes pop-in {
          0% {
            transform: scale(0);
          }
          70% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </Box>
  );
}

export function GuessingStage() {
  return (
    <Box 
      sx={{
        position: 'relative',
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Box 
        sx={{ 
          fontSize: '2rem', 
          marginY: 4,
          textAlign: 'center'
        }}
      >
        Players are making their guesses...
      </Box>
      <EmojiAnimation />
    </Box>
  );
} 
import { useEffect, useState } from 'react';
import { GameState } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Typography,
  Paper,
} from '@mui/material';
import { RevealedPrompt } from './RevealedPrompt';

interface BasePrompt {
  id: string;
  text: string;
  isReal: boolean;
  authorId: string;
}

interface RevealGuessesProps {
  gameState: GameState;
  onComplete: () => void;
}

export function RevealGuesses({ gameState, onComplete }: RevealGuessesProps) {
  if (!gameState.activeImage) return <Typography>No active image to score</Typography>;

  const image = gameState.images[gameState.activeImage.imageId];
  if (!image) return <Typography>Image not found</Typography>;

  // Group guesses by promptId
  const guessesByPrompt = gameState.activeImage.guesses.reduce((acc, guess) => {
    if (!acc[guess.promptId]) {
      acc[guess.promptId] = [];
    }
    acc[guess.promptId].push(guess.playerId);
    return acc;
  }, {} as Record<string, string[]>);

  // Get all prompts (real + fake)
  const allPrompts: BasePrompt[] = [
    { id: 'real', text: image.prompt, isReal: true, authorId: image.creatorId },
    ...gameState.activeImage.fakePrompts.map(fp => ({
      id: fp.id,
      text: fp.text,
      isReal: false,
      authorId: fp.authorId
    }))
  ];

  // State for how many prompts are revealed
  const [revealedCount, setRevealedCount] = useState(1);

  // Auto-advance logic for prompts
  useEffect(() => {
    if (revealedCount < allPrompts.length) {
      const timer = setTimeout(() => {
        setRevealedCount(count => count + 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // After all prompts are revealed, wait a bit then call onComplete
      const timer = setTimeout(() => {
        onComplete();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [revealedCount, allPrompts.length, onComplete]);

  // Sort all prompts by fewest to most guessers
  const sortedPrompts = [...allPrompts]
    .sort((a, b) => (guessesByPrompt[a.id]?.length || 0) - (guessesByPrompt[b.id]?.length || 0));
  // Take the first N revealed, then reverse so newest is at the top
  const revealedPrompts = sortedPrompts.slice(0, revealedCount).reverse();

  return (
    <motion.div
      key="prompts"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Paper 
        elevation={3} 
        sx={{ 
          p: { xs: 2, md: 3 }, 
          bgcolor: 'rgba(255,255,255,0.8)',
          width: { xs: '100%', md: '50%' },
          minWidth: { md: 512 },
        }}
      >
        <Box sx={{ minHeight: 90 }}>
          <AnimatePresence>
            {revealedPrompts.map((prompt) => {
              const guesserIds = guessesByPrompt[prompt.id] || [];
              const guessers = guesserIds.map(id => gameState.players[id]);
              const author = gameState.players[prompt.authorId];

              return (
                <RevealedPrompt
                  key={prompt.id}
                  prompt={prompt}
                  author={author}
                  guessers={guessers}
                />
              );
            })}
          </AnimatePresence>
        </Box>
      </Paper>
    </motion.div>
  );
} 
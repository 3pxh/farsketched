import { useState, useMemo } from 'react';
import { GameState } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Typography } from '@mui/material';
import { RevealTheTruth } from './RevealTheTruth';
import { RevealGuesses } from './RevealGuesses';
import { Leaderboard } from './Leaderboard';

export function ScoringStageAlt({ gameState }: { gameState: GameState }) {
  if (!gameState.activeImage) return <Typography>No active image to score</Typography>;

  const image = gameState.images[gameState.activeImage.imageId];
  if (!image) return <Typography>Image not found</Typography>;

  const imageUrl = useMemo(() => URL.createObjectURL(image.imageBlob), [image.imageBlob]);
  const [showTruth, setShowTruth] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  return (
    <Box 
      sx={{
        position: 'relative',
        flex: 1,
        minHeight: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        p: 2,
        overflow: 'hidden'
      }}
    >
      <AnimatePresence mode="wait">
        {!showTruth ? (
          <RevealGuesses 
            gameState={gameState} 
            onComplete={() => setShowTruth(true)} 
          />
        ) : !showLeaderboard ? (
          <motion.div
            key="truth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <RevealTheTruth
              imageUrl={imageUrl}
              prompt={image.prompt}
              authorName={gameState.players[image.creatorId].name}
              authorAvatarUrl={gameState.players[image.creatorId].avatarUrl}
              onComplete={() => setShowLeaderboard(true)}
            />
          </motion.div>
        ) : (
          <Leaderboard gameState={gameState} />
        )}
      </AnimatePresence>
    </Box>
  );
} 
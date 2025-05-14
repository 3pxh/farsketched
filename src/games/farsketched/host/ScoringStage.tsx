import { useEffect, useState, useRef, useMemo } from 'react';
import { GameState } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Typography,
  Avatar,
  Paper,
  Stack,
} from '@mui/material';

// Define prompt types
interface BasePrompt {
  id: string;
  text: string;
  isReal: boolean;
  authorId: string;
}

interface DisplayPrompt extends BasePrompt {
  roundScore: number;
  noSubmission?: boolean;
}

// Component for avatar + score
function CreatorAvatarWithScore({
  prompt,
  creator,
  points,
  showRealFake,
  guessersShown
}: {
  prompt: DisplayPrompt;
  creator: any;
  points: number;
  showRealFake: boolean;
  guessersShown: number;
}) {
  return (
    <Box
      component={motion.div}
      sx={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 64 }}
      layout
    >
      <Avatar
        src={creator.avatarUrl}
        alt={creator.name}
        sx={{ width: 48, height: 48, mb: 0.5, border: '2px solid #fff', boxShadow: 1 }}
        title={creator.name + (prompt.isReal ? ' (Creator)' : '')}
      />
      {/* Show points badge after real/fake is revealed */}
      {showRealFake ? points > 0 && (
        <Box sx={{ position: 'absolute', top: 0, right: -8, bgcolor: 'primary.main', color: '#fff', borderRadius: 2, px: 1, fontWeight: 700, fontSize: 14, boxShadow: 2 }}>
          +{points}
        </Box>
      ) : guessersShown > 0 && (
        <Box
          component={motion.span}
          sx={{ position: 'absolute', top: 0, right: -8, bgcolor: 'primary.main', color: '#fff', borderRadius: 2, px: 1, fontWeight: 700, fontSize: 14, boxShadow: 2 }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          layout={false}
        >
          +{guessersShown * 5}
        </Box>
      )}
      {/* Always show total score when row enters */}
      <Typography variant="caption" sx={{ mt: 0.5, fontWeight: 700, fontSize: { xs: '1.1rem', md: '1.3rem' } }}>{creator.points}</Typography>
    </Box>
  );
}

export function ScoringStage({ gameState }: { gameState: GameState }) {
  if (!gameState.activeImage) return <Typography>No active image to score</Typography>;

  const image = gameState.images[gameState.activeImage.imageId];
  if (!image) return <Typography>Image not found</Typography>;

  const imageUrl = useMemo(() => URL.createObjectURL(image.imageBlob), [image.imageBlob]);

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

  // Find all connected players who didn't submit a fake prompt and aren't the image creator
  const missingPromptPlayers = useMemo((): BasePrompt[] => {
    const promptAuthorIds = new Set(allPrompts.map(p => p.authorId));
    const connectedPlayers = Object.values(gameState.players).filter(
      player => player.connected && !promptAuthorIds.has(player.id)
    );
    return connectedPlayers.map(player => ({
      id: `missing-${player.id}`,
      text: "No prompt submitted",
      isReal: false,
      authorId: player.id,
      noSubmission: true
    }));
  }, [allPrompts, gameState.players]);

  // State for whether to show missing players
  const [showMissingPlayers, setShowMissingPlayers] = useState(false);

  // State for how many prompts are revealed
  const [revealedCount, setRevealedCount] = useState(1);

  // Auto-advance logic
  useEffect(() => {
    if (revealedCount < allPrompts.length) {
      const timer = setTimeout(() => {
        setRevealedCount(count => count + 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [revealedCount, allPrompts.length]);

  // Sort all prompts by fewest to most guessers
  const sortedPrompts = [...allPrompts]
    .sort((a, b) => (guessesByPrompt[a.id]?.length || 0) - (guessesByPrompt[b.id]?.length || 0));
  // Take the first N revealed, then reverse so newest is at the top
  const revealedPrompts = sortedPrompts.slice(0, revealedCount).reverse();

  // Progressive reveal state for the topmost prompt
  const topPrompt = revealedPrompts[0];
  const topPromptGuessers = guessesByPrompt[topPrompt.id] || [];
  const [topGuessersShown, setTopGuessersShown] = useState(topPromptGuessers.length);
  const [topShowAuthor, setTopShowAuthor] = useState(true);
  const prevTopPromptId = useRef(topPrompt.id);
  // For real/fake reveal after last prompt's author is shown
  const [showRealFake, setShowRealFake] = useState(false);

  useEffect(() => {
    // If a new prompt is revealed, start progressive reveal
    if (topPrompt.id !== prevTopPromptId.current) {
      setTopGuessersShown(0);
      setTopShowAuthor(false);
      prevTopPromptId.current = topPrompt.id;
    }
    if (topGuessersShown < topPromptGuessers.length) {
      const t = setTimeout(() => setTopGuessersShown(n => n + 1), 350);
      return () => clearTimeout(t);
    } else if (!topShowAuthor) {
      const t = setTimeout(() => setTopShowAuthor(true), 500);
      return () => clearTimeout(t);
    }
  }, [topPrompt.id, topPromptGuessers.length, topGuessersShown, topShowAuthor]);

  // Reveal real/fake after the last prompt's author is shown
  useEffect(() => {
    if (
      revealedCount === allPrompts.length &&
      topShowAuthor &&
      topPrompt.id === sortedPrompts[sortedPrompts.length - 1].id &&
      !showRealFake
    ) {
      // Wait for image collapse animation (0.3s) plus an additional delay
      const t = setTimeout(() => setShowRealFake(true), 800);
      return () => clearTimeout(t);
    }
  }, [revealedCount, allPrompts.length, topShowAuthor, topPrompt.id, sortedPrompts, showRealFake]);

  // Show missing players before resorting
  useEffect(() => {
    if (showRealFake && !showMissingPlayers && missingPromptPlayers.length > 0) {
      // Show missing players after a delay
      const timer = setTimeout(() => {
        setShowMissingPlayers(true);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [showRealFake, showMissingPlayers, missingPromptPlayers.length]);

  // Calculate current round points
  const roundPoints: Record<string, number> = {};
  
  // Points for image creator (5 points per correct guess)
  const correctGuesses = gameState.activeImage.guesses.filter(guess => guess.isCorrect).length;
  roundPoints[image.creatorId] = correctGuesses * 5;

  // Points for fake prompt authors
  for (const fakePrompt of gameState.activeImage.fakePrompts) {
    const guessesForThisFake = gameState.activeImage.guesses.filter(
      guess => guess.promptId === fakePrompt.id
    ).length;
    
    // 5 points per guess on their fake prompt
    roundPoints[fakePrompt.authorId] = (roundPoints[fakePrompt.authorId] || 0) + (guessesForThisFake * 3);

    // 5 points if they guessed correctly
    const authorGuessedCorrectly = gameState.activeImage.guesses.some(
      guess => guess.playerId === fakePrompt.authorId && guess.isCorrect
    );
    if (authorGuessedCorrectly) {
      roundPoints[fakePrompt.authorId] = (roundPoints[fakePrompt.authorId] || 0) + 5;
    }
  }

  // State to trigger resorting by score after score reveal
  const [shouldResortByScore, setShouldResortByScore] = useState(false);

  // After the score count-up, trigger resort
  useEffect(() => {
    if (showRealFake && !shouldResortByScore) {
      // Wait for the count-up animation to finish and after showing missing players
      const delay = missingPromptPlayers.length > 0 ? 1800 : 1400;
      const t = setTimeout(() => setShouldResortByScore(true), delay);
      return () => clearTimeout(t);
    }
    if (!showRealFake && shouldResortByScore) {
      setShouldResortByScore(false);
      setShowMissingPlayers(false);
    }
  }, [showRealFake, shouldResortByScore, missingPromptPlayers.length]);

  // Create the final list of prompts to display
  const finalPrompts = useMemo(() => {
    const promptsToShow = [...revealedPrompts];
    
    // Add missing players if showing them
    if (showMissingPlayers && missingPromptPlayers.length > 0) {
      promptsToShow.push(...missingPromptPlayers);
    }
    
    return promptsToShow;
  }, [revealedPrompts, missingPromptPlayers, showMissingPlayers]);

  // Resort revealedPrompts by creator's total points if shouldResortByScore
  let sortedRevealedPrompts;
  if (shouldResortByScore) {
    // Sort all revealed prompts by creator's total points, descending
    sortedRevealedPrompts = finalPrompts.slice().sort((a, b) => {
      const aPoints = gameState.players[a.authorId]?.points ?? 0;
      const bPoints = gameState.players[b.authorId]?.points ?? 0;
      return bPoints - aPoints;
    });
  } else {
    // Show most recently revealed at the top
    sortedRevealedPrompts = finalPrompts;
  }

  const revealedPromptsWithScores: DisplayPrompt[] = sortedRevealedPrompts.map(prompt => ({
    ...prompt,
    roundScore: roundPoints[prompt.authorId] || 0,
  }));

  return (
    <Box sx={{ width: '100%', maxWidth: 850, mx: 'auto', mt: 3, mb: 3 }}>
      <AnimatePresence>
        {!showRealFake && (
          <Box
            component={motion.div}
            initial={{ height: 512, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'tween', duration: 0.3 }}
            sx={{
              width: 512,
              maxWidth: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              mx: 'auto',
              mb: 3,
            }}
          >
            <Box
              component="img"
              src={imageUrl}
              alt="Generated image"
              sx={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
            />
          </Box>
        )}
      </AnimatePresence>
      <Paper elevation={3} sx={{ p: { xs: 2, md: 3 }, bgcolor: 'rgba(255,255,255,0.8)' }}>
        <Typography variant="h5" fontWeight={700} mb={2}>Results:</Typography>
        <Box sx={{ minHeight: 90 }}>
          <AnimatePresence>
            {revealedPromptsWithScores.map((prompt, idx) => {
              const guessers = guessesByPrompt[prompt.id] || [];
              const isTop = idx === 0 && !prompt.noSubmission;
              const creator = gameState.players[prompt.authorId];
              let points = prompt.roundScore;
              const guessersShown = isTop ? topGuessersShown : guessers.length;
              return (
                <Box
                  key={prompt.id}
                  component={motion.div}
                  layout
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -100, opacity: 0 }}
                  transition={{ type: 'tween', stiffness: 400, damping: 30, duration: shouldResortByScore ? 1.5 : 0.3 }}
                  sx={{ mb: 2 }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      bgcolor: prompt.noSubmission
                        ? 'rgba(0, 0, 0, 0.04)' // very light gray for no submission
                        : showRealFake
                          ? (prompt.isReal
                              ? 'rgba(76, 175, 80, 0.08)' // very light green
                              : 'rgba(255, 152, 0, 0.08)') // very light orange
                          : 'grey.100',
                      border: prompt.noSubmission
                        ? '2px solid rgba(0, 0, 0, 0.12)'
                        : showRealFake
                          ? (prompt.isReal
                              ? '2px solid'
                              : '2px solid')
                          : '2px solid transparent',
                      borderColor: prompt.noSubmission
                        ? 'transparent'
                        : showRealFake
                          ? (prompt.isReal
                              ? 'success.main'
                              : 'warning.main')
                          : 'transparent',
                      borderRadius: 2,
                      boxShadow: 1,
                      p: { xs: 1, md: 1.25 },
                      mb: 1,
                      opacity: prompt.noSubmission ? 0.7 : 1,
                    }}
                  >
                    <CreatorAvatarWithScore
                      prompt={prompt}
                      creator={creator}
                      points={points}
                      showRealFake={showRealFake}
                      guessersShown={guessersShown}
                    />
                    <Typography 
                      sx={{ 
                        flex: 1, 
                        mx: 2, 
                        fontWeight: prompt.noSubmission ? 400 : 500, 
                        fontSize: { xs: '1.2rem', md: '1.5rem' },
                        fontStyle: prompt.noSubmission ? 'italic' : 'normal',
                        color: prompt.noSubmission ? 'text.secondary' : 'text.primary'
                      }}
                    >
                      {prompt.text}
                    </Typography>
                    <Stack direction="row" spacing={-1} alignItems="center" sx={{ minWidth: 48 }}>
                      {guessers.length ? (
                        guessers.map((playerId, i) =>
                          (!isTop || i < topGuessersShown) ? (
                            <Box
                              key={playerId}
                              component={motion.img}
                              src={gameState.players[playerId].avatarUrl}
                              alt={gameState.players[playerId].name}
                              title={gameState.players[playerId].name}
                              initial={{ scale: 0.7, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: isTop ? i * 0.15 : 0, type: 'spring', stiffness: 300, damping: 20 }}
                              sx={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #fff', boxShadow: 1, ml: -1 }}
                            />
                          ) : null
                        )
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1, fontSize: '32px', lineHeight: 1, display: 'flex', alignItems: 'center', height: 32 }}>😪</Typography>
                      )}
                    </Stack>
                  </Box>
                </Box>
              );
            })}
          </AnimatePresence>
        </Box>
      </Paper>
    </Box>
  );
} 
import { useEffect, useState, useRef, useMemo } from 'react';
import { GameState } from '../types';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Avatar,
  Paper,
  Stack,
} from '@mui/material';
import { TextDisplay } from '../client/TextDisplay';

// Define prompt types
interface BasePrompt {
  id: string;
  text: string;
  isReal: boolean;
  authorId: string;
  roundScore?: number;
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
  prompt: BasePrompt;
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
  if (!gameState.activeText) return <Typography>No active text to score</Typography>;

  const text = gameState.texts[gameState.activeText.textId];
  if (!text) return <Typography>Text not found</Typography>;

  // Group guesses by promptId
  const guessesByPrompt = gameState.activeText.guesses.reduce((acc, guess) => {
    if (!acc[guess.promptId]) {
      acc[guess.promptId] = [];
    }
    acc[guess.promptId].push(guess.playerId);
    return acc;
  }, {} as Record<string, string[]>);

  // Get all prompts (real + fake)
  const allPrompts: BasePrompt[] = [
    { id: 'real', text: text.prompt, isReal: true, authorId: text.creatorId },
    ...gameState.activeText.fakePrompts.map(fp => ({
      id: fp.id,
      text: fp.text,
      isReal: false,
      authorId: fp.authorId
    }))
  ];

  // Find all connected players who didn't submit a fake prompt and aren't the text creator
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
      // Wait for text collapse animation (0.3s) plus an additional delay
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
  
  // Points for text creator (5 points per correct guess)
  const correctGuesses = gameState.activeText.guesses.filter(guess => guess.isCorrect).length;
  roundPoints[text.creatorId] = correctGuesses * 5;

  // Points for fake prompt authors
  for (const fakePrompt of gameState.activeText.fakePrompts) {
    const guessesForThisFake = gameState.activeText.guesses.filter(
      guess => guess.promptId === fakePrompt.id
    ).length;
    
    // 5 points per guess on their fake prompt
    roundPoints[fakePrompt.authorId] = (roundPoints[fakePrompt.authorId] || 0) + (guessesForThisFake * 3);

    // 5 points if they guessed correctly
    const authorGuessedCorrectly = gameState.activeText.guesses.some(
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
    sortedRevealedPrompts = finalPrompts;
  }

  return (
    <Box sx={{ p: 2, width: '100%', maxWidth: 600, mx: 'auto' }}>
      <Paper elevation={3} sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.8)' }}>
        <Box display="flex" flexDirection="column" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h5" gutterBottom>Generated Text</Typography>
          <TextDisplay text={text.text} />
        </Box>
        <Typography variant="h5" gutterBottom align="center" sx={{ mb: 3 }}>
          Prompts
        </Typography>
        <Stack spacing={2}>
          {sortedRevealedPrompts.map((prompt) => {
            const creator = gameState.players[prompt.authorId];
            const points = roundPoints[prompt.authorId] || 0;
            const guessers = guessesByPrompt[prompt.id] || [];
            const guessersShown = topPrompt.id === prompt.id ? topGuessersShown : guessers.length;
            const showAuthor = topPrompt.id === prompt.id ? topShowAuthor : true;

            return (
              <Box
                key={prompt.id}
                component={motion.div}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.6)',
                  position: 'relative',
                }}
              >
                <CreatorAvatarWithScore
                  prompt={prompt}
                  creator={creator}
                  points={points}
                  showRealFake={showRealFake}
                  guessersShown={guessersShown}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 500,
                      color: showRealFake ? (prompt.isReal ? 'success.main' : 'error.main') : 'inherit',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {prompt.text}
                  </Typography>
                  {showAuthor && !prompt.noSubmission && (
                    <Typography variant="caption" color="text.secondary">
                      by {creator.name}
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          })}
        </Stack>
      </Paper>
    </Box>
  );
} 
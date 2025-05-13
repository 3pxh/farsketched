import { useEffect, useState, useRef, useMemo } from 'react';
import { GameState } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import '../Host.css';

// Component for avatar + score
function CreatorAvatarWithScore({
  prompt,
  creator,
  points,
  showRealFake,
  guessersShown
}: {
  prompt: any;
  creator: any;
  points: number;
  showRealFake: boolean;
  guessersShown: number;
}) {
  return (
    <motion.div 
      className="row-avatar" 
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      layout
    >
      <img
        src={creator.avatarUrl}
        alt={creator.name}
        className="author-avatar"
        title={creator.name + (prompt.isReal ? ' (Creator)' : '')}
      />
      {/* Show points badge after real/fake is revealed */}
      {showRealFake ? points > 0 && (
        <span className="points-badge">+{points}</span>
      ) : guessersShown > 0 && (
        <motion.span
          className="points-badge"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          layout={false}
        >
          +{guessersShown * 5}
        </motion.span>
      )}
      {/* Always show total score when row enters */}
      <span className="creator-total-score">{creator.points}</span>
    </motion.div>
  );
}

export function ScoringStage({ gameState }: { gameState: GameState }) {
  if (!gameState.activeImage) return <p>No active image to score</p>;

  const image = gameState.images[gameState.activeImage.imageId];
  if (!image) return <p>Image not found</p>;

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
  const allPrompts = [
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
      // Wait for the count-up animation to finish, then resort
      const t = setTimeout(() => setShouldResortByScore(true), 1400);
      return () => clearTimeout(t);
    }
    if (!showRealFake && shouldResortByScore) {
      setShouldResortByScore(false);
    }
  }, [showRealFake, shouldResortByScore]);

  // Resort revealedPrompts by creator's total points if shouldResortByScore
  let sortedRevealedPrompts;
  if (shouldResortByScore) {
    // Sort all revealed prompts by creator's total points, descending
    sortedRevealedPrompts = revealedPrompts.slice().sort((a, b) => {
      const aPoints = gameState.players[a.authorId]?.points ?? 0;
      const bPoints = gameState.players[b.authorId]?.points ?? 0;
      return bPoints - aPoints;
    });
  } else {
    // Show most recently revealed at the top
    sortedRevealedPrompts = revealedPrompts;
  }

  const revealedPromptsWithScores = sortedRevealedPrompts.map(prompt => ({
    ...prompt,
    roundScore: roundPoints[prompt.authorId] || 0,
  }));

  return (
    <div className="scoring-stage">
      <AnimatePresence>
        {!showRealFake && (
          <motion.div 
            className="active-image"
            initial={{ height: '512px', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'tween', duration: 0.3 }}
            style={{
              width: '512px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              margin: '0 auto'
            }}
          >
            <img 
              src={imageUrl}
              alt="Generated image"
              style={{ 
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="prompt-results">
        <h2>Results:</h2>
        <div className="prompt-boxes compact" style={{ minHeight: 90 }}>
          <AnimatePresence>
            {revealedPromptsWithScores.map((prompt, idx) => {
              const guessers = guessesByPrompt[prompt.id] || [];
              const isTop = idx === 0;
              const creator = gameState.players[prompt.authorId];
              let points = prompt.roundScore;
              const guessersShown = isTop ? topGuessersShown : guessers.length;
              return (
                <motion.div
                  key={prompt.id}
                  layout
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -100, opacity: 0 }}
                  transition={{ type: 'tween', stiffness: 400, damping: 30, duration: shouldResortByScore ? 1.5 : 0.3 }}
                >
                  <div 
                    className={`prompt-box-row ${showRealFake ? (prompt.isReal ? 'real-prompt' : 'fake-prompt') : 'neutral-prompt'}`}
                  >
                    <CreatorAvatarWithScore
                      prompt={prompt}
                      creator={creator}
                      points={points}
                      showRealFake={showRealFake}
                      guessersShown={guessersShown}
                    />
                    <div className="row-prompt-text">
                      <span className="prompt-text-row">{prompt.text}</span>
                    </div>
                    <div className="row-guessers">
                      {guessers.length ? (
                        guessers.map((playerId, i) =>
                          (!isTop || i < topGuessersShown) ? (
                            <motion.img
                              key={playerId}
                              src={gameState.players[playerId].avatarUrl}
                              alt={gameState.players[playerId].name}
                              className="guesser-avatar"
                              title={gameState.players[playerId].name}
                              initial={{ scale: 0.7, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: isTop ? i * 0.15 : 0, type: 'spring', stiffness: 300, damping: 20 }}
                            />
                          ) : null
                        )
                      ) : (
                        <span className="no-guesses">😪</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
} 
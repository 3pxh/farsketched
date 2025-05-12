import { useEffect, useState, useRef } from 'react';
import { GameStage, GameConfig, GameMessage, GameState } from '@/games/farsketched/types';
import { farsketchedReducer, initialState } from './reducer';
import { HostLobby } from '@/games/farsketched/HostLobby';
import { usePeer } from '@/contexts/PeerContext';
import { HostGameStateProvider, useHostGameState } from '@/contexts/GameState';
import { Timer } from './components/Timer';
import './Host.css';
import { motion, AnimatePresence } from 'framer-motion';

interface HostProps {
  gameConfig: GameConfig;
}

function FoolingStage({ gameState }: { gameState: GameState }) {
  if (!gameState.activeImage) return <p>No active image</p>;

  const image = gameState.images[gameState.activeImage.imageId];
  if (!image) return <p>Image not found</p>;

  return (
    <div className="fooling-stage">
      <h2>Fooling Stage</h2>
      <div className="active-image">
        <img 
          src={URL.createObjectURL(image.imageBlob)} 
          alt="Generated image for fooling"
          style={{ maxWidth: '512px', maxHeight: '512px' }}
        />
        <p>Real prompt: {image.prompt}</p>
      </div>
    </div>
  );
}

// Helper for animated count up
function useCountUp(final: number, start: number, shouldAnimate: boolean, duration = 1200) {
  const [value, setValue] = useState(start);
  useEffect(() => {
    if (!shouldAnimate) {
      setValue(start);
      return;
    }
    if (start === final) {
      setValue(final);
      return;
    }
    let raf: number;
    const startTime = performance.now();
    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setValue(Math.round(start + (final - start) * progress));
      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      }
    }
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [final, start, shouldAnimate, duration]);
  return value;
}

// New component for avatar + score
function CreatorAvatarWithScore({
  prompt,
  creator,
  points,
  showRealFake
}: {
  prompt: any;
  creator: any;
  points: number;
  showRealFake: boolean;
}) {
  const prevTotal = creator.points - points;
  const animatedScore = useCountUp(creator.points, prevTotal, showRealFake);
  return (
    <div className="row-avatar" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <img
        src={creator.avatarUrl}
        alt={creator.name}
        className="author-avatar"
        title={creator.name + (prompt.isReal ? ' (Creator)' : '')}
      />
      {/* Show points badge after real/fake is revealed */}
      {showRealFake && points > 0 && (
        <span className="points-badge">+{points}</span>
      )}
      {/* Show animated total score after real/fake is revealed */}
      {showRealFake && (
        <span className="creator-total-score">{animatedScore}</span>
      )}
    </div>
  );
}

export function ScoringStage({ gameState }: { gameState: GameState }) {
  if (!gameState.activeImage) return <p>No active image to score</p>;

  const image = gameState.images[gameState.activeImage.imageId];
  if (!image) return <p>Image not found</p>;

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
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [revealedCount, allPrompts.length]);

  const handleNext = () => {
    if (revealedCount < allPrompts.length) {
      setRevealedCount(revealedCount + 1);
    }
  };
  const handlePrev = () => {
    if (revealedCount > 1) {
      setRevealedCount(revealedCount - 1);
    }
  };

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
  const lastPromptId = revealedPrompts.length > 0 ? revealedPrompts[0].id : null;

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
      const t = setTimeout(() => setShowRealFake(true), 500);
      return () => clearTimeout(t);
    }
    // Reset showRealFake if we go back
    if ((revealedCount < allPrompts.length || !topShowAuthor) && showRealFake) {
      setShowRealFake(false);
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
    
    // 3 points per guess on their fake prompt
    roundPoints[fakePrompt.authorId] = (roundPoints[fakePrompt.authorId] || 0) + (guessesForThisFake * 3);

    // 5 points if they guessed correctly
    const authorGuessedCorrectly = gameState.activeImage.guesses.some(
      guess => guess.playerId === fakePrompt.authorId && guess.isCorrect
    );
    if (authorGuessedCorrectly) {
      roundPoints[fakePrompt.authorId] = (roundPoints[fakePrompt.authorId] || 0) + 5;
    }
  }

  // Precompute points and animated scores for all prompts
  const allPromptPoints = sortedPrompts.map(prompt => {
    let points = 0;
    const guesses = (gameState.activeImage && gameState.activeImage.guesses) ? gameState.activeImage.guesses : [];
    if (prompt.isReal) {
      points = (guessesByPrompt['real']?.length || 0) * 5;
    } else {
      points = (guessesByPrompt[prompt.id]?.length || 0) * 3;
      const authorGuessedReal = guesses.some(
        g => g.playerId === prompt.authorId && g.promptId === 'real'
      );
      if (authorGuessedReal) points += 5;
    }
    const creator = gameState.players[prompt.authorId];
    const prevTotal = creator.points - points;
    return { points, prevTotal, creatorPoints: creator.points };
  });
  // Precompute animated scores for all prompts
  const allAnimatedScores = allPromptPoints.map(({ creatorPoints, prevTotal }, i) =>
    useCountUp(creatorPoints, prevTotal, showRealFake)
  );

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

  return (
    <div className="scoring-stage">
      <h2>Scoring Stage</h2>
      <div className="active-image">
        <img 
          src={URL.createObjectURL(image.imageBlob)} 
          alt="Generated image"
          style={{ maxWidth: '512px', maxHeight: '512px' }}
        />
      </div>
      <div className="prompt-results">
        <h3>Results:</h3>
        <div className="prompt-boxes compact" style={{ minHeight: 90 }}>
          <AnimatePresence>
            {sortedRevealedPrompts.map((prompt, idx) => {
              const guessers = guessesByPrompt[prompt.id] || [];
              const isTop = idx === 0;
              const animatedScore = allAnimatedScores[idx];
              const creator = gameState.players[prompt.authorId];
              const { points } = allPromptPoints[idx];
              const showScore = showRealFake;
              return (
                <motion.div
                  key={prompt.id}
                  layout
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -100, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  style={{ marginBottom: 12 }}
                >
                  <div 
                    className={`prompt-box-row ${showRealFake ? (prompt.isReal ? 'real-prompt' : 'fake-prompt') : 'neutral-prompt'}`}
                  >
                    <CreatorAvatarWithScore
                      key={prompt.id + '-' + creator.points}
                      prompt={prompt}
                      creator={creator}
                      points={points}
                      showRealFake={showRealFake}
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

function HostContent({ gameConfig }: HostProps) {
  // Get synchronized game state from the context
  const { state: gameState, updateState } = useHostGameState<GameState>();
  const { messages, markRead, sendSelfMessage } = usePeer<GameMessage>();

  // TODO: move this out; it will be used by all games
  useEffect(() => {
    messages.forEach(msg => {
      try {
        updateState(currentState => farsketchedReducer(currentState, msg, sendSelfMessage));
        markRead(msg);
      } catch (error) {
        console.error('Error processing game message:', error);
      }
    });
  }, [messages, markRead, updateState]);

  const renderStage = () => {
    switch (gameState.stage) {
      case GameStage.LOBBY:
        return (
          <HostLobby
            gameConfig={gameConfig}
            players={Object.values(gameState.players)}
          />
        );
      case GameStage.PROMPTING:
        return <p>Prompting Stage</p>;
      case GameStage.FOOLING:
        return <FoolingStage gameState={gameState} />;
      case GameStage.GUESSING:
        return <p>Guessing Stage</p>;
      case GameStage.SCORING:
        return <ScoringStage gameState={gameState} />;
      case GameStage.GAME_OVER:
        return <p>Game Over Stage</p>;
      default:
        return <p>Unknown Stage</p>;
    }
  };

  return (
    <div className="game-container">
      <h1>Farsketched</h1>
      {renderStage()}
      {gameState.timer.isRunning && (
        <div className="timer-wrapper">
          <Timer 
            startTime={gameState.timer.startTime} 
            duration={gameState.timer.duration} 
          />
        </div>
      )}
    </div>
  );
}

export default function Host({ gameConfig }: HostProps) {
  return (
    <HostGameStateProvider<GameState> 
      initialState={initialState} 
      debug={true}
      syncInterval={100}
    >
      <HostContent gameConfig={gameConfig} />
    </HostGameStateProvider>
  );
}
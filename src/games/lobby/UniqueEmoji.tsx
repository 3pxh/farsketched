import { useState, useEffect, useRef } from 'react';
import { useAudio } from '@/contexts/AudioProvider';
import * as Tone from 'tone';
import { Box, Button, Slider, Typography, styled, keyframes, IconButton } from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import { purple } from '@mui/material/colors';

const emojiList = [
  "🐶", "🌴", "🍒", "👻", "🤖", "🚀", "💜", "🤠", "🐱", "💕", "🌟", "👽", "🌈", "🎉",
  "🐼", "🦨", "🍕", "🌯", "🌸", "🌻", "🌞", "🌝", "🌎", "🧙", "🎭", "🎪", "🎨", "🎬"
];

const TOTAL_EMOJIS = emojiList.length;

const gradientPosition = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

const gradientRotation = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;


const GradientBackground = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '-50%',
  left: '-50%',
  right: '-50%',
  bottom: '-50%',
  background: `linear-gradient(
    45deg,
    ${theme.palette.primary.dark},
    ${theme.palette.secondary.dark},
    ${theme.palette.error.main},
    ${theme.palette.warning.main},
    ${purple[700]},
    ${purple[500]},
    ${theme.palette.info.main},
    ${theme.palette.success.main},
    ${theme.palette.primary.main},
    ${theme.palette.secondary.main}
  )`,
  backgroundSize: '400% 400%',
  animation: `
    ${gradientPosition} 15s ease infinite,
    ${gradientRotation} 30s linear infinite
  `,
  zIndex: 0,
  pointerEvents: 'none',
}));

const GameContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  color: theme.palette.common.white,
}));

const ContentContainer = styled(Box)({
  position: 'relative',
  width: '100%',
  height: '100%',
  zIndex: 1,
  '& > *': {
    position: 'relative',
    zIndex: 2,
  },
});

const GameOverContainer = styled(Box)({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  textAlign: 'center',
  padding: '2rem',
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  backdropFilter: 'blur(8px)',
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
});

const TopBar = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(1),
  left: 0,
  right: 0,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(0, 2),
  backgroundColor: 'rgba(0, 0, 0, 0.2)',
  backdropFilter: 'blur(8px)',
  borderRadius: theme.spacing(2),
  margin: theme.spacing(0, 1),
}));

const VolumeControl = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  width: 150,
}));

const CELEBRATION_EMOJIS = ["🎉", "🎊", "✨", "🎈", "🎆", "🎇", "🌟", "💫", "⭐️", "🪅"];

const createExplosionEmoji = (x: number, y: number, emoji: string, delay: number) => {
  const element = document.createElement("div");
  const angle = Math.random() * Math.PI * 2;
  const rotationSpeed = (Math.random() - 0.5) * 720; // -360 to 360 degrees per second
  const distance = 100 + Math.random() * 200;
  
  element.textContent = emoji;
  element.style.cssText = `
    position: absolute;
    font-size: 2rem;
    left: ${x}px;
    top: ${y}px;
    z-index: 3;
    transform-origin: center;
    pointer-events: none;
  `;

  let startTime: number | null = null;
  const duration = 1000; // 1 second animation

  const animate = (timestamp: number) => {
    if (!startTime) startTime = timestamp;
    const progress = (timestamp - startTime) / duration;

    if (progress < 1) {
      const easeOut = 1 - Math.pow(1 - progress, 3); // Cubic ease out
      const currentDistance = distance * easeOut;
      const currentRotation = rotationSpeed * progress;
      
      const currentX = x + Math.cos(angle) * currentDistance;
      const currentY = y + Math.sin(angle) * currentDistance;
      
      element.style.transform = `translate(-50%, -50%) rotate(${currentRotation}deg)`;
      element.style.left = `${currentX}px`;
      element.style.top = `${currentY}px`;
      element.style.opacity = `${1 - easeOut}`;
      
      requestAnimationFrame(animate);
    } else {
      element.remove();
    }
  };

  setTimeout(() => {
    requestAnimationFrame(animate);
  }, delay);

  return element;
};

const createVictoryExplosion = (container: HTMLElement) => {
  const rect = container.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  
  // Create multiple bursts with different delays
  for (let i = 0; i < 3; i++) { // 3 waves of explosions
    const baseDelay = i * 200; // 200ms between waves
    
    // Create 10 emojis per burst
    for (let j = 0; j < 10; j++) {
      const emoji = CELEBRATION_EMOJIS[Math.floor(Math.random() * CELEBRATION_EMOJIS.length)];
      const element = createExplosionEmoji(
        centerX,
        centerY,
        emoji,
        baseDelay + Math.random() * 100
      );
      container.appendChild(element);
    }
  }
};

export const UniqueEmoji = () => {
  const [score, setScore] = useState(0);
  const [highscore, setHighscore] = useState(0);
  const [gameRunning, setGameRunning] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(1);
  const gameRef = useRef<HTMLDivElement>(null);
  const collected = useRef<Set<string>>(new Set());
  const intervals = useRef<Set<NodeJS.Timeout>>(new Set());
  const currentScore = useRef(0);
  const isVictoryRef = useRef(false);
  const { playNote, playSound, volume, setVolume } = useAudio();
  const [randomizedEmojis, setRandomizedEmojis] = useState<string[]>(emojiList.sort(() => Math.random() - 0.5));
  const nextEmojiIndex = useRef(3);
  const currentEmoji = useRef<Set<string>>(new Set(
    randomizedEmojis.slice(0, 3)
  ));

  // Initialize audio when component mounts
  useEffect(() => {
    const initAudio = async () => {
      await Tone.start();
    };
    initAudio();
  }, []);

  useEffect(() => {
    currentScore.current = score;
  }, [score]);

  // Update isVictory state whenever isVictoryRef changes
  useEffect(() => {
    setIsVictory(isVictoryRef.current);
  }, [isVictoryRef.current]);

  const startGame = () => {
    setGameStarted(true);
    setGameRunning(true);
    playSound('sparkle');
  };

  const spawnEmoji = () => {
    if (!gameRunning || !gameRef.current) return;
    
    // If in victory mode, don't spawn new collectible emojis
    if (isVictoryRef.current) {
      const emoji = document.createElement("div");
      emoji.className = "wiggling-emoji";
      const randomEmoji = emojiList[Math.floor(Math.random() * emojiList.length)];
      emoji.textContent = randomEmoji;
      emoji.style.cssText = `
        position: absolute;
        font-size: 4rem;
        user-select: none;
        left: ${Math.random() * 95}vw;
        top: -2rem;
        z-index: 2;
        animation: wiggle 1s ease-in-out infinite;
      `;
      
      // Add keyframes to document if they don't exist
      if (!document.querySelector('#wiggle-keyframes')) {
        const style = document.createElement('style');
        style.id = 'wiggle-keyframes';
        style.textContent = `
          @keyframes wiggle {
            0%, 100% { transform: rotate(-5deg); }
            50% { transform: rotate(5deg); }
          }
        `;
        document.head.appendChild(style);
      }
      
      gameRef.current.appendChild(emoji);

      let y = -32;
      const speed = Math.random() * 1 + 1;

      const interval = setInterval(() => {
        if (!gameRunning) {
          clearInterval(interval);
          emoji.remove();
          return;
        }

        y += speed;
        emoji.style.top = y + "px";

        if (y > window.innerHeight) {
          emoji.remove();
          clearInterval(interval);
          intervals.current.delete(interval);
        }
      }, 16);

      intervals.current.add(interval);
      return;
    }

    // Normal gameplay emoji spawning
    const availableEmojis = Array.from(currentEmoji.current);
    if (availableEmojis.length === 0) return;
    
    const emoji = document.createElement("div");
    emoji.className = "emoji";
    const randomEmoji = availableEmojis[Math.floor(Math.random() * availableEmojis.length)];
    emoji.textContent = randomEmoji;
    emoji.style.cssText = `
      position: absolute;
      font-size: 4rem;
      cursor: pointer;
      user-select: none;
      left: ${Math.random() * 95}vw;
      top: -2rem;
      z-index: 2;
    `;
    gameRef.current.appendChild(emoji);

    let y = -32;
    const speed = Math.random() * 1 + 1;

    const interval = setInterval(() => {
      if (!gameRunning) {
        clearInterval(interval);
        emoji.remove();
        return;
      }

      y += speed;
      emoji.style.top = y + "px";

      if (y > window.innerHeight) {
        emoji.remove();
        clearInterval(interval);
        intervals.current.delete(interval);
      }
    }, 16);

    intervals.current.add(interval);

    const handleEmojiInteraction = () => {
      if (collected.current.has(emoji.textContent || '')) {
        playSound('whoosh');
        endGame();
      } else {
        collected.current.add(emoji.textContent || '');
        currentScore.current += 1;
        setScore(currentScore.current);
        
        // Check for victory
        if (currentScore.current === TOTAL_EMOJIS) {
          isVictoryRef.current = true;
          setIsVictory(true);
          playNote('C4', '8n');
          // Create victory explosion
          if (gameRef.current) {
            createVictoryExplosion(gameRef.current);
          }
        } else {
          currentEmoji.current.add(randomizedEmojis[nextEmojiIndex.current]);
          nextEmojiIndex.current++;
          playNote('C4', '8n');
        }
        
        emoji.remove();
        clearInterval(interval);
        intervals.current.delete(interval);
      }
    };

    emoji.addEventListener("click", handleEmojiInteraction);
    emoji.addEventListener("touchstart", handleEmojiInteraction);
  };

  const endGame = () => {
    setGameRunning(false);
    if (currentScore.current > highscore) {
      setHighscore(currentScore.current);
    }

    // Remove click handlers from all emojis while keeping animations
    if (gameRef.current) {
      const emojis = gameRef.current.getElementsByClassName('emoji');
      Array.from(emojis).forEach(emoji => {
        (emoji as HTMLElement).style.pointerEvents = 'none';
      });
    }
  };

  const restartGame = () => {
    // Clear all intervals
    intervals.current.forEach(interval => clearInterval(interval));
    intervals.current.clear();
    
    // Remove all emojis
    if (gameRef.current) {
      const emojis = gameRef.current.getElementsByClassName('emoji');
      while (emojis.length > 0) {
        emojis[0].remove();
      }
    }

    setGameRunning(true);
    setScore(0);
    currentScore.current = 0;
    isVictoryRef.current = false;
    setIsVictory(false);
    collected.current.clear();
    setRandomizedEmojis(emojiList.sort(() => Math.random() - 0.5));
    currentEmoji.current = new Set(
      randomizedEmojis.slice(0, 3)
    );
    nextEmojiIndex.current = 3;
    playNote('C4', '8n');
  };

  const handleVolumeIconClick = () => {
    if (isMuted) {
      setVolume(previousVolume);
      setIsMuted(false);
    } else {
      setPreviousVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
  };

  useEffect(() => {
    if (!gameStarted) return;
    
    const interval = setInterval(spawnEmoji, 200);
    intervals.current.add(interval);
    return () => {
      clearInterval(interval);
      intervals.current.delete(interval);
    };
  }, [gameRunning, gameStarted]);

  return (
    <GameContainer ref={gameRef}>
      <GradientBackground />
      <ContentContainer>
        {!gameStarted ? (
          <GameOverContainer>
            <Button
              variant="contained"
              onClick={startGame}
              sx={{
                mt: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(4px)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                }
              }}
            >
              Start Game
            </Button>
          </GameOverContainer>
        ) : !gameRunning && (
          <GameOverContainer>
            <Typography 
              variant="h4" 
              color="error" 
              gutterBottom
              sx={{ 
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                fontWeight: 'bold'
              }}
            >
              out of RAM
            </Typography>
            <Button
              variant="contained"
              onClick={restartGame}
              sx={{
                mt: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(4px)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                }
              }}
            >
              Again!
            </Button>
          </GameOverContainer>
        )}
        <TopBar>
          <VolumeControl>
            <IconButton 
              onClick={handleVolumeIconClick}
              sx={{ 
                color: 'white',
                padding: 0.5,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
            </IconButton>
            <Slider
              size="small"
              value={volume}
              onChange={(_, value) => {
                setVolume(value as number);
                if (value === 0) {
                  setIsMuted(true);
                } else if (isMuted) {
                  setIsMuted(false);
                }
              }}
              min={0}
              max={1}
              step={0.01}
              aria-label="Volume"
              sx={{
                '& .MuiSlider-thumb': {
                  backgroundColor: 'white',
                },
                '& .MuiSlider-track': {
                  backgroundColor: 'white',
                },
                '& .MuiSlider-rail': {
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                }
              }}
            />
          </VolumeControl>
          <Box sx={{ display: 'flex', gap: 2, zIndex: 100 }}>
            <Typography variant="h6" sx={{ textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)' }}>
              Score: {score}/{TOTAL_EMOJIS}
              {isVictory && ' 🎉'}
            </Typography>
          </Box>
        </TopBar>
      </ContentContainer>
    </GameContainer>
  );
}; 
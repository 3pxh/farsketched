import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import './Timer.css';

const EMOJI_HAPPY = 60;
const EMOJI_NEUTRAL = 35;
const EMOJI_WORRIED = 15;
const BURST_COUNT = 25;
const BURST_DURATION = 1400; // ms

interface TimerProps {
  startTime: number;
  duration: number;
}

function getTransitionEmoji(threshold: number) {
  if (threshold === EMOJI_HAPPY) return '😯';
  if (threshold === EMOJI_NEUTRAL) return '😨';
  if (threshold === EMOJI_WORRIED) return '😱';
  return '💥';
}

export function Timer({ startTime, duration }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [exploded, setExploded] = useState<{[key:number]: boolean}>({});
  const [burst, setBurst] = useState<{ threshold: number, emoji: string } | null>(null);
  const prevProgress = useRef(100);

  useEffect(() => {
    const updateTimer = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = Math.max(0, duration - elapsed);
      setTimeLeft(remaining);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 100);
    return () => clearInterval(interval);
  }, [startTime, duration]);

  // Calculate progress as a percentage
  const progress = (timeLeft / duration) * 100;

  // Detect threshold crossings and trigger burst
  useEffect(() => {
    const thresholds = [EMOJI_HAPPY, EMOJI_NEUTRAL, EMOJI_WORRIED];
    for (const t of thresholds) {
      if (prevProgress.current > t && progress <= t && !exploded[t]) {
        setExploded(e => ({ ...e, [t]: true }));
        setBurst({ threshold: t, emoji: getTransitionEmoji(t) });
        setTimeout(() => setBurst(null), BURST_DURATION);
      }
    }
    prevProgress.current = progress;
  }, [progress, exploded]);

  // Determine the emoji based on time left
  const getEmoji = () => {
    if (progress > EMOJI_HAPPY) return '😃';
    if (progress > EMOJI_NEUTRAL) return '😯';
    if (progress > EMOJI_WORRIED) return '😨';
    return '😱';
  };

  // Calculate gradient color based on progress
  const getGradient = () => {
    const colors = {
      green: '#4CAF50',
      yellow: '#FFC107',
      orange: '#FF9800',
      red: '#F44336'
    };
    if (progress > EMOJI_NEUTRAL) {
      return `linear-gradient(to left, ${colors.green}, ${colors.yellow})`;
    } else if (progress > EMOJI_WORRIED) {
      return `linear-gradient(to left, ${colors.yellow}, ${colors.orange})`;
    } else {
      return `linear-gradient(to left, ${colors.orange}, ${colors.red})`;
    }
  };

  // Render burst emojis if needed
  const renderBurst = () => {
    if (!burst) return null;
    const burstEmojis = [];
    for (let i = 0; i < BURST_COUNT; i++) {
      const angle = Math.random() * 360;
      burstEmojis.push(
        <span
          key={i}
          className="burst-emoji"
          style={{
            '--burst-angle': `${angle}deg`,
            animationDuration: `${BURST_DURATION}ms`
          } as React.CSSProperties}
        >
          {burst.emoji}
        </span>
      );
    }
    return <div className="emoji-burst">{burstEmojis}</div>;
  };

  return (
    <div className="timer-container">
      <div className="timer-progress-container">
        <motion.div
          className="timer-progress-bar"
          style={{ background: getGradient() }}
          initial={{ width: '100%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
        <motion.div
          className="timer-emoji"
          initial={{ left: '100%' }}
          animate={{ left: `${progress}%` }}
          transition={{ duration: 0.1 }}
          style={{ position: 'absolute' }}
        >
          {getEmoji()}
          {renderBurst()}
        </motion.div>
      </div>
    </div>
  );
} 
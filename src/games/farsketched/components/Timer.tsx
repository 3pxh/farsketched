import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import './Timer.css';

interface TimerProps {
  startTime: number;
  duration: number;
}

export function Timer({ startTime, duration }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    const updateTimer = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = Math.max(0, duration - elapsed);
      setTimeLeft(remaining);
    };

    // Update immediately
    updateTimer();

    // Then update every 100ms for smooth animation
    const interval = setInterval(updateTimer, 100);

    return () => clearInterval(interval);
  }, [startTime, duration]);

  // Calculate progress as a percentage
  const progress = (timeLeft / duration) * 100;

  // Determine the emoji based on time left
  const getEmoji = () => {
    if (progress > 75) return '😊';
    if (progress > 50) return '😐';
    if (progress > 25) return '😰';
    return '😱';
  };

  // Calculate gradient color based on progress
  const getGradient = () => {
    // Define color stops
    const colors = {
      green: '#4CAF50',  // 100%
      yellow: '#FFC107', // 50%
      orange: '#FF9800', // 25%
      red: '#F44336'     // 0%
    };

    // Calculate intermediate colors based on progress
    if (progress > 50) {
      // Green to Yellow (100% to 50%)
      const ratio = (progress - 50) / 50;
      return `linear-gradient(to right, ${colors.green}, ${colors.yellow})`;
    } else if (progress > 25) {
      // Yellow to Orange (50% to 25%)
      const ratio = (progress - 25) / 25;
      return `linear-gradient(to right, ${colors.yellow}, ${colors.orange})`;
    } else {
      // Orange to Red (25% to 0%)
      const ratio = progress / 25;
      return `linear-gradient(to right, ${colors.orange}, ${colors.red})`;
    }
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
        >
          {getEmoji()}
        </motion.div>
      </div>
      <div className="timer-message">
        {progress > 75 ? 'Plenty of time!' :
         progress > 50 ? 'Still good!' :
         progress > 25 ? 'Hurry up!' :
         'Last chance!'}
      </div>
    </div>
  );
} 
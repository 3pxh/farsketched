import React, { useState } from 'react';
import GameStageIcons from './GameStageIcons';
import { GameStage, GameState } from '@/games/farsketched/types';
import './ClientGameOver.css';
import AchievementIcon from './AchievementIcon';
import { useAudio } from '../contexts/AudioProvider';

interface ClientGameOverProps {
  gameState: GameState;
}

const achievementDescriptions: Record<string, string> = {
  most_accurate: 'Most Accurate: Guessed the most prompts correctly.',
  the_painter: 'The Painter: Wrote the best prompts for the image generator.',
  best_bullshitter: 'Best Bullshitter: Fooled the most players with fake prompts.',
  the_chaotician: 'The Chaotician: Caused the most chaos with unpredictable play.',
};

const ANIMATION_STAGGER = 0.36; // seconds

const notes = ['C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4', 'B3', 'A3'];

interface ScoreRowProps {
  player: {
    name: string;
    score: number;
    avatarUrl: string;
    achievements: string[];
  };
  index: number;
  total: number;
  onHover: (index: number) => void;
}

const ScoreRow: React.FC<ScoreRowProps> = ({ player, index, total, onHover }) => {
  const { playNote, audioEnabled } = useAudio();
  const animationDelay = (total - 1 - index) * ANIMATION_STAGGER;

  React.useEffect(() => {
    if (!audioEnabled) return;
    const timer = setTimeout(() => {
      const note = notes[index] || 'C4';
      playNote(note, '8n');
    }, (animationDelay) * 1000);
    return () => clearTimeout(timer);
  }, [audioEnabled, index, animationDelay, playNote]);

  return (
    <div
      className={`score-item ${index % 2 === 0 ? 'score-item-left' : 'score-item-right'}`}
      style={{ animationDelay: `${animationDelay}s` }}
      onMouseEnter={() => onHover(index)}
    >
      <img
        src={player.avatarUrl}
        alt={`${player.name}'s avatar`}
        className="player-avatar"
      />
      <span className="player-name">{player.name}</span>
      <span className="player-score">{player.score} points</span>
      {player.achievements && player.achievements.length > 0 && (
        <div className="achievements">
          {player.achievements.map((achievement, i) => {
            // Tooltip state for long-press
            const [showTooltip, setShowTooltip] = useState(false);
            let pressTimer: NodeJS.Timeout;
            const handleTouchStart = () => {
              pressTimer = setTimeout(() => setShowTooltip(true), 500);
            };
            const handleTouchEnd = () => {
              clearTimeout(pressTimer);
              setShowTooltip(false);
            };
            return (
              <span
                key={i}
                className={`achievement-badge${showTooltip ? ' show-tooltip' : ''}`}
                tabIndex={0}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <AchievementIcon type={achievement} />
                <span className="achievement-tooltip">
                  {achievementDescriptions[achievement] || achievement}
                </span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ClientGameOver: React.FC<ClientGameOverProps> = ({ gameState }) => {
  const { playNote, audioEnabled, playSound } = useAudio();

  // Convert game state to scores array
  const scores = Object.values(gameState.players)
    .map(player => ({
      name: player.name,
      score: player.points,
      avatarUrl: player.avatarUrl,
      achievements: gameState.achievements
        .filter(achievement => achievement.playerIds.includes(player.id))
        .map(achievement => achievement.type)
    }))
    .sort((a, b) => b.score - a.score);

  const handleHover = (index: number) => {
    if (audioEnabled) {
      try {
        // Play different notes based on rank (1st place = highest note)
        const notes = ['C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4', 'B3', 'A3'];
        const note = notes[index] || 'C4';
        playNote(note, '8n');
      } catch (error) {
        console.log('Sound play failed:', error);
      }
    }
  };

  return (
    <div className="game-over-container">
      <GameStageIcons currentStage={GameStage.GAME_OVER} size={128} className="game-over-stages" />
      
      <h1 className="game-over-title">Game Complete!</h1>
      
      <div className="scores-container">
        <h2>Final Scores</h2>
        <div className="scores-list">
          {scores.map((player, index) => (
            <ScoreRow
              key={player.name}
              player={player}
              index={index}
              total={scores.length}
              onHover={handleHover}
            />
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', margin: '2rem 0' }}>
        <button onClick={() => playSound('chime')}>Chime</button>
        <button onClick={() => playSound('laser')}>Laser</button>
        <button onClick={() => playSound('pop')}>Pop</button>
        <button onClick={() => playSound('whoosh')}>Whoosh</button>
        <button onClick={() => playSound('sparkle')}>Sparkle</button>
      </div>
      <div className="thank-you-message">
        <h2>Thanks for Playing!</h2>
        <p>Hope you had fun creating and guessing images!</p>
      </div>
    </div>
  );
};

export default ClientGameOver; 
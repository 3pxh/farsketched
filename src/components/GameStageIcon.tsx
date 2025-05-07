import React from 'react';
import { GameStage } from '@/games/farsketched/types';
import './GameStageIcon.css';

interface GameStageIconProps {
  stage: GameStage;
  size?: number;
  className?: string;
}

const GameStageIcon: React.FC<GameStageIconProps> = ({ stage, size = 128, className = '' }) => {
  const getIcon = () => {
    switch (stage) {
      case GameStage.LOBBY:
        return (
          <svg viewBox="0 0 24 24" width={size} height={size}>
            {/* Door with welcome mat */}
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
            <path d="M9 7h6v10H9z" />
            <path d="M10 8h4v8h-4z" />
            <path d="M11 16h2v1h-2z" />
            <path d="M8 17h8v1H8z" />
          </svg>
        );
      case GameStage.PROMPTING:
        return (
          <svg viewBox="0 0 24 24" width={size} height={size}>
            {/* Pencil writing on paper */}
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
            <path d="M7 10h10v1H7z" />
            <path d="M7 13h10v1H7z" />
            <path d="M7 16h6v1H7z" />
            <path d="M16 7l-2 2 2 2 2-2-2-2z" transform="rotate(45 16 9)" />
          </svg>
        );
      case GameStage.FOOLING:
        return (
          <svg viewBox="0 0 24 24" width={size} height={size}>
            {/* Mask with question mark */}
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
            <path d="M8 9c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4-4-1.79-4-4zm4 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" />
            <path d="M12 15c-2.21 0-4 1.79-4 4v1h8v-1c0-2.21-1.79-4-4-4z" />
          </svg>
        );
      case GameStage.GUESSING:
        return (
          <svg viewBox="0 0 24 24" width={size} height={size}>
            {/* Magnifying glass with question mark */}
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            <path d="M9.5 7c-1.38 0-2.5 1.12-2.5 2.5h1c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5c0 .83-.67 1.5-1.5 1.5h-1v1h1c1.66 0 3-1.34 3-3 0-1.38-1.12-2.5-2.5-2.5z" />
          </svg>
        );
      case GameStage.SCORING:
        return (
          <svg viewBox="0 0 24 24" width={size} height={size}>
            {/* Trophy with stars */}
            <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM7 10.82C5.84 10.4 5 9.3 5 8V7h2v3.82zM19 8c0 1.3-.84 2.4-2 2.82V7h2v1z" />
            <path d="M12 12c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
            <path d="M8 7l1.5 3 3.5.5-2.5 2.5.5 3.5L8 14l-2 2.5.5-3.5L4 10.5l3.5-.5z" />
          </svg>
        );
      case GameStage.GAME_OVER:
        return (
          <svg viewBox="0 0 24 24" width={size} height={size}>
            {/* Game over screen with controller */}
            <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z" />
            <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
            <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
            <path d="M7 10h2v2H7z" />
            <path d="M15 10h2v2h-2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`game-stage-icon ${className}`} data-stage={stage}>
      {getIcon()}
    </div>
  );
};

export default GameStageIcon; 
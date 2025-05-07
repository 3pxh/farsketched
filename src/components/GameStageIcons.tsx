import React from 'react';
import { GameStage } from '@/games/farsketched/types';
import GameStageIcon from './GameStageIcon';
import './GameStageIcons.css';

interface GameStageIconsProps {
  currentStage?: GameStage;
  size?: number;
  className?: string;
}

const GameStageIcons: React.FC<GameStageIconsProps> = ({
  currentStage,
  size = 128,
  className = '',
}) => {
  const stages = [
    GameStage.LOBBY,
    GameStage.PROMPTING,
    GameStage.FOOLING,
    GameStage.GUESSING,
    GameStage.SCORING,
    GameStage.GAME_OVER,
  ];

  return (
    <div className={`game-stage-icons ${className}`}>
      {stages.map((stage, index) => (
        <React.Fragment key={stage}>
          <GameStageIcon
            stage={stage}
            size={size}
            className={currentStage === stage ? 'active' : ''}
          />
          {index < stages.length - 1 && <div className="stage-connector" />}
        </React.Fragment>
      ))}
    </div>
  );
};

export default GameStageIcons; 
import { GameState, AchievementType } from '../types';
import './GameOverStage.css';

interface GameOverStageProps {
  gameState: GameState;
}

const ACHIEVEMENT_TITLES: Record<AchievementType, string> = {
  [AchievementType.MOST_ACCURATE]: 'Most Accurate',
  [AchievementType.BEST_BULLSHITTER]: 'Best Bullshitter',
  [AchievementType.THE_CHAOTICIAN]: 'The Chaotician',
  [AchievementType.THE_PAINTER]: 'The Painter'
};

const ACHIEVEMENT_DESCRIPTIONS: Record<AchievementType, string> = {
  [AchievementType.MOST_ACCURATE]: 'Made the most correct guesses',
  [AchievementType.BEST_BULLSHITTER]: 'Fooled the most people with fake prompts',
  [AchievementType.THE_CHAOTICIAN]: 'Created the most chaotic vote distribution',
  [AchievementType.THE_PAINTER]: 'Had their image prompts guessed correctly'
};

export function GameOverStage({ gameState }: GameOverStageProps) {
  // Calculate max points for score visualization
  const maxPoints = Math.max(...Object.values(gameState.players).map(p => p.points));
  
  // Sort players by points in ascending order
  const sortedPlayers = Object.values(gameState.players)
    .sort((a, b) => a.points - b.points);

  return (
    <div className="game-over-stage">
      <h2>Game Over</h2>
      
      <div className="achievements-section">
        <div className="achievements-grid">
          {gameState.achievements.map((achievement) => (
            <div 
              key={achievement.type}
              className="achievement-card"
            >
              <div className="achievement-avatars">
                {achievement.playerIds.map(playerId => {
                  const player = gameState.players[playerId];
                  return (
                    <img 
                      key={playerId}
                      src={player.avatarUrl} 
                      alt={player.name}
                      className="achievement-avatar"
                    />
                  );
                })}
              </div>
              <div>
                <h4 className="achievement-title">
                  {ACHIEVEMENT_TITLES[achievement.type]}
                </h4>
                <p className="achievement-description">
                  {ACHIEVEMENT_DESCRIPTIONS[achievement.type]}
                </p>
                <p className="achievement-players">
                  {achievement.playerIds.map(playerId => gameState.players[playerId].name).join(' & ')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="scores-section">
        <h3>Final Scores</h3>
        <div className="scores-container">
          {sortedPlayers.map((player) => {
            const heightPercentage = (player.points / maxPoints) * 100;
            return (
              <div 
                key={player.id}
                className="score-bar-container"
              >
                <div className="score-bar-wrapper">
                  <div 
                    className="score-bar"
                    style={{ height: `${heightPercentage}%` }}
                  >
                    <span className="score-points">{player.points}</span>
                  </div>
                </div>
                <img 
                  src={player.avatarUrl} 
                  alt={player.name}
                  className="score-avatar"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 
import { GameOverStage } from '../GameOverStage';
import { GameState, GameStage, AchievementType } from '../../types';
import '../../../../HostApp.css';

const players = [
  { id: 'player1', name: 'Alice', avatarUrl: 'https://i.pravatar.cc/150?img=1' },
  { id: 'player2', name: 'Bob', avatarUrl: 'https://i.pravatar.cc/150?img=2' },
  { id: 'player3', name: 'Charlie', avatarUrl: 'https://i.pravatar.cc/150?img=3' },
  { id: 'player4', name: 'Diana', avatarUrl: 'https://i.pravatar.cc/150?img=4' },
];

const playersObj = Object.fromEntries(
  players.map((p, i) => [p.id, {
    ...p,
    connected: true,
    points: (i + 1) * 25,
    lastSeen: Date.now()
  }])
);

const mockGameState: GameState = {
  config: {
    maxPlayers: 10,
    minPlayers: 3,
    roundCount: 3,
    promptTimerSeconds: 45,
    foolingTimerSeconds: 45,
    guessingTimerSeconds: 20,
    scoringDisplaySeconds: 10,
    apiProvider: 'stability',
    apiKey: '',
    roomCode: ''
  },
  stage: GameStage.GAME_OVER,
  players: playersObj,
  images: {
    'image1': {
      id: 'image1',
      creatorId: 'player1',
      prompt: 'A serene mountain landscape at sunset with a tranquil lake.',
      imageBlob: new Blob(['test'], { type: 'image/png' }),
      roundIndex: 0,
      timestamp: Date.now(),
      status: 'complete'
    },
    'image2': {
      id: 'image2',
      creatorId: 'player2',
      prompt: 'A dense forest in morning fog with sunlight rays.',
      imageBlob: new Blob(['test'], { type: 'image/png' }),
      roundIndex: 1,
      timestamp: Date.now(),
      status: 'complete'
    },
    'image3': {
      id: 'image3',
      creatorId: 'player3',
      prompt: 'A desert with cacti and a dramatic sunset sky.',
      imageBlob: new Blob(['test'], { type: 'image/png' }),
      roundIndex: 2,
      timestamp: Date.now(),
      status: 'complete'
    }
  },
  currentRound: 2,
  roundImages: [['image1'], ['image2'], ['image3']],
  activeImageIndex: 0,
  activeImage: null,
  timer: {
    startTime: Date.now(),
    duration: 0,
    isRunning: false
  },
  achievements: [
    { playerId: 'player4', type: AchievementType.MOST_ACCURATE, value: 8 },
    { playerId: 'player2', type: AchievementType.BEST_BULLSHITTER, value: 5 },
    { playerId: 'player2', type: AchievementType.THE_CHAOTICIAN, value: 5 },
    { playerId: 'player3', type: AchievementType.THE_PAINTER, value: 5 }
  ]
};

export default {
  'With Players and Achievements': () => <GameOverStage gameState={mockGameState} />,
  'No Achievements': () => <GameOverStage gameState={{
    ...mockGameState,
    achievements: []
  }} />,
  'Single Winner': () => <GameOverStage gameState={{
    ...mockGameState,
    players: Object.fromEntries(
      players.map((p, i) => [p.id, {
        ...p,
        connected: true,
        points: i === 0 ? 100 : 50,
        lastSeen: Date.now()
      }])
    )
  }} />
}; 
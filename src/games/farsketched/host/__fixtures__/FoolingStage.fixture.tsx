import { FoolingStage } from '../FoolingStage';
import { GameState, GameStage } from '../../types';

const players = [
  { id: 'player1', name: 'Alice', avatarUrl: 'https://i.pravatar.cc/150?img=1' },
  { id: 'player2', name: 'Bob', avatarUrl: 'https://i.pravatar.cc/150?img=2' },
  { id: 'player3', name: 'Charlie', avatarUrl: 'https://i.pravatar.cc/150?img=3' },
];

const playersObj = Object.fromEntries(
  players.map((p, i) => [p.id, {
    ...p,
    connected: true,
    points: (i + 1) * 10,
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
  stage: GameStage.FOOLING,
  history: [],
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
    }
  },
  currentRound: 0,
  roundImages: [['image1']],
  activeImageIndex: 0,
  activeImage: {
    imageId: 'image1',
    fakePrompts: [],
    guesses: []
  },
  timer: {
    startTime: Date.now(),
    duration: 45,
    isRunning: true
  },
  achievements: []
};

export default {
  'With Active Image': () => <FoolingStage gameState={mockGameState} />,
  'No Active Image': () => <FoolingStage gameState={{ ...mockGameState, activeImage: null }} />,
  'Image Not Found': () => <FoolingStage gameState={{ ...mockGameState, images: {} }} />
}; 
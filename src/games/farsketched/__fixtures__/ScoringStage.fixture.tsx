import { ScoringStage } from '../Host';
import { GameState, GameStage } from '../types';

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
  stage: GameStage.SCORING,
  players: {
    'player1': {
      id: 'player1',
      name: 'Alice',
      avatarUrl: 'https://i.pravatar.cc/150?img=1',
      connected: true,
      points: 15,
      lastSeen: Date.now()
    },
    'player2': {
      id: 'player2',
      name: 'Bob',
      avatarUrl: 'https://i.pravatar.cc/150?img=2',
      connected: true,
      points: 10,
      lastSeen: Date.now()
    },
    'player3': {
      id: 'player3',
      name: 'Charlie',
      avatarUrl: 'https://i.pravatar.cc/150?img=3',
      connected: true,
      points: 8,
      lastSeen: Date.now()
    }
  },
  images: {
    'image1': {
      id: 'image1',
      creatorId: 'player1',
      prompt: 'A serene mountain landscape at sunset',
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
    fakePrompts: [
      {
        id: 'fake1',
        imageId: 'image1',
        authorId: 'player2',
        text: 'A peaceful lake with mountains in the background'
      },
      {
        id: 'fake2',
        imageId: 'image1',
        authorId: 'player3',
        text: 'A beautiful sunset over the ocean'
      }
    ],
    guesses: [
      {
        playerId: 'player2',
        imageId: 'image1',
        promptId: 'real',
        isCorrect: true
      },
      {
        playerId: 'player3',
        imageId: 'image1',
        promptId: 'fake1',
        isCorrect: false
      }
    ]
  },
  timer: {
    startTime: Date.now(),
    duration: 10,
    isRunning: true
  },
  achievements: []
};

export default {
  'Default State': () => <ScoringStage gameState={mockGameState} />
}; 
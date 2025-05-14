import { GuessingStage } from '../GuessingStage';
import { GameState, GameStage } from '../../types';
import '../../../../HostApp.css';

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

const fakePrompts = [
  { id: 'fake1', imageId: 'image1', authorId: 'player2', text: 'A peaceful lake at sunset with golden mountains.' },
  { id: 'fake2', imageId: 'image1', authorId: 'player3', text: 'Waves crash on the shore as the sun sets over the ocean.' },
];

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
  stage: GameStage.GUESSING,
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
    fakePrompts,
    guesses: []
  },
  timer: {
    startTime: Date.now(),
    duration: 20,
    isRunning: true
  },
  achievements: [],
  history: []
};

export default {
  'With Fake Prompts': () => <GuessingStage gameState={mockGameState} />,
  'No Fake Prompts': () => <GuessingStage gameState={{
    ...mockGameState,
    activeImage: {
      ...mockGameState.activeImage!,
      fakePrompts: []
    }
  }} />,
  'With Some Guesses': () => <GuessingStage gameState={{
    ...mockGameState,
    activeImage: {
      ...mockGameState.activeImage!,
      guesses: [
        { playerId: 'player2', imageId: 'image1', promptId: 'real', isCorrect: true },
        { playerId: 'player3', imageId: 'image1', promptId: 'fake1', isCorrect: false }
      ]
    }
  }} />
}; 
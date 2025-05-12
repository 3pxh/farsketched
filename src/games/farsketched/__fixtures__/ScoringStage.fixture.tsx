import { ScoringStage } from '../Host';
import { GameState, GameStage } from '../types';
import '../../../HostApp.css';

const players = [
  { id: 'player1', name: 'Alice', avatarUrl: 'https://i.pravatar.cc/150?img=1' },
  { id: 'player2', name: 'Bob', avatarUrl: 'https://i.pravatar.cc/150?img=2' },
  { id: 'player3', name: 'Charlie', avatarUrl: 'https://i.pravatar.cc/150?img=3' },
  { id: 'player4', name: 'Diana', avatarUrl: 'https://i.pravatar.cc/150?img=4' },
  { id: 'player5', name: 'Eve', avatarUrl: 'https://i.pravatar.cc/150?img=5' },
  { id: 'player6', name: 'Frank', avatarUrl: 'https://i.pravatar.cc/150?img=6' },
  { id: 'player7', name: 'Grace', avatarUrl: 'https://i.pravatar.cc/150?img=7' },
  { id: 'player8', name: 'Heidi', avatarUrl: 'https://i.pravatar.cc/150?img=8' },
];

const playersObj = Object.fromEntries(
  players.map((p, i) => [p.id, {
    ...p,
    connected: true,
    points: (i + 5) * 5,
    lastSeen: Date.now()
  }])
);

const fakePrompts = [
  { id: 'fake1', imageId: 'image1', authorId: 'player2', text: 'A peaceful lake at sunset with golden mountains.' },
  { id: 'fake2', imageId: 'image1', authorId: 'player3', text: 'Waves crash on the shore as the sun sets over the ocean.' },
  { id: 'fake3', imageId: 'image1', authorId: 'player4', text: 'A city skyline at dawn, skyscrapers in the first light.' },
  { id: 'fake4', imageId: 'image1', authorId: 'player5', text: 'A dense forest in morning fog with sunlight rays.' },
  { id: 'fake5', imageId: 'image1', authorId: 'player6', text: 'A desert with cacti and a dramatic sunset sky.' },
  { id: 'fake6', imageId: 'image1', authorId: 'player7', text: 'A snowy mountain peak under a starry night sky.' },
  { id: 'fake7', imageId: 'image1', authorId: 'player8', text: 'A winding river through green hills and wildflowers.' },
];

const guesses = [
  // Real prompt guessed by Bob, Diana, Eve, Frank, Grace
  { playerId: 'player2', imageId: 'image1', promptId: 'real', isCorrect: true },
  { playerId: 'player4', imageId: 'image1', promptId: 'real', isCorrect: true },
  { playerId: 'player5', imageId: 'image1', promptId: 'real', isCorrect: true },
  { playerId: 'player6', imageId: 'image1', promptId: 'real', isCorrect: true },
  { playerId: 'player7', imageId: 'image1', promptId: 'real', isCorrect: true },
  // Fake1 guessed by Charlie
  { playerId: 'player3', imageId: 'image1', promptId: 'fake1', isCorrect: false },
  // Fake4 guessed by Heidi
  { playerId: 'player8', imageId: 'image1', promptId: 'fake4', isCorrect: false },
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
  stage: GameStage.SCORING,
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
    guesses
  },
  timer: {
    startTime: Date.now(),
    duration: 10,
    isRunning: true
  },
  achievements: []
};

export default {
  '8 Players Example': () => <ScoringStage gameState={mockGameState} />
}; 
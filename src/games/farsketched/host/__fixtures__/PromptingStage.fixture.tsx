import { PromptingStage } from '../PromptingStage';
import { GameState, GameStage } from '../../types';
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
  stage: GameStage.PROMPTING,
  players: playersObj,
  images: {},
  currentRound: 0,
  roundImages: [[]],
  activeImageIndex: 0,
  activeImage: null,
  timer: {
    startTime: Date.now(),
    duration: 45,
    isRunning: true
  },
  achievements: []
};

export default {
  'With Players': () => <PromptingStage gameState={mockGameState} />,
  'Min Players': () => <PromptingStage gameState={{
    ...mockGameState,
    players: Object.fromEntries(
      players.slice(0, 3).map((p, i) => [p.id, {
        ...p,
        connected: true,
        points: (i + 1) * 10,
        lastSeen: Date.now()
      }])
    )
  }} />,
  'Max Players': () => <PromptingStage gameState={{
    ...mockGameState,
    players: Object.fromEntries(
      Array.from({ length: 10 }, (_, i) => ({
        id: `player${i + 1}`,
        name: `Player ${i + 1}`,
        avatarUrl: `https://i.pravatar.cc/150?img=${i + 1}`
      })).map((p, i) => [p.id, {
        ...p,
        connected: true,
        points: (i + 1) * 10,
        lastSeen: Date.now()
      }])
    )
  }} />
}; 
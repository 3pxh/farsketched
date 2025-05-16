import { ScoringStage } from '../ScoringStage';
import { GameState, GameStage } from '../../types';
import { ClientGameStateProvider } from '@/contexts/GameState';
import { PeerProvider } from '@/contexts/PeerContext';

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
    apiKey: 'test-key',
    roomCode: 'TEST123'
  },
  stage: GameStage.SCORING,
  players: {
    'player1': {
      id: 'player1',
      name: 'Alice',
      avatarUrl: 'https://i.pravatar.cc/150?img=1',
      connected: true,
      points: 25,
      lastSeen: Date.now()
    },
    'player2': {
      id: 'player2',
      name: 'Bob',
      avatarUrl: 'https://i.pravatar.cc/150?img=2',
      connected: true,
      points: 18,
      lastSeen: Date.now()
    },
    'player3': {
      id: 'player3',
      name: 'Charlie',
      avatarUrl: 'https://i.pravatar.cc/150?img=3',
      connected: true,
      points: 15,
      lastSeen: Date.now()
    },
    'player4': {
      id: 'player4',
      name: 'Diana',
      avatarUrl: 'https://i.pravatar.cc/150?img=4',
      connected: false,
      points: 12,
      lastSeen: Date.now() - 60000
    },
    'player5': {
      id: 'player5',
      name: 'Eve',
      avatarUrl: 'https://i.pravatar.cc/150?img=5',
      connected: true,
      points: 8,
      lastSeen: Date.now()
    }
  },
  currentRound: 1,
  roundImages: [['image1']],
  activeImageIndex: 0,
  activeImage: {
    imageId: 'image1',
    fakePrompts: [],
    guesses: []
  },
  images: {},
  timer: {
    startTime: Date.now(),
    duration: 10,
    isRunning: true
  },
  achievements: [],
  history: []
};

export default {
  'Default': () => (
    <PeerProvider isHost={false}>
      <ClientGameStateProvider initialState={mockGameState} debug={true}>
        <ScoringStage />
      </ClientGameStateProvider>
    </PeerProvider>
  )
}; 
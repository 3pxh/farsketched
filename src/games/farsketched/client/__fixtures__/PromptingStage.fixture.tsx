import { PromptingStage } from '../PromptingStage';
import { GameState, GameStage } from '../../types';
import { ClientGameStateProvider } from '@/contexts/GameState';
import { PeerProvider } from '@/contexts/PeerContext';
import { mockBlob } from './BlobMock';

const mockGameState: GameState = {
  stage: GameStage.PROMPTING,
  currentRound: 0,
  players: {
    'player1': {
      id: 'player1',
      name: 'Player 1',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=player1',
      connected: true,
      points: 0,
      lastSeen: Date.now()
    },
    'player2': {
      id: 'player2',
      name: 'Player 2',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=player2',
      connected: true,
      points: 0,
      lastSeen: Date.now()
    },
  },
  roundImages: [[]],
  images: {},
  activeImage: null,
  activeImageIndex: 0,
  config: {
    maxPlayers: 10,
    minPlayers: 3,
    roundCount: 3,
    promptTimerSeconds: 45,
    foolingTimerSeconds: 45,
    guessingTimerSeconds: 20,
    scoringDisplaySeconds: 10,
    apiProvider: 'openai',
    apiKey: '',
    roomCode: 'test-room'
  },
  achievements: [],
  timer: {
    isRunning: false,
    startTime: 0,
    duration: 0
  },
  history: []
};

export default {
  'Empty State': (
    <PeerProvider isHost={false}>
      <ClientGameStateProvider initialState={mockGameState} debug={true}>
        <PromptingStage />
      </ClientGameStateProvider>
    </PeerProvider>
  ),
  'Just Submitted': (
    <PeerProvider isHost={false}>
      <ClientGameStateProvider 
        initialState={{
          ...mockGameState,
          roundImages: [['image1']],
          images: {
            'image1': {
              id: 'image1',
              creatorId: 'player1',
              prompt: 'A beautiful sunset over mountains',
              status: 'pending',
              roundIndex: 0,
              timestamp: Date.now()
            }
          }
        }} 
        debug={true}
      >
        <PromptingStage />
      </ClientGameStateProvider>
    </PeerProvider>
  ),
  'With Generated Image': (
    <PeerProvider isHost={false}>
      <ClientGameStateProvider 
        initialState={{
          ...mockGameState,
          roundImages: [['image1']],
          images: {
            'image1': {
              id: 'image1',
              creatorId: 'player1',
              prompt: 'A beautiful sunset over mountains',
              status: 'complete',
              imageBlob: mockBlob,
              roundIndex: 0,
              timestamp: Date.now()
            }
          }
        }} 
        debug={true}
      >
        <PromptingStage />
      </ClientGameStateProvider>
    </PeerProvider>
  )
}; 
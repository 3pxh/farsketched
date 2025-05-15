import { GameOverStage } from '../GameOverStage';
import { GameState, GameStage } from '../../types';
import { ClientGameStateProvider } from '@/contexts/GameState';
import { PeerProvider } from '@/contexts/PeerContext';
import { mockBlob } from './BlobMock';

const mockGameState: GameState = {
  stage: GameStage.GAME_OVER,
  currentRound: 2, // Game is finished
  players: {
    'player1': {
      id: 'player1',
      name: 'Alice',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
      connected: true,
      points: 100,
      lastSeen: Date.now()
    },
    'player2': {
      id: 'player2',
      name: 'Bob',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
      connected: true,
      points: 75,
      lastSeen: Date.now()
    },
    'player3': {
      id: 'player3',
      name: 'Charlie',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie',
      connected: true,
      points: 50,
      lastSeen: Date.now()
    }
  },
  roundImages: [
    ['image1'],
    ['image2'],
    ['image3']
  ],
  images: {
    'image1': {
      id: 'image1',
      creatorId: 'player1',
      prompt: 'A serene mountain landscape at sunset',
      status: 'complete',
      imageBlob: mockBlob,
      roundIndex: 0,
      timestamp: Date.now()
    },
    'image2': {
      id: 'image2',
      creatorId: 'player2',
      prompt: 'A futuristic cityscape with flying cars',
      status: 'complete',
      imageBlob: mockBlob,
      roundIndex: 1,
      timestamp: Date.now()
    },
    'image3': {
      id: 'image3',
      creatorId: 'player3',
      prompt: 'An underwater scene with bioluminescent creatures',
      status: 'complete',
      imageBlob: mockBlob,
      roundIndex: 2,
      timestamp: Date.now()
    }
  },
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
  history: [
    {
      imageId: 'image1',
      fakePrompts: [
        {
          id: 'fake1',
          imageId: 'image1',
          authorId: 'player2',
          text: 'A peaceful mountain lake reflecting the sunset'
        },
        {
          id: 'fake2',
          imageId: 'image1',
          authorId: 'player3',
          text: 'A dramatic mountain peak piercing through clouds'
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
    }
  ]
};

export default {
  'Complete Game': (
    <PeerProvider isHost={false}>
      <ClientGameStateProvider initialState={mockGameState} debug={true}>
        <GameOverStage />
      </ClientGameStateProvider>
    </PeerProvider>
  ),
  'Single Round': (
    <PeerProvider isHost={false}>
      <ClientGameStateProvider 
        initialState={{
          ...mockGameState,
          currentRound: 0,
          roundImages: [['image1']],
          images: {
            'image1': mockGameState.images['image1']
          }
        }} 
        debug={true}
      >
        <GameOverStage />
      </ClientGameStateProvider>
    </PeerProvider>
  ),
  'Multiple Players Same Round': (
    <PeerProvider isHost={false}>
      <ClientGameStateProvider 
        initialState={{
          ...mockGameState,
          currentRound: 0,
          roundImages: [['image1', 'image2', 'image3']],
          images: {
            'image1': {
              ...mockGameState.images['image1'],
              roundIndex: 0
            },
            'image2': {
              ...mockGameState.images['image2'],
              roundIndex: 0
            },
            'image3': {
              ...mockGameState.images['image3'],
              roundIndex: 0
            }
          }
        }} 
        debug={true}
      >
        <GameOverStage />
      </ClientGameStateProvider>
    </PeerProvider>
  )
}; 
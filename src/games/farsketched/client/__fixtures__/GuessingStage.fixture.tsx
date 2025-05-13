import { GuessingStage } from '../GuessingStage';
import { GameState, GameStage } from '../../types';
import { ClientGameStateProvider } from '@/contexts/GameState';
import { PeerProvider } from '@/contexts/PeerContext';

const mockGameState: GameState = {
  stage: GameStage.GUESSING,
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
  roundImages: [
    ['image1']
  ],
  images: {
    'image1': {
      id: 'image1',
      creatorId: 'player1',
      prompt: 'A beautiful sunset over mountains',
      status: 'complete',
      imageBlob: new Blob([new Uint8Array([1, 2, 3])], { type: 'image/webp' }),
      roundIndex: 0,
      timestamp: Date.now()
    }
  },
  activeImage: {
    imageId: 'image1',
    fakePrompts: [
      {
        id: 'fake1',
        imageId: 'image1',
        authorId: 'player2',
        text: 'A mountain landscape at dawn'
      }
    ],
    guesses: []
  },
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
  }
};

export default {
  'Empty State': (
    <PeerProvider isHost={false}>
      <ClientGameStateProvider initialState={mockGameState} debug={true}>
        <GuessingStage />
      </ClientGameStateProvider>
    </PeerProvider>
  ),
  'With Submitted Guess': (
    <PeerProvider isHost={false}>
      <ClientGameStateProvider 
        initialState={{
          ...mockGameState,
          activeImage: {
            ...mockGameState.activeImage!,
            guesses: [
              {
                id: 'guess1',
                imageId: 'image1',
                authorId: 'player2',
                selectedPromptId: 'fake1'
              }
            ]
          }
        }} 
        debug={true}
      >
        <GuessingStage />
      </ClientGameStateProvider>
    </PeerProvider>
  ),
  'All Players Guessed': (
    <PeerProvider isHost={false}>
      <ClientGameStateProvider 
        initialState={{
          ...mockGameState,
          activeImage: {
            ...mockGameState.activeImage!,
            guesses: [
              {
                id: 'guess1',
                imageId: 'image1',
                authorId: 'player2',
                selectedPromptId: 'fake1'
              },
              {
                id: 'guess2',
                imageId: 'image1',
                authorId: 'player1',
                selectedPromptId: 'fake1'
              }
            ]
          }
        }} 
        debug={true}
      >
        <GuessingStage />
      </ClientGameStateProvider>
    </PeerProvider>
  )
}; 
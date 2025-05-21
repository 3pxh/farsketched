import { GameStage, GameState, Player, GeneratedImage, FakePrompt, Guess } from '../../types';
import { PeerProvider } from '@/contexts/PeerContext';
import { HostGameStateProvider } from '@/contexts/GameState';
import { ScoringStageAlt } from '../ScoringStageAlt';
import { initialState } from '../../reducer';
import { mockBlob } from '../../__fixtures__/mockBlob';

// Define FixtureWrapper locally
const FixtureWrapper = ({ children }: { children: React.ReactNode }) => (
  <div style={{ 
    width: '100vw', 
    height: '100vh', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f8cdda 0%, #a1c4fd 100%)'
  }}>
    {children}
  </div>
);

// Mock players
const playersObj: Record<string, Player> = {
  player1: {
    id: 'player1',
    name: 'Alice',
    avatarUrl: 'https://i.pravatar.cc/150?img=1',
    points: 0,
    connected: true,
    lastSeen: Date.now()
  },
  player2: {
    id: 'player2',
    name: 'Bob',
    avatarUrl: 'https://i.pravatar.cc/150?img=2',
    points: 0,
    connected: true,
    lastSeen: Date.now()
  },
  player3: {
    id: 'player3',
    name: 'Charlie',
    avatarUrl: 'https://i.pravatar.cc/150?img=3',
    points: 0,
    connected: true,
    lastSeen: Date.now()
  }
};

// Mock image
const mockImage: GeneratedImage = {
  id: 'image1',
  prompt: 'A cat wearing a tuxedo playing chess',
  creatorId: 'player1',
  imageBlob: mockBlob,
  roundIndex: 0,
  timestamp: Date.now(),
  status: 'complete'
};

// Mock fake prompts
const fakePrompts: FakePrompt[] = [
  {
    id: 'fake1',
    text: 'A dog wearing a bowtie playing poker',
    authorId: 'player2',
    imageId: 'image1'
  },
  {
    id: 'fake2',
    text: 'A hamster in a suit playing checkers',
    authorId: 'player3',
    imageId: 'image1'
  }
];

// Mock guesses
const guesses: Guess[] = [
  {
    playerId: 'player2',
    promptId: 'real',
    isCorrect: true,
    imageId: 'image1'
  },
  {
    playerId: 'player3',
    promptId: 'fake1',
    isCorrect: false,
    imageId: 'image1'
  }
];

export default {
  'Scoring Stage Alt': () => {
    const scoringState: GameState = {
      ...initialState,
      stage: GameStage.SCORING,
      players: playersObj,
      currentRound: 0,
      images: { 'image1': mockImage },
      roundImages: [['image1']],
      activeImageIndex: 0,
      activeImage: {
        imageId: 'image1',
        fakePrompts,
        guesses
      },
      timer: {
        startTime: Date.now(),
        duration: 20, // Hardcode the duration since we don't have access to gameConfig
        isRunning: true
      }
    };

    return (
      <FixtureWrapper>
        <PeerProvider isHost={true}>
          <HostGameStateProvider<GameState> initialState={scoringState} debug={true}>
            <ScoringStageAlt gameState={scoringState} />
          </HostGameStateProvider>
        </PeerProvider>
      </FixtureWrapper>
    );
  }
}; 
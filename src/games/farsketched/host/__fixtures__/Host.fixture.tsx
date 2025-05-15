import { HostContent } from '../Host';
import { GameState, GameStage, Player, FakePrompt, Guess, AchievementType } from '../../types';
import { PeerProvider } from '@/contexts/PeerContext';
import { HostGameStateProvider } from '@/contexts/GameState';
import { initialState } from '../../reducer';
import { ThemeProvider } from '@mui/material';
import { createHostTheme } from '@/HostApp';
import '../../../../HostApp.css';

// Create a theme instance for fixtures
const fixtureTheme = createHostTheme();

// Wrapper component to avoid repetition
const FixtureWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={fixtureTheme}>
    {children}
  </ThemeProvider>
);

const players: Player[] = [
  { 
    id: 'player1',
    name: 'Alice',
    avatarUrl: 'https://i.pravatar.cc/150?img=1',
    connected: true,
    points: 0,
    lastSeen: Date.now()
  },
  { 
    id: 'player2',
    name: 'Bob',
    avatarUrl: 'https://i.pravatar.cc/150?img=2',
    connected: true,
    points: 0,
    lastSeen: Date.now()
  },
  { 
    id: 'player3',
    name: 'Charlie',
    avatarUrl: 'https://i.pravatar.cc/150?img=3',
    connected: false, // Disconnected player
    points: 0,
    lastSeen: Date.now() - 60000 // Last seen 1 minute ago
  }
];

const gameConfig = {
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
};

const mockImage = {
  id: 'image1',
  creatorId: 'player1',
  prompt: 'A serene mountain landscape at sunset with a tranquil lake',
  imageBlob: new Blob(['test'], { type: 'image/png' }),
  roundIndex: 0,
  timestamp: Date.now(),
  status: 'complete' as const
};

const fakePrompts: FakePrompt[] = [
  { id: 'fake1', imageId: 'image1', authorId: 'player2', text: 'A peaceful desert oasis under a starlit sky' },
  { id: 'fake2', imageId: 'image1', authorId: 'player3', text: 'A misty forest clearing at dawn with rays of sunlight' }
];

const guesses: Guess[] = [
  { playerId: 'player2', imageId: 'image1', promptId: 'real', isCorrect: true },
  { playerId: 'player3', imageId: 'image1', promptId: 'fake1', isCorrect: false }
];

const playersObj = Object.fromEntries(players.map(p => [p.id, p]));

export default {
  'Empty Lobby': () => {
    const emptyState = {
      ...initialState,
      stage: GameStage.LOBBY
    };

    return (
      <FixtureWrapper>
        <PeerProvider isHost={true}>
          <HostGameStateProvider<GameState> initialState={emptyState} debug={true}>
            <HostContent gameConfig={{...gameConfig, roomCode: 'EMPTY'}} />
          </HostGameStateProvider>
        </PeerProvider>
      </FixtureWrapper>
    );
  },
  'Lobby with Players': () => {
    const stateWithPlayers = {
      ...initialState,
      stage: GameStage.LOBBY,
      players: playersObj
    };

    return (
      <FixtureWrapper>
        <PeerProvider isHost={true}>
          <HostGameStateProvider<GameState> initialState={stateWithPlayers} debug={true}>
            <HostContent gameConfig={gameConfig} />
          </HostGameStateProvider>
        </PeerProvider>
      </FixtureWrapper>
    );
  },
  'Prompting Stage': () => {
    const promptingState = {
      ...initialState,
      stage: GameStage.PROMPTING,
      players: playersObj,
      currentRound: 0,
      timer: {
        startTime: Date.now(),
        duration: gameConfig.promptTimerSeconds,
        isRunning: true
      }
    };

    return (
      <FixtureWrapper>
        <PeerProvider isHost={true}>
          <HostGameStateProvider<GameState> initialState={promptingState} debug={true}>
            <HostContent gameConfig={gameConfig} />
          </HostGameStateProvider>
        </PeerProvider>
      </FixtureWrapper>
    );
  },
  'Fooling Stage': () => {
    const foolingState = {
      ...initialState,
      stage: GameStage.FOOLING,
      players: playersObj,
      currentRound: 0,
      images: { 'image1': mockImage },
      roundImages: [['image1']],
      activeImageIndex: 0,
      activeImage: {
        imageId: 'image1',
        fakePrompts: [],
        guesses: []
      },
      timer: {
        startTime: Date.now(),
        duration: gameConfig.foolingTimerSeconds,
        isRunning: true
      }
    };

    return (
      <FixtureWrapper>
        <PeerProvider isHost={true}>
          <HostGameStateProvider<GameState> initialState={foolingState} debug={true}>
            <HostContent gameConfig={gameConfig} />
          </HostGameStateProvider>
        </PeerProvider>
      </FixtureWrapper>
    );
  },
  'Guessing Stage': () => {
    const guessingState = {
      ...initialState,
      stage: GameStage.GUESSING,
      players: playersObj,
      currentRound: 0,
      images: { 'image1': mockImage },
      roundImages: [['image1']],
      activeImageIndex: 0,
      activeImage: {
        imageId: 'image1',
        fakePrompts,
        guesses: []
      },
      timer: {
        startTime: Date.now(),
        duration: gameConfig.guessingTimerSeconds,
        isRunning: true
      }
    };

    return (
      <FixtureWrapper>
        <PeerProvider isHost={true}>
          <HostGameStateProvider<GameState> initialState={guessingState} debug={true}>
            <HostContent gameConfig={gameConfig} />
          </HostGameStateProvider>
        </PeerProvider>
      </FixtureWrapper>
    );
  },
  'Scoring Stage': () => {
    const scoringState = {
      ...initialState,
      stage: GameStage.SCORING,
      players: {
        ...playersObj,
        player2: { ...playersObj.player2, points: 5 },
        player3: { ...playersObj.player3, points: 2 }
      },
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
        duration: gameConfig.scoringDisplaySeconds,
        isRunning: true
      }
    };

    return (
      <FixtureWrapper>
        <PeerProvider isHost={true}>
          <HostGameStateProvider<GameState> initialState={scoringState} debug={true}>
            <HostContent gameConfig={gameConfig} />
          </HostGameStateProvider>
        </PeerProvider>
      </FixtureWrapper>
    );
  },
  'Game Over': () => {
    const gameOverState = {
      ...initialState,
      stage: GameStage.GAME_OVER,
      players: {
        ...playersObj,
        player1: { ...playersObj.player1, points: 15 },
        player2: { ...playersObj.player2, points: 12 },
        player3: { ...playersObj.player3, points: 8 }
      },
      currentRound: 2,
      images: { 'image1': mockImage },
      roundImages: [['image1'], ['image1'], ['image1']],
      activeImage: null,
      history: [{
        imageId: 'image1',
        fakePrompts,
        guesses
      }],
      achievements: [{
        type: AchievementType.MOST_ACCURATE,
        playerIds: ['player1'],
        value: 3
      }]
    };

    return (
      <FixtureWrapper>
        <PeerProvider isHost={true}>
          <HostGameStateProvider<GameState> initialState={gameOverState} debug={true}>
            <HostContent gameConfig={gameConfig} />
          </HostGameStateProvider>
        </PeerProvider>
      </FixtureWrapper>
    );
  }
}; 
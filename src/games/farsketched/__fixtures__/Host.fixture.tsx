import { PeerProvider } from '@/contexts/PeerContext';
import { HostGameStateProvider } from '@/contexts/GameState';
import { ThemeProvider } from '@mui/material';
import { createHostTheme } from '@/HostApp';
import { HostContent } from '../host/Host';
import { GameState, GameStage, Player, FakePrompt, Guess, AchievementType } from '../types';
import { initialState } from '../reducer';

function base64ToBlob(base64: string, mime = 'image/png') {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mime });
}

const mockBlob = base64ToBlob('iVBORw0KGgoAAAANSUhEUgAAAgAAAAIACAYAAAD0eNT6AAAACXBIWXMAAA7EAAAOxAGVKw4bAAAEv2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSfvu78nIGlkPSdXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQnPz4KPHg6eG1wbWV0YSB4bWxuczp4PSdhZG9iZTpuczptZXRhLyc+CjxyZGY6UkRGIHhtbG5zOnJkZj0naHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyc+CgogPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9JycKICB4bWxuczpBdHRyaWI9J2h0dHA6Ly9ucy5hdHRyaWJ1dGlvbi5jb20vYWRzLzEuMC8nPgogIDxBdHRyaWI6QWRzPgogICA8cmRmOlNlcT4KICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0nUmVzb3VyY2UnPgogICAgIDxBdHRyaWI6Q3JlYXRlZD4yMDI1LTA1LTEzPC9BdHRyaWI6Q3JlYXRlZD4KICAgICA8QXR0cmliOkV4dElkPjE1NmUzMTU3LTA1NTAtNGU2Yy1hZGUwLTM5MThiZWQ5Mzk2YzwvQXR0cmliOkV4dElkPgogICAgIDxBdHRyaWI6RmJJZD41MjUyNjU5MTQxNzk1ODA8L0F0dHJpYjpGYklkPgogICAgIDxBdHRyaWI6VG91Y2hUeXBlPjI8L0F0dHJpYjpUb3VjaFR5cGU+CiAgICA8L3JkZjpsaT4KICAgPC9yZGY6U2VxPgogIDwvQXR0cmliOkFkcz4KIDwvcmRmOkRlc2NyaXB0aW9uPgoKIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PScnCiAgeG1sbnM6ZGM9J2h0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvJz4KICA8ZGM6dGl0bGU+CiAgIDxyZGY6QWx0PgogICAgPHJkZjpsaSB4bWw6bGFuZz0neC1kZWZhdWx0Jz5VbnRpdGxlZCBkZXNpZ24gLSAxPC9yZGY6bGk+CiAgIDwvcmRmOkFsdD4KICA8L2RjOnRpdGxlPgogPC9yZGY6RGVzY3JpcHRpb24+CgogPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9JycKICB4bWxuczpwZGY9J2h0dHA6Ly9ucy5hZG9iZS5jb20vcGRmLzEuMy8nPgogIDxwZGY6QXV0aG9yPkJlbmphbWluIE9sbXN0ZWQ8L3BkZjpBdXRob3I+CiA8L3JkZjpEZXNjcmlwdGlvbj4KCiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0nJwogIHhtbG5zOnhtcD0naHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyc+CiAgPHhtcDpDcmVhdG9yVG9vbD5DYW52YSAoUmVuZGVyZXIpIGRvYz1EQUduVjhVWXhsZyB1c2VyPVVBQnRtRFBaQ0k4IGJyYW5kPUJBQnRtTzg1Tk9NIHRlbXBsYXRlPTwveG1wOkNyZWF0b3JUb29sPgogPC9yZGY6RGVzY3JpcHRpb24+CjwvcmRmOlJERj4KPC94OnhtcG1ldGE+Cjw/eHBhY2tldCBlbmQ9J3InPz68ceuUAAAIa0lEQVR4nOzWMQHAIADAsDG9OMUHNpiLcTRR0LNjzX0eACDlvR0AAPzPAABAkAEAgCADAABBBgAAggwAAAQZAAAIMgAAEGQAACDIAABAkAEAgCADAABBBgAAggwAAAQZAAAIMgAAEGQAACDIAABAkAEAgCADAABBBgAAggwAAAQZAAAIMgAAEGQAACDIAABAkAEAgCADAABBBgAAggwAAAQZAAAIMgAAEGQAACDIAABAkAEAgCADAABBBgAAggwAAAQZAAAIMgAAEGQAACDIAABAkAEAgCADAABBBgAAggwAAAQZAAAIMgAAEGQAACDIAABAkAEAgCADAABBBgAAggwAAAQZAAAIMgAAEGQAACDIAABAkAEAgCADAABBBgAAggwAAAQZAAAIMgAAEGQAACDIAABAkAEAgCADAABBBgAAggwAAAQZAAAIMgAAEGQAACDIAABAkAEAgCADAABBBgAAggwAAAQZAAAIMgAAEGQAACDIAABAkAEAgCADAABBBgAAggwAAAQZAAAIMgAAEGQAACDIAABAkAEAgCADAABBBgAAggwAAAQZAAAIMgAAEGQAACDIAABAkAEAgCADAABBBgAAggwAAAQZAAAIMgAAEGQAACDIAABAkAEAgCADAABBBgAAggwAAAQZAAAIMgAAEGQAACDIAABAkAEAgCADAABBBgAAggwAAAQZAAAIMgAAEGQAACDIAABAkAEAgCADAABBBgAAggwAAAQZAAAI+gAAAP//7NaBAAAAAIAgf+tBLooEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgIAAP//7NaBAAAAAIAgf+tBLooEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgIAAP//7daBAAAAAIAgf+tBLooEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgQAAIYEAACGBAAAhgL9sQccUU9fJwAAAABJRU5ErkJggg==')


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
  room: 'TEST123'
};

const mockImage = {
  id: 'image1',
  creatorId: 'player1',
  prompt: 'A serene mountain landscape at sunset with a tranquil lake',
  imageBlob: mockBlob,
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
            <HostContent gameConfig={{...gameConfig, room: 'EMPTY'}} />
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
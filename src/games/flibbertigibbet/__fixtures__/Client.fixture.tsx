import { PeerProvider } from '@/contexts/PeerContext';
import { ClientGameStateProvider } from '@/contexts/GameState';
import { ThemeProvider } from '@mui/material';
import { clientTheme } from '@/ClientApp';
import { initialState } from '../reducer';
import { GameState, GameStage, Player, FakePrompt, Guess, AchievementType } from '../types';
import { ClientContent } from '../client/ClientContent';

const players: Player[] = [
  { 
    id: 'player1', // This will be our client's ID
    name: 'Alice',
    avatarUrl: 'https://robohash.org/alice.png?set=set1',
    connected: true,
    points: 0,
    lastSeen: Date.now()
  },
  { 
    id: 'player2',
    name: 'Bob',
    avatarUrl: 'https://robohash.org/bob.png?set=set2',
    connected: true,
    points: 0,
    lastSeen: Date.now()
  },
  { 
    id: 'player3',
    name: 'Charlie',
    avatarUrl: 'https://robohash.org/charlie.png?set=set3',
    connected: false,
    points: 0,
    lastSeen: Date.now() - 60000
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
  room: 'TEST123'
};

const mockText = {
  id: 'text1',
  creatorId: 'player2',
  prompt: 'A serene mountain landscape at sunset with a tranquil lake',
  text: 'The sun dipped below the jagged peaks, casting long shadows across the valley. A gentle breeze rippled the surface of the lake, turning the water into a mirror of orange and gold. The last rays of sunlight painted the clouds in brilliant hues of pink and purple, while the first stars began to twinkle in the darkening sky.',
  roundIndex: 0,
  timestamp: Date.now(),
  status: 'complete' as const
};

const fakePrompts: FakePrompt[] = [
  { id: 'fake1', textId: 'text1', authorId: 'player1', text: 'A peaceful desert oasis under a starlit sky' },
  { id: 'fake2', textId: 'text1', authorId: 'player3', text: 'A misty forest clearing at dawn with rays of sunlight' }
];

const guesses: Guess[] = [
  { playerId: 'player1', textId: 'text1', promptId: 'real', isCorrect: true },
  { playerId: 'player3', textId: 'text1', promptId: 'fake1', isCorrect: false }
];

const playersObj = Object.fromEntries(players.map(p => [p.id, p]));

export default {
  'Not Joined': () => {
    const notJoinedState = {
      ...initialState,
      stage: GameStage.LOBBY
    };

    return (
      <ThemeProvider theme={clientTheme}>
        <PeerProvider isHost={false}>
          <ClientGameStateProvider<GameState> initialState={notJoinedState}>
            <ClientContent />
          </ClientGameStateProvider>
        </PeerProvider>
      </ThemeProvider>
    );
  },
  'Joined Lobby': () => {
    const lobbyState = {
      ...initialState,
      stage: GameStage.LOBBY,
      players: playersObj
    };

    return (
      <ThemeProvider theme={clientTheme}>
        <PeerProvider isHost={false}>
          <ClientGameStateProvider<GameState> initialState={lobbyState}>
            <ClientContent />
          </ClientGameStateProvider>
        </PeerProvider>
      </ThemeProvider>
    );
  },
  'Prompting Stage (My Turn)': () => {
    const promptingState = {
      ...initialState,
      stage: GameStage.PROMPTING,
      players: playersObj,
      currentRound: 0,
      activePromptingPlayer: 'player1',
      timer: {
        startTime: Date.now(),
        duration: gameConfig.promptTimerSeconds,
        isRunning: true
      }
    };

    return (
      <ThemeProvider theme={clientTheme}>
        <PeerProvider isHost={false}>
          <ClientGameStateProvider<GameState> initialState={promptingState}>
            <ClientContent />
          </ClientGameStateProvider>
        </PeerProvider>
      </ThemeProvider>
    );
  },
  'Prompting Stage (Waiting)': () => {
    const waitingPromptState = {
      ...initialState,
      stage: GameStage.PROMPTING,
      players: playersObj,
      currentRound: 0,
      activePromptingPlayer: 'player2',
      timer: {
        startTime: Date.now(),
        duration: gameConfig.promptTimerSeconds,
        isRunning: true
      }
    };

    return (
      <ThemeProvider theme={clientTheme}>
        <PeerProvider isHost={false}>
          <ClientGameStateProvider<GameState> initialState={waitingPromptState}>
            <ClientContent />
          </ClientGameStateProvider>
        </PeerProvider>
      </ThemeProvider>
    );
  },
  'Fooling Stage (Not My Text)': () => {
    const foolingState = {
      ...initialState,
      stage: GameStage.FOOLING,
      players: playersObj,
      currentRound: 0,
      texts: { 'text1': mockText },
      roundTexts: [['text1']],
      activeTextIndex: 0,
      activeText: {
        textId: 'text1',
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
      <ThemeProvider theme={clientTheme}>
        <PeerProvider isHost={false}>
          <ClientGameStateProvider<GameState> initialState={foolingState}>
            <ClientContent />
          </ClientGameStateProvider>
        </PeerProvider>
      </ThemeProvider>
    );
  },
  'Guessing Stage': () => {
    const guessingState = {
      ...initialState,
      stage: GameStage.GUESSING,
      players: playersObj,
      currentRound: 0,
      texts: { 'text1': mockText },
      roundTexts: [['text1']],
      activeTextIndex: 0,
      activeText: {
        textId: 'text1',
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
      <ThemeProvider theme={clientTheme}>
        <PeerProvider isHost={false}>
          <ClientGameStateProvider<GameState> initialState={guessingState}>
            <ClientContent />
          </ClientGameStateProvider>
        </PeerProvider>
      </ThemeProvider>
    );
  },
  'Scoring Stage': () => {
    const scoringState = {
      ...initialState,
      stage: GameStage.SCORING,
      players: {
        ...playersObj,
        player1: { ...playersObj.player1, points: 5 },
        player2: { ...playersObj.player2, points: 2 }
      },
      currentRound: 0,
      texts: { 'text1': mockText },
      roundTexts: [['text1']],
      activeTextIndex: 0,
      activeText: {
        textId: 'text1',
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
      <ThemeProvider theme={clientTheme}>
        <PeerProvider isHost={false}>
          <ClientGameStateProvider<GameState> initialState={scoringState}>
            <ClientContent />
          </ClientGameStateProvider>
        </PeerProvider>
      </ThemeProvider>
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
      texts: { 'text1': mockText },
      roundTexts: [['text1'], ['text1'], ['text1']],
      activeText: null,
      history: [{
        textId: 'text1',
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
      <ThemeProvider theme={clientTheme}>
        <PeerProvider isHost={false}>
          <ClientGameStateProvider<GameState> initialState={gameOverState}>
            <ClientContent />
          </ClientGameStateProvider>
        </PeerProvider>
      </ThemeProvider>
    );
  }
}; 
import { GameState, GameStage, GameConfig, AchievementType } from './types';

const defaultConfig: GameConfig = {
  maxPlayers: 10,
  minPlayers: 3,
  roundCount: 3,
  promptTimerSeconds: 45,
  foolingTimerSeconds: 45,
  guessingTimerSeconds: 20,
  scoringDisplaySeconds: 10,
  apiProvider: 'openai',
  apiKey: '',
  roomCode: 'FAKE123'
};

export const fakeGameState: GameState = {
  config: defaultConfig,
  stage: GameStage.GAME_OVER,
  players: {
    'player1': {
      id: 'player1',
      name: 'Alice',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
      connected: true,
      points: 950,
      lastSeen: Date.now()
    },
    'player2': {
      id: 'player2',
      name: 'Bob',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
      connected: true,
      points: 870,
      lastSeen: Date.now()
    },
    'player3': {
      id: 'player3',
      name: 'Charlie',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie',
      connected: true,
      points: 800,
      lastSeen: Date.now()
    },
    'player4': {
      id: 'player4',
      name: 'Diana',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diana',
      connected: true,
      points: 760,
      lastSeen: Date.now()
    },
    'player5': {
      id: 'player5',
      name: 'Eli',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Eli',
      connected: true,
      points: 700,
      lastSeen: Date.now()
    },
    'player6': {
      id: 'player6',
      name: 'Fay',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fay',
      connected: true,
      points: 650,
      lastSeen: Date.now()
    },
    'player7': {
      id: 'player7',
      name: 'Gus',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gus',
      connected: true,
      points: 600,
      lastSeen: Date.now()
    },
    'player8': {
      id: 'player8',
      name: 'Hana',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hana',
      connected: true,
      points: 550,
      lastSeen: Date.now()
    },
    'player9': {
      id: 'player9',
      name: 'Ivan',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ivan',
      connected: true,
      points: 500,
      lastSeen: Date.now()
    },
    'player10': {
      id: 'player10',
      name: 'Jill',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jill',
      connected: true,
      points: 450,
      lastSeen: Date.now()
    }
  },
  images: {},
  currentRound: 3,
  roundImages: [],
  activeImageIndex: 0,
  activeImage: null,
  timer: {
    startTime: 0,
    duration: 0,
    isRunning: false
  },
  achievements: [
    {
      playerId: 'player1',
      type: AchievementType.MOST_ACCURATE,
      value: 8
    },
    {
      playerId: 'player1',
      type: AchievementType.THE_PAINTER,
      value: 7
    },
    {
      playerId: 'player2',
      type: AchievementType.BEST_BULLSHITTER,
      value: 6
    },
    {
      playerId: 'player3',
      type: AchievementType.THE_CHAOTICIAN,
      value: 5
    },
    {
      playerId: 'player4',
      type: AchievementType.MOST_ACCURATE,
      value: 4
    },
    {
      playerId: 'player5',
      type: AchievementType.THE_PAINTER,
      value: 3
    },
    {
      playerId: 'player6',
      type: AchievementType.BEST_BULLSHITTER,
      value: 2
    },
    {
      playerId: 'player7',
      type: AchievementType.THE_CHAOTICIAN,
      value: 1
    },
    {
      playerId: 'player8',
      type: AchievementType.MOST_ACCURATE,
      value: 1
    },
    {
      playerId: 'player9',
      type: AchievementType.THE_PAINTER,
      value: 1
    },
    {
      playerId: 'player10',
      type: AchievementType.BEST_BULLSHITTER,
      value: 1
    }
  ]
}; 
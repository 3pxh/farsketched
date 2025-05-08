import {
  GameState,
  GameMessage,
  MessageType,
  GameStage,
  GameConfig,
  Player
} from '@/games/farsketched/types';

// Default game configuration
const DEFAULT_CONFIG: GameConfig = {
  maxPlayers: 10,
  minPlayers: 3,
  roundCount: 3,
  promptTimerSeconds: 45,
  foolingTimerSeconds: 45,
  guessingTimerSeconds: 20,
  scoringDisplaySeconds: 10,
  apiProvider: 'openai',
  apiKey: '',
  roomCode: ''
};

// Initial game state
export const initialState: GameState = {
  config: DEFAULT_CONFIG,
  stage: GameStage.LOBBY,
  players: {},
  images: {},
  currentRound: 0,
  roundImages: [],
  activeImageIndex: 0,
  activeImage: null,
  timer: {
    startTime: 0,
    duration: 0,
    isRunning: false
  },
  achievements: []
};

export function farsketchedReducer(
  state: GameState = initialState,
  message: GameMessage,
  sendSelfMessage: (msg: GameMessage) => void
): GameState {
  switch (message.type) {
    // Connection messages
    case MessageType.CONNECTION_REQUEST:
    case MessageType.CONNECTION_ACCEPTED:
    case MessageType.CONNECTION_REJECTED:
    case MessageType.PING:
    case MessageType.PONG:
    case MessageType.DISCONNECT:
      return state;

    // Lobby messages
    case MessageType.SET_PLAYER_INFO: {
      const newPlayer: Player = {
        id: message.playerId,
        name: message.name,
        avatarUrl: message.avatarUrl,
        connected: true,
        points: 0,
        lastSeen: Date.now()
      };
      console.log('New player:', newPlayer);

      return {
        ...state,
        players: {
          ...state.players,
          [message.playerId]: newPlayer
        }
      };
    }
    case MessageType.PLAYER_LEFT:
      return {
        ...state,
        players: {
          ...state.players,
          [message.playerId]: { ...state.players[message.playerId], connected: false }
        }
      };

    case MessageType.PLAYER_JOINED:
    case MessageType.REQUEST_START_GAME:
      return {
        ...state,
        stage: GameStage.PROMPTING
      };

    // Game flow messages
    case MessageType.SUBMIT_PROMPT:
      // We're going to call the image generator,
      // and on success use sendSelfMessage to send the image to the host
    case MessageType.PROMPT_RESULT:
    case MessageType.SUBMIT_FAKE_PROMPT:
    case MessageType.SUBMIT_GUESS:
    case MessageType.ROUND_COMPLETE:
    case MessageType.GAME_OVER:
      return state;

    // Error messages
    case MessageType.ERROR:
    case MessageType.PROMPT_ERROR:
      return state;

    default:
      return state;
  }
} 

import {
  GameState,
  GameMessage,
  MessageType,
  GameStage,
  GameConfig,
  Player
} from '@/games/farsketched/types';
import { generateImages } from '@/apis/imageGeneration';
import { settingsManager } from '@/settings';

// Default game configuration
const DEFAULT_CONFIG: GameConfig = {
  maxPlayers: 10,
  minPlayers: 3,
  roundCount: 3,
  promptTimerSeconds: 45,
  foolingTimerSeconds: 45,
  guessingTimerSeconds: 20,
  scoringDisplaySeconds: 10,
  apiProvider: 'stability',
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
    case MessageType.SUBMIT_PROMPT: {
      // Generate a unique ID for the image
      const imageId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      
      // Create a new pending image
      const pendingImage = {
        id: imageId,
        creatorId: message.playerId,
        prompt: message.prompt,
        imageBlob: new Blob(), // Empty blob for pending state
        roundIndex: state.currentRound,
        timestamp: Date.now(),
        status: 'pending' as const
      };

      // Add the image to the current round's images
      const currentRoundImages = state.roundImages[state.currentRound] || [];
      const updatedRoundImages = [...state.roundImages];
      updatedRoundImages[state.currentRound] = [...currentRoundImages, imageId];
      
      // Get the appropriate API key based on provider
      const getApiKey = async () => {
        if (state.config.apiProvider === 'stability') {
          return await settingsManager.getStabilityApiKey();
        } else if (state.config.apiProvider === 'openai') {
          return await settingsManager.getOpenaiApiKey();
        }
        return null;
      };

      // Call the image generation API
      getApiKey().then(async (apiKey) => {
        if (!apiKey) {
          throw new Error('API key not found. Please set it in the settings.');
        }

        const images = await generateImages({
          prompt: message.prompt,
          provider: state.config.apiProvider as 'openai' | 'stability',
          width: 512,
          height: 512,
          apiKey
        });

        if (images.length > 0) {
          // Send success message with the generated image
          const successMessage: GameMessage = {
            type: MessageType.PROMPT_RESULT,
            success: true,
            imageId,
            imageBlob: images[0].blob,
            timestamp: Date.now(),
            messageId: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
          };
          sendSelfMessage(successMessage);
        }
      }).catch((error) => {
        // Send error message if generation fails
        const errorMessage: GameMessage = {
          type: MessageType.PROMPT_ERROR,
          playerId: message.playerId,
          prompt: message.prompt,
          errorCode: 'GENERATION_FAILED',
          errorMessage: error.message,
          timestamp: Date.now(),
          messageId: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
        };
        sendSelfMessage(errorMessage);
      });

      return {
        ...state,
        images: {
          ...state.images,
          [imageId]: pendingImage
        },
        roundImages: updatedRoundImages
      };
    }

    case MessageType.PROMPT_RESULT: {
      if (message.success && message.imageId && message.imageBlob) {
        // Update the existing image with the generated blob and mark as complete
        const existingImage = state.images[message.imageId];
        if (existingImage) {
          return {
            ...state,
            images: {
              ...state.images,
              [message.imageId]: {
                ...existingImage,
                imageBlob: message.imageBlob,
                status: 'complete'
              }
            }
          };
        }
      }
      return state;
    }

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

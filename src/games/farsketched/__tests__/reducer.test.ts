import { farsketchedReducer, initialState } from '../reducer';
import { 
  MessageType, 
  GameStage, 
  GameMessage,
  PingMessage,
  SetPlayerInfoMessage,
  ConnectionRequestMessage,
  ConnectionAcceptedMessage,
  ConnectionRejectedMessage,
  PongMessage,
  DisconnectMessage,
  PlayerJoinedMessage,
  RequestStartGameMessage,
  GameStartingMessage,
  SubmitPromptMessage,
  PromptResultMessage,
  SubmitFakePromptMessage,
  SubmitGuessMessage,
  ErrorMessage,
  PromptErrorMessage
} from '@/games/farsketched/types';

// Mock the image generation API
jest.mock('@/apis/imageGeneration', () => ({
  generateImages: jest.fn().mockResolvedValue([{
    blob: new Blob(['test'], { type: 'image/png' })
  }])
}));

// Mock the settings manager
jest.mock('@/settings', () => ({
  settingsManager: {
    getStabilityApiKey: jest.fn().mockResolvedValue('test-api-key'),
    getOpenaiApiKey: jest.fn().mockResolvedValue('test-api-key')
  }
}));

// Mock setTimeout to prevent actual timeouts
jest.useFakeTimers();

// Helper function to create a base message with required fields
const createBaseMessage = (type: MessageType) => ({
  type,
  timestamp: Date.now(),
  messageId: `test-${Date.now()}`
});

// Helper function to create specific message types
const createMessage = <T extends GameMessage>(type: MessageType, additionalProps: Omit<T, 'type' | 'timestamp' | 'messageId'>): T => ({
  ...createBaseMessage(type),
  ...additionalProps
} as T);

// Helper to create a player
const createPlayer = (id: string) => ({
  id,
  name: `Player ${id}`,
  avatarUrl: `https://example.com/avatar-${id}.png`,
  connected: true,
  points: 0,
  lastSeen: Date.now()
});

// Helper to create a completed image
const createCompletedImage = (id: string, creatorId: string, prompt: string) => ({
  id,
  creatorId,
  prompt,
  imageBlob: new Blob(['test'], { type: 'image/png' }),
  roundIndex: 0,
  timestamp: Date.now(),
  status: 'complete' as const
});

// Helper to simulate a complete round flow
const simulateRoundFlow = (
  state: any,
  players: string[],
  imageCount: number,
  sendSelfMessage: (msg: GameMessage) => void
) => {
  let currentState = state;

  // 1. Submit prompts for each player
  for (let i = 0; i < players.length; i++) {
    const promptMessage = createMessage<SubmitPromptMessage>(MessageType.SUBMIT_PROMPT, {
      playerId: players[i],
      prompt: `Test prompt ${i}`
    });
    currentState = farsketchedReducer(currentState, promptMessage, sendSelfMessage);
  }

  // 2. Simulate successful image generation for each prompt
  const imageIds = Object.keys(currentState.images);
  for (const imageId of imageIds) {
    const resultMessage = createMessage<PromptResultMessage>(MessageType.PROMPT_RESULT, {
      success: true,
      imageId,
      imageBlob: new Blob(['test'], { type: 'image/png' })
    });
    currentState = farsketchedReducer(currentState, resultMessage, sendSelfMessage);
  }

  // 3. Submit fake prompts for each image
  for (let i = 0; i < imageCount; i++) {
    const imageId = currentState.roundImages[currentState.currentRound][i];
    for (const playerId of players) {
      const fakePromptMessage = createMessage<SubmitFakePromptMessage>(MessageType.SUBMIT_FAKE_PROMPT, {
        playerId,
        imageId,
        fakePrompt: `Fake prompt for image ${i} by player ${playerId}`
      });
      currentState = farsketchedReducer(currentState, fakePromptMessage, sendSelfMessage);
    }
  }

  // 4. Submit guesses for each image
  for (let i = 0; i < imageCount; i++) {
    const imageId = currentState.roundImages[currentState.currentRound][i];
    for (const playerId of players) {
      const guessMessage = createMessage<SubmitGuessMessage>(MessageType.SUBMIT_GUESS, {
        playerId,
        imageId,
        promptId: 'real' // For simplicity, everyone guesses "real"
      });
      currentState = farsketchedReducer(currentState, guessMessage, sendSelfMessage);
    }
  }

  return currentState;
};

const sendSelfMessage = (msg: GameMessage) => {
  console.log('sendSelfMessage:', msg);
};

describe('farsketchedReducer', () => {
  it('should return initial state when no state is provided', () => {
    const result = farsketchedReducer(undefined, createMessage<PingMessage>(MessageType.PING, {}), sendSelfMessage);
    expect(result).toEqual(initialState);
  });

  it('should handle SET_PLAYER_INFO message', () => {
    const message = createMessage<SetPlayerInfoMessage>(MessageType.SET_PLAYER_INFO, {
      playerId: 'player1',
      name: 'Test Player',
      avatarUrl: 'https://example.com/avatar.png'
    });

    const result = farsketchedReducer(initialState, message, sendSelfMessage);

    expect(result.players).toHaveProperty('player1');
    expect(result.players['player1']).toEqual({
      id: 'player1',
      name: 'Test Player',
      avatarUrl: 'https://example.com/avatar.png',
      connected: true,
      points: 0,
      lastSeen: expect.any(Number)
    });
  });

  it('should handle connection messages without state changes', () => {
    const connectionMessages = [
      createMessage<ConnectionRequestMessage>(MessageType.CONNECTION_REQUEST, { playerId: 'test', roomCode: 'test' }),
      createMessage<ConnectionAcceptedMessage>(MessageType.CONNECTION_ACCEPTED, { gameState: initialState, yourPlayerId: 'test' }),
      createMessage<ConnectionRejectedMessage>(MessageType.CONNECTION_REJECTED, { reason: 'test' }),
      createMessage<PingMessage>(MessageType.PING, {}),
      createMessage<PongMessage>(MessageType.PONG, {}),
      createMessage<DisconnectMessage>(MessageType.DISCONNECT, { playerId: 'test' })
    ];

    connectionMessages.forEach(message => {
      const result = farsketchedReducer(initialState, message, sendSelfMessage);
      expect(result).toEqual(initialState);
    });
  });


  it('should handle start game', () => {
    const lobbyMessages = [
      createMessage<PlayerJoinedMessage>(MessageType.PLAYER_JOINED, { player: { id: 'test', name: 'test', avatarUrl: 'test', connected: true, points: 0, lastSeen: Date.now() } }),
      createMessage<RequestStartGameMessage>(MessageType.REQUEST_START_GAME, { playerId: 'test' }),
    ];
    let result = {}
    lobbyMessages.forEach(message => {
      result = farsketchedReducer(initialState, message, sendSelfMessage);
    });
    
    // Expect the game to be in prompting stage with a running timer
    expect(result).toEqual({
      ...initialState,
      players: {},
      stage: GameStage.PROMPTING,
      timer: {
        startTime: expect.any(Number),
        duration: initialState.config.promptTimerSeconds,
        isRunning: true,
        timeoutId: expect.any(Object)
      }
    });
  });

  it('should handle game flow messages appropriately', async () => {
    // Test messages that should change state
    const submitPromptMessage = createMessage<SubmitPromptMessage>(MessageType.SUBMIT_PROMPT, { 
      playerId: 'test', 
      prompt: 'test' 
    });
    
    // First test SUBMIT_PROMPT
    let result = farsketchedReducer(initialState, submitPromptMessage, sendSelfMessage);
    expect(result.images).not.toEqual(initialState.images);
    expect(result.roundImages).not.toEqual(initialState.roundImages);
    
    // Get the generated image ID
    const imageId = Object.keys(result.images)[0];
    expect(imageId).toBeDefined();

    // Then test PROMPT_RESULT with the actual image ID
    const promptResultMessage = createMessage<PromptResultMessage>(MessageType.PROMPT_RESULT, { 
      success: true, 
      imageId, 
      imageBlob: new Blob(['test'], { type: 'image/png' }) 
    });
    result = farsketchedReducer(result, promptResultMessage, sendSelfMessage);
    expect(result.images[imageId].status).toBe('complete');

    // Setup state for fake prompt and guess tests
    const stateWithActiveImage = {
      ...result,
      stage: GameStage.FOOLING,
      activeImage: {
        imageId,
        fakePrompts: [],
        guesses: []
      }
    };

    // Test SUBMIT_FAKE_PROMPT
    const fakePromptMessage = createMessage<SubmitFakePromptMessage>(MessageType.SUBMIT_FAKE_PROMPT, { 
      playerId: 'test', 
      imageId, 
      fakePrompt: 'test' 
    });
    result = farsketchedReducer(stateWithActiveImage, fakePromptMessage, sendSelfMessage);
    expect(result.activeImage?.fakePrompts.length).toBe(1);

    // Test SUBMIT_GUESS
    const guessMessage = createMessage<SubmitGuessMessage>(MessageType.SUBMIT_GUESS, { 
      playerId: 'test', 
      imageId, 
      promptId: 'test' 
    });
    result = farsketchedReducer(result, guessMessage, sendSelfMessage);
    expect(result.activeImage?.guesses.length).toBe(1);

    // Test messages that should not change state
    const nonStateChangingMessages = [
      createMessage<GameStartingMessage>(MessageType.GAME_STARTING, { players: [], config: initialState.config })
    ];

    nonStateChangingMessages.forEach(message => {
      const result = farsketchedReducer(initialState, message, sendSelfMessage);
      expect(result).toEqual(initialState);
    });
  });

  it('should handle error messages without state changes', () => {
    const errorMessages = [
      createMessage<ErrorMessage>(MessageType.ERROR, { code: 'test', message: 'test' }),
      createMessage<PromptErrorMessage>(MessageType.PROMPT_ERROR, { playerId: 'test', prompt: 'test', errorCode: 'test', errorMessage: 'test' })
    ];

    errorMessages.forEach(message => {
      const result = farsketchedReducer(initialState, message, sendSelfMessage);
      expect(result).toEqual(initialState);
    });
  });

  it('should handle unknown message types by returning current state', () => {
    const result = farsketchedReducer(initialState, createMessage<PingMessage>('UNKNOWN_TYPE' as MessageType, {}), sendSelfMessage);
    expect(result).toEqual(initialState);
  });

  describe('Full game flow', () => {
    it('should handle a complete game with multiple rounds', () => {
      const players = ['player1', 'player2', 'player3'];
      const roundCount = 2;
      let state = {
        ...initialState,
        config: {
          ...initialState.config,
          roundCount
        }
      };

      // Add players to the game
      for (const playerId of players) {
        const playerMessage = createMessage<SetPlayerInfoMessage>(MessageType.SET_PLAYER_INFO, {
          playerId,
          name: `Player ${playerId}`,
          avatarUrl: `https://example.com/avatar-${playerId}.png`
        });
        state = farsketchedReducer(state, playerMessage, sendSelfMessage);
      }

      // Verify players are added
      expect(Object.keys(state.players)).toHaveLength(players.length);

      // Start the game
      const startMessage = createMessage<RequestStartGameMessage>(MessageType.REQUEST_START_GAME, {
        playerId: players[0]
      });
      state = farsketchedReducer(state, startMessage, sendSelfMessage);
      expect(state.stage).toBe(GameStage.PROMPTING);

      // Play through each round
      for (let round = 0; round < roundCount; round++) {
        expect(state.currentRound).toBe(round);
        expect(state.stage).toBe(GameStage.PROMPTING);

        // All players submit prompts
        for (const playerId of players) {
          const promptMessage = createMessage<SubmitPromptMessage>(MessageType.SUBMIT_PROMPT, {
            playerId,
            prompt: `Round ${round} prompt from ${playerId}`
          });
          state = farsketchedReducer(state, promptMessage, sendSelfMessage);
        }

        // Verify prompts were submitted
        expect(state.roundImages[round]).toHaveLength(players.length);

        // Mock successful image generation for all prompts
        for (const imageId of state.roundImages[round]) {
          const resultMessage = createMessage<PromptResultMessage>(MessageType.PROMPT_RESULT, {
            success: true,
            imageId,
            imageBlob: new Blob([`image-${imageId}`], { type: 'image/png' })
          });
          state = farsketchedReducer(state, resultMessage, sendSelfMessage);
        }

        // For each image in the round
        for (let imageIndex = 0; imageIndex < players.length; imageIndex++) {
          const currentImageId = state.roundImages[round][imageIndex];

          // Verify we're in fooling stage with the correct image
          expect(state.stage).toBe(GameStage.FOOLING);
          expect(state.activeImage?.imageId).toBe(currentImageId);
          expect(state.activeImageIndex).toBe(imageIndex);

          // All players submit fake prompts
          for (const playerId of players) {
            // Skip the image creator
            if (state.images[currentImageId].creatorId !== playerId) {
              const fakePromptMessage = createMessage<SubmitFakePromptMessage>(MessageType.SUBMIT_FAKE_PROMPT, {
                playerId,
                imageId: currentImageId,
                fakePrompt: `Fake prompt for image ${imageIndex} by ${playerId}`
              });
              state = farsketchedReducer(state, fakePromptMessage, sendSelfMessage);
            }
          }

          // Verify fake prompts were submitted
          expect(state.activeImage?.fakePrompts.length).toBe(players.length - 1);
          expect(state.stage).toBe(GameStage.GUESSING);

          // All non-creator players submit guesses
          for (const playerId of players) {
            // Skip the image creator
            if (state.images[currentImageId].creatorId !== playerId) {
              const guessMessage = createMessage<SubmitGuessMessage>(MessageType.SUBMIT_GUESS, {
                playerId,
                imageId: currentImageId,
                promptId: 'real' // Everyone guesses the real prompt for simplicity
              });
              state = farsketchedReducer(state, guessMessage, sendSelfMessage);
            }
          }

          // Verify guesses were submitted (should be one less than total players)
          expect(state.activeImage?.guesses.length).toBe(players.length - 1);

          // Move to scoring
          expect(state.stage).toBe(GameStage.SCORING);

          // Send timer expired to move to next image or round
          const timerExpiredMessage = createMessage<GameMessage>(MessageType.TIMER_EXPIRED, {
            stage: GameStage.SCORING
          });
          state = farsketchedReducer(state, timerExpiredMessage, sendSelfMessage);

          // If this is the last image of the round
          if (imageIndex === players.length - 1) {
            // If this is the last round, we should move to game over
            if (round === roundCount - 1) {
              expect(state.stage).toBe(GameStage.GAME_OVER);
            } else {
              // Otherwise, we should move to prompting for the next round
              expect(state.stage).toBe(GameStage.PROMPTING);
              expect(state.currentRound).toBe(round + 1);
            }
          } else {
            // If not the last image, we should move to fooling for the next image
            expect(state.stage).toBe(GameStage.FOOLING);
            expect(state.activeImageIndex).toBe(imageIndex + 1);
          }
        }
      }

      // Verify game ended
      expect(state.stage).toBe(GameStage.GAME_OVER);
      expect(state.currentRound).toBe(roundCount - 1);
    });

    it('should transition to guessing stage when all non-creator players submit fake prompts', () => {
      const players = ['player1', 'player2', 'player3'];
      let state = initialState;

      // Add players
      for (const playerId of players) {
        const playerMessage = createMessage<SetPlayerInfoMessage>(MessageType.SET_PLAYER_INFO, {
          playerId,
          name: `Player ${playerId}`,
          avatarUrl: `https://example.com/avatar-${playerId}.png`
        });
        state = farsketchedReducer(state, playerMessage, sendSelfMessage);
      }

      // Start game and submit a prompt
      const startMessage = createMessage<RequestStartGameMessage>(MessageType.REQUEST_START_GAME, {
        playerId: players[0]
      });
      state = farsketchedReducer(state, startMessage, sendSelfMessage);

      const promptMessage = createMessage<SubmitPromptMessage>(MessageType.SUBMIT_PROMPT, {
        playerId: players[0],
        prompt: 'Test prompt'
      });
      state = farsketchedReducer(state, promptMessage, sendSelfMessage);

      // Get the image ID
      const imageId = Object.keys(state.images)[0];

      // Mock successful image generation
      const resultMessage = createMessage<PromptResultMessage>(MessageType.PROMPT_RESULT, {
        success: true,
        imageId,
        imageBlob: new Blob(['test'], { type: 'image/png' })
      });
      state = farsketchedReducer(state, resultMessage, sendSelfMessage);

      // Set up state for fooling stage
      state = {
        ...state,
        stage: GameStage.FOOLING,
        activeImage: {
          imageId,
          fakePrompts: [],
          guesses: []
        }
      };

      // Submit fake prompts from non-creator players
      for (const playerId of players.slice(1)) { // Skip player1 (the creator)
        const fakePromptMessage = createMessage<SubmitFakePromptMessage>(MessageType.SUBMIT_FAKE_PROMPT, {
          playerId,
          imageId,
          fakePrompt: `Fake prompt from ${playerId}`
        });
        state = farsketchedReducer(state, fakePromptMessage, sendSelfMessage);
      }

      // Verify we moved to guessing stage
      expect(state.stage).toBe(GameStage.GUESSING);
      expect(state.activeImage?.fakePrompts.length).toBe(players.length - 1);
    });

    it('should transition to scoring when all non-creator players have guessed', () => {
      // This test would fail with the old logic (before the reducer fix)
      const players = ['player1', 'player2', 'player3'];
      let state = initialState;

      // Add players
      for (const playerId of players) {
        const playerMessage = createMessage<SetPlayerInfoMessage>(MessageType.SET_PLAYER_INFO, {
          playerId,
          name: `Player ${playerId}`,
          avatarUrl: `https://example.com/avatar-${playerId}.png`
        });
        state = farsketchedReducer(state, playerMessage, sendSelfMessage);
      }

      // Start game and submit a prompt
      const startMessage = createMessage<RequestStartGameMessage>(MessageType.REQUEST_START_GAME, {
        playerId: players[0]
      });
      state = farsketchedReducer(state, startMessage, sendSelfMessage);

      const promptMessage = createMessage<SubmitPromptMessage>(MessageType.SUBMIT_PROMPT, {
        playerId: players[0],
        prompt: 'Test prompt'
      });
      state = farsketchedReducer(state, promptMessage, sendSelfMessage);

      // Get the image ID
      const imageId = Object.keys(state.images)[0];

      // Mock successful image generation
      const resultMessage = createMessage<PromptResultMessage>(MessageType.PROMPT_RESULT, {
        success: true,
        imageId,
        imageBlob: new Blob(['test'], { type: 'image/png' })
      });
      state = farsketchedReducer(state, resultMessage, sendSelfMessage);

      // Set up state for guessing stage
      state = {
        ...state,
        stage: GameStage.GUESSING,
        activeImage: {
          imageId,
          fakePrompts: [
            { id: 'fake1', imageId, authorId: players[1], text: 'Fake 1' },
            { id: 'fake2', imageId, authorId: players[2], text: 'Fake 2' }
          ],
          guesses: []
        }
      };

      // Only non-creator players submit guesses
      for (const playerId of players.slice(1)) {
        const guessMessage = createMessage<SubmitGuessMessage>(MessageType.SUBMIT_GUESS, {
          playerId,
          imageId,
          promptId: 'real'
        });
        state = farsketchedReducer(state, guessMessage, sendSelfMessage);
      }

      // Should now be in scoring stage
      expect(state.stage).toBe(GameStage.SCORING);
      expect(state.activeImage?.guesses.length).toBe(2);
    });
  });
}); 
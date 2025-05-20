import { farsketchedReducer, initialState, calculateAchievements } from '../reducer';
import { 
  MessageType, 
  GameStage, 
  GameMessage,
  SetPlayerInfoMessage,
  PlayerJoinedMessage,
  RequestStartGameMessage,
  GameStartingMessage,
  SubmitPromptMessage,
  PromptResultMessage,
  SubmitFakePromptMessage,
  SubmitGuessMessage,
  ErrorMessage,
  PromptErrorMessage,
  ActiveImage,
  AchievementType,
  GameState
} from '../types';

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

const sendSelfMessage = (msg: GameMessage) => {
  console.log('sendSelfMessage:', msg);
};

describe('farsketchedReducer', () => {
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
        timeoutId: expect.any(Object),
        timerId: 'timer-0-0'
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

  it('should only store the first guess from a player and ignore subsequent guesses', () => {
    // Setup initial state with players
    const players = {
      'player1': {
        id: 'player1',
        name: 'Player 1',
        avatarUrl: 'https://example.com/avatar1.png',
        connected: true,
        points: 0,
        lastSeen: Date.now()
      },
      'player2': {
        id: 'player2',
        name: 'Player 2',
        avatarUrl: 'https://example.com/avatar2.png',
        connected: true,
        points: 0,
        lastSeen: Date.now()
      }
    };
    
    // Create a test image
    const image = { 
      id: 'testImage', 
      creatorId: 'player1', 
      prompt: 'Test prompt',
      status: 'complete' as const,
      imageBlob: new Blob(['test'], { type: 'image/png' }),
      roundIndex: 0,
      timestamp: Date.now()
    };
    
    // Set up initial state in guessing stage with an active image
    const initialTestState: GameState = {
      ...initialState,
      players,
      images: { 'testImage': image },
      stage: GameStage.GUESSING,
      activeImage: {
        imageId: 'testImage',
        fakePrompts: [
          { id: 'fake1', imageId: 'testImage', authorId: 'player2', text: 'Fake prompt' }
        ],
        guesses: []
      }
    };
    
    // Player 2 submits their first guess
    const firstGuessMessage = createMessage<SubmitGuessMessage>(MessageType.SUBMIT_GUESS, { 
      playerId: 'player2', 
      imageId: 'testImage', 
      promptId: 'real' // Guessing the real prompt
    });
    
    const stateAfterFirstGuess = farsketchedReducer(initialTestState, firstGuessMessage, sendSelfMessage);
    
    // Verify the first guess was saved
    expect(stateAfterFirstGuess.activeImage?.guesses.length).toBe(1);
    expect(stateAfterFirstGuess.activeImage?.guesses[0].playerId).toBe('player2');
    expect(stateAfterFirstGuess.activeImage?.guesses[0].promptId).toBe('real');
    
    // Player 2 tries to submit a second guess
    const secondGuessMessage = createMessage<SubmitGuessMessage>(MessageType.SUBMIT_GUESS, { 
      playerId: 'player2', 
      imageId: 'testImage', 
      promptId: 'fake1' // Changing their mind to the fake prompt
    });
    
    const stateAfterSecondGuess = farsketchedReducer(stateAfterFirstGuess, secondGuessMessage, sendSelfMessage);
    
    // Verify that the second guess was ignored
    expect(stateAfterSecondGuess.activeImage?.guesses.length).toBe(1);
    expect(stateAfterSecondGuess.activeImage?.guesses[0].playerId).toBe('player2');
    expect(stateAfterSecondGuess.activeImage?.guesses[0].promptId).toBe('real');
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
            stage: GameStage.SCORING,
            timerId: `timer-${round}-${imageIndex}`
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

    it('should calculate scores correctly when transitioning to scoring stage', () => {
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

      // Set up state for guessing stage with fake prompts
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

      // Submit guesses:
      // - player2 guesses correctly (real prompt)
      // - player3 guesses player2's fake prompt
      const guess1 = createMessage<SubmitGuessMessage>(MessageType.SUBMIT_GUESS, {
        playerId: players[1],
        imageId,
        promptId: 'real'
      });
      state = farsketchedReducer(state, guess1, sendSelfMessage);

      const guess2 = createMessage<SubmitGuessMessage>(MessageType.SUBMIT_GUESS, {
        playerId: players[2],
        imageId,
        promptId: 'fake1'
      });
      state = farsketchedReducer(state, guess2, sendSelfMessage);

      // Verify scores:
      // - player1 (creator) gets 5 points for player2's correct guess
      // - player2 gets 5 points for guessing correctly
      // - player3 gets 0 points (wrong guess)
      expect(state.players[players[0]].points).toBe(5);
      expect(state.players[players[1]].points).toBe(8);
      expect(state.players[players[2]].points).toBe(0);
    });

    it('should accumulate scores across multiple rounds', () => {
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

      // Start game
      const startMessage = createMessage<RequestStartGameMessage>(MessageType.REQUEST_START_GAME, {
        playerId: players[0]
      });
      state = farsketchedReducer(state, startMessage, sendSelfMessage);

      // First round
      const promptMessage1 = createMessage<SubmitPromptMessage>(MessageType.SUBMIT_PROMPT, {
        playerId: players[0],
        prompt: 'Test prompt 1'
      });
      state = farsketchedReducer(state, promptMessage1, sendSelfMessage);

      const imageId1 = Object.keys(state.images)[0];

      const resultMessage1 = createMessage<PromptResultMessage>(MessageType.PROMPT_RESULT, {
        success: true,
        imageId: imageId1,
        imageBlob: new Blob(['test'], { type: 'image/png' })
      });
      state = farsketchedReducer(state, resultMessage1, sendSelfMessage);

      state = {
        ...state,
        stage: GameStage.GUESSING,
        activeImage: {
          imageId: imageId1,
          fakePrompts: [
            { id: 'fake1', imageId: imageId1, authorId: players[1], text: 'Fake 1' },
            { id: 'fake2', imageId: imageId1, authorId: players[2], text: 'Fake 2' }
          ],
          guesses: []
        }
      };

      // All players guess correctly in first round
      const guess1 = createMessage<SubmitGuessMessage>(MessageType.SUBMIT_GUESS, {
        playerId: players[1],
        imageId: imageId1,
        promptId: 'real'
      });
      state = farsketchedReducer(state, guess1, sendSelfMessage);

      const guess2 = createMessage<SubmitGuessMessage>(MessageType.SUBMIT_GUESS, {
        playerId: players[2],
        imageId: imageId1,
        promptId: 'real'
      });
      state = farsketchedReducer(state, guess2, sendSelfMessage);

      // Move to next round
      const timerExpiredMessage1 = createMessage<GameMessage>(MessageType.TIMER_EXPIRED, {
        stage: GameStage.SCORING
      });
      state = farsketchedReducer(state, timerExpiredMessage1, sendSelfMessage);

      // Second round
      const promptMessage2 = createMessage<SubmitPromptMessage>(MessageType.SUBMIT_PROMPT, {
        playerId: players[1],
        prompt: 'Test prompt 2'
      });
      state = farsketchedReducer(state, promptMessage2, sendSelfMessage);

      const imageId2 = Object.keys(state.images)[1];

      const resultMessage2 = createMessage<PromptResultMessage>(MessageType.PROMPT_RESULT, {
        success: true,
        imageId: imageId2,
        imageBlob: new Blob(['test'], { type: 'image/png' })
      });
      state = farsketchedReducer(state, resultMessage2, sendSelfMessage);

      state = {
        ...state,
        stage: GameStage.GUESSING,
        activeImage: {
          imageId: imageId2,
          fakePrompts: [
            { id: 'fake3', imageId: imageId2, authorId: players[0], text: 'Fake 3' },
            { id: 'fake4', imageId: imageId2, authorId: players[2], text: 'Fake 4' }
          ],
          guesses: []
        }
      };

      // All players guess correctly in second round
      const guess3 = createMessage<SubmitGuessMessage>(MessageType.SUBMIT_GUESS, {
        playerId: players[0],
        imageId: imageId2,
        promptId: 'real'
      });
      state = farsketchedReducer(state, guess3, sendSelfMessage);

      const guess4 = createMessage<SubmitGuessMessage>(MessageType.SUBMIT_GUESS, {
        playerId: players[2],
        imageId: imageId2,
        promptId: 'real'
      });
      state = farsketchedReducer(state, guess4, sendSelfMessage);

      // Verify accumulated scores:
      // player1: 5 points from first round + 5 points for correct guess in second round
      // player2: 5 points from first round + 10 points from second round (creator)
      // player3: 5 points from first round + 5 points for correct guess in second round
      expect(state.players[players[0]].points).toBe(15);
      expect(state.players[players[1]].points).toBe(15);
      expect(state.players[players[2]].points).toBe(10);
    });

    it('should calculate achievements correctly based on player performance', () => {
      // Create test players
      const players = {
        'playerA': {
          id: 'playerA',
          name: 'Player A',
          avatarUrl: 'https://example.com/avatar-a.png',
          connected: true,
          points: 0,
          lastSeen: Date.now()
        },
        'playerB': {
          id: 'playerB',
          name: 'Player B',
          avatarUrl: 'https://example.com/avatar-b.png',
          connected: true,
          points: 0,
          lastSeen: Date.now()
        },
        'playerC': {
          id: 'playerC',
          name: 'Player C',
          avatarUrl: 'https://example.com/avatar-c.png',
          connected: true,
          points: 0,
          lastSeen: Date.now()
        }
      };

      // Create test images
      const images = {
        'imgA1': { 
          id: 'imgA1', 
          creatorId: 'playerA', 
          prompt: 'A1 prompt', 
          status: 'complete' as const,
          imageBlob: new Blob(['test'], { type: 'image/png' }),
          roundIndex: 0,
          timestamp: Date.now()
        },
        'imgA2': { 
          id: 'imgA2', 
          creatorId: 'playerA', 
          prompt: 'A2 prompt', 
          status: 'complete' as const,
          imageBlob: new Blob(['test'], { type: 'image/png' }),
          roundIndex: 0,
          timestamp: Date.now()
        },
        'imgA3': { 
          id: 'imgA3', 
          creatorId: 'playerA', 
          prompt: 'A3 prompt', 
          status: 'complete' as const,
          imageBlob: new Blob(['test'], { type: 'image/png' }),
          roundIndex: 0,
          timestamp: Date.now()
        },
        'imgB1': { 
          id: 'imgB1', 
          creatorId: 'playerB', 
          prompt: 'B1 prompt', 
          status: 'complete' as const,
          imageBlob: new Blob(['test'], { type: 'image/png' }),
          roundIndex: 0,
          timestamp: Date.now()
        },
        'imgB2': { 
          id: 'imgB2', 
          creatorId: 'playerB', 
          prompt: 'B2 prompt', 
          status: 'complete' as const,
          imageBlob: new Blob(['test'], { type: 'image/png' }),
          roundIndex: 0,
          timestamp: Date.now()
        },
        'imgB3': { 
          id: 'imgB3', 
          creatorId: 'playerB', 
          prompt: 'B3 prompt', 
          status: 'complete' as const,
          imageBlob: new Blob(['test'], { type: 'image/png' }),
          roundIndex: 0,
          timestamp: Date.now()
        },
        'imgC1': { 
          id: 'imgC1', 
          creatorId: 'playerC', 
          prompt: 'C1 prompt', 
          status: 'complete' as const,
          imageBlob: new Blob(['test'], { type: 'image/png' }),
          roundIndex: 0,
          timestamp: Date.now()
        },
        'imgC2': { 
          id: 'imgC2', 
          creatorId: 'playerC', 
          prompt: 'C2 prompt', 
          status: 'complete' as const,
          imageBlob: new Blob(['test'], { type: 'image/png' }),
          roundIndex: 0,
          timestamp: Date.now()
        },
        'imgC3': { 
          id: 'imgC3', 
          creatorId: 'playerC', 
          prompt: 'C3 prompt', 
          status: 'complete' as const,
          imageBlob: new Blob(['test'], { type: 'image/png' }),
          roundIndex: 0,
          timestamp: Date.now()
        }
      };

      // Create history with active images
      const history: ActiveImage[] = [
        // Player A's images
        {
          imageId: 'imgA1',
          fakePrompts: [
            { id: 'fakeA1B', imageId: 'imgA1', authorId: 'playerB', text: 'Fake A1 by B' },
            { id: 'fakeA1C', imageId: 'imgA1', authorId: 'playerC', text: 'Fake A1 by C' }
          ],
          guesses: [
            { playerId: 'playerB', imageId: 'imgA1', promptId: 'fakeA1B', isCorrect: false },
            { playerId: 'playerC', imageId: 'imgA1', promptId: 'fakeA1C', isCorrect: false }
          ]
        },
        {
          imageId: 'imgA2',
          fakePrompts: [
            { id: 'fakeA2B', imageId: 'imgA2', authorId: 'playerB', text: 'Fake A2 by B' },
            { id: 'fakeA2C', imageId: 'imgA2', authorId: 'playerC', text: 'Fake A2 by C' }
          ],
          guesses: [
            { playerId: 'playerB', imageId: 'imgA2', promptId: 'fakeA2B', isCorrect: false },
            { playerId: 'playerC', imageId: 'imgA2', promptId: 'fakeA2C', isCorrect: false }
          ]
        },
        {
          imageId: 'imgA3',
          fakePrompts: [
            { id: 'fakeA3B', imageId: 'imgA3', authorId: 'playerB', text: 'Fake A3 by B' },
            { id: 'fakeA3C', imageId: 'imgA3', authorId: 'playerC', text: 'Fake A3 by C' }
          ],
          guesses: [
            { playerId: 'playerB', imageId: 'imgA3', promptId: 'fakeA3B', isCorrect: false },
            { playerId: 'playerC', imageId: 'imgA3', promptId: 'fakeA3C', isCorrect: false }
          ]
        },
        // Player B's images
        {
          imageId: 'imgB1',
          fakePrompts: [
            { id: 'fakeB1A', imageId: 'imgB1', authorId: 'playerA', text: 'Fake B1 by A' },
            { id: 'fakeB1C', imageId: 'imgB1', authorId: 'playerC', text: 'Fake B1 by C' }
          ],
          guesses: [
            { playerId: 'playerA', imageId: 'imgB1', promptId: 'real', isCorrect: true },
            { playerId: 'playerC', imageId: 'imgB1', promptId: 'fakeB1A', isCorrect: false }
          ]
        },
        {
          imageId: 'imgB2',
          fakePrompts: [
            { id: 'fakeB2A', imageId: 'imgB2', authorId: 'playerA', text: 'Fake B2 by A' },
            { id: 'fakeB2C', imageId: 'imgB2', authorId: 'playerC', text: 'Fake B2 by C' }
          ],
          guesses: [
            { playerId: 'playerA', imageId: 'imgB2', promptId: 'real', isCorrect: true },
            { playerId: 'playerC', imageId: 'imgB2', promptId: 'fakeB2A', isCorrect: false }
          ]
        },
        {
          imageId: 'imgB3',
          fakePrompts: [
            { id: 'fakeB3A', imageId: 'imgB3', authorId: 'playerA', text: 'Fake B3 by A' },
            { id: 'fakeB3C', imageId: 'imgB3', authorId: 'playerC', text: 'Fake B3 by C' }
          ],
          guesses: [
            { playerId: 'playerA', imageId: 'imgB3', promptId: 'real', isCorrect: true },
            { playerId: 'playerC', imageId: 'imgB3', promptId: 'fakeB3A', isCorrect: false }
          ]
        },
        // Player C's images
        {
          imageId: 'imgC1',
          fakePrompts: [
            { id: 'fakeC1A', imageId: 'imgC1', authorId: 'playerA', text: 'Fake C1 by A' },
            { id: 'fakeC1B', imageId: 'imgC1', authorId: 'playerB', text: 'Fake C1 by B' }
          ],
          guesses: [
            { playerId: 'playerA', imageId: 'imgC1', promptId: 'real', isCorrect: true },
            { playerId: 'playerB', imageId: 'imgC1', promptId: 'fakeC1A', isCorrect: false }
          ]
        },
        {
          imageId: 'imgC2',
          fakePrompts: [
            { id: 'fakeC2A', imageId: 'imgC2', authorId: 'playerA', text: 'Fake C2 by A' },
            { id: 'fakeC2B', imageId: 'imgC2', authorId: 'playerB', text: 'Fake C2 by B' }
          ],
          guesses: [
            { playerId: 'playerA', imageId: 'imgC2', promptId: 'fakeC2B', isCorrect: false },
            { playerId: 'playerB', imageId: 'imgC2', promptId: 'fakeC2A', isCorrect: false }
          ]
        },
        {
          imageId: 'imgC3',
          fakePrompts: [
            { id: 'fakeC3A', imageId: 'imgC3', authorId: 'playerA', text: 'Fake C3 by A' },
            { id: 'fakeC3B', imageId: 'imgC3', authorId: 'playerB', text: 'Fake C3 by B' }
          ],
          guesses: [
            { playerId: 'playerA', imageId: 'imgC3', promptId: 'fakeC3B', isCorrect: false },
            { playerId: 'playerB', imageId: 'imgC3', promptId: 'fakeC3A', isCorrect: false }
          ]
        }
      ];

      const achievementMap = calculateAchievements(history, players, images);

      // Verify achievements
      expect(achievementMap.get(AchievementType.MOST_ACCURATE)).toEqual(['playerA']); // A always guesses correctly
      expect(achievementMap.get(AchievementType.BEST_BULLSHITTER)).toEqual(['playerA']); // A fools C consistently
      expect(achievementMap.get(AchievementType.THE_PAINTER)).toEqual(['playerB']); // B's prompts get guessed correctly
      expect(achievementMap.get(AchievementType.THE_CHAOTICIAN)).toEqual(['playerC']); // C's fake prompts get varied votes
    });
  });
}); 
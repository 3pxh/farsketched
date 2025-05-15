import {
  GameState,
  GameMessage,
  MessageType,
  GameStage,
  GameConfig,
  Player,
  AchievementType,
  ActiveImage,
  GeneratedImage
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

// Helper function to generate timer ID
const generateTimerId = (round: number, imageIndex: number) => `timer-${round}-${imageIndex}`;

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
  history: [],
  timer: {
    startTime: 0,
    duration: 0,
    isRunning: false
  },
  achievements: []
};

/**
 * Calculates which players earned which achievements based on game history
 * @param history Array of completed game rounds
 * @param players Map of all players in the game
 * @param images Map of all generated images
 * @returns Map of achievement type to array of player IDs who earned it
 */
export function calculateAchievements(
  history: ActiveImage[],
  players: Record<string, Player>,
  images: Record<string, GeneratedImage>
): Map<AchievementType, string[]> {
  const achievementMap = new Map<AchievementType, string[]>();
  
  // Track statistics for each player
  const playerStats = new Map<string, {
    correctGuesses: number,      // For MOST_ACCURATE
    peopleFooled: number,        // For BEST_BULLSHITTER
    voteSpread: number,          // For THE_CHAOTICIAN
    ownPromptsGuessed: number    // For THE_PAINTER
  }>();

  // Initialize stats for all players
  Object.keys(players).forEach(playerId => {
    playerStats.set(playerId, {
      correctGuesses: 0,
      peopleFooled: 0,
      voteSpread: 0,
      ownPromptsGuessed: 0
    });
  });

  // Analyze each round
  history.forEach(round => {
    const image = images[round.imageId];
    if (!image) return; // Skip if image not found
    
    const imageCreatorId = image.creatorId;
    
    // Count votes for each prompt
    const promptVotes = new Map<string, number>();
    round.guesses.forEach(guess => {
      promptVotes.set(guess.promptId, (promptVotes.get(guess.promptId) || 0) + 1);
    });

    // Update player statistics
    round.guesses.forEach(guess => {
      const stats = playerStats.get(guess.playerId)!;
      
      // Update correct guesses
      if (guess.isCorrect) {
        stats.correctGuesses++;
      }
    });

    // Update fake prompt authors' stats
    round.fakePrompts.forEach(fakePrompt => {
      const stats = playerStats.get(fakePrompt.authorId)!;
      const votesForThisFake = promptVotes.get(fakePrompt.id) || 0;
      
      // Update people fooled count
      stats.peopleFooled += votesForThisFake;
      
      // Update vote spread (using standard deviation of votes)
      const meanVotes = round.guesses.length / (round.fakePrompts.length + 1); // +1 for real prompt
      const variance = Math.pow(votesForThisFake - meanVotes, 2);
      stats.voteSpread += variance;
    });

    // Update image creator's stats
    const creatorStats = playerStats.get(imageCreatorId)!;
    const correctGuessesForCreator = round.guesses.filter(g => g.isCorrect).length;
    creatorStats.ownPromptsGuessed += correctGuessesForCreator;
  });

  // Find winners for each achievement
  const findWinners = (getScore: (stats: { correctGuesses: number, peopleFooled: number, voteSpread: number, ownPromptsGuessed: number }) => number) => {
    const scores = new Map<string, number>();
    playerStats.forEach((stats, playerId) => {
      scores.set(playerId, getScore(stats));
    });
    
    const maxScore = Math.max(...scores.values());
    return Array.from(scores.entries())
      .filter(([_, score]) => score === maxScore)
      .map(([playerId]) => playerId);
  };

  // Assign achievements to winners
  achievementMap.set(
    AchievementType.MOST_ACCURATE,
    findWinners(stats => stats.correctGuesses)
  );

  achievementMap.set(
    AchievementType.BEST_BULLSHITTER,
    findWinners(stats => stats.peopleFooled)
  );

  achievementMap.set(
    AchievementType.THE_CHAOTICIAN,
    findWinners(stats => stats.voteSpread)
  );

  achievementMap.set(
    AchievementType.THE_PAINTER,
    findWinners(stats => stats.ownPromptsGuessed)
  );

  return achievementMap;
}

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
    case MessageType.REQUEST_START_GAME: {
      const now = Date.now();
      const timerId = generateTimerId(0, 0); // Starting round 0
      const timeoutId = setTimeout(() => {
        const timerExpiredMessage: GameMessage = {
          type: MessageType.TIMER_EXPIRED,
          stage: GameStage.PROMPTING,
          timestamp: Date.now(),
          messageId: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          timerId
        };
        sendSelfMessage(timerExpiredMessage);
      }, state.config.promptTimerSeconds * 1000);

      return {
        ...state,
        stage: GameStage.PROMPTING,
        timer: {
          startTime: now,
          duration: state.config.promptTimerSeconds,
          isRunning: true,
          timeoutId,
          timerId
        }
      };
    }

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
          const updatedState = {
            ...state,
            images: {
              ...state.images,
              [message.imageId]: {
                ...existingImage,
                imageBlob: message.imageBlob,
                status: 'complete' as const
              }
            }
          };

          // Check if we should transition to fooling stage
          if (state.stage === GameStage.PROMPTING) {
            const currentRoundImageIds = updatedState.roundImages[updatedState.currentRound] || [];
            const successfulImages = currentRoundImageIds.filter(imageId => {
              const image = updatedState.images[imageId];
              return image && image.status === 'complete' && image.imageBlob.size > 0;
            });

            // Check if all players have submitted image requests
            const allPlayersSubmitted = Object.keys(updatedState.players).length === currentRoundImageIds.length;

            // If all players have submitted and we have at least one successful image, move to fooling
            if (allPlayersSubmitted && successfulImages.length > 0) {
              const now = Date.now();
              const timerId = generateTimerId(state.currentRound, 0);
              const timeoutId = setTimeout(() => {
                const timerExpiredMessage: GameMessage = {
                  type: MessageType.TIMER_EXPIRED,
                  stage: GameStage.FOOLING,
                  timestamp: Date.now(),
                  messageId: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
                  timerId
                };
                sendSelfMessage(timerExpiredMessage);
              }, updatedState.config.foolingTimerSeconds * 1000);

              // Set the first successful image as active
              const activeImage = {
                imageId: successfulImages[0],
                fakePrompts: [],
                guesses: []
              };

              return {
                ...updatedState,
                stage: GameStage.FOOLING,
                activeImage,
                activeImageIndex: currentRoundImageIds.indexOf(successfulImages[0]),
                timer: {
                  startTime: now,
                  duration: updatedState.config.foolingTimerSeconds,
                  isRunning: true,
                  timeoutId,
                  timerId
                }
              };
            }
          }

          return updatedState;
        }
      }
      return state;
    }

    case MessageType.SUBMIT_FAKE_PROMPT: {
      if (!state.activeImage) return state;

      // Check if this player has already submitted a fake prompt
      const hasSubmitted = state.activeImage.fakePrompts.some(
        prompt => prompt.authorId === message.playerId
      );
      if (hasSubmitted) return state;

      // Create new fake prompt
      const fakePrompt = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        imageId: state.activeImage.imageId,
        authorId: message.playerId,
        text: message.fakePrompt
      };

      const updatedActiveImage = {
        ...state.activeImage,
        fakePrompts: [...state.activeImage.fakePrompts, fakePrompt]
      };

      // Check if all non-creator players have submitted fake prompts
      const imageCreatorId = state.images[state.activeImage.imageId].creatorId;
      const nonCreatorPlayers = Object.keys(state.players).filter(id => id !== imageCreatorId);
      const allPlayersSubmitted = nonCreatorPlayers.length === updatedActiveImage.fakePrompts.length;

      if (allPlayersSubmitted) {
        const now = Date.now();
        const timerId = generateTimerId(state.currentRound, state.activeImageIndex);
        const timeoutId = setTimeout(() => {
          const timerExpiredMessage: GameMessage = {
            type: MessageType.TIMER_EXPIRED,
            stage: GameStage.GUESSING,
            timestamp: Date.now(),
            messageId: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            timerId
          };
          sendSelfMessage(timerExpiredMessage);
        }, state.config.guessingTimerSeconds * 1000);

        return {
          ...state,
          stage: GameStage.GUESSING,
          activeImage: updatedActiveImage,
          timer: {
            startTime: now,
            duration: state.config.guessingTimerSeconds,
            isRunning: true,
            timeoutId,
            timerId
          }
        };
      }

      return {
        ...state,
        activeImage: updatedActiveImage
      };
    }

    case MessageType.SUBMIT_GUESS: {
      if (!state.activeImage) return state;

      // Check if this player has already submitted a guess
      const hasSubmitted = state.activeImage.guesses.some(
        guess => guess.playerId === message.playerId
      );
      if (hasSubmitted) return state;

      // Create new guess
      const guess = {
        playerId: message.playerId,
        imageId: state.activeImage.imageId,
        promptId: message.promptId,
        isCorrect: message.promptId === 'real'
      };

      const updatedActiveImage = {
        ...state.activeImage,
        guesses: [...state.activeImage.guesses, guess]
      };

      // Get the image creator's ID
      const imageCreatorId = state.images[state.activeImage.imageId].creatorId;
      
      // Check if all non-creator players have submitted guesses
      const nonCreatorPlayers = Object.keys(state.players).filter(id => id !== imageCreatorId);
      const allPlayersGuessed = nonCreatorPlayers.length === updatedActiveImage.guesses.length;

      if (allPlayersGuessed) {
        // Calculate scores before moving to scoring stage
        const updatedPlayers = { ...state.players };
        
        // Count correct guesses for the real prompt
        const correctGuesses = updatedActiveImage.guesses.filter(guess => guess.isCorrect).length;
        
        // Award points to image creator for each correct guess
        updatedPlayers[imageCreatorId] = {
          ...updatedPlayers[imageCreatorId],
          points: (updatedPlayers[imageCreatorId].points || 0) + (correctGuesses * 5)
        };

        // Award points to players who wrote fake prompts
        for (const fakePrompt of updatedActiveImage.fakePrompts) {
          const fakePromptAuthor = fakePrompt.authorId;
          
          // Count how many players guessed this fake prompt
          const guessesForThisFake = updatedActiveImage.guesses.filter(
            guess => guess.promptId === fakePrompt.id
          ).length;

          // Award points to fake prompt author
          updatedPlayers[fakePromptAuthor] = {
            ...updatedPlayers[fakePromptAuthor],
            points: (updatedPlayers[fakePromptAuthor].points || 0) + (guessesForThisFake * 3)
          };

          // If they guessed correctly, award additional points
          const authorGuessedCorrectly = updatedActiveImage.guesses.some(
            guess => guess.playerId === fakePromptAuthor && guess.isCorrect
          );
          if (authorGuessedCorrectly) {
            updatedPlayers[fakePromptAuthor] = {
              ...updatedPlayers[fakePromptAuthor],
              points: (updatedPlayers[fakePromptAuthor].points || 0) + 5
            };
          }
        }

        const now = Date.now();
        const timerId = generateTimerId(state.currentRound, state.activeImageIndex);
        const timeoutId = setTimeout(() => {
          const timerExpiredMessage: GameMessage = {
            type: MessageType.TIMER_EXPIRED,
            stage: GameStage.SCORING,
            timestamp: Date.now(),
            messageId: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            timerId
          };
          sendSelfMessage(timerExpiredMessage);
        }, state.config.scoringDisplaySeconds * 1000);

        return {
          ...state,
          stage: GameStage.SCORING,
          activeImage: updatedActiveImage,
          history: [...state.history, updatedActiveImage],
          players: updatedPlayers,
          timer: {
            startTime: now,
            duration: state.config.scoringDisplaySeconds,
            isRunning: true,
            timeoutId,
            timerId
          }
        };
      }

      return {
        ...state,
        activeImage: updatedActiveImage
      };
    }

    case MessageType.TIMER_EXPIRED: {
      // Ignore if timer ID doesn't match current timer
      if (state.timer.timerId && message.timerId !== state.timer.timerId) {
        return state;
      }

      // Handle transition from prompting to fooling
      if (state.stage === GameStage.PROMPTING && message.stage === GameStage.PROMPTING) {
        const now = Date.now();
        const timerId = generateTimerId(state.currentRound, state.activeImageIndex);
        const timeoutId = setTimeout(() => {
          const timerExpiredMessage: GameMessage = {
            type: MessageType.TIMER_EXPIRED,
            stage: GameStage.FOOLING,
            timestamp: Date.now(),
            messageId: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            timerId
          };
          sendSelfMessage(timerExpiredMessage);
        }, state.config.foolingTimerSeconds * 1000);

        // Find a completed image from the current round
        const currentRoundImageIds = state.roundImages[state.currentRound] || [];
        const completedImage = currentRoundImageIds.find(imageId => {
          const image = state.images[imageId];
          return image && image.status === 'complete';
        });

        // If we found a completed image, set it as active
        const activeImage = completedImage ? {
          imageId: completedImage,
          fakePrompts: [],
          guesses: []
        } : null;

        return {
          ...state,
          stage: GameStage.FOOLING,
          activeImage,
          activeImageIndex: completedImage ? currentRoundImageIds.indexOf(completedImage) : 0,
          timer: {
            startTime: now,
            duration: state.config.foolingTimerSeconds,
            isRunning: true,
            timeoutId,
            timerId
          }
        };
      }
      
      // Handle transition from fooling to guessing
      if (state.stage === GameStage.FOOLING && message.stage === GameStage.FOOLING) {
        const now = Date.now();
        const timerId = generateTimerId(state.currentRound, state.activeImageIndex);
        const timeoutId = setTimeout(() => {
          const timerExpiredMessage: GameMessage = {
            type: MessageType.TIMER_EXPIRED,
            stage: GameStage.GUESSING,
            timestamp: Date.now(),
            messageId: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            timerId
          };
          sendSelfMessage(timerExpiredMessage);
        }, state.config.guessingTimerSeconds * 1000);

        return {
          ...state,
          stage: GameStage.GUESSING,
          timer: {
            startTime: now,
            duration: state.config.guessingTimerSeconds,
            isRunning: true,
            timeoutId,
            timerId
          }
        };
      }

      // Handle transition from guessing to scoring
      if (state.stage === GameStage.GUESSING && message.stage === GameStage.GUESSING) {
        const now = Date.now();
        const timerId = generateTimerId(state.currentRound, state.activeImageIndex);
        const timeoutId = setTimeout(() => {
          const timerExpiredMessage: GameMessage = {
            type: MessageType.TIMER_EXPIRED,
            stage: GameStage.SCORING,
            timestamp: Date.now(),
            messageId: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            timerId
          };
          sendSelfMessage(timerExpiredMessage);
        }, state.config.scoringDisplaySeconds * 1000);

        // Calculate scores for the guesses we have
        const updatedPlayers = { ...state.players };
        if (state.activeImage) {
          const imageCreatorId = state.images[state.activeImage.imageId].creatorId;
          
          // Count correct guesses for the real prompt
          const correctGuesses = state.activeImage.guesses.filter(guess => guess.isCorrect).length;
          
          // Award points to image creator for each correct guess
          updatedPlayers[imageCreatorId] = {
            ...updatedPlayers[imageCreatorId],
            points: (updatedPlayers[imageCreatorId].points || 0) + (correctGuesses * 5)
          };

          // Award points to players who wrote fake prompts
          for (const fakePrompt of state.activeImage.fakePrompts) {
            const fakePromptAuthor = fakePrompt.authorId;
            
            // Count how many players guessed this fake prompt
            const guessesForThisFake = state.activeImage.guesses.filter(
              guess => guess.promptId === fakePrompt.id
            ).length;

            // Award points to fake prompt author
            updatedPlayers[fakePromptAuthor] = {
              ...updatedPlayers[fakePromptAuthor],
              points: (updatedPlayers[fakePromptAuthor].points || 0) + (guessesForThisFake * 3)
            };

            // If they guessed correctly, award additional points
            const authorGuessedCorrectly = state.activeImage.guesses.some(
              guess => guess.playerId === fakePromptAuthor && guess.isCorrect
            );
            if (authorGuessedCorrectly) {
              updatedPlayers[fakePromptAuthor] = {
                ...updatedPlayers[fakePromptAuthor],
                points: (updatedPlayers[fakePromptAuthor].points || 0) + 5
              };
            }
          }
        }

        return {
          ...state,
          stage: GameStage.SCORING,
          history: state.activeImage ? [...state.history, state.activeImage] : state.history,
          players: updatedPlayers,
          timer: {
            startTime: now,
            duration: state.config.scoringDisplaySeconds,
            isRunning: true,
            timeoutId,
            timerId
          }
        };
      }

      // Handle transition from scoring stage
      if (state.stage === GameStage.SCORING && message.stage === GameStage.SCORING) {
        const currentRoundImageIds = state.roundImages[state.currentRound] || [];
        const nextImageIndex = state.activeImageIndex + 1;
        const isLastImageInRound = nextImageIndex >= currentRoundImageIds.length;
        const isLastRound = state.currentRound + 1 >= state.config.roundCount;

        // If there are more images in the current round, move to fooling stage
        if (!isLastImageInRound) {
          const nextImageId = currentRoundImageIds[nextImageIndex];
          const now = Date.now();
          const timerId = generateTimerId(state.currentRound, nextImageIndex);
          const timeoutId = setTimeout(() => {
            const timerExpiredMessage: GameMessage = {
              type: MessageType.TIMER_EXPIRED,
              stage: GameStage.FOOLING,
              timestamp: Date.now(),
              messageId: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
              timerId
            };
            sendSelfMessage(timerExpiredMessage);
          }, state.config.foolingTimerSeconds * 1000);

          return {
            ...state,
            stage: GameStage.FOOLING,
            activeImage: {
              imageId: nextImageId,
              fakePrompts: [],
              guesses: []
            },
            activeImageIndex: nextImageIndex,
            timer: {
              startTime: now,
              duration: state.config.foolingTimerSeconds,
              isRunning: true,
              timeoutId,
              timerId
            }
          };
        }

        // If this is not the last round, move to prompting stage
        if (!isLastRound) {
          const now = Date.now();
          const timerId = generateTimerId(state.currentRound + 1, 0);
          const timeoutId = setTimeout(() => {
            const timerExpiredMessage: GameMessage = {
              type: MessageType.TIMER_EXPIRED,
              stage: GameStage.PROMPTING,
              timestamp: Date.now(),
              messageId: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
              timerId
            };
            sendSelfMessage(timerExpiredMessage);
          }, state.config.promptTimerSeconds * 1000);

          return {
            ...state,
            stage: GameStage.PROMPTING,
            currentRound: state.currentRound + 1,
            activeImage: null,
            activeImageIndex: 0,
            timer: {
              startTime: now,
              duration: state.config.promptTimerSeconds,
              isRunning: true,
              timeoutId,
              timerId
            }
          };
        }

        // If this is the last round and last image, move to game over
        const achievementMap = calculateAchievements(state.history, state.players, state.images);
        const achievements = Array.from(achievementMap.entries()).map(([type, playerIds]) => ({
          type,
          playerIds,
          value: 0 // We could calculate specific values if needed
        }));

        return {
          ...state,
          stage: GameStage.GAME_OVER,
          achievements
        };
      }

      return state;
    }

    // Error messages
    case MessageType.ERROR:
    case MessageType.PROMPT_ERROR:
      return state;

    default:
      return state;
  }
} 

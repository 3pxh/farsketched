import {
  GameState,
  GameMessage,
  MessageType,
  GameStage,
  GameConfig,
  Player,
  AchievementType,
  ActiveText,
  GeneratedText
} from './types';
import { generateText } from '@/apis/textGeneration';

// Default game configuration
const DEFAULT_CONFIG: GameConfig = {
  maxPlayers: 10,
  minPlayers: 3,
  roundCount: 3,
  promptTimerSeconds: 45,
  foolingTimerSeconds: 45,
  guessingTimerSeconds: 20,
  scoringDisplaySeconds: 10,
  room: ''
};

// Helper function to generate timer ID
const generateTimerId = (round: number, textIndex: number) => `timer-${round}-${textIndex}`;

// Initial game state
export const initialState: GameState = {
  config: DEFAULT_CONFIG,
  stage: GameStage.LOBBY,
  players: {},
  texts: {},
  currentRound: 0,
  roundTexts: [],
  activeTextIndex: 0,
  activeText: null,
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
 * @param texts Map of all generated texts
 * @returns Map of achievement type to array of player IDs who earned it
 */
export function calculateAchievements(
  history: ActiveText[],
  players: Record<string, Player>,
  texts: Record<string, GeneratedText>
): Map<AchievementType, string[]> {
  const achievementMap = new Map<AchievementType, string[]>();
  
  // Track statistics for each player
  const playerStats = new Map<string, {
    correctGuesses: number,      // For MOST_ACCURATE
    peopleFooled: number,        // For BEST_BULLSHITTER
    voteSpread: number,          // For THE_CHAOTICIAN
    ownPromptsGuessed: number    // For THE_WRITER
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
    const text = texts[round.textId];
    if (!text) return; // Skip if text not found
    
    const textCreatorId = text.creatorId;
    
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

    // Update text creator's stats
    const creatorStats = playerStats.get(textCreatorId)!;
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
    AchievementType.THE_WRITER,
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
      // Generate a unique ID for the text
      const textId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      
      // Create a new pending text
      const pendingText = {
        id: textId,
        creatorId: message.playerId,
        prompt: message.prompt,
        text: '', // Empty text for pending state
        roundIndex: state.currentRound,
        timestamp: Date.now(),
        status: 'pending' as const
      };

      // Add the text to the current round's texts
      const currentRoundTexts = state.roundTexts[state.currentRound] || [];
      const updatedRoundTexts = [...state.roundTexts];
      updatedRoundTexts[state.currentRound] = [...currentRoundTexts, textId];
      
      // Call the text generation API
      generateText({
        prompt: message.prompt,
      }).then(generatedText => {
        if (generatedText) {
          // Send success message with the generated text
          const successMessage: GameMessage = {
            type: MessageType.PROMPT_RESULT,
            success: true,
            textId,
            generatedText: generatedText.text,
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

      // Check if this is the last prompt submission
      const updatedTexts = {
        ...state.texts,
        [textId]: pendingText
      };

      const allPlayersSubmitted = Object.keys(state.players).length === updatedRoundTexts[state.currentRound].length;

      if (allPlayersSubmitted) {
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
        }, state.config.foolingTimerSeconds * 1000);

        // Find a successful text or fall back to the earliest one
        const currentRoundTextIds = updatedRoundTexts[state.currentRound];
        const successfulText = currentRoundTextIds.find(textId => {
          const text = updatedTexts[textId];
          return text && text.status === 'complete' && text.text.length > 0;
        });

        const selectedTextId = successfulText || currentRoundTextIds[0]; // Fall back to earliest if no successful text

        return {
          ...state,
          texts: updatedTexts,
          roundTexts: updatedRoundTexts,
          stage: GameStage.FOOLING,
          activeText: {
            textId: selectedTextId,
            fakePrompts: [],
            guesses: []
          },
          activeTextIndex: currentRoundTextIds.indexOf(selectedTextId),
          timer: {
            startTime: now,
            duration: state.config.foolingTimerSeconds,
            isRunning: true,
            timeoutId,
            timerId
          }
        };
      }

      return {
        ...state,
        texts: updatedTexts,
        roundTexts: updatedRoundTexts
      };
    }

    case MessageType.PROMPT_RESULT: {
      if (message.success && message.textId && message.generatedText) {
        // Update the existing text with the generated text and mark as complete
        const existingText = state.texts[message.textId];
        if (existingText) {
          const updatedState = {
            ...state,
            texts: {
              ...state.texts,
              [message.textId]: {
                ...existingText,
                text: message.generatedText,
                status: 'complete' as const
              }
            }
          };

          // Check if we should transition to fooling stage
          if (state.stage === GameStage.PROMPTING) {
            const currentRoundTextIds = updatedState.roundTexts[updatedState.currentRound] || [];
            const successfulTexts = currentRoundTextIds.filter(textId => {
              const text = updatedState.texts[textId];
              return text && text.status === 'complete' && text.text.length > 0;
            });

            // Check if all players have submitted text requests
            const allPlayersSubmitted = Object.keys(updatedState.players).length === currentRoundTextIds.length;

            // If all players have submitted and we have at least one successful text, move to fooling
            if (allPlayersSubmitted && successfulTexts.length > 0) {
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

              // Set the first successful text as active
              const activeText = {
                textId: successfulTexts[0],
                fakePrompts: [],
                guesses: []
              };

              return {
                ...updatedState,
                stage: GameStage.FOOLING,
                activeText,
                activeTextIndex: currentRoundTextIds.indexOf(successfulTexts[0]),
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
      if (!state.activeText) return state;

      // Check if this player has already submitted a fake prompt
      const hasSubmitted = state.activeText.fakePrompts.some(
        prompt => prompt.authorId === message.playerId
      );
      if (hasSubmitted) return state;

      // Create new fake prompt
      const fakePrompt = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        textId: state.activeText.textId,
        authorId: message.playerId,
        text: message.fakePrompt
      };

      const updatedActiveText = {
        ...state.activeText,
        fakePrompts: [...state.activeText.fakePrompts, fakePrompt]
      };

      // Check if all non-creator players have submitted fake prompts
      const textCreatorId = state.texts[state.activeText.textId].creatorId;
      const nonCreatorPlayers = Object.keys(state.players).filter(id => id !== textCreatorId);
      const allPlayersSubmitted = nonCreatorPlayers.length === updatedActiveText.fakePrompts.length;

      if (allPlayersSubmitted) {
        const now = Date.now();
        const timerId = generateTimerId(state.currentRound, state.activeTextIndex);
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
          activeText: updatedActiveText,
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
        activeText: updatedActiveText
      };
    }

    case MessageType.SUBMIT_GUESS: {
      if (!state.activeText) return state;

      // Check if this player has already submitted a guess
      const hasSubmitted = state.activeText.guesses.some(
        guess => guess.playerId === message.playerId
      );
      if (hasSubmitted) return state;

      // Create new guess
      const guess = {
        playerId: message.playerId,
        textId: state.activeText.textId,
        promptId: message.promptId,
        isCorrect: message.promptId === 'real'
      };

      const updatedActiveText = {
        ...state.activeText,
        guesses: [...state.activeText.guesses, guess]
      };

      // Get the text creator's ID
      const textCreatorId = state.texts[state.activeText.textId].creatorId;
      
      // Check if all non-creator players have submitted guesses
      const nonCreatorPlayers = Object.keys(state.players).filter(id => id !== textCreatorId);
      const allPlayersGuessed = nonCreatorPlayers.length === updatedActiveText.guesses.length;

      if (allPlayersGuessed) {
        // Calculate scores before moving to scoring stage
        const updatedPlayers = { ...state.players };
        
        // Count correct guesses for the real prompt
        const correctGuesses = updatedActiveText.guesses.filter(guess => guess.isCorrect).length;
        
        // Award points to text creator for each correct guess
        updatedPlayers[textCreatorId] = {
          ...updatedPlayers[textCreatorId],
          points: (updatedPlayers[textCreatorId].points || 0) + (correctGuesses * 5)
        };

        // Award points to players who wrote fake prompts
        for (const fakePrompt of updatedActiveText.fakePrompts) {
          const fakePromptAuthor = fakePrompt.authorId;
          
          // Count how many players guessed this fake prompt
          const guessesForThisFake = updatedActiveText.guesses.filter(
            guess => guess.promptId === fakePrompt.id
          ).length;

          // Award points to fake prompt author
          updatedPlayers[fakePromptAuthor] = {
            ...updatedPlayers[fakePromptAuthor],
            points: (updatedPlayers[fakePromptAuthor].points || 0) + (guessesForThisFake * 3)
          };

          // If they guessed correctly, award additional points
          const authorGuessedCorrectly = updatedActiveText.guesses.some(
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
        const timerId = generateTimerId(state.currentRound, state.activeTextIndex);
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
          activeText: updatedActiveText,
          history: [...state.history, updatedActiveText],
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
        activeText: updatedActiveText
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
        const timerId = generateTimerId(state.currentRound, state.activeTextIndex);
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

        // Find a completed text from the current round
        const currentRoundTextIds = state.roundTexts[state.currentRound] || [];
        const completedText = currentRoundTextIds.find(textId => {
          const text = state.texts[textId];
          return text && text.status === 'complete';
        });

        // If we found a completed text, set it as active
        const activeText = completedText ? {
          textId: completedText,
          fakePrompts: [],
          guesses: []
        } : null;

        return {
          ...state,
          stage: GameStage.FOOLING,
          activeText,
          activeTextIndex: completedText ? currentRoundTextIds.indexOf(completedText) : 0,
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
        const timerId = generateTimerId(state.currentRound, state.activeTextIndex);
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
        const timerId = generateTimerId(state.currentRound, state.activeTextIndex);
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
        if (state.activeText) {
          const textCreatorId = state.texts[state.activeText.textId].creatorId;
          
          // Count correct guesses for the real prompt
          const correctGuesses = state.activeText.guesses.filter(guess => guess.isCorrect).length;
          
          // Award points to text creator for each correct guess
          updatedPlayers[textCreatorId] = {
            ...updatedPlayers[textCreatorId],
            points: (updatedPlayers[textCreatorId].points || 0) + (correctGuesses * 5)
          };

          // Award points to players who wrote fake prompts
          for (const fakePrompt of state.activeText.fakePrompts) {
            const fakePromptAuthor = fakePrompt.authorId;
            
            // Count how many players guessed this fake prompt
            const guessesForThisFake = state.activeText.guesses.filter(
              guess => guess.promptId === fakePrompt.id
            ).length;

            // Award points to fake prompt author
            updatedPlayers[fakePromptAuthor] = {
              ...updatedPlayers[fakePromptAuthor],
              points: (updatedPlayers[fakePromptAuthor].points || 0) + (guessesForThisFake * 3)
            };

            // If they guessed correctly, award additional points
            const authorGuessedCorrectly = state.activeText.guesses.some(
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
          history: state.activeText ? [...state.history, state.activeText] : state.history,
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
        const currentRoundTextIds = state.roundTexts[state.currentRound] || [];
        const nextTextIndex = state.activeTextIndex + 1;
        const isLastTextInRound = nextTextIndex >= currentRoundTextIds.length;
        const isLastRound = state.currentRound + 1 >= state.config.roundCount;

        // If there are more texts in the current round, move to fooling stage
        if (!isLastTextInRound) {
          const nextTextId = currentRoundTextIds[nextTextIndex];
          const now = Date.now();
          const timerId = generateTimerId(state.currentRound, nextTextIndex);
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
            activeText: {
              textId: nextTextId,
              fakePrompts: [],
              guesses: []
            },
            activeTextIndex: nextTextIndex,
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
            activeText: null,
            activeTextIndex: 0,
            timer: {
              startTime: now,
              duration: state.config.promptTimerSeconds,
              isRunning: true,
              timeoutId,
              timerId
            }
          };
        }

        // If this is the last round and last text, move to game over
        const achievementMap = calculateAchievements(state.history, state.players, state.texts);
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

/**
 * Core types for Farsketched
 */

// ==================== Player & Image Types ====================

/**
 * Represents a player in the game
 */
export interface Player {
    id: string;           // UUID generated client-side
    name: string;         // Display name chosen by player
    avatarUrl: string;    // URL to player's avatar image
    connected: boolean;   // Connection status
    points: number;       // Total points accumulated
    lastSeen: number;     // Timestamp of last activity
  }
  
  /**
   * Represents a generated image
   */
  export interface GeneratedImage {
    id: string;           // Unique ID for the image
    creatorId: string;    // Player ID who created the image
    prompt: string;       // The real prompt used to generate the image
    imageBlob: Blob;      // The actual image data as a Blob
    roundIndex: number;   // Which round this image belongs to
    timestamp: number;    // When the image was generated
    status: 'pending' | 'complete' | 'error'; // Status of the image generation
  }
  
  /**
   * Represents a fake prompt (lie) submitted by a player
   */
  export interface FakePrompt {
    id: string;           // Unique ID for this fake prompt
    imageId: string;      // ID of the image this fake prompt is for
    authorId: string;     // Player ID who wrote this fake prompt
    text: string;         // The fake prompt text
  }
  
  /**
   * Represents a player's guess for an image
   */
  export interface Guess {
    playerId: string;     // Player who made the guess
    imageId: string;      // Image being guessed for
    promptId: string;     // ID of the prompt they chose (can be real or fake)
    isCorrect: boolean;   // Whether this guess was correct
  }
  
  // ==================== Game State Types ====================
  
  /**
   * Possible game stages
   */
  export enum GameStage {
    LOBBY = 'lobby',                // Players joining, setting names/avatars
    PROMPTING = 'prompting',        // Players submitting initial prompts
    FOOLING = 'fooling',            // Players creating fake prompts
    GUESSING = 'guessing',          // Players guessing the real prompt
    SCORING = 'scoring',            // Showing scores for the current image
    GAME_OVER = 'game_over'         // Final scores and achievements
  }
  
  /**
   * Game configuration settings
   */
  export interface GameConfig {
    maxPlayers: number;             // Maximum number of players (default: 10)
    minPlayers: number;             // Minimum players required (default: 3)
    roundCount: number;             // Number of rounds (default: 3)
    promptTimerSeconds: number;     // Time for prompting stage (default: 45)
    foolingTimerSeconds: number;    // Time for fooling stage (default: 45)
    guessingTimerSeconds: number;   // Time for guessing stage (default: 20)
    scoringDisplaySeconds: number;  // Time to display scoring (default: 10)
    room: string;                   // Unique code for this game room
  }
  
  /**
   * Achievement types that can be awarded at the end
   */
  export enum AchievementType {
    MOST_ACCURATE = 'most_accurate',   // Most correct guesses
    BEST_BULLSHITTER = 'best_bullshitter', // Most people fooled by fake prompts
    THE_CHAOTICIAN = 'the_chaotician', // Biggest spread of votes across prompts
    THE_PAINTER = 'the_painter'        // Most real prompts guessed of their images
  }
  
  /**
   * Represents an achievement earned by a player
   */
  export interface Achievement {
    type: AchievementType;
    playerIds: string[];
    value: number;
  }
  
  /**
   * Current active image being processed
   */
  export interface ActiveImage {
    imageId: string;      // The current image being shown
    fakePrompts: FakePrompt[]; // All fake prompts submitted
    guesses: Guess[];     // All guesses made
  }
  
  /**
   * Complete game state on the host
   */
  export interface GameState {
    config: GameConfig;
    stage: GameStage;
    players: Record<string, Player>;
    images: Record<string, GeneratedImage>;
    currentRound: number; // 0-indexed
    roundImages: string[][]; // Array of image IDs per round
    activeImageIndex: number; // Index within current round
    activeImage: ActiveImage | null;
    history: ActiveImage[]; // Array of completed ActiveImage instances
    timer: {
      startTime: number;  // When the current timer started
      duration: number;   // Duration in seconds
      isRunning: boolean;
      timeoutId?: NodeJS.Timeout; // ID of the current timer timeout
      timerId?: string; // ID to match with timer expired messages
    };
    achievements: Achievement[]; // Only populated at game end
  }
  
  // ==================== Message Types ====================
  
  /**
   * Types of messages that can be sent between host and clients
   */
  export enum MessageType {
    // Lobby messages
    SET_PLAYER_INFO = 'set_player_info',
    PLAYER_JOINED = 'player_joined',
    PLAYER_LEFT = 'player_left',
    REQUEST_START_GAME = 'request_start_game',
    CANCEL_START_GAME = 'cancel_start_game',
    
    // Game flow messages
    GAME_STARTING = 'game_starting',
    SUBMIT_PROMPT = 'submit_prompt',
    PROMPT_RESULT = 'prompt_result',
    SUBMIT_FAKE_PROMPT = 'submit_fake_prompt',
    SUBMIT_GUESS = 'submit_guess',
    TIMER_EXPIRED = 'timer_expired',
    
    // Error messages
    ERROR = 'error',
    PROMPT_ERROR = 'prompt_error'
  }
  
  // ==================== Base Message Interface ====================
  
  /**
   * Base interface for all messages
   */
  export interface BaseMessage {
    type: MessageType;
    timestamp: number;
    messageId: string;    // Unique ID to prevent duplicate processing
  }
  
  // ==================== Lobby Messages ====================
  
  /**
   * Client sets/updates their name and avatar
   */
  export interface SetPlayerInfoMessage extends BaseMessage {
    type: MessageType.SET_PLAYER_INFO;
    playerId: string;
    name: string;
    avatarUrl: string;
  }
  
  /**
   * Host notifies all clients that a player joined
   */
  export interface PlayerJoinedMessage extends BaseMessage {
    type: MessageType.PLAYER_JOINED;
    player: Player;
  }
  
  /**
   * Host notifies all clients that a player left
   */
  export interface PlayerLeftMessage extends BaseMessage {
    type: MessageType.PLAYER_LEFT;
    playerId: string;
  }
  
  /**
   * Client requests to start the game
   */
  export interface RequestStartGameMessage extends BaseMessage {
    type: MessageType.REQUEST_START_GAME;
    playerId: string;
  }
  
  /**
   * Client cancels their start game request
   */
  export interface CancelStartGameMessage extends BaseMessage {
    type: MessageType.CANCEL_START_GAME;
    playerId: string;
  }
  
  // ==================== Game Flow Messages ====================
  
  /**
   * Host notifies all clients that the game is starting
   */
  export interface GameStartingMessage extends BaseMessage {
    type: MessageType.GAME_STARTING;
    players: Player[];
    config: GameConfig;
  }
  
  /**
   * Client submits a prompt to generate an image
   */
  export interface SubmitPromptMessage extends BaseMessage {
    type: MessageType.SUBMIT_PROMPT;
    playerId: string;
    prompt: string;
  }
  
  /**
   * Host sends back result of prompt generation
   */
  export interface PromptResultMessage extends BaseMessage {
    type: MessageType.PROMPT_RESULT;
    success: boolean;
    imageId?: string;
    imageBlob?: Blob;
    errorMessage?: string;
  }
  
  /**
   * Client submits a fake prompt
   */
  export interface SubmitFakePromptMessage extends BaseMessage {
    type: MessageType.SUBMIT_FAKE_PROMPT;
    playerId: string;
    imageId: string;
    fakePrompt: string;
  }
  
  /**
   * Client submits a guess for the real prompt
   */
  export interface SubmitGuessMessage extends BaseMessage {
    type: MessageType.SUBMIT_GUESS;
    playerId: string;
    imageId: string;
    promptId: string;
  }

  /**
   * Host notifies all clients that a timer has expired
   */
  export interface TimerExpiredMessage extends BaseMessage {
    type: MessageType.TIMER_EXPIRED;
    stage: GameStage;     // Which game stage the timer was for
    timerId: string;      // ID to match with current timer
  }
  
  // ==================== Error Messages ====================
  
  /**
   * General error message
   */
  export interface ErrorMessage extends BaseMessage {
    type: MessageType.ERROR;
    code: string;
    message: string;
  }
  
  /**
   * Error specific to image prompt generation
   */
  export interface PromptErrorMessage extends BaseMessage {
    type: MessageType.PROMPT_ERROR;
    playerId: string;
    prompt: string;
    errorCode: string;
    errorMessage: string;
  }
  
  // ==================== Union Type for All Messages ====================
  
  export type GameMessage =
    | SetPlayerInfoMessage
    | PlayerJoinedMessage
    | PlayerLeftMessage
    | RequestStartGameMessage
    | CancelStartGameMessage
    | GameStartingMessage
    | SubmitPromptMessage
    | PromptResultMessage
    | SubmitFakePromptMessage
    | SubmitGuessMessage
    | TimerExpiredMessage
    | ErrorMessage
    | PromptErrorMessage;
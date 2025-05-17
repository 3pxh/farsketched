/**
 * Core types for Farsketched
 */

// ==================== Player & Text Types ====================

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
   * Represents a generated text
   */
  export interface GeneratedText {
    id: string;           // Unique ID for the text
    creatorId: string;    // Player ID who created the text
    prompt: string;       // The real prompt used to generate the text
    text: string;         // The actual generated text
    roundIndex: number;   // Which round this text belongs to
    timestamp: number;    // When the text was generated
    status: 'pending' | 'complete' | 'error'; // Status of the text generation
  }
  
  /**
   * Represents a fake prompt (lie) submitted by a player
   */
  export interface FakePrompt {
    id: string;           // Unique ID for this fake prompt
    textId: string;       // ID of the text this fake prompt is for
    authorId: string;     // Player ID who wrote this fake prompt
    text: string;         // The fake prompt text
  }
  
  /**
   * Represents a player's guess for a text
   */
  export interface Guess {
    playerId: string;     // Player who made the guess
    textId: string;       // Text being guessed for
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
    SCORING = 'scoring',            // Showing scores for the current text
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
    instructions: {
      ai: string,                   // Instructions for the language model
      human: string                 // Instructions for the human players 
    };           
  }
  
  /**
   * Achievement types that can be awarded at the end
   */
  export enum AchievementType {
    MOST_ACCURATE = 'most_accurate',   // Most correct guesses
    BEST_BULLSHITTER = 'best_bullshitter', // Most people fooled by fake prompts
    THE_CHAOTICIAN = 'the_chaotician', // Biggest spread of votes across prompts
    THE_WRITER = 'the_writer'          // Most real prompts guessed of their texts
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
   * Current active text being processed
   */
  export interface ActiveText {
    textId: string;       // The current text being shown
    fakePrompts: FakePrompt[]; // All fake prompts submitted
    guesses: Guess[];     // All guesses made
  }
  
  /**
   * Complete game state on the host
   */
  export interface GameState {
    stage: GameStage;
    players: Record<string, Player>;
    texts: Record<string, GeneratedText>;
    currentRound: number; // 0-indexed
    roundTexts: string[][]; // Array of text IDs per round
    activeTextIndex: number; // Index within current round
    activeText: ActiveText | null;
    history: ActiveText[]; // Array of completed ActiveText instances
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
    // Connection messages
    CONNECTION_REQUEST = 'connection_request',
    CONNECTION_ACCEPTED = 'connection_accepted',
    CONNECTION_REJECTED = 'connection_rejected',
    PING = 'ping',
    PONG = 'pong',
    DISCONNECT = 'disconnect',
    
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
  
  // ==================== Connection Messages ====================
  
  /**
   * Client requests to join a game with a player ID
   */
  export interface ConnectionRequestMessage extends BaseMessage {
    type: MessageType.CONNECTION_REQUEST;
    playerId: string;     // UUID stored in local storage
    room: string;     // Room code from URL parameter
  }
  
  /**
   * Host accepts a connection request
   */
  export interface ConnectionAcceptedMessage extends BaseMessage {
    type: MessageType.CONNECTION_ACCEPTED;
    gameState: GameState; // Current game state
    yourPlayerId: string; // Confirming the player's ID
  }
  
  /**
   * Host rejects a connection request
   */
  export interface ConnectionRejectedMessage extends BaseMessage {
    type: MessageType.CONNECTION_REJECTED;
    reason: string;       // Why the connection was rejected
  }
  
  /**
   * Keep-alive ping message
   */
  export interface PingMessage extends BaseMessage {
    type: MessageType.PING;
  }
  
  /**
   * Response to ping
   */
  export interface PongMessage extends BaseMessage {
    type: MessageType.PONG;
  }
  
  /**
   * Notification that a client is disconnecting
   */
  export interface DisconnectMessage extends BaseMessage {
    type: MessageType.DISCONNECT;
    playerId: string;
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
   * Client submits a prompt to generate text
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
    textId?: string;
    generatedText?: string;
    errorMessage?: string;
  }
  
  /**
   * Client submits a fake prompt
   */
  export interface SubmitFakePromptMessage extends BaseMessage {
    type: MessageType.SUBMIT_FAKE_PROMPT;
    playerId: string;
    textId: string;
    fakePrompt: string;
  }
  
  /**
   * Client submits a guess for the real prompt
   */
  export interface SubmitGuessMessage extends BaseMessage {
    type: MessageType.SUBMIT_GUESS;
    playerId: string;
    textId: string;
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
   * Error specific to text prompt generation
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
    | ConnectionRequestMessage
    | ConnectionAcceptedMessage
    | ConnectionRejectedMessage
    | PingMessage
    | PongMessage
    | DisconnectMessage
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
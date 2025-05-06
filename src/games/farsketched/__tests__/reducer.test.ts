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
  PlayerLeftMessage,
  RequestStartGameMessage,
  CancelStartGameMessage,
  GameStartingMessage,
  GameStateUpdateMessage,
  SubmitPromptMessage,
  PromptResultMessage,
  SubmitFakePromptMessage,
  SubmitGuessMessage,
  RoundCompleteMessage,
  GameOverMessage,
  ErrorMessage,
  PromptErrorMessage
} from '@/types';

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

describe('farsketchedReducer', () => {
  it('should return initial state when no state is provided', () => {
    const result = farsketchedReducer(undefined, createMessage<PingMessage>(MessageType.PING, {}));
    expect(result).toEqual(initialState);
  });

  it('should handle SET_PLAYER_INFO message', () => {
    const message = createMessage<SetPlayerInfoMessage>(MessageType.SET_PLAYER_INFO, {
      playerId: 'player1',
      name: 'Test Player',
      avatarUrl: 'https://example.com/avatar.png'
    });

    const result = farsketchedReducer(initialState, message);

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
      const result = farsketchedReducer(initialState, message);
      expect(result).toEqual(initialState);
    });
  });

  it('should handle lobby messages without state changes', () => {
    const lobbyMessages = [
      createMessage<PlayerJoinedMessage>(MessageType.PLAYER_JOINED, { player: { id: 'test', name: 'test', avatarUrl: 'test', connected: true, points: 0, lastSeen: Date.now() } }),
      createMessage<PlayerLeftMessage>(MessageType.PLAYER_LEFT, { playerId: 'test' }),
      createMessage<RequestStartGameMessage>(MessageType.REQUEST_START_GAME, { playerId: 'test' }),
      createMessage<CancelStartGameMessage>(MessageType.CANCEL_START_GAME, { playerId: 'test' })
    ];

    lobbyMessages.forEach(message => {
      const result = farsketchedReducer(initialState, message);
      expect(result).toEqual(initialState);
    });
  });

  it('should handle game flow messages without state changes', () => {
    const gameFlowMessages = [
      createMessage<GameStartingMessage>(MessageType.GAME_STARTING, { players: [], config: initialState.config }),
      createMessage<GameStateUpdateMessage>(MessageType.GAME_STATE_UPDATE, { stage: GameStage.LOBBY, currentRound: 0, activeImageIndex: 0, timerSeconds: 0 }),
      createMessage<SubmitPromptMessage>(MessageType.SUBMIT_PROMPT, { playerId: 'test', prompt: 'test' }),
      createMessage<PromptResultMessage>(MessageType.PROMPT_RESULT, { success: true, imageId: 'test', imageUrl: 'test' }),
      createMessage<SubmitFakePromptMessage>(MessageType.SUBMIT_FAKE_PROMPT, { playerId: 'test', imageId: 'test', fakePrompt: 'test' }),
      createMessage<SubmitGuessMessage>(MessageType.SUBMIT_GUESS, { playerId: 'test', imageId: 'test', promptId: 'test' }),
      createMessage<RoundCompleteMessage>(MessageType.ROUND_COMPLETE, { roundIndex: 0, scores: {} }),
      createMessage<GameOverMessage>(MessageType.GAME_OVER, { finalScores: {}, achievements: [] })
    ];

    gameFlowMessages.forEach(message => {
      const result = farsketchedReducer(initialState, message);
      expect(result).toEqual(initialState);
    });
  });

  it('should handle error messages without state changes', () => {
    const errorMessages = [
      createMessage<ErrorMessage>(MessageType.ERROR, { code: 'test', message: 'test' }),
      createMessage<PromptErrorMessage>(MessageType.PROMPT_ERROR, { playerId: 'test', prompt: 'test', errorCode: 'test', errorMessage: 'test' })
    ];

    errorMessages.forEach(message => {
      const result = farsketchedReducer(initialState, message);
      expect(result).toEqual(initialState);
    });
  });

  it('should handle unknown message types by returning current state', () => {
    const result = farsketchedReducer(initialState, createMessage<PingMessage>('UNKNOWN_TYPE' as MessageType, {}));
    expect(result).toEqual(initialState);
  });
}); 
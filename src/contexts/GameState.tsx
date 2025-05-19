// GameStateContext.tsx
import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { usePeer } from './PeerContext';
import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';

// Define game state message types to work with your existing system
export enum GameStateMessageType {
  FULL_STATE = 'GAME_FULL_STATE',
  PATCH = 'GAME_PATCH',
  REQUEST_FULL_STATE = 'GAME_REQUEST_FULL_STATE'
}

interface BaseGameStateMessage {
  type: GameStateMessageType;
  version: number;
  timestamp: number;
  messageId: string;
}

interface FullStateMessage<T> extends BaseGameStateMessage {
  type: GameStateMessageType.FULL_STATE;
  payload: T;
}

interface PatchStateMessage<T> extends BaseGameStateMessage {
  type: GameStateMessageType.PATCH;
  payload: Partial<T>;
}

interface RequestFullStateMessage extends BaseGameStateMessage {
  type: GameStateMessageType.REQUEST_FULL_STATE;
  payload: {};
}

type GameStateMessage<T> = FullStateMessage<T> | PatchStateMessage<T> | RequestFullStateMessage;

// Host Context
interface HostGameStateContextType<T> {
  state: T;
  updateState: (newState: T | ((currentState: T) => T)) => void;
  connectedClients: string[];
  broadcastFullState: () => void;
  version: number;
}

const HostGameStateContext = createContext<HostGameStateContextType<any> | null>(null);

interface HostGameStateProviderProps<T> {
  children: ReactNode;
  initialState: T;
  syncInterval?: number;
  debug?: boolean;
}

export function HostGameStateProvider<T extends object>({
  children,
  initialState,
  syncInterval = 50,
  debug = false
}: HostGameStateProviderProps<T>) {
  const { sendMessage, connectedPeers, messages } = usePeer<GameStateMessage<T>>();
  const [state, setState] = useState<T>(initialState);
  const [version, setVersion] = useState(0);
  const previousStateRef = useRef<T>(_.cloneDeep(initialState));
  
  // Log if debug is enabled
  const logDebug = (message: string, ...args: any[]) => {
    if (debug) {
      console.log(`[HostGameState] ${message}`, ...args);
    }
  };

  // Update state with new value or update function
  const updateState = (newState: T | ((currentState: T) => T)) => {
    setState((currentState) => {
      const nextState = typeof newState === 'function' 
        ? (newState as Function)(currentState)
        : newState;
      
      setVersion((v) => v + 1);
      return nextState;
    });
  };

  // Broadcast full state to all clients
  const broadcastFullState = () => {
    logDebug('Broadcasting full state to all clients');
    
    const fullStateMessage: GameStateMessage<T> = {
      type: GameStateMessageType.FULL_STATE,
      payload: state,
      version,
      timestamp: Date.now(),
      messageId: uuidv4()
    };
    
    sendMessage(fullStateMessage);
  };

  // Handle incoming messages
  useEffect(() => {
    messages.forEach(message => {
      try {
        if (message.type === GameStateMessageType.REQUEST_FULL_STATE) {
          logDebug('Received request for full state from client');
          broadcastFullState();
        }
      } catch (error) {
        // Not a JSON message or not relevant to game state
      }
    });
  }, [messages]);

  // Check for changes and send patches at regular intervals
  useEffect(() => {
    if (connectedPeers.length === 0) {
      return; // No clients connected, no need to send updates
    }
    
    const intervalId = setInterval(() => {
      // Find differences between current and previous state
      const changes = findStateChanges(previousStateRef.current, state);
      
      if (changes && Object.keys(changes).length > 0) {
        logDebug('State changed, sending patch:', changes);
        
        const patchMessage: GameStateMessage<Partial<T>> = {
          type: GameStateMessageType.PATCH,
          payload: changes,
          version,
          timestamp: Date.now(),
          messageId: uuidv4()
        };
        
        sendMessage(patchMessage);
        
        // Update previous state reference
        previousStateRef.current = _.cloneDeep(state);
      }
    }, syncInterval);
    
    return () => clearInterval(intervalId);
  }, [state, connectedPeers, version, syncInterval, sendMessage]);

  // Update previous state reference when state changes significantly
  useEffect(() => {
    previousStateRef.current = _.cloneDeep(state);
  }, []);

  const contextValue: HostGameStateContextType<T> = {
    state,
    updateState,
    connectedClients: connectedPeers,
    broadcastFullState,
    version
  };

  return (
    <HostGameStateContext.Provider value={contextValue}>
      {children}
    </HostGameStateContext.Provider>
  );
}

export function useHostGameState<T>() {
  const context = useContext(HostGameStateContext);
  if (!context) {
    throw new Error('useHostGameState must be used within a HostGameStateProvider');
  }
  return context as HostGameStateContextType<T>;
}

// Client Context
interface ClientGameStateContextType<T> {
  state: T;
  isReady: boolean;
  version: number;
  requestFullState: () => void;
  lastSyncTimestamp: number | null;
}

const ClientGameStateContext = createContext<ClientGameStateContextType<any> | null>(null);

interface ClientGameStateProviderProps<T> {
  children: ReactNode;
  initialState: T;
  debug?: boolean;
}

export function ClientGameStateProvider<T>({
  children,
  initialState,
  debug = false
}: ClientGameStateProviderProps<T>) {
  const { sendMessage, isConnected, messages } = usePeer<GameStateMessage<T>>();
  const [state, setState] = useState<T>(initialState);
  const [isReady, setIsReady] = useState(false);
  const [version, setVersion] = useState(0);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number | null>(null);
  const processedMessages = useRef<Set<string>>(new Set());

  // Log if debug is enabled
  const logDebug = (message: string, ...args: any[]) => {
    if (debug) {
      console.log(`[ClientGameState] ${message}`, ...args);
    }
  };

  // Request full state from host
  const requestFullState = () => {
    if (!isConnected) {
      logDebug('Cannot request full state: not connected to host');
      return;
    }
    
    logDebug('Requesting full state from host');
    
    const requestMessage: RequestFullStateMessage = {
      type: GameStateMessageType.REQUEST_FULL_STATE,
      payload: {},
      version: version,
      timestamp: Date.now(),
      messageId: uuidv4()
    };
    
    sendMessage(requestMessage);
  };

  // Process incoming game state messages
  useEffect(() => {
    // Process only unread messages
    messages.forEach(message => {
      try {
        // Skip messages we've already processed
        if (processedMessages.current.has(message.messageId)) {
          return;
        }
        
        // Handle game state messages
        if (message.type === GameStateMessageType.FULL_STATE) {
          logDebug('Received full state from host');
          
          setState(message.payload);
          setVersion(message.version);
          setLastSyncTimestamp(message.timestamp);
          setIsReady(true);
          processedMessages.current.add(message.messageId);
        } 
        else if (message.type === GameStateMessageType.PATCH) {
          logDebug('Received state patch from host', message.payload);
          
          setState(currentState => {
            return applyPatch(currentState, message.payload);
          });
          
          setVersion(message.version);
          setLastSyncTimestamp(message.timestamp);
          setIsReady(true);
          processedMessages.current.add(message.messageId);
        }
      } catch (error) {
        // Not a JSON message or not relevant to game state
      }
    });
  }, [messages]);

  // Request full state when first connected
  useEffect(() => {
    if (isConnected && !isReady) {
      requestFullState();
    }
  }, [isConnected, isReady]);

  const contextValue: ClientGameStateContextType<T> = {
    state,
    isReady,
    version,
    requestFullState,
    lastSyncTimestamp
  };

  return (
    <ClientGameStateContext.Provider value={contextValue}>
      {children}
    </ClientGameStateContext.Provider>
  );
}

export function useClientGameState<T>() {
  const context = useContext(ClientGameStateContext);
  if (!context) {
    throw new Error('useClientGameState must be used within a ClientGameStateProvider');
  }
  return context as ClientGameStateContextType<T>;
}

// Helper function to find deep changes between previous and current state
function findStateChanges<T>(previous: T, current: T): Partial<T> | null {
  // Handle cases where state is primitive or null
  if (!_.isObject(current) || !_.isObject(previous)) {
    return !_.isEqual(previous, current) ? current as Partial<T> : null;
  }
  
  // Calculate deep differences
  const diff = deepDiff(previous as object, current as object) as Partial<T>;
  return diff && Object.keys(diff).length > 0 ? diff : null;
}

// Helper function to calculate deep differences between objects
function deepDiff<T extends object>(oldObj: T, newObj: T): Partial<T> {
  // Start with an empty object to collect changes
  const result: Partial<T> = {};
  
  // Process additions and modifications
  Object.keys(newObj).forEach(key => {
    const typedKey = key as keyof T;
    const oldValue = oldObj[typedKey];
    const newValue = newObj[typedKey];
    
    // Skip if values are deeply equal
    if (_.isEqual(oldValue, newValue)) {
      return;
    }
    
    // Special case for binary data (likely blobs/images)
    // Just check equality and send reference if different
    if (oldValue instanceof Blob || newValue instanceof Blob ||
        (ArrayBuffer.isView(oldValue) || ArrayBuffer.isView(newValue))) {
      if (oldValue !== newValue) {
        result[typedKey] = newValue;
      }
      return;
    }
    
    // Recursively diff objects (but not arrays, which are replaced entirely)
    if (_.isPlainObject(oldValue) && _.isPlainObject(newValue)) {
      const nestedDiff = deepDiff(oldValue as object, newValue as object);
      if (Object.keys(nestedDiff).length > 0) {
        result[typedKey] = nestedDiff as any;
      }
    } else {
      // Direct value assignment for primitive types, arrays, or when old value didn't exist
      result[typedKey] = newValue;
    }
  });
  
  // Detect deletions - properties in old object that aren't in new object
  Object.keys(oldObj).forEach(key => {
    const typedKey = key as keyof T;
    if (!(typedKey in newObj) && result[typedKey] === undefined) {
      // Mark deleted properties with null to explicitly signal deletion
      result[typedKey] = null as any;
    }
  });
  
  return result;
}

function applyPatch<T>(currentState: T, patch: Partial<T>): T {
  // Create a shallow clone of the top level without cloning binary data
  // We suspect this might help performance
  const result = { ...currentState };
  
  // Apply each patch property
  Object.keys(patch).forEach(key => {
    const typedKey = key as keyof T;
    const patchValue = patch[typedKey];
    
    // Handle null values as deletions
    if (patchValue === null) {
      delete (result as any)[typedKey];
      return;
    }
    
    const currentValue = result[typedKey];
    
    // Special case for binary data - use direct reference assignment
    // This doesn't break things. I'm also not convinced it does anything given the same assignment
    // to non-plain-objects below.
    // if (patchValue instanceof Blob || 
    //     ArrayBuffer.isView(patchValue) || 
    //     (typeof patchValue === 'object' && patchValue !== null && 'byteLength' in patchValue)) {
    //   (result as any)[typedKey] = patchValue;
    //   return;
    // }
    
    // If both values are plain objects (not arrays), recursively merge
    if (_.isPlainObject(currentValue) && _.isPlainObject(patchValue)) {
      (result as any)[typedKey] = applyPatch(currentValue as any, patchValue as any);
    } else {
      (result as any)[typedKey] = patchValue;
    }
  });
  
  return result;
}
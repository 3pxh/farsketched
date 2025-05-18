// PeerContext.ts
import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import Peer, { DataConnection } from 'peerjs';

interface PeerContextType<T> {
  peer: Peer | null;
  peerId: string;
  connectedPeers: string[];
  messages: T[];
  isHost: boolean;
  isConnected: boolean;
  hostPeerId: string;
  setHostPeerId: (id: string) => void;
  connectToHost: () => void;
  sendMessage: (msg: T) => void;
  sendSelfMessage: (msg: T) => void;
  markRead: (msg: T) => void;
}

const PeerContext = createContext<PeerContextType<any>>({} as PeerContextType<any>);

interface PeerProviderProps {
  children: ReactNode;
  isHost: boolean;
  peerId?: string;
}

// TODO: Make this generic to a message type
export const PeerProvider = <T,>({ children, isHost, peerId: providedPeerId }: PeerProviderProps) => {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [peerId, setPeerId] = useState<string>(providedPeerId || "");
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  const [messages, setMessages] = useState<T[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [hostPeerId, setHostPeerId] = useState<string>("");
  const connections = useRef<Record<string, DataConnection>>({});

  const markRead = (msg: T) => {
    console.log('markRead:', msg);
    setMessages(prev => prev.filter(m => m !== msg));
  };

  const handleMessage = (msg: T) => {
    console.log('handleMessage:', msg);
    setMessages(prev => [...prev, msg]);
  };

  useEffect(() => {
    console.log(`Initializing peer...${providedPeerId ? ` with ID: ${providedPeerId}` : ''}`);
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('room');
    const storedPeerId = localStorage.getItem(`peer_${roomId}`);
    console.log(`Stored peer ID for room ${roomId}: ${storedPeerId}`);
    const options = {
      config: {
        iceServers: [
          {
            urls: "stun:stun.relay.metered.ca:80",
          },
          {
            urls: "turn:global.relay.metered.ca:80",
            username: "c84a0eb7ee05e24ac07ce5ca",
            credential: "QFdMnXTyxgWCH+Sf",
          },
          {
            urls: "turn:global.relay.metered.ca:80?transport=tcp",
            username: "c84a0eb7ee05e24ac07ce5ca",
            credential: "QFdMnXTyxgWCH+Sf",
          },
          {
            urls: "turn:global.relay.metered.ca:443",
            username: "c84a0eb7ee05e24ac07ce5ca",
            credential: "QFdMnXTyxgWCH+Sf",
          },
          {
            urls: "turns:global.relay.metered.ca:443?transport=tcp",
            username: "c84a0eb7ee05e24ac07ce5ca",
            credential: "QFdMnXTyxgWCH+Sf",
          },
        ],
      }
    }
    const newPeer = providedPeerId ? new Peer(providedPeerId, options) : (storedPeerId && !isHost) ? new Peer(storedPeerId, options) : new Peer(options);
    console.log("new peer", {id: newPeer.id, isHost, providedPeerId});
    newPeer.on('open', (id) => {
      setPeerId(id);
      if(!isHost && !storedPeerId) {
        localStorage.setItem(`peer_${roomId}`, id);
      }
    });

    newPeer.on('error', (err) => {
      console.error(`Peer error:`, err);
    });

    setPeer(newPeer);

    return () => {
      console.log(`Cleaning up peer...`);
      newPeer.destroy();
    };
  }, [isHost, providedPeerId]);

  useEffect(() => {
    if (!peer) {
      console.log(`No peer instance available`);
      return;
    }

    console.log(`Setting up connection handler...`);
    const handleConnection = (conn: DataConnection) => {
      console.log(`New connection request from:`, conn.peer);
      
      // Store the connection
      connections.current[conn.peer] = conn;
      
      // Set up data handler for this connection
      conn.on('data', (data) => {
        console.log(`Received data from ${conn.peer}:`, data);
        handleMessage(data as T);
      });

      conn.on('open', () => {
        console.log(`Connection opened to peer:`, conn.peer);
        setConnectedPeers((prev) => [...prev, conn.peer]);
        
        // If we're the host, establish a connection back to the client
        if (isHost) {
          console.log(`[Host] Establishing connection back to client:`, conn.peer);
          const hostConn = peer.connect(conn.peer);
          hostConn.on('open', () => {
            console.log(`[Host] Connection back to client established:`, conn.peer);
            connections.current[conn.peer] = hostConn;
            // Set up data handler for the host's connection
            hostConn.on('data', (data) => {
              console.log(`[Host] Received data from client ${conn.peer}:`, data);
              handleMessage(data as T);
            });
          });
        }
      });

      conn.on('close', () => {
        console.log(`Connection closed with peer:`, conn.peer);
        delete connections.current[conn.peer];
        setConnectedPeers((prev) => prev.filter((id) => id !== conn.peer));
      });

      conn.on('error', (err) => {
        console.error(`Connection error with ${conn.peer}:`, err);
      });
    };

    // Remove any existing connection handlers
    peer.off('connection');
    // Add the new connection handler
    peer.on('connection', handleConnection);
    console.log(`Connection handler setup complete`);

    return () => {
      console.log(`Removing connection handler...`);
      peer.off('connection', handleConnection);
    };
  }, [peer, isHost]);

  const connectToHost = () => {
    if (!peer || !hostPeerId) {
      console.log(`[Client] Cannot connect - peer: ${!!peer}, hostPeerId: ${hostPeerId}`);
      return;
    }

    console.log(`[Client] Attempting to connect to host:`, hostPeerId);
    const conn = peer.connect(hostPeerId);
    
    conn.on('open', () => {
      console.log(`[Client] Connected to host:`, hostPeerId);
      setIsConnected(true);
      connections.current[hostPeerId] = conn;
      // Set up data handler for client's connection
      conn.on('data', (data) => {
        console.log(`[Client] Received data from host:`, data);
        handleMessage(data as T);
      });
    });

    conn.on('error', (err) => {
      console.error(`[Client] Connection error:`, err);
      setIsConnected(false);
      delete connections.current[hostPeerId];
    });

    conn.on('close', () => {
      console.log(`[Client] Connection closed with host`);
      setIsConnected(false);
      delete connections.current[hostPeerId];
    });
  };

  const sendMessage = (msg: T) => {
    try {
      Object.values(connections.current).forEach((conn) => {
        if (conn.open) {
          console.log(`Sending to peer ${conn.peer}:`, msg);
          conn.send(msg);
        }
      });
    } catch (error) {
      console.error(`Error sending message:`, error);
    }
  };

  const sendSelfMessage = (msg: T) => {
    console.log(`Sending self message:`, msg);
    setMessages(prev => [...prev, msg]);
  };

  return (
    <PeerContext.Provider
      value={{
        peer,
        peerId,
        connectedPeers,
        messages,
        isHost,
        isConnected,
        hostPeerId,
        setHostPeerId,
        connectToHost,
        sendMessage,
        sendSelfMessage,
        markRead,
      }}
    >
      {children}
    </PeerContext.Provider>
  );
};

export const usePeer = <T,>() => {
  const context = useContext<PeerContextType<T>>(PeerContext);
  if (!context) {
    throw new Error('usePeer must be used within a PeerProvider');
  }
  return context;
};

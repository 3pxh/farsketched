// PeerContext.ts
import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { GameMessage, MessageType } from '../types';

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
}

interface PeerContextType {
  peer: Peer | null;
  peerId: string;
  connectedPeers: string[];
  messages: Message[];
  isHost: boolean;
  isConnected: boolean;
  hostPeerId: string;
  setHostPeerId: (id: string) => void;
  connectToHost: () => void;
  sendMessage: (content: string) => void;
}

const PeerContext = createContext<PeerContextType | null>(null);

interface PeerProviderProps {
  children: ReactNode;
  isHost: boolean;
}

export const PeerProvider = ({ children, isHost }: PeerProviderProps) => {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [peerId, setPeerId] = useState<string>("");
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [hostPeerId, setHostPeerId] = useState<string>("");
  const processedMessageIds = useRef<Set<string>>(new Set());
  const connections = useRef<Record<string, DataConnection>>({});

  const handleMessage = (data: any) => {
    try {
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
      
      if (parsedData.type === 'message') {
        const message = {
          ...parsedData.data,
          timestamp: new Date(parsedData.data.timestamp)
        };
        
        if (!processedMessageIds.current.has(message.id)) {
          processedMessageIds.current.add(message.id);
          setMessages((prev) => [...prev, message]);
        }
      } else if (Object.values(MessageType).includes(parsedData.type)) {
        // Handle game-specific messages
        const gameMessage = parsedData as GameMessage;
        if (!processedMessageIds.current.has(gameMessage.messageId)) {
          processedMessageIds.current.add(gameMessage.messageId);
          setMessages((prev) => [...prev, {
            id: gameMessage.messageId,
            sender: isHost ? 'Host' : 'Client',
            content: JSON.stringify(gameMessage),
            timestamp: new Date(gameMessage.timestamp)
          }]);
        }
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  };

  useEffect(() => {
    console.log(`[${isHost ? 'Host' : 'Client'}] Initializing peer...`);
    const newPeer = new Peer();
    
    newPeer.on('open', (id) => {
      console.log(`[${isHost ? 'Host' : 'Client'}] Peer initialized with ID:`, id);
      setPeerId(id);
    });

    newPeer.on('error', (err) => {
      console.error(`[${isHost ? 'Host' : 'Client'}] Peer error:`, err);
    });

    setPeer(newPeer);

    return () => {
      console.log(`[${isHost ? 'Host' : 'Client'}] Cleaning up peer...`);
      newPeer.destroy();
    };
  }, [isHost]);

  useEffect(() => {
    if (!peer) {
      console.log(`[${isHost ? 'Host' : 'Client'}] No peer instance available`);
      return;
    }

    console.log(`[${isHost ? 'Host' : 'Client'}] Setting up connection handler...`);
    const handleConnection = (conn: DataConnection) => {
      console.log(`[${isHost ? 'Host' : 'Client'}] New connection request from:`, conn.peer);
      
      // Store the connection
      connections.current[conn.peer] = conn;
      
      // Set up data handler for this connection
      conn.on('data', (data) => {
        console.log(`[${isHost ? 'Host' : 'Client'}] Received data from ${conn.peer}:`, data);
        handleMessage(data);
      });

      conn.on('open', () => {
        console.log(`[${isHost ? 'Host' : 'Client'}] Connection opened to peer:`, conn.peer);
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
              handleMessage(data);
            });
          });
        }
      });

      conn.on('close', () => {
        console.log(`[${isHost ? 'Host' : 'Client'}] Connection closed with peer:`, conn.peer);
        delete connections.current[conn.peer];
        setConnectedPeers((prev) => prev.filter((id) => id !== conn.peer));
      });

      conn.on('error', (err) => {
        console.error(`[${isHost ? 'Host' : 'Client'}] Connection error with ${conn.peer}:`, err);
      });
    };

    // Remove any existing connection handlers
    peer.off('connection');
    // Add the new connection handler
    peer.on('connection', handleConnection);
    console.log(`[${isHost ? 'Host' : 'Client'}] Connection handler setup complete`);

    return () => {
      console.log(`[${isHost ? 'Host' : 'Client'}] Removing connection handler...`);
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
        handleMessage(data);
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

  const sendMessage = (content: string) => {
    if (!content.trim() || !peer) {
      console.log(`[${isHost ? 'Host' : 'Client'}] Cannot send message - content: ${!!content}, peer: ${!!peer}`);
      return;
    }

    try {
      const parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
      console.log(`[${isHost ? 'Host' : 'Client'}] Sending message:`, parsedContent);
      
      // Send message through all established connections
      Object.values(connections.current).forEach((conn) => {
        if (conn.open) {
          console.log(`[${isHost ? 'Host' : 'Client'}] Sending to peer ${conn.peer}:`, parsedContent);
          conn.send(parsedContent);
        }
      });
    } catch (error) {
      console.error(`[${isHost ? 'Host' : 'Client'}] Error sending message:`, error);
    }
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
      }}
    >
      {children}
    </PeerContext.Provider>
  );
};

export const usePeer = () => {
  const context = useContext(PeerContext);
  if (!context) {
    throw new Error('usePeer must be used within a PeerProvider');
  }
  return context;
};

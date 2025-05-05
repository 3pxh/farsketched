// PeerContext.ts
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Peer, { DataConnection } from 'peerjs';

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
  const processedMessageIds = new Set<string>();

  useEffect(() => {
    const newPeer = new Peer();
    
    newPeer.on('open', (id) => {
      setPeerId(id);
      console.log(`${isHost ? 'Host' : 'Client'} peer ID:`, id);
    });

    newPeer.on('error', (err) => {
      console.error('Peer error:', err);
    });

    setPeer(newPeer);

    return () => {
      newPeer.destroy();
    };
  }, [isHost]);

  useEffect(() => {
    if (!peer) return;

    const handleConnection = (conn: DataConnection) => {
      conn.on('data', (data: any) => {
        if (data.type === 'message') {
          const message = {
            ...data.data,
            timestamp: new Date(data.data.timestamp)
          };
          
          if (!processedMessageIds.has(message.id)) {
            processedMessageIds.add(message.id);
            setMessages((prev) => [...prev, message]);
          }
        }
      });

      conn.on('open', () => {
        console.log('Connection opened to peer:', conn.peer);
        setConnectedPeers((prev) => [...prev, conn.peer]);
      });

      conn.on('close', () => {
        setConnectedPeers((prev) => prev.filter((id) => id !== conn.peer));
      });
    };

    peer.off('connection');
    peer.on('connection', handleConnection);

    return () => {
      peer.off('connection', handleConnection);
    };
  }, [peer]);

  const connectToHost = () => {
    if (!peer || !hostPeerId) return;

    const conn = peer.connect(hostPeerId);
    
    conn.on('open', () => {
      console.log('Connected to host');
      setIsConnected(true);
    });

    conn.on('error', (err) => {
      console.error('Connection error:', err);
      setIsConnected(false);
    });

    conn.on('close', () => {
      console.log('Connection closed');
      setIsConnected(false);
    });
  };

  const sendMessage = (content: string) => {
    if (!content.trim() || !peer) return;

    const messageId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const newMessage: Message = {
      id: messageId,
      sender: isHost ? 'Host' : 'Client',
      content,
      timestamp: new Date(),
    };

    processedMessageIds.add(messageId);
    setMessages((prev) => [...prev, newMessage]);

    connectedPeers.forEach((peerId) => {
      const conn = peer.connect(peerId);
      conn.on('open', () => {
        conn.send({
          type: 'message',
          data: newMessage,
        });
      });
    });
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

import { useState, useEffect, useRef } from 'react';
import Peer, { DataConnection } from 'peerjs';

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  peer: Peer;
  isHost: boolean;
}

export const ChatInterface = ({ peer, isHost }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const processedMessageIds = useRef<Set<string>>(new Set());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const messageId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const newMessage: Message = {
      id: messageId,
      sender: isHost ? 'Host' : 'Client',
      content: inputMessage,
      timestamp: new Date(),
    };

    processedMessageIds.current.add(messageId);
    setMessages((prev) => [...prev, newMessage]);
    setInputMessage('');

    // Broadcast message to all connected peers
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

  useEffect(() => {
    const handleConnection = (conn: DataConnection) => {
      conn.on('data', (data: any) => {
        if (data.type === 'message') {
          const message = {
            ...data.data,
            timestamp: new Date(data.data.timestamp)
          };
          
          // Only add message if we haven't processed it before
          if (!processedMessageIds.current.has(message.id)) {
            processedMessageIds.current.add(message.id);
            setMessages((prev) => [...prev, message]);
          }
        }
      });

      conn.on('open', () => {
        setConnectedPeers((prev) => [...prev, conn.peer]);
      });

      conn.on('close', () => {
        setConnectedPeers((prev) => prev.filter((id) => id !== conn.peer));
      });
    };

    // Clean up previous listeners
    peer.off('connection');
    // Add new listener
    peer.on('connection', handleConnection);

    return () => {
      peer.off('connection', handleConnection);
    };
  }, [peer]);

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.sender === (isHost ? 'Host' : 'Client') ? 'own' : 'other'}`}>
            <div className="message-sender">{message.sender}</div>
            <div className="message-content">{message.content}</div>
            <div className="message-timestamp">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type a message..."
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
}; 
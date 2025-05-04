import { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';

interface Message {
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      sender: isHost ? 'Host' : 'Client',
      content: inputMessage,
      timestamp: new Date(),
    };

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
    peer.on('connection', (conn) => {
      conn.on('data', (data: any) => {
        if (data.type === 'message') {
          const message = {
            ...data.data,
            timestamp: new Date(data.data.timestamp)
          };
          setMessages((prev) => [...prev, message]);
        }
      });

      conn.on('open', () => {
        setConnectedPeers((prev) => [...prev, conn.peer]);
      });

      conn.on('close', () => {
        setConnectedPeers((prev) => prev.filter((id) => id !== conn.peer));
      });
    });
  }, [peer]);

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.sender === (isHost ? 'Host' : 'Client') ? 'own' : 'other'}`}>
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
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type a message..."
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
}; 
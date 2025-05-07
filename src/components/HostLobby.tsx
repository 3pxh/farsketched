import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Player, GameConfig, MessageType, GameMessage } from '../games/farsketched/types';
import { usePeer } from '../contexts/PeerContext';
import './HostLobby.css';

interface HostLobbyProps {
  gameConfig: GameConfig;
  players: Player[];
}

export const HostLobby = ({ gameConfig, players }: HostLobbyProps) => {
  const { peerId, sendMessage } = usePeer();
  const [joinUrl, setJoinUrl] = useState<string>('');
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);

  useEffect(() => {
    // Generate the join URL with the peer ID as room code
    const url = new URL('http://localhost:8000/clientindex.html');
    url.searchParams.set('roomCode', peerId);
    setJoinUrl(url.toString());

    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      setSpeechSynthesis(window.speechSynthesis);
    }
  }, [peerId]);

  useEffect(() => {
    // Handle incoming messages from clients
    const handleMessage = (data: GameMessage) => {
      if (data.type === MessageType.SET_PLAYER_INFO) {
        // Notify all clients about the new player
        const playerJoinedMessage: GameMessage = {
          type: MessageType.PLAYER_JOINED,
          player: {
            id: data.playerId,
            name: data.name,
            avatarUrl: data.avatarUrl,
            connected: true,
            points: 0,
            lastSeen: Date.now()
          },
          timestamp: Date.now(),
          messageId: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
        };
        sendMessage(JSON.stringify(playerJoinedMessage));

        // Speak welcome message
        if (speechSynthesis) {
          const utterance = new SpeechSynthesisUtterance(
            `Welcome ${data.name}! ${players.length + 1} players in the room.`
          );
          speechSynthesis.speak(utterance);
        }
      }
    };

    // Set up message handler
    const messageHandler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as GameMessage;
        handleMessage(data);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    // Add event listener for messages
    window.addEventListener('message', messageHandler);

    return () => {
      window.removeEventListener('message', messageHandler);
    };
  }, [sendMessage, speechSynthesis, players.length]);

  return (
    <div className="host-lobby">
      <div className="lobby-content">
        <div className="players-section">
          <h2>Players ({players.length}/{gameConfig.maxPlayers})</h2>
          <div className="player-list">
            {players.map((player) => (
              <div key={player.id} className="player-item">
                <img src={player.avatarUrl} alt={player.name} className="player-avatar" />
                <span className="player-name">{player.connected ? player.name : (<s>{player.name}</s>)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="qr-section">
          <h2>Scan to Join</h2>
          <div className="qr-container">
            <QRCodeSVG
              value={joinUrl}
              size={256}
              level="H"
              marginSize={4}
            />
          </div>
          <div className="join-url">
            <button onClick={() => navigator.clipboard.writeText(joinUrl)}>
              Copy Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 

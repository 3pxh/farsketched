import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Player, GameConfig, MessageType, GameMessage } from '../types';
import { usePeer } from '../contexts/PeerContext';

interface LobbyScreenProps {
  gameConfig: GameConfig;
  onStartGame: () => void;
}

export const LobbyScreen = ({ gameConfig, onStartGame }: LobbyScreenProps) => {
  const { peerId, connectedPeers, sendMessage } = usePeer();
  const [players, setPlayers] = useState<Player[]>([]);
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
        const newPlayer: Player = {
          id: data.playerId,
          name: data.name,
          avatarUrl: data.avatarUrl,
          connected: true,
          points: 0,
          lastSeen: Date.now()
        };
        setPlayers(prev => [...prev, newPlayer]);
        
        // Notify all clients about the new player
        const playerJoinedMessage: GameMessage = {
          type: MessageType.PLAYER_JOINED,
          player: newPlayer,
          timestamp: Date.now(),
          messageId: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
        };
        sendMessage(JSON.stringify(playerJoinedMessage));

        // Speak welcome message
        if (speechSynthesis) {
          const utterance = new SpeechSynthesisUtterance(
            `Welcome ${newPlayer.name}! ${players.length + 1} players in the room.`
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

  // Update players when connectedPeers changes
  useEffect(() => {
    // Remove players who are no longer connected
    setPlayers(prev => prev.filter(player => connectedPeers.includes(player.id)));
  }, [connectedPeers]);

  const canStartGame = players.length >= gameConfig.minPlayers && players.length <= gameConfig.maxPlayers;

  return (
    <div className="lobby-screen">
      <div className="lobby-header">
        <h1>Farsketched</h1>
        <div className="room-code">Room Code: {peerId}</div>
      </div>

      <div className="lobby-content">
        <div className="qr-section">
          <h2>Scan to Join</h2>
          <div className="qr-container">
            <QRCodeSVG
              value={joinUrl}
              size={256}
              level="H"
              includeMargin={true}
            />
          </div>
          <div className="join-url">
            <input
              type="text"
              value={joinUrl}
              readOnly
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button onClick={() => navigator.clipboard.writeText(joinUrl)}>
              Copy Link
            </button>
          </div>
        </div>

        <div className="players-section">
          <h2>Players ({players.length}/{gameConfig.maxPlayers})</h2>
          <div className="player-list">
            {players.map((player) => (
              <div key={player.id} className="player-item">
                <img src={player.avatarUrl} alt={player.name} className="player-avatar" />
                <span className="player-name">{player.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="lobby-footer">
        <button
          className="start-game-button"
          onClick={onStartGame}
          disabled={!canStartGame}
        >
          Start Game
        </button>
        {!canStartGame && (
          <div className="player-count-warning">
            {players.length < gameConfig.minPlayers
              ? `Need ${gameConfig.minPlayers - players.length} more players to start`
              : `Too many players (max ${gameConfig.maxPlayers})`}
          </div>
        )}
      </div>
    </div>
  );
}; 
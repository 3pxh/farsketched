import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Player, GameConfig } from '@/games/farsketched/types';
import { usePeer } from '@/contexts/PeerContext';
import '@/games/farsketched/HostLobby.css';

interface HostLobbyProps {
  gameConfig: GameConfig;
  players: Player[];
}

export const HostLobby = ({ gameConfig, players }: HostLobbyProps) => {
  const { peerId } = usePeer();
  const [joinUrl, setJoinUrl] = useState<string>('');

  useEffect(() => {
    if (peerId) {
      const url = new URL('http://localhost:8000/clientindex.html');
      url.searchParams.set('roomCode', peerId);
      setJoinUrl(url.toString());
    }
  }, [peerId]);

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
          {joinUrl.length === 0 ? <></> : <>
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
          </>}
        </div>
      </div>
    </div>
  );
}; 

import { useState } from 'react';
import { usePeer } from '../contexts/PeerContext';
import { MessageType, GameMessage } from '../types';

export const PlayerSetup = () => {
  const { peerId, sendMessage } = usePeer();
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('https://api.dicebear.com/7.x/avataaars/svg?seed=default');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const message: GameMessage = {
      type: MessageType.SET_PLAYER_INFO,
      playerId: peerId,
      name: name.trim(),
      avatarUrl,
      timestamp: Date.now(),
      messageId: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    };

    sendMessage(JSON.stringify(message));
    setIsSubmitted(true);
  };

  const generateRandomAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    setAvatarUrl(`https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`);
  };

  if (isSubmitted) {
    return (
      <div className="player-setup">
        <h2>Welcome, {name}!</h2>
        <p>Waiting for the host to start the game...</p>
      </div>
    );
  }

  return (
    <div className="player-setup">
      <h2>Join the Game</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Your Name</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            required
            maxLength={20}
          />
        </div>
        
        <div className="form-group">
          <label>Your Avatar</label>
          <div className="avatar-preview">
            <img src={avatarUrl} alt="Your avatar" />
            <button type="button" onClick={generateRandomAvatar}>
              Randomize Avatar
            </button>
          </div>
        </div>

        <button type="submit" disabled={!name.trim()}>
          Join Game
        </button>
      </form>
    </div>
  );
}; 
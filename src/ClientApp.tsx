import { useState, useEffect } from 'react';
import "./App.css";
import { PeerProvider } from '@/contexts/PeerContext';
import { usePeer } from '@/contexts/PeerContext';
import { Client } from '@/games/farsketched/Client';
import { AudioProvider } from './contexts/AudioProvider';

function ClientContent() {
  const { isConnected, setHostPeerId, connectToHost, peerId } = usePeer();
  const [hasAttemptedConnection, setHasAttemptedConnection] = useState(false);

  useEffect(() => {
    // Get roomCode from URL
    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get('roomCode');
    
    if (roomCode && peerId && !isConnected && !hasAttemptedConnection) {
      console.log('Setting host peer ID to:', roomCode);
      setHostPeerId(roomCode);
      setHasAttemptedConnection(true);
    }
  }, [setHostPeerId, isConnected, hasAttemptedConnection, peerId]);

  // Separate effect for connecting after hostPeerId is set
  useEffect(() => {
    if (hasAttemptedConnection && !isConnected) {
      console.log('Attempting to connect to host...');
      connectToHost();
    }
  }, [hasAttemptedConnection, isConnected, connectToHost]);

  return (
    <main className="container">
      <h1>Farsketched</h1>
      <div className="connection-status">
        {isConnected ? (
          <div>Connected to host</div>
        ) : (
          <div>Connecting to host...</div>
        )}
      </div>
      <Client />
    </main>
  );
}

function ClientApp() {
  return (
    <PeerProvider isHost={false}>
      <AudioProvider>
        <ClientContent />
      </AudioProvider>
    </PeerProvider>
  );
}

export default ClientApp;


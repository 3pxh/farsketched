import { useState, useEffect } from "react";
import Peer from "peerjs";
import { ChatInterface } from "./components/ChatInterface";
import "./App.css";

function ClientApp() {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [peerId, setPeerId] = useState<string>("");
  const [hostPeerId, setHostPeerId] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize PeerJS
    const newPeer = new Peer();
    
    newPeer.on('open', (id) => {
      setPeerId(id);
      console.log('Client peer ID:', id);
    });

    newPeer.on('error', (err) => {
      console.error('Peer error:', err);
    });

    setPeer(newPeer);

    return () => {
      newPeer.destroy();
    };
  }, []);

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

  return (
    <main className="container">
      <h1>Client Chat Room</h1>
      <div className="peer-id">
        Your Peer ID: {peerId}
      </div>
      {!isConnected ? (
        <div className="connection-form">
          <input
            type="text"
            value={hostPeerId}
            onChange={(e) => setHostPeerId(e.target.value)}
            placeholder="Enter host's Peer ID"
          />
          <button onClick={connectToHost}>Connect to Host</button>
        </div>
      ) : (
        <div className="connection-status">
          Connected to host: {hostPeerId}
        </div>
      )}
      {peer && isConnected && (
        <ChatInterface peer={peer} isHost={false} />
      )}
    </main>
  );
}

export default ClientApp;

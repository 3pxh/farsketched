import { useState, useEffect } from "react";
import Peer from "peerjs";
import { ChatInterface } from "./components/ChatInterface";
import "./App.css";

function App() {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [peerId, setPeerId] = useState<string>("");

  useEffect(() => {
    // Initialize PeerJS
    const newPeer = new Peer();
    
    newPeer.on('open', (id) => {
      setPeerId(id);
      console.log('Host peer ID:', id);
    });

    newPeer.on('error', (err) => {
      console.error('Peer error:', err);
    });

    setPeer(newPeer);

    return () => {
      newPeer.destroy();
    };
  }, []);

  return (
    <main className="container">
      <h1>Host Chat Room</h1>
      <div className="peer-id">
        Your Peer ID: {peerId}
      </div>
      {peer && (
        <ChatInterface peer={peer} isHost={true} />
      )}
    </main>
  );
}

export default App;

import { useState, useEffect } from "react";
import Peer from "peerjs";
import { ChatInterface } from "./components/ChatInterface";
import "./App.css";
import { TestSetting } from './components/TestSetting';
import { initializeDatabase } from './database';

function App() {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [peerId, setPeerId] = useState<string>("");
  const [dbInitialized, setDbInitialized] = useState(false);

  useEffect(() => {
    // Initialize database
    const initDb = async () => {
      try {
        await initializeDatabase();
        setDbInitialized(true);
      } catch (error) {
        console.error('Error initializing database:', error);
      }
    };
    initDb();

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

  if (!dbInitialized) {
    return <div className="container">Initializing database...</div>;
  }

  return (
    <div className="container">
      <h1>Farsketched</h1>
      <TestSetting />
      <main className="container">
        <h1>Host Chat Room</h1>
        <div className="peer-id">
          Your Peer ID: {peerId}
        </div>
        {peer && (
          <ChatInterface peer={peer} isHost={true} />
        )}
      </main>
    </div>
  );
}

export default App;

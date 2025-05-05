import { useState, useEffect } from "react";
import { ChatInterface } from "./components/ChatInterface";
import "./App.css";
import { TestSetting } from './components/TestSetting';
import { initializeDatabase } from './database';
import { PeerProvider } from './contexts/PeerContext';
import { usePeer } from './contexts/PeerContext';

function HostInfo() {
  const { peerId } = usePeer();
  return (
    <div className="peer-id">
      Your Peer ID: {peerId}
    </div>
  );
}

function App() {
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
  }, []);

  if (!dbInitialized) {
    return <div className="container">Initializing database...</div>;
  }

  return (
    <PeerProvider isHost={true}>
      <div className="container">
        <h1>Farsketched</h1>
        <TestSetting />
        <main className="container">
          <h1>Host Chat Room</h1>
          <HostInfo />
          <ChatInterface />
        </main>
      </div>
    </PeerProvider>
  );
}

export default App;

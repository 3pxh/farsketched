import { useState, useEffect } from "react";
import "./App.css";
import { initializeDatabase } from './database';
import { PeerProvider } from './contexts/PeerContext';
import { usePeer } from './contexts/PeerContext';
import { GameConfig } from './types';
import { Game } from './components/Game';

const defaultGameConfig: GameConfig = {
  maxPlayers: 10,
  minPlayers: 3,
  roundCount: 3,
  promptTimerSeconds: 45,
  foolingTimerSeconds: 45,
  guessingTimerSeconds: 20,
  scoringDisplaySeconds: 10,
  apiProvider: 'openai',
  apiKey: '',
  roomCode: ''
};

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
        <Game gameConfig={defaultGameConfig} />
      </div>
    </PeerProvider>
  );
}

export default App;

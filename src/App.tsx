import { useState, useEffect } from "react";
import "./App.css";
import { initializeDatabase } from './database';
import { PeerProvider } from './contexts/PeerContext';
import { GameConfig } from './types';
import { Game } from './components/Game';
import { Settings } from './components/Settings';

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
  const [showSettings, setShowSettings] = useState(false);
  const [gameConfig, setGameConfig] = useState<GameConfig>(defaultGameConfig);

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

  const handleSaveSettings = (newConfig: GameConfig) => {
    setGameConfig(newConfig);
    // Here you might want to save the config to localStorage or your database
  };

  if (!dbInitialized) {
    return <div className="container">Initializing database...</div>;
  }

  return (
    <PeerProvider isHost={true}>
      <div className="container">
        <button 
          className="settings-gear" 
          onClick={() => setShowSettings(true)}
          aria-label="Settings"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
          </svg>
        </button>
        <Game gameConfig={gameConfig} />
        {showSettings && (
          <Settings
            gameConfig={gameConfig}
            onSave={handleSaveSettings}
            onClose={() => setShowSettings(false)}
          />
        )}
      </div>
    </PeerProvider>
  );
}

export default App;

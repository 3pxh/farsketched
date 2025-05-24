import { createContext, useContext, useState, ReactNode } from 'react';
import { Game } from '@/types/games';

interface GameContextType {
  selectedGame: Game | null;
  setGame: (game: Game) => void;
  clearGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  const setGame = (game: Game) => {
    setSelectedGame(game);
  };

  const clearGame = () => {
    setSelectedGame(null);
  };

  return (
    <GameContext.Provider value={{ selectedGame, setGame, clearGame }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
} 
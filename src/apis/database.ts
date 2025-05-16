import Database from '@tauri-apps/plugin-sql';

// Initialize the database and create tables if they don't exist
export async function initializeDatabase() {
  const db = await Database.load('sqlite:farsketched.db');
  
  // Create settings table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL
    )
  `);

  // Create games table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      start_time DATETIME NOT NULL,
      end_time DATETIME,
      players_count INTEGER NOT NULL,
      winner_id TEXT,
      winner_name TEXT
    )
  `);

  // Create game_rounds table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS game_rounds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      round_number INTEGER NOT NULL,
      image_prompt TEXT NOT NULL,
      image_url TEXT,
      correct_guesses INTEGER DEFAULT 0,
      fooled_players INTEGER DEFAULT 0,
      FOREIGN KEY (game_id) REFERENCES games(id)
    )
  `);

  return db;
}

// Settings operations
export async function getSetting(key: string): Promise<string | null> {
  const db = await Database.load('sqlite:farsketched.db');
  const result = await db.select<{ value: string }[]>(
    'SELECT value FROM settings WHERE key = ?',
    [key]
  );
  return result.length > 0 ? result[0].value : null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await Database.load('sqlite:farsketched.db');
  await db.execute(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    [key, value]
  );
}

// Game history operations
export async function saveGame(game: {
  startTime: Date;
  endTime?: Date;
  playersCount: number;
  winnerId?: string;
  winnerName?: string;
}): Promise<number> {
  const db = await Database.load('sqlite:farsketched.db');
  const result = await db.execute(
    'INSERT INTO games (start_time, end_time, players_count, winner_id, winner_name) VALUES (?, ?, ?, ?, ?)',
    [
      game.startTime.toISOString(),
      game.endTime?.toISOString() || null,
      game.playersCount,
      game.winnerId || null,
      game.winnerName || null
    ]
  );
  return result.lastInsertId || 0;
}

export async function saveGameRound(round: {
  gameId: number;
  roundNumber: number;
  imagePrompt: string;
  imageUrl: string;
  correctGuesses: number;
  fooledPlayers: number;
}): Promise<void> {
  const db = await Database.load('sqlite:farsketched.db');
  await db.execute(
    'INSERT INTO game_rounds (game_id, round_number, image_prompt, image_url, correct_guesses, fooled_players) VALUES (?, ?, ?, ?, ?, ?)',
    [
      round.gameId,
      round.roundNumber,
      round.imagePrompt,
      round.imageUrl,
      round.correctGuesses,
      round.fooledPlayers
    ]
  );
}

export async function getGameHistory(limit: number = 10): Promise<any[]> {
  const db = await Database.load('sqlite:farsketched.db');
  return await db.select(
    'SELECT * FROM games ORDER BY start_time DESC LIMIT ?',
    [limit]
  );
} 
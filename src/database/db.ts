import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../../data.db');
const db: Database.Database = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
export function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      discord_id TEXT PRIMARY KEY,
      steam_id TEXT NOT NULL,
      last_updated INTEGER NOT NULL,
      is_private INTEGER NOT NULL DEFAULT 0
    )
  `);

  // Games table
  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      app_id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      icon_url TEXT
    )
  `);

  // User games relationship table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_games (
      discord_id TEXT NOT NULL,
      app_id INTEGER NOT NULL,
      playtime INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (discord_id, app_id),
      FOREIGN KEY (discord_id) REFERENCES users(discord_id) ON DELETE CASCADE,
      FOREIGN KEY (app_id) REFERENCES games(app_id) ON DELETE CASCADE
    )
  `);

  // Create indexes for faster queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_user_games_discord
    ON user_games(discord_id)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_user_games_app
    ON user_games(app_id)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_games_name
    ON games(name)
  `);

  console.log('Database initialized successfully');
}

export default db;

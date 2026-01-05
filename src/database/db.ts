import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Use a more reliable database path that works in Docker
const dbDir = process.env.DB_PATH || path.join(__dirname, '../../');
const dbPath = path.join(dbDir, 'data.db');

// Ensure directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

console.log(`[Database] Using database path: ${dbPath}`);
const db: Database.Database = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
export function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      discord_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      steam_id TEXT NOT NULL,
      last_updated INTEGER NOT NULL,
      is_private INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (discord_id, guild_id)
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
      guild_id TEXT NOT NULL,
      app_id INTEGER NOT NULL,
      playtime INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (discord_id, guild_id, app_id),
      FOREIGN KEY (discord_id, guild_id) REFERENCES users(discord_id, guild_id) ON DELETE CASCADE,
      FOREIGN KEY (app_id) REFERENCES games(app_id) ON DELETE CASCADE
    )
  `);

  // Create indexes for faster queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_user_games_discord_guild
    ON user_games(discord_id, guild_id)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_user_games_guild
    ON user_games(guild_id)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_user_games_app
    ON user_games(app_id)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_games_name
    ON games(name)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_guild
    ON users(guild_id)
  `);

  console.log('Database initialized successfully');
}

export default db;

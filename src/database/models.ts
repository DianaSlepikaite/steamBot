import db from './db';

export interface User {
  discord_id: string;
  guild_id: string;
  steam_id: string;
  last_updated: number;
  is_private: boolean;
}

export interface Game {
  app_id: number;
  name: string;
  icon_url?: string;
}

export interface UserGame {
  discord_id: string;
  guild_id: string;
  app_id: number;
  playtime: number;
}

// User operations
export const UserModel = {
  create(discordId: string, guildId: string, steamId: string): void {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO users (discord_id, guild_id, steam_id, last_updated, is_private)
      VALUES (?, ?, ?, ?, 0)
    `);
    stmt.run(discordId, guildId, steamId, Date.now());
  },

  get(discordId: string, guildId: string): User | undefined {
    const stmt = db.prepare('SELECT * FROM users WHERE discord_id = ? AND guild_id = ?');
    const row = stmt.get(discordId, guildId) as any;
    if (!row) return undefined;
    return {
      ...row,
      is_private: Boolean(row.is_private)
    };
  },

  updatePrivacy(discordId: string, guildId: string, isPrivate: boolean): void {
    const stmt = db.prepare(`
      UPDATE users SET is_private = ?, last_updated = ?
      WHERE discord_id = ? AND guild_id = ?
    `);
    stmt.run(isPrivate ? 1 : 0, Date.now(), discordId, guildId);
  },

  updateLastFetched(discordId: string, guildId: string): void {
    const stmt = db.prepare(`
      UPDATE users SET last_updated = ?
      WHERE discord_id = ? AND guild_id = ?
    `);
    stmt.run(Date.now(), discordId, guildId);
  },

  delete(discordId: string, guildId: string): void {
    const stmt = db.prepare('DELETE FROM users WHERE discord_id = ? AND guild_id = ?');
    stmt.run(discordId, guildId);
  }
};

// Game operations
export const GameModel = {
  createOrUpdate(appId: number, name: string, iconUrl?: string): void {
    // Use INSERT OR IGNORE to avoid cascading deletes, then UPDATE if needed
    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO games (app_id, name, icon_url)
      VALUES (?, ?, ?)
    `);
    insertStmt.run(appId, name, iconUrl);

    // Update the game info if it already existed
    const updateStmt = db.prepare(`
      UPDATE games SET name = ?, icon_url = ?
      WHERE app_id = ?
    `);
    updateStmt.run(name, iconUrl, appId);
  },

  get(appId: number): Game | undefined {
    const stmt = db.prepare('SELECT * FROM games WHERE app_id = ?');
    return stmt.get(appId) as Game | undefined;
  },

  searchByName(query: string): Game[] {
    const stmt = db.prepare(`
      SELECT * FROM games
      WHERE name LIKE ?
      ORDER BY name
      LIMIT 10
    `);
    return stmt.all(`%${query}%`) as Game[];
  }
};

// UserGame operations
export const UserGameModel = {
  create(discordId: string, guildId: string, appId: number, playtime: number): void {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO user_games (discord_id, guild_id, app_id, playtime)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(discordId, guildId, appId, playtime);
  },

  deleteAllForUser(discordId: string, guildId: string): void {
    const stmt = db.prepare('DELETE FROM user_games WHERE discord_id = ? AND guild_id = ?');
    stmt.run(discordId, guildId);
  },

  getUserGames(discordId: string, guildId: string): (Game & { playtime: number })[] {
    const stmt = db.prepare(`
      SELECT g.*, ug.playtime
      FROM user_games ug
      JOIN games g ON ug.app_id = g.app_id
      WHERE ug.discord_id = ? AND ug.guild_id = ?
      ORDER BY g.name
    `);
    return stmt.all(discordId, guildId) as (Game & { playtime: number })[];
  },

  getUsersWithGame(guildId: string, appId: number): string[] {
    const stmt = db.prepare(`
      SELECT discord_id FROM user_games
      WHERE guild_id = ? AND app_id = ?
    `);
    return (stmt.all(guildId, appId) as { discord_id: string }[]).map(row => row.discord_id);
  },

  userHasGame(discordId: string, guildId: string, appId: number): boolean {
    const stmt = db.prepare(`
      SELECT 1 FROM user_games
      WHERE discord_id = ? AND guild_id = ? AND app_id = ?
    `);
    return stmt.get(discordId, guildId, appId) !== undefined;
  },

  getCommonGames(guildId: string, discordIds: string[]): Game[] {
    if (discordIds.length === 0) return [];

    const placeholders = discordIds.map(() => '?').join(',');
    const stmt = db.prepare(`
      SELECT g.*, COUNT(DISTINCT ug.discord_id) as user_count
      FROM games g
      JOIN user_games ug ON g.app_id = ug.app_id
      WHERE ug.guild_id = ? AND ug.discord_id IN (${placeholders})
      GROUP BY g.app_id
      HAVING user_count = ?
      ORDER BY g.name
    `);

    return stmt.all(guildId, ...discordIds, discordIds.length) as Game[];
  },

  getUserGameCount(discordId: string, guildId: string): number {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count FROM user_games
      WHERE discord_id = ? AND guild_id = ?
    `);
    return (stmt.get(discordId, guildId) as { count: number }).count;
  }
};

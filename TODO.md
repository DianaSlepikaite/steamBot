# TODO - Security & Improvement Tasks

This document tracks security improvements and feature enhancements for the Steam Discord Bot.

## 🔴 High Priority (Security & Compliance)

### 1. Add User Verification
**Status**: Pending
**Priority**: Critical
**Location**: `src/commands/linksteam.ts`

**Issue**: Currently, any user can link ANY Steam profile to their Discord account, not just their own. This allows:
- User impersonation
- Privacy violations (fetching someone else's public game library without consent)
- Potential abuse

**Solution**: Implement one of the following:
- Steam OpenID verification flow
- Require users to verify ownership via Steam profile description
- Add a warning message that users acknowledge they own the profile

---

### 2. Implement Rate Limiting
**Status**: Pending
**Priority**: Critical
**Location**: `src/commands/linksteam.ts`, `src/commands/refresh.ts`

**Issue**: No rate limiting on Steam API calls. Users can spam commands and:
- Exhaust Steam API quota
- Risk API key suspension
- Cause performance issues

**Solution**:
- Add per-user cooldowns (e.g., 1 minute between `/refresh` calls)
- Track last command execution time in database or in-memory cache
- Return friendly error messages when cooldown is active

**Implementation Ideas**:
```typescript
// In database/models.ts
const cooldowns = new Map<string, number>();

function checkCooldown(userId: string, guildId: string, seconds: number): boolean {
  const key = `${userId}:${guildId}`;
  const now = Date.now();
  const lastCall = cooldowns.get(key) || 0;

  if (now - lastCall < seconds * 1000) {
    return false; // Still on cooldown
  }

  cooldowns.set(key, now);
  return true; // Cooldown passed
}
```

---

### 3. Sanitize Error Messages
**Status**: Pending
**Priority**: High
**Location**: All command files

**Issue**: Error messages expose internal implementation details:
```typescript
content: `An error occurred: ${error.message}`
```

This can reveal:
- Stack traces
- Database structure
- API implementation details
- File paths

**Solution**:
- Show generic errors to users
- Log detailed errors server-side only
- Create user-friendly error messages

**Example Fix**:
```typescript
catch (error: any) {
  console.error('[linksteam] Detailed error:', error);
  return interaction.editReply({
    content: 'An unexpected error occurred. Please try again later.'
  });
}
```

---

### 4. Add `/unlink` Command (GDPR Compliance)
**Status**: Pending
**Priority**: High
**Compliance**: GDPR "Right to be Forgotten"

**Issue**: Users cannot delete their data from the bot. This violates GDPR in EU/UK.

**Solution**:
- Create new `/unlink` command
- Delete user data from `users` and `user_games` tables
- Confirm deletion to user
- Consider keeping audit log (anonymized)

**Implementation**:
```typescript
// src/commands/unlink.ts
export async function execute(interaction: ChatInputCommandInteraction) {
  const userId = interaction.user.id;
  const guildId = interaction.guildId!;

  UserModel.delete(userId, guildId);
  // Cascade will handle user_games deletion

  return interaction.reply({
    content: 'Your Steam account has been unlinked and all data deleted.',
    ephemeral: true
  });
}
```

---

## 🟡 Medium Priority (Security Hardening)

### 5. Remove API Key Logging
**Status**: Pending
**Priority**: Medium
**Location**: `src/utils/steam.ts:100`

**Issue**: Logs first 8 characters of Steam API key.

**Current Code**:
```typescript
console.log(`[Steam API] Using API key: ${process.env.STEAM_API_KEY.substring(0, 8)}...`);
```

**Fix**:
```typescript
console.log(`[Steam API] Using API key: ${process.env.STEAM_API_KEY ? 'PRESENT' : 'NOT SET'}`);
```

---

### 6. Add Database Transactions
**Status**: Pending
**Priority**: Medium
**Location**: `src/utils/steam.ts:170-184`

**Issue**: When fetching games:
1. Old games are deleted
2. New games are inserted
3. If step 2 fails, user has no games (data loss)

**Solution**: Wrap in transaction
```typescript
db.transaction(() => {
  UserGameModel.deleteAllForUser(discordId, guildId);

  for (const game of games) {
    GameModel.createOrUpdate(game.appid, game.name, iconUrl);
    UserGameModel.create(discordId, guildId, game.appid, game.playtime_forever || 0);
  }
})();
```

---

### 7. Implement Guild Cleanup on Bot Removal
**Status**: Pending
**Priority**: Medium
**Location**: `src/index.ts`

**Issue**: When bot leaves/is kicked from a guild, data remains in database forever.

**Solution**: Listen to `Events.GuildDelete`
```typescript
client.on(Events.GuildDelete, (guild) => {
  console.log(`Left guild: ${guild.id}`);

  // Delete all users and games for this guild
  db.prepare('DELETE FROM users WHERE guild_id = ?').run(guild.id);
  // user_games will cascade delete due to foreign key
});
```

---

### 8. Add Production vs Development Log Levels
**Status**: Pending
**Priority**: Medium
**Location**: Throughout codebase

**Issue**: Excessive logging in production:
- User IDs, Guild IDs, Steam IDs
- API responses
- Stack traces

**Solution**: Use environment-based logging
```typescript
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'; // debug, info, warn, error

function debug(message: string, ...args: any[]) {
  if (LOG_LEVEL === 'debug') {
    console.log(message, ...args);
  }
}

function info(message: string, ...args: any[]) {
  if (['debug', 'info'].includes(LOG_LEVEL)) {
    console.log(message, ...args);
  }
}
```

Or use a proper logging library like `winston` or `pino`.

---

## 🟢 Low Priority (Quality of Life)

### 9. Escape LIKE Wildcards in Search
**Status**: Pending
**Priority**: Low
**Location**: `src/database/models.ts:96`

**Issue**: User searches with `%` or `_` behave as wildcards.

**Current**:
```typescript
return stmt.all(`%${query}%`) as Game[];
```

**Fix**:
```typescript
// Escape special LIKE characters
const escapedQuery = query.replace(/[%_]/g, '\\$&');
return stmt.all(`%${escapedQuery}%`) as Game[];
```

---

### 10. Add Stale Data Cleanup Jobs
**Status**: Pending
**Priority**: Low

**Issue**: Database accumulates:
- Inactive users
- Old games no longer owned
- Stale privacy flags

**Solution**: Periodic cleanup task
```typescript
// Run daily or weekly
function cleanupStaleData() {
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

  // Delete users inactive for 30+ days
  db.prepare('DELETE FROM users WHERE last_updated < ?').run(thirtyDaysAgo);

  // Clean orphaned games (no longer owned by anyone)
  db.prepare(`
    DELETE FROM games
    WHERE app_id NOT IN (SELECT DISTINCT app_id FROM user_games)
  `).run();
}
```

---

## Progress Tracking

- [ ] 1. Add user verification
- [ ] 2. Implement rate limiting
- [ ] 3. Sanitize error messages
- [ ] 4. Add /unlink command
- [ ] 5. Remove API key logging
- [ ] 6. Add database transactions
- [ ] 7. Implement guild cleanup
- [ ] 8. Add log levels
- [ ] 9. Escape LIKE wildcards
- [ ] 10. Add cleanup jobs

---


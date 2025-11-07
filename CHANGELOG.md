# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **New `/commonvc` command** - Find common multiplayer games for all users currently in a voice channel
  - Automatically detects all users in the specified voice channel
  - Filters out bots automatically
  - Shows the same multiplayer filtering and player counts as `/common`
- **Multiplayer filtering for `/common` command** - Now only shows games that support multiplayer/co-op
- **Player count display** - Shows maximum players supported for each multiplayer game with compact notation (e.g., "[4P Co-op]", "[32P]")
- **Privacy protection for cached data** - Users can make their profile private after linking without losing their stored games
  - Bot preserves existing game data when refresh fails due to privacy
  - Shows warning message when using cached data
  - Informs users how to update their library with new purchases
- Increased `/common` command to support up to **10 users** (previously 5)
- Steam Store API integration to detect multiplayer games and extract player counts
- Hardcoded database of ~50 popular games with known player counts
- Web scraping fallback from Steam community hub for player count detection
- Caching system for multiplayer status to improve performance
- Progress indicator when checking multiplayer games
- `GuildVoiceStates` intent for voice channel member detection

### Fixed
- **Critical Bug**: Fixed game ownership data being wiped when users refresh their libraries
  - Changed `INSERT OR REPLACE` to `INSERT OR IGNORE` + `UPDATE` to prevent cascading deletes
  - Multiple users can now link their Steam accounts without corrupting each other's data
- Fixed Steam API integration issues with the `steamapi` npm package
  - Replaced `steamapi` library calls with direct Steam Web API `fetch()` requests
  - Resolves "Unauthorized" errors when fetching games
  - Fixes vanity URL resolution failures ("Bad Request" errors)
- Added comprehensive error logging for debugging Steam API issues

### Changed
- Removed dependency on `steamapi` npm package
- Now using direct Steam Web API calls for all Steam operations
- Improved error messages and logging throughout the application

### Added
- Detailed console logging for Steam API operations
- Better error handling for private profiles and API failures

## [1.0.0] - 2025-11-05

### Added
- Initial release
- `/linksteam` command to link Discord accounts to Steam profiles
- `/whohas` command to find who owns a specific game
- `/has` command to check if a user owns a game
- `/common` command to find games owned by multiple users (2-5 users)
- `/refresh` command to update user's game library
- SQLite database for storing user and game data
- Privacy detection for Steam profiles
- Docker support for deployment
- Comprehensive documentation (README, QUICKSTART, DEPLOYMENT guides)

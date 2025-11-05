# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

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

# Discord Steam Game Sync Bot

A Discord bot that helps server members discover which games they own in common by syncing Steam libraries.

## Features

- **Link Steam Accounts** - Connect Discord profiles to Steam accounts
- **Find Common Games** - Discover games owned by multiple users
- **Check Ownership** - See who owns specific games
- **Privacy Handling** - Detects and notifies about private Steam profiles
- **Auto-sync** - Fetches and caches game libraries for fast queries

## Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/linksteam <steam_url_or_id>` | Link your Steam account | `/linksteam https://steamcommunity.com/id/yourname` |
| `/whohas <game>` | List users who own a game | `/whohas Counter-Strike` |
| `/has <@user> <game>` | Check if a user owns a game | `/has @friend Portal 2` |
| `/common <@user1> <@user2> ...` | Show shared games (2-5 users) | `/common @friend1 @friend2` |
| `/refresh` | Update your game library | `/refresh` |

## Setup

### Prerequisites

1. **Node.js** v18 or higher
2. **Discord Bot Token** from [Discord Developer Portal](https://discord.com/developers/applications)
3. **Steam Web API Key** from [Steam Community](https://steamcommunity.com/dev/apikey)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd steamBot
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Configure your `.env` file:
```env
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_application_client_id_here
STEAM_API_KEY=your_steam_api_key_here
```

### Getting Your API Keys

#### Discord Bot Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to the "Bot" section and click "Add Bot"
4. Under "Token", click "Reset Token" and copy it to `DISCORD_TOKEN` in `.env`
5. Go to "OAuth2" → "General" and copy the "Client ID" to `DISCORD_CLIENT_ID` in `.env`
6. Go to "OAuth2" → "URL Generator":
   - Select scopes: `bot`, `applications.commands`
   - Select bot permissions: `Send Messages`, `Use Slash Commands`, `Embed Links`
   - Copy the generated URL and use it to invite the bot to your server

#### Steam API Key

1. Go to [Steam Web API Key](https://steamcommunity.com/dev/apikey)
2. Enter a domain name (can be anything, e.g., `localhost`)
3. Copy the generated key to `STEAM_API_KEY` in `.env`

### Running the Bot

1. Build the TypeScript code:
```bash
npm run build
```

2. Register slash commands with Discord:
```bash
npm run register
```

3. Start the bot:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Usage Guide

### For Users

1. **Link Your Steam Account**
   - Use `/linksteam` with your Steam profile URL, custom URL, or SteamID64
   - Example: `/linksteam https://steamcommunity.com/id/yourname`
   - Example: `/linksteam yourname`
   - Example: `/linksteam 76561198012345678`

2. **Make Sure Your Profile is Public**
   - The bot requires your "Game Details" to be public
   - Go to [Steam Privacy Settings](https://steamcommunity.com/my/edit/settings)
   - Set "Game details" to "Public"
   - Run `/refresh` to update your library

3. **Find Games with Friends**
   - Use `/common @friend1 @friend2` to see shared games
   - Use `/whohas Portal 2` to see who owns a specific game
   - Use `/has @friend Minecraft` to check if someone owns a game

### Privacy Notes

- The bot only stores SteamID, Discord ID, and game ownership data
- No personal information or passwords are collected
- Users can unlink by removing their data (contact bot admin)
- Steam profiles must have public "Game Details" for the bot to work

## Project Structure

```
steamBot/
├── src/
│   ├── commands/          # Command handlers
│   │   ├── linksteam.ts
│   │   ├── whohas.ts
│   │   ├── has.ts
│   │   ├── common.ts
│   │   └── refresh.ts
│   ├── database/          # Database setup and models
│   │   ├── db.ts
│   │   └── models.ts
│   ├── utils/             # Utility functions
│   │   └── steam.ts
│   ├── index.ts           # Main bot entry point
│   └── register-commands.ts
├── .env.example           # Environment template
├── package.json
└── tsconfig.json
```

## Database Schema

The bot uses SQLite with three tables:

- **users**: Discord ID, Steam ID, last update time, privacy status
- **games**: App ID, game name, icon URL
- **user_games**: Many-to-many relationship with playtime

## Deployment

### Docker

A Dockerfile is provided for easy deployment:

```bash
docker build -t steam-bot .
docker run -d --env-file .env steam-bot
```

### Railway / VPS

1. Build the project: `npm run build`
2. Set environment variables on your platform
3. Run: `npm start`
4. Make sure to run `npm run register` once to register commands

## Troubleshooting

### "Profile is Private" Error
- Go to [Steam Privacy Settings](https://steamcommunity.com/my/edit/settings)
- Set "Game details" to "Public"
- Run `/refresh`

### Commands Not Showing Up
- Make sure you ran `npm run register`
- Wait a few minutes for Discord to sync commands
- Try kicking and re-inviting the bot

### Bot Not Responding
- Check that the bot is online in your server
- Verify all environment variables are set correctly
- Check the console for error messages

## Future Enhancements

- [ ] Track recently played games
- [ ] Show playtime statistics
- [ ] Detect co-op/multiplayer games
- [ ] Multi-platform support (Epic, Xbox, PSN)
- [ ] Web dashboard for stats visualization
- [ ] Automatic periodic library updates
- [ ] Role assignment based on game ownership

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

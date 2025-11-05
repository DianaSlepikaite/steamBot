# Quick Start Guide

Get your Discord Steam Bot up and running in 5 minutes!

## Step 1: Get Your API Keys

### Discord Bot Token
1. Go to https://discord.com/developers/applications
2. Click "New Application" → Name it → Click "Bot" → "Add Bot"
3. Copy the token (you'll need this for `.env`)
4. Copy the Application ID from "General Information" (this is your CLIENT_ID)

### Steam API Key
1. Go to https://steamcommunity.com/dev/apikey
2. Enter any domain name (e.g., `localhost`)
3. Copy the key

## Step 2: Configure the Bot

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and add your keys:
```env
DISCORD_TOKEN=paste_your_bot_token_here
DISCORD_CLIENT_ID=paste_your_client_id_here
STEAM_API_KEY=paste_your_steam_key_here
```

## Step 3: Install & Run

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Register commands with Discord
npm run register

# Start the bot
npm start
```

## Step 4: Invite the Bot

1. Go back to https://discord.com/developers/applications
2. Select your application → "OAuth2" → "URL Generator"
3. Select scopes: `bot` and `applications.commands`
4. Select permissions: `Send Messages`, `Use Slash Commands`, `Embed Links`
5. Copy the generated URL and open it in your browser
6. Select your server and authorize

## Step 5: Test It Out!

In your Discord server, try these commands:

1. Link your Steam account:
```
/linksteam https://steamcommunity.com/id/yourname
```

2. Check who has a game:
```
/whohas Portal 2
```

3. Find games in common:
```
/common @friend1 @friend2
```

## Troubleshooting

**Commands not showing up?**
- Wait a few minutes for Discord to sync
- Make sure you ran `npm run register`
- Try re-inviting the bot

**"Profile is private" error?**
- Go to https://steamcommunity.com/my/edit/settings
- Set "Game details" to "Public"
- Run `/refresh` in Discord

**Bot offline?**
- Check console for errors
- Verify your `.env` file has correct tokens
- Make sure `npm start` is still running

## Development Mode

For auto-reload during development:
```bash
npm run dev
```

## Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check out the project structure in `src/`
- Consider hosting on Railway, Heroku, or a VPS for 24/7 uptime

## Need Help?

- Check the [README.md](README.md) troubleshooting section
- Review error messages in the console
- Make sure all dependencies are installed
- Verify your Node.js version is 18+

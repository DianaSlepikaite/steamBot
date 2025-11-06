# Deploy to Fly.io (Free)

Complete guide to deploy your Discord Steam Bot to Fly.io for free.

## Prerequisites

- Fly.io account (free)
- Your Discord and Steam API keys ready
- Bot running locally and tested

## Step 1: Install Fly CLI

```bash
# On macOS:
brew install flyctl

# On Linux/WSL:
curl -L https://fly.io/install.sh | sh

# On Windows:
pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

## Step 2: Authenticate

```bash
# Sign up for new account:
fly auth signup

# Or login if you already have account:
fly auth login
```

This will open a browser to authenticate.

## Step 3: Launch Your App

From your project directory:

```bash
cd /path/to/steamBot

# Launch the app (this will create the app on Fly.io)
fly launch
```

**When prompted:**
- App name: Press Enter to use `steambot-discord` (or choose your own)
- Region: Choose closest to you (e.g., `sjc` for San Jose, `iad` for Virginia)
- **Database**: **NO** - we're using SQLite, not PostgreSQL
- **Deploy now**: **NO** - we need to add secrets first

## Step 4: Add Your Secrets (Environment Variables)

```bash
# Add Discord token
fly secrets set DISCORD_TOKEN=your_discord_bot_token_here

# Add Discord client ID
fly secrets set DISCORD_CLIENT_ID=your_discord_client_id_here

# Add Steam API key
fly secrets set STEAM_API_KEY=your_steam_api_key_here
```

**Important:** Replace the values with your actual keys from `.env`!

## Step 5: Deploy!

```bash
fly deploy
```

This will:
1. Build your Docker image
2. Upload it to Fly.io
3. Start your bot

## Step 6: Check Status

```bash
# Check if bot is running
fly status

# View logs (keep this open to see bot activity)
fly logs
```

You should see:
```
Logged in as YourBotName#1234
Bot is ready and serving X guild(s)
```

## Step 7: Register Commands (One Time Only)

Your bot is now running on Fly.io, but you still need to register Discord commands **once**.

Run this **locally** (not on Fly.io):

```bash
npm run register
```

This registers the slash commands with Discord. You only need to do this once.

## ✅ Done!

Your bot is now running 24/7 on Fly.io for free!

---

## Managing Your Bot

### View Logs
```bash
fly logs

# Or follow logs in real-time:
fly logs -f
```

### Restart Bot
```bash
fly apps restart steambot-discord
```

### Check Status
```bash
fly status
```

### Update Bot (After Code Changes)

```bash
# 1. Commit your changes to git
git add .
git commit -m "Update bot"
git push

# 2. Deploy updated version
fly deploy
```

### Scale (if needed)
```bash
# Check current resources
fly scale show

# Bot should run fine on smallest instance (free tier)
fly scale vm shared-cpu-1x --memory 256
```

---

## Troubleshooting

### Bot shows as offline
```bash
# Check logs for errors
fly logs

# Common issues:
# 1. Wrong Discord token → Update: fly secrets set DISCORD_TOKEN=...
# 2. Wrong Steam API key → Update: fly secrets set STEAM_API_KEY=...
# 3. App crashed → Check logs for error message
```

### Commands not showing in Discord
```bash
# Did you register commands?
npm run register

# Wait 5-10 minutes for Discord to sync
# Try kicking and re-inviting the bot
```

### "Unauthorized" errors
```bash
# Check your Steam API key is correct
fly secrets list  # Shows which secrets are set (but not values)

# Update if needed:
fly secrets set STEAM_API_KEY=your_correct_key
```

### Database issues
The database (`data.db`) is stored in the container and will be **lost** when you deploy updates.

For persistent data, you have two options:

**Option 1: Use Fly Volumes (Recommended)**
```bash
# Create a volume for persistent storage
fly volumes create steambot_data --size 1

# Update fly.toml to mount the volume
# Add this to fly.toml:
# [mounts]
#   source = "steambot_data"
#   destination = "/app"
```

**Option 2: Use external database (PostgreSQL)**
- Requires code changes to use PostgreSQL instead of SQLite
- More complex but better for production

For now, users will need to `/linksteam` again after each deploy. This is fine for testing!

---

## Free Tier Limits

Fly.io free tier includes:
- 3 shared-cpu-1x VMs with 256MB RAM
- 3GB persistent volume storage
- 160GB outbound data transfer

**Your bot uses:**
- 1 VM (✅ well within limits)
- ~50-100MB RAM (✅ fits easily)
- Minimal bandwidth (✅ no problem)

Should run **free forever**! 🎉

---

## Cost Monitoring

Check your usage:
```bash
fly dashboard
# Opens browser to show usage and billing
```

As long as you stay within free tier limits, you'll never be charged!

---

## Uninstalling / Deleting

If you want to remove the bot from Fly.io:

```bash
# Delete the app
fly apps destroy steambot-discord

# This will:
# - Stop the bot
# - Delete all data
# - Free up your resources
```

---

## Next Steps

- Add more users to your Discord server
- Have them use `/linksteam`
- Use `/common`, `/whohas`, `/has` commands
- Check logs periodically: `fly logs`

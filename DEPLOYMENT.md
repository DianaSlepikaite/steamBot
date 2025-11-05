# Deployment Guide

## Local Testing (Start Here)

### 1. Set Up Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your keys:
# - DISCORD_TOKEN (from Discord Developer Portal → Bot → Token)
# - DISCORD_CLIENT_ID (from Discord Developer Portal → OAuth2 → Client ID)
# - STEAM_API_KEY (from https://steamcommunity.com/dev/apikey)
nano .env  # or use your preferred editor
```

### 2. Verify Setup

```bash
npm run check
```

This will verify:
- ✅ Node.js version
- ✅ Dependencies installed
- ✅ .env file exists
- ✅ All required tokens configured

### 3. Build and Register Commands

```bash
# Build TypeScript
npm run build

# Register slash commands with Discord (only need to do once)
npm run register
```

### 4. Start the Bot

```bash
npm start
```

Keep this terminal window open. The bot is now running!

### 5. Invite Bot to Your Server

1. Go to: https://discord.com/developers/applications
2. Select your application
3. Go to: **OAuth2** → **URL Generator**
4. Select scopes:
   - ✅ `bot`
   - ✅ `applications.commands`
5. Select bot permissions:
   - ✅ `Send Messages`
   - ✅ `Embed Links`
   - ✅ `Use Application Commands`
6. Copy the generated URL
7. Open URL in browser → Select your server → Authorize

### 6. Test Commands

In your Discord server:
```
/linksteam https://steamcommunity.com/id/yoursteam
/whohas Portal 2
/common @friend1 @friend2
```

---

## Production Deployment

Once local testing works, choose a deployment method:

---

## Option 1: VPS Deployment (DigitalOcean, Linode, AWS EC2, etc.)

### Prerequisites
- A VPS with Ubuntu/Debian
- SSH access
- Domain (optional)

### Steps

```bash
# 1. SSH into your VPS
ssh user@your-server-ip

# 2. Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Clone your repository
git clone https://github.com/YOUR_USERNAME/steamBot.git
cd steamBot

# 4. Install dependencies
npm install

# 5. Create .env file
nano .env
# Add your tokens, then save (Ctrl+X, Y, Enter)

# 6. Build and register
npm run build
npm run register

# 7. Install PM2 for process management
sudo npm install -g pm2

# 8. Start bot with PM2
pm2 start dist/index.js --name steam-bot

# 9. Make it auto-start on reboot
pm2 startup
pm2 save
```

### PM2 Commands

```bash
pm2 status          # Check bot status
pm2 logs steam-bot  # View logs
pm2 restart steam-bot  # Restart bot
pm2 stop steam-bot  # Stop bot
pm2 delete steam-bot  # Remove from PM2
```

---

## Option 2: Docker Deployment

### Prerequisites
- Docker and Docker Compose installed

### Steps

```bash
# 1. Clone repository
git clone https://github.com/YOUR_USERNAME/steamBot.git
cd steamBot

# 2. Create .env file
cp .env.example .env
nano .env  # Add your tokens

# 3. Build and start
docker-compose up -d

# 4. View logs
docker-compose logs -f

# 5. Register commands (first time only)
docker-compose exec bot npm run register
```

### Docker Commands

```bash
docker-compose up -d      # Start bot
docker-compose down       # Stop bot
docker-compose logs -f    # View logs
docker-compose restart    # Restart bot
docker-compose pull       # Update image
```

---

## Option 3: Railway Deployment (Easiest Cloud Option)

### Prerequisites
- GitHub account
- Railway account (free tier available)

### Steps

1. **Push code to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/steamBot.git
git push -u origin main
```

2. **Deploy on Railway**
   - Go to https://railway.app
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your steamBot repository
   - Railway will auto-detect and deploy

3. **Add Environment Variables**
   - In Railway dashboard, go to your project
   - Click "Variables" tab
   - Add:
     - `DISCORD_TOKEN`
     - `DISCORD_CLIENT_ID`
     - `STEAM_API_KEY`

4. **Register Commands** (do this locally once)
```bash
# On your local machine:
npm run register
```

5. **Bot is now live!** Railway will keep it running 24/7

### Railway Tips
- Free tier: 500 hours/month (enough for 1 bot)
- Auto-deploys on git push
- View logs in Railway dashboard
- No server management needed

---

## Option 4: Heroku Deployment

### Prerequisites
- Heroku account
- Heroku CLI installed

### Steps

```bash
# 1. Login to Heroku
heroku login

# 2. Create app
heroku create your-steam-bot-name

# 3. Set environment variables
heroku config:set DISCORD_TOKEN=your_token
heroku config:set DISCORD_CLIENT_ID=your_client_id
heroku config:set STEAM_API_KEY=your_steam_key

# 4. Create Procfile
echo "worker: npm start" > Procfile

# 5. Deploy
git add .
git commit -m "Add Procfile"
git push heroku main

# 6. Scale worker
heroku ps:scale worker=1

# 7. Register commands (locally)
npm run register
```

---

## Option 5: Keep Running Locally

If you just want to test or run it on your personal computer:

```bash
# Start bot
npm start

# Or for development with auto-reload:
npm run dev
```

**Note**: Bot only runs while your computer is on and terminal is open.

---

## Troubleshooting

### Commands not showing in Discord
- Wait 5-10 minutes after running `npm run register`
- Make sure bot has `applications.commands` scope
- Try kicking and re-inviting the bot
- Run `npm run register` again

### Bot offline
- Check logs for errors
- Verify .env tokens are correct
- Ensure bot has internet connection
- Check Discord API status: https://discordstatus.com

### "Profile is Private" error
Users need to:
1. Go to https://steamcommunity.com/my/edit/settings
2. Set "Game details" to **Public**
3. Run `/refresh` in Discord

### Build errors
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Database errors
```bash
# Reset database (WARNING: deletes all data)
rm -f data.db
# Bot will recreate on next start
```

---

## Updating the Bot

### Pull latest changes
```bash
git pull origin main
npm install
npm run build
# Restart bot (method depends on deployment)
```

### VPS (PM2)
```bash
pm2 restart steam-bot
```

### Docker
```bash
docker-compose down
docker-compose up -d --build
```

### Railway/Heroku
Just push to GitHub - auto-deploys!

---

## Monitoring

### Check if bot is online
- Look for green status in Discord server member list
- Try a slash command

### View logs

**Local/PM2:**
```bash
pm2 logs steam-bot
```

**Docker:**
```bash
docker-compose logs -f
```

**Railway:**
- View in Railway dashboard

---

## Security Best Practices

1. **Never commit .env file**
   - Already in .gitignore
   - Use environment variables in production

2. **Rotate tokens if exposed**
   - Discord: Reset bot token
   - Steam: Generate new API key

3. **Restrict bot permissions**
   - Only give necessary permissions
   - Don't make it admin

4. **Regular updates**
   - Keep dependencies updated
   - Monitor for security issues

---

## Support

- Check logs first
- Review README.md
- Verify environment variables
- Test locally before deploying

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run check` | Verify setup |
| `npm run build` | Compile TypeScript |
| `npm run register` | Register slash commands |
| `npm start` | Start bot (production) |
| `npm run dev` | Start bot (development) |

---

## Next Steps After Deployment

1. ✅ Bot is online
2. ✅ Commands registered
3. ✅ Bot invited to server
4. 🎮 Share with server members!
5. 📊 Monitor logs for issues
6. 🔄 Gather feedback
7. 🚀 Add new features (see CONTRIBUTING.md)

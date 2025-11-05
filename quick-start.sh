#!/bin/bash

# Quick Start Script for Discord Steam Bot
# This script helps you get the bot running quickly

set -e

echo "🤖 Discord Steam Bot - Quick Start"
echo "=================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created!"
    echo ""
    echo "⚠️  IMPORTANT: You need to edit .env and add your API keys:"
    echo "   - DISCORD_TOKEN (from Discord Developer Portal)"
    echo "   - DISCORD_CLIENT_ID (from Discord Developer Portal)"
    echo "   - STEAM_API_KEY (from Steam Web API)"
    echo ""
    echo "Open .env in your editor and add your keys, then run this script again."
    exit 0
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed!"
    echo ""
fi

# Check setup
echo "🔍 Checking setup..."
npm run check || {
    echo ""
    echo "❌ Setup check failed. Please fix the issues above."
    exit 1
}

echo ""
echo "🔨 Building project..."
npm run build

echo ""
echo "📝 Registering Discord commands..."
npm run register

echo ""
echo "=================================="
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Invite the bot to your server using the OAuth2 URL Generator"
echo "2. Run: npm start"
echo "3. Test commands in Discord: /linksteam, /whohas, etc."
echo ""
echo "For detailed deployment instructions, see DEPLOYMENT.md"
echo "=================================="

#!/usr/bin/env node

/**
 * Setup verification script
 * Checks that all required environment variables and dependencies are configured
 */

require('dotenv').config();

const checks = {
  nodeVersion: false,
  dependencies: false,
  envFile: false,
  discordToken: false,
  discordClientId: false,
  steamApiKey: false,
  build: false
};

console.log('\n🔍 Checking Discord Steam Bot Setup...\n');

// Check Node.js version
const nodeVersion = process.version.match(/^v(\d+)\./);
if (nodeVersion && parseInt(nodeVersion[1]) >= 18) {
  console.log('✅ Node.js version:', process.version, '(OK)');
  checks.nodeVersion = true;
} else {
  console.log('❌ Node.js version:', process.version, '(Need v18 or higher)');
}

// Check if node_modules exists
const fs = require('fs');
if (fs.existsSync('./node_modules')) {
  console.log('✅ Dependencies installed');
  checks.dependencies = true;
} else {
  console.log('❌ Dependencies not installed. Run: npm install');
}

// Check if .env file exists
if (fs.existsSync('./.env')) {
  console.log('✅ .env file exists');
  checks.envFile = true;
} else {
  console.log('❌ .env file not found. Run: cp .env.example .env');
}

// Check environment variables
if (process.env.DISCORD_TOKEN && process.env.DISCORD_TOKEN !== 'your_discord_bot_token_here') {
  console.log('✅ DISCORD_TOKEN configured');
  checks.discordToken = true;
} else {
  console.log('❌ DISCORD_TOKEN not configured in .env');
}

if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_ID !== 'your_discord_application_client_id_here') {
  console.log('✅ DISCORD_CLIENT_ID configured');
  checks.discordClientId = true;
} else {
  console.log('❌ DISCORD_CLIENT_ID not configured in .env');
}

if (process.env.STEAM_API_KEY && process.env.STEAM_API_KEY !== 'your_steam_api_key_here') {
  console.log('✅ STEAM_API_KEY configured');
  checks.steamApiKey = true;
} else {
  console.log('❌ STEAM_API_KEY not configured in .env');
}

// Check if build exists
if (fs.existsSync('./dist/index.js')) {
  console.log('✅ Project built (dist/ folder exists)');
  checks.build = true;
} else {
  console.log('⚠️  Project not built yet. Run: npm run build');
}

// Summary
console.log('\n' + '='.repeat(50));
const allChecks = Object.values(checks).every(v => v);
const criticalChecks = checks.nodeVersion && checks.dependencies &&
                       checks.envFile && checks.discordToken &&
                       checks.discordClientId && checks.steamApiKey;

if (allChecks) {
  console.log('✅ All checks passed! Ready to run.');
  console.log('\nNext steps:');
  console.log('  1. npm run register  (register commands)');
  console.log('  2. npm start         (start the bot)');
} else if (criticalChecks && !checks.build) {
  console.log('⚠️  Configuration complete, but not built yet.');
  console.log('\nNext steps:');
  console.log('  1. npm run build     (compile TypeScript)');
  console.log('  2. npm run register  (register commands)');
  console.log('  3. npm start         (start the bot)');
} else {
  console.log('❌ Setup incomplete. Please fix the issues above.');
  console.log('\nQuick setup:');
  console.log('  1. Install Node.js 18+');
  console.log('  2. npm install');
  console.log('  3. cp .env.example .env');
  console.log('  4. Edit .env with your API keys');
  console.log('  5. npm run build');
  console.log('  6. npm run register');
  console.log('  7. npm start');
}
console.log('='.repeat(50) + '\n');

process.exit(allChecks ? 0 : 1);

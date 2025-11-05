import { Client, GatewayIntentBits, Events, Interaction } from 'discord.js';
import dotenv from 'dotenv';
import { initializeDatabase } from './database/db';
import * as linksteamCmd from './commands/linksteam';
import * as whohasCmd from './commands/whohas';
import * as hasCmd from './commands/has';
import * as commonCmd from './commands/common';
import * as refreshCmd from './commands/refresh';

// Load environment variables
dotenv.config();

// Validate required environment variables
if (!process.env.DISCORD_TOKEN) {
  console.error('Error: DISCORD_TOKEN is not set in .env file');
  process.exit(1);
}

if (!process.env.DISCORD_CLIENT_ID) {
  console.error('Error: DISCORD_CLIENT_ID is not set in .env file');
  process.exit(1);
}

if (!process.env.STEAM_API_KEY) {
  console.error('Error: STEAM_API_KEY is not set in .env file');
  process.exit(1);
}

// Initialize database
initializeDatabase();

// Create Discord client
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// Command handlers map
const commands = new Map([
  ['linksteam', linksteamCmd],
  ['whohas', whohasCmd],
  ['has', hasCmd],
  ['common', commonCmd],
  ['refresh', refreshCmd],
]);

// Ready event
client.once(Events.ClientReady, (c) => {
  console.log(`Logged in as ${c.user.tag}`);
  console.log(`Bot is ready and serving ${c.guilds.cache.size} guild(s)`);
});

// Interaction handler
client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);

  if (!command) {
    console.warn(`Unknown command: ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}:`, error);

    const errorMessage = {
      content: 'There was an error executing this command.',
      ephemeral: true,
    };

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
});

// Error handling
client.on(Events.Error, (error) => {
  console.error('Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);

console.log('Starting Discord Steam Bot...');

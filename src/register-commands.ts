import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const commands = [
  new SlashCommandBuilder()
    .setName('linksteam')
    .setDescription('Link your Steam account to your Discord profile')
    .addStringOption(option =>
      option
        .setName('steam_url_or_id')
        .setDescription('Your Steam profile URL, custom URL, or SteamID64')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('whohas')
    .setDescription('Find who owns a specific game')
    .addStringOption(option =>
      option
        .setName('game')
        .setDescription('Name of the game to search for')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('has')
    .setDescription('Check if a user owns a specific game')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The Discord user to check')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('game')
        .setDescription('Name of the game to search for')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('common')
    .setDescription('Show games owned by all mentioned users')
    .addUserOption(option =>
      option
        .setName('user1')
        .setDescription('First user')
        .setRequired(true)
    )
    .addUserOption(option =>
      option
        .setName('user2')
        .setDescription('Second user')
        .setRequired(false)
    )
    .addUserOption(option =>
      option
        .setName('user3')
        .setDescription('Third user')
        .setRequired(false)
    )
    .addUserOption(option =>
      option
        .setName('user4')
        .setDescription('Fourth user')
        .setRequired(false)
    )
    .addUserOption(option =>
      option
        .setName('user5')
        .setDescription('Fifth user')
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName('refresh')
    .setDescription('Refresh your Steam game library'),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!),
      { body: commands }
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
})();

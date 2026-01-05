import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { UserModel } from '../database/models';
import { resolveSteamId, fetchAndStoreGames } from '../utils/steam';

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const steamInput = interaction.options.getString('steam_url_or_id', true);
  const discordId = interaction.user.id;
  const guildId = interaction.guildId;

  if (!guildId) {
    return interaction.editReply({
      content: 'This command can only be used in a server.',
    });
  }

  try {
    console.log(`[linksteam] User ${discordId} in guild ${guildId} attempting to link: ${steamInput}`);

    // Resolve Steam ID
    const steamId = await resolveSteamId(steamInput);
    console.log(`[linksteam] Resolved Steam ID: ${steamId}`);

    if (!steamId) {
      console.log(`[linksteam] Failed to resolve Steam ID for input: ${steamInput}`);
      return interaction.editReply({
        content: 'Could not resolve Steam ID. Please provide a valid Steam profile URL, custom URL, or SteamID64.',
      });
    }

    // Save user to database
    UserModel.create(discordId, guildId, steamId);
    console.log(`[linksteam] Saved user to database: Discord ${discordId} in guild ${guildId} -> Steam ${steamId}`);

    // Fetch and store games
    console.log(`[linksteam] Fetching games for Steam ID: ${steamId}`);
    const result = await fetchAndStoreGames(discordId, guildId, steamId);
    console.log(`[linksteam] Fetch result:`, result);

    if (!result.success) {
      if (result.isPrivate) {
        UserModel.updatePrivacy(discordId, guildId, true);

        const embed = new EmbedBuilder()
          .setColor(0xFF6B6B)
          .setTitle('Steam Profile is Private')
          .setDescription(
            'Your Steam profile appears to be private. To use this bot, you need to make your **Game Details** public.\n\n' +
            '**How to make your profile public:**\n' +
            '1. Go to your [Steam Privacy Settings](https://steamcommunity.com/my/edit/settings)\n' +
            '2. Under "Privacy Settings", set **Game details** to **Public**\n' +
            '3. Click **Save** and then use `/refresh` to update your library'
          )
          .setFooter({ text: 'Your Steam ID has been saved, but no games were fetched.' });

        return interaction.editReply({ embeds: [embed] });
      } else {
        return interaction.editReply({
          content: `Error: ${result.error || 'Failed to fetch games from Steam.'}`,
        });
      }
    }

    // Success
    UserModel.updatePrivacy(discordId, guildId, false);
    UserModel.updateLastFetched(discordId, guildId);

    const embed = new EmbedBuilder()
      .setColor(0x66C0F4)
      .setTitle('Steam Account Linked Successfully!')
      .setDescription(
        `Your Steam account has been linked and **${result.gamesCount} games** were imported.\n\n` +
        'You can now use commands like `/whohas`, `/has`, and `/common` to find games with friends!'
      )
      .setFooter({ text: 'Use /refresh to update your library anytime' });

    return interaction.editReply({ embeds: [embed] });
  } catch (error: any) {
    console.error('Error in linksteam command:', error);
    return interaction.editReply({
      content: `An error occurred: ${error.message}`,
    });
  }
}

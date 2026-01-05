import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { UserModel } from '../database/models';
import { fetchAndStoreGames } from '../utils/steam';

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const discordId = interaction.user.id;
  const guildId = interaction.guildId;

  if (!guildId) {
    return interaction.editReply({
      content: 'This command can only be used in a server.',
    });
  }

  try {
    // Check if user has linked their Steam account
    const user = UserModel.get(discordId, guildId);

    if (!user) {
      return interaction.editReply({
        content: 'You haven\'t linked your Steam account yet. Use `/linksteam` first.',
      });
    }

    // Fetch and store games
    const result = await fetchAndStoreGames(discordId, guildId, user.steam_id);

    if (!result.success) {
      if (result.isPrivate) {
        // Special case: User has existing games and profile is now private
        if (result.error === 'keepExisting' && result.gamesCount > 0) {
          const embed = new EmbedBuilder()
            .setColor(0xFFA500)
            .setTitle('Profile is Private - Using Cached Data')
            .setDescription(
              `Your Steam profile appears to be private, but we still have **${result.gamesCount} games** stored from your last refresh.\n\n` +
              '**Your existing game data will be used** for now.\n\n' +
              '⚠️ **Important:** If you\'ve bought new games, you\'ll need to:\n' +
              '1. Make your [Game Details public](https://steamcommunity.com/my/edit/settings)\n' +
              '2. Run `/refresh` again to update your library\n' +
              '3. You can then set it back to private if desired'
            )
            .setFooter({ text: 'Note: Your game list may be outdated' });

          return interaction.editReply({ embeds: [embed] });
        }

        // Regular private profile with no cached data
        UserModel.updatePrivacy(discordId, guildId, true);

        const embed = new EmbedBuilder()
          .setColor(0xFF6B6B)
          .setTitle('Steam Profile is Private')
          .setDescription(
            'Your Steam profile appears to be private. To use this bot, you need to make your **Game Details** public.\n\n' +
            '**How to make your profile public:**\n' +
            '1. Go to your [Steam Privacy Settings](https://steamcommunity.com/my/edit/settings)\n' +
            '2. Under "Privacy Settings", set **Game details** to **Public**\n' +
            '3. Click **Save** and then use `/refresh` again'
          );

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
      .setColor(0x57F287)
      .setTitle('Library Refreshed!')
      .setDescription(
        `Your Steam library has been updated with **${result.gamesCount} games**.`
      )
      .setFooter({ text: 'Your game data is now up to date' });

    return interaction.editReply({ embeds: [embed] });
  } catch (error: any) {
    console.error('Error in refresh command:', error);
    return interaction.editReply({
      content: `An error occurred: ${error.message}`,
    });
  }
}

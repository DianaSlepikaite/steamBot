import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { UserModel } from '../database/models';
import { fetchAndStoreGames } from '../utils/steam';

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const discordId = interaction.user.id;

  try {
    // Check if user has linked their Steam account
    const user = UserModel.get(discordId);

    if (!user) {
      return interaction.editReply({
        content: 'You haven\'t linked your Steam account yet. Use `/linksteam` first.',
      });
    }

    // Fetch and store games
    const result = await fetchAndStoreGames(discordId, user.steam_id);

    if (!result.success) {
      if (result.isPrivate) {
        UserModel.updatePrivacy(discordId, true);

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
    UserModel.updatePrivacy(discordId, false);
    UserModel.updateLastFetched(discordId);

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

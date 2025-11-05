import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { GameModel, UserGameModel } from '../database/models';

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const gameQuery = interaction.options.getString('game', true);

  try {
    // Search for games matching the query
    const games = GameModel.searchByName(gameQuery);

    if (games.length === 0) {
      return interaction.editReply({
        content: `No games found matching "${gameQuery}". Make sure users have linked their Steam accounts and the game name is spelled correctly.`,
      });
    }

    // Use the first match (could be improved with user selection)
    const game = games[0];
    if (!game) {
      return interaction.editReply({
        content: `No games found matching "${gameQuery}".`,
      });
    }

    // Get users who own this game
    const userIds = UserGameModel.getUsersWithGame(game.app_id);

    if (userIds.length === 0) {
      return interaction.editReply({
        content: `No one in this server owns "${game.name}".`,
      });
    }

    // Format user mentions
    const userMentions = userIds.map(id => `<@${id}>`).join(', ');

    const embed = new EmbedBuilder()
      .setColor(0x66C0F4)
      .setTitle(`Who owns ${game.name}`)
      .setDescription(`**${userIds.length}** member(s) own this game:\n\n${userMentions}`)
      .setFooter({ text: `App ID: ${game.app_id}` });

    if (game.icon_url) {
      embed.setThumbnail(game.icon_url);
    }

    // If there are multiple matches, show them
    if (games.length > 1) {
      const otherGames = games.slice(1, 4).map(g => g.name).join(', ');
      embed.addFields({
        name: 'Other matches',
        value: `${otherGames}${games.length > 4 ? ', ...' : ''}`,
      });
    }

    return interaction.editReply({ embeds: [embed] });
  } catch (error: any) {
    console.error('Error in whohas command:', error);
    return interaction.editReply({
      content: `An error occurred: ${error.message}`,
    });
  }
}

import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { GameModel, UserGameModel, UserModel } from '../database/models';

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const targetUser = interaction.options.getUser('user', true);
  const gameQuery = interaction.options.getString('game', true);
  const discordId = targetUser.id;

  try {
    // Check if user has linked their Steam account
    const user = UserModel.get(discordId);

    if (!user) {
      return interaction.editReply({
        content: `<@${discordId}> hasn't linked their Steam account yet. They need to use \`/linksteam\` first.`,
      });
    }

    // Check if profile is private
    if (user.is_private) {
      return interaction.editReply({
        content: `<@${discordId}>'s Steam profile is private. They need to make their Game Details public and use \`/refresh\`.`,
      });
    }

    // Search for the game
    const games = GameModel.searchByName(gameQuery);

    if (games.length === 0) {
      return interaction.editReply({
        content: `No games found matching "${gameQuery}".`,
      });
    }

    const game = games[0];
    if (!game) {
      return interaction.editReply({
        content: `No games found matching "${gameQuery}".`,
      });
    }

    // Check if user owns the game
    const hasGame = UserGameModel.userHasGame(discordId, game.app_id);

    const embed = new EmbedBuilder()
      .setColor(hasGame ? 0x57F287 : 0x5865F2)
      .setTitle(hasGame ? '✅ Yes!' : '❌ No')
      .setDescription(
        hasGame
          ? `<@${discordId}> **owns** ${game.name}`
          : `<@${discordId}> **does not own** ${game.name}`
      )
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
    console.error('Error in has command:', error);
    return interaction.editReply({
      content: `An error occurred: ${error.message}`,
    });
  }
}

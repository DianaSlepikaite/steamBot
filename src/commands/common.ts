import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { UserGameModel, UserModel } from '../database/models';
import { filterMultiplayerGames } from '../utils/multiplayer';

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  try {
    // Collect all user options
    const userIds: string[] = [];
    for (let i = 1; i <= 10; i++) {
      const user = interaction.options.getUser(`user${i}`);
      if (user) {
        userIds.push(user.id);
      }
    }

    if (userIds.length < 2) {
      return interaction.editReply({
        content: 'Please specify at least 2 users to compare.',
      });
    }

    // Check if all users have linked their Steam accounts
    const missingUsers: string[] = [];
    const privateUsers: string[] = [];

    for (const userId of userIds) {
      const user = UserModel.get(userId);
      if (!user) {
        missingUsers.push(userId);
      } else if (user.is_private) {
        privateUsers.push(userId);
      }
    }

    if (missingUsers.length > 0) {
      const mentions = missingUsers.map(id => `<@${id}>`).join(', ');
      return interaction.editReply({
        content: `The following users haven't linked their Steam accounts yet: ${mentions}\n\nThey need to use \`/linksteam\` first.`,
      });
    }

    if (privateUsers.length > 0) {
      const mentions = privateUsers.map(id => `<@${id}>`).join(', ');
      return interaction.editReply({
        content: `The following users have private Steam profiles: ${mentions}\n\nThey need to make their Game Details public and use \`/refresh\`.`,
      });
    }

    // Get common games
    const commonGames = UserGameModel.getCommonGames(userIds);

    if (commonGames.length === 0) {
      const userMentions = userIds.map(id => `<@${id}>`).join(', ');
      return interaction.editReply({
        content: `${userMentions} don't have any games in common.`,
      });
    }

    // Filter to only show multiplayer games
    await interaction.editReply({
      content: `Found ${commonGames.length} common games. Checking which ones support multiplayer... ⏳`,
    });

    const multiplayerGames = await filterMultiplayerGames(commonGames);

    if (multiplayerGames.length === 0) {
      const userMentions = userIds.map(id => `<@${id}>`).join(', ');
      return interaction.editReply({
        content: `${userMentions} have ${commonGames.length} common game(s), but none support multiplayer.`,
      });
    }

    // Format the games list with player counts when available
    const gamesList = multiplayerGames
      .slice(0, 20)
      .map((game, index) => {
        let playerInfo = '';

        // Show player count if available
        if (game.multiplayerInfo.coopPlayers) {
          playerInfo = ` **[${game.multiplayerInfo.coopPlayers}P Co-op]**`;
        } else if (game.multiplayerInfo.maxPlayers) {
          playerInfo = ` **[${game.multiplayerInfo.maxPlayers}P]**`;
        }

        return `${index + 1}. ${game.name}${playerInfo}`;
      })
      .join('\n');

    const userMentions = userIds.map(id => `<@${id}>`).join(', ');

    const embed = new EmbedBuilder()
      .setColor(0x66C0F4)
      .setTitle('Common Multiplayer Games')
      .setDescription(
        `**${multiplayerGames.length}** multiplayer game(s) owned by all users:\n${userMentions}\n\n${gamesList}`
      )
      .setFooter({
        text: multiplayerGames.length > 20
          ? `Showing 20 of ${multiplayerGames.length} multiplayer games (${commonGames.length} total common games)`
          : `${multiplayerGames.length} multiplayer games (${commonGames.length} total common games)`,
      });

    return interaction.editReply({ embeds: [embed] });
  } catch (error: any) {
    console.error('Error in common command:', error);
    return interaction.editReply({
      content: `An error occurred: ${error.message}`,
    });
  }
}

import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { UserGameModel, UserModel } from '../database/models';

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  try {
    // Collect all user options
    const userIds: string[] = [];
    for (let i = 1; i <= 5; i++) {
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

    // Format the games list
    const gamesList = commonGames
      .slice(0, 20)
      .map(game => `• ${game.name}`)
      .join('\n');

    const userMentions = userIds.map(id => `<@${id}>`).join(', ');

    const embed = new EmbedBuilder()
      .setColor(0x66C0F4)
      .setTitle('Common Games')
      .setDescription(
        `**${commonGames.length}** game(s) owned by all users:\n${userMentions}\n\n${gamesList}`
      )
      .setFooter({
        text: commonGames.length > 20
          ? `Showing 20 of ${commonGames.length} games`
          : `Total: ${commonGames.length} games`,
      });

    return interaction.editReply({ embeds: [embed] });
  } catch (error: any) {
    console.error('Error in common command:', error);
    return interaction.editReply({
      content: `An error occurred: ${error.message}`,
    });
  }
}

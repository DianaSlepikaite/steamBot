import { ChatInputCommandInteraction, EmbedBuilder, ChannelType } from 'discord.js';
import { UserGameModel, UserModel } from '../database/models';
import { filterMultiplayerGames } from '../utils/multiplayer';

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();

  const guildId = interaction.guildId;

  if (!guildId || !interaction.guild) {
    return interaction.editReply({
      content: 'This command can only be used in a server.',
    });
  }

  try {
    const channelName = interaction.options.getString('channel', true);

    // Find the voice channel by name
    const voiceChannels = interaction.guild.channels.cache.filter(
      channel => channel.type === ChannelType.GuildVoice
    );

    const targetChannel = voiceChannels.find(
      channel => channel.name.toLowerCase() === channelName.toLowerCase()
    );

    if (!targetChannel || targetChannel.type !== ChannelType.GuildVoice) {
      const availableChannels = voiceChannels.map(c => c.name).join(', ');
      return interaction.editReply({
        content: `Voice channel "${channelName}" not found.\n\nAvailable voice channels: ${availableChannels || 'None'}`,
      });
    }

    // Get all members in the voice channel
    const membersInVC = Array.from(targetChannel.members.values());

    if (membersInVC.length === 0) {
      return interaction.editReply({
        content: `No one is currently in the voice channel "${targetChannel.name}".`,
      });
    }

    // Filter out bots
    const humanMembers = membersInVC.filter(member => !member.user.bot);

    if (humanMembers.length < 2) {
      return interaction.editReply({
        content: `There are not enough users in "${targetChannel.name}" to find common games (need at least 2 users).`,
      });
    }

    const userIds = humanMembers.map(member => member.id);

    // Check if all users have linked their Steam accounts
    const missingUsers: string[] = [];
    const privateUsers: string[] = [];

    for (const userId of userIds) {
      const user = UserModel.get(userId, guildId);
      if (!user) {
        missingUsers.push(userId);
      } else if (user.is_private) {
        privateUsers.push(userId);
      }
    }

    if (missingUsers.length > 0) {
      const mentions = missingUsers.map(id => `<@${id}>`).join(', ');
      return interaction.editReply({
        content: `The following users in "${targetChannel.name}" haven't linked their Steam accounts yet: ${mentions}\n\nThey need to use \`/linksteam\` first.`,
      });
    }

    if (privateUsers.length > 0) {
      const mentions = privateUsers.map(id => `<@${id}>`).join(', ');
      return interaction.editReply({
        content: `The following users in "${targetChannel.name}" have private Steam profiles: ${mentions}\n\nThey need to make their Game Details public and use \`/refresh\`.`,
      });
    }

    // Get common games
    const commonGames = UserGameModel.getCommonGames(guildId, userIds);

    if (commonGames.length === 0) {
      const userMentions = userIds.map(id => `<@${id}>`).join(', ');
      return interaction.editReply({
        content: `Users in "${targetChannel.name}" (${userMentions}) don't have any games in common.`,
      });
    }

    // Filter to only show multiplayer games
    await interaction.editReply({
      content: `Found ${commonGames.length} common games for ${humanMembers.length} users in "${targetChannel.name}". Checking which ones support multiplayer... ⏳`,
    });

    const multiplayerGames = await filterMultiplayerGames(commonGames);

    if (multiplayerGames.length === 0) {
      const userMentions = userIds.map(id => `<@${id}>`).join(', ');
      return interaction.editReply({
        content: `Users in "${targetChannel.name}" (${userMentions}) have ${commonGames.length} common game(s), but none support multiplayer.`,
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
      .setTitle(`Common Multiplayer Games in "${targetChannel.name}"`)
      .setDescription(
        `**${multiplayerGames.length}** multiplayer game(s) owned by all **${humanMembers.length} users** in voice channel:\n${userMentions}\n\n${gamesList}`
      )
      .setFooter({
        text: multiplayerGames.length > 20
          ? `Showing 20 of ${multiplayerGames.length} multiplayer games (${commonGames.length} total common games)`
          : `${multiplayerGames.length} multiplayer games (${commonGames.length} total common games)`,
      });

    return interaction.editReply({ embeds: [embed] });
  } catch (error: any) {
    console.error('Error in commonvc command:', error);
    return interaction.editReply({
      content: `An error occurred: ${error.message}`,
    });
  }
}

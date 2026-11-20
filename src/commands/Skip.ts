import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
  type MessageActionRowComponentBuilder,
} from 'discord.js';
import { SKIP_WAIT_TIME } from '../Constants';
import { customIdValue, newCustomId } from '../ConversationHelper';
import { Phase } from '../enums/Phase';
import { getGamesManagerInstance } from '../GamesManager';
import { Log } from '../Log';
import type { Command } from '../types/Command';
import { UserError } from '../UserError';

const activeSkipVotes = new Set<string>();

export const skip: Command = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Propose to end the discussion early and go to the vote.')
    .setContexts(InteractionContextType.Guild),
  async execute(interaction) {
    if (!interaction.channel) {
      throw new UserError('This command can only be used in a text channel.');
    }
    const game = getGamesManagerInstance().getGame(interaction.channel);
    if (!game.getPlayer(interaction.user.id)) {
      throw new UserError("Cannot skip, you're not a player in this game.");
    }
    if (game.phase !== Phase.discussion) {
      throw new UserError(
        'Cannot skip, the game is not in the discussion phase.'
      );
    }
    if (activeSkipVotes.has(interaction.channelId)) {
      throw new UserError('There is already a skip vote in progress.');
    }
    activeSkipVotes.add(interaction.channelId);

    try {
      const agreed = new Set([
        interaction.user.id,
        ...game.players.filter((p) => p.isVirtual).map(({ id }) => id),
      ]);
      const content = () =>
        `<@${interaction.user.id}> wants to skip to the voting phase. Does everyone agree?\n${game.tagPlayersText}\nAgreed: ${agreed.size}/${game.players.length}`;
      const row =
        new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(newCustomId('skip', 'agree'))
            .setLabel('Agree')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(newCustomId('skip', 'disagree'))
            .setLabel('Disagree')
            .setStyle(ButtonStyle.Danger)
        );
      const response = await interaction.reply({
        content: content(),
        components: [row],
        withResponse: true,
      });
      const message = response.resource?.message;
      if (!message) {
        return;
      }

      const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: SKIP_WAIT_TIME,
      });
      collector.on('collect', (i) => {
        (async () => {
          if (!game.getPlayer(i.user.id)) {
            await i.reply({
              content: "You're not a player in this game.",
              flags: MessageFlags.Ephemeral,
            });
            return;
          }
          if (customIdValue(i.customId) === 'disagree') {
            await i.deferUpdate();
            collector.stop('declined');
            return;
          }
          agreed.add(i.user.id);
          await i.update({ content: content() });
          if (agreed.size === game.players.length) {
            collector.stop('agreed');
          }
        })().catch((error) => Log.error('Skip interaction failed', error));
      });

      const reason = new Promise<string>((resolve) =>
        collector.once('end', (_collected, endReason) => resolve(endReason))
      );
      if (agreed.size === game.players.length) {
        collector.stop('agreed');
      }
      if ((await reason) === 'agreed' && game.phase === Phase.discussion) {
        await interaction.editReply({
          content: 'Everyone agreed. Skipping to the voting phase!',
          components: [],
        });
        game.endGame().catch((error) => {
          Log.error(error);
          void game.abort('Something went wrong, the game was stopped.');
        });
      } else {
        await interaction.editReply({
          content: 'Not everyone wants to skip to the voting phase.',
          components: [],
        });
      }
    } finally {
      activeSkipVotes.delete(interaction.channelId);
    }
  },
};

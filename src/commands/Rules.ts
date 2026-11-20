import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { RULES_URL } from '../Constants';
import type { Command } from '../types/Command';

export const rules: Command = {
  data: new SlashCommandBuilder()
    .setName('rules')
    .setDescription('Get a link to the official rules.')
    .setContexts(InteractionContextType.Guild),
  async execute(interaction) {
    await interaction.reply({
      content: 'You can read the official rules here:',
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setLabel('Official rules (PDF)')
            .setURL(RULES_URL)
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};

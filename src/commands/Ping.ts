import {
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import type { Command } from '../types/Command';

export const ping: Command = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check how responsive the bot is.')
    .setContexts(InteractionContextType.Guild),
  async execute(interaction) {
    const response = await interaction.reply({
      content: 'Pinging…',
      flags: MessageFlags.Ephemeral,
      withResponse: true,
    });
    const sentAt = response.resource?.message?.createdTimestamp ?? Date.now();
    await interaction.editReply(
      `Pong! Round trip: \`${sentAt - interaction.createdTimestamp}ms\`, gateway: \`${interaction.client.ws.ping}ms\``
    );
  },
};

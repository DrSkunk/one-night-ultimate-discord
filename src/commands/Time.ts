import {
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { getGamesManagerInstance } from '../GamesManager';
import type { Command } from '../types/Command';
import { UserError } from '../UserError';

export const time: Command = {
  data: new SlashCommandBuilder()
    .setName('time')
    .setDescription('Display the remaining discussion time.')
    .setContexts(InteractionContextType.Guild),
  async execute(interaction) {
    if (!interaction.channel) {
      throw new UserError('This command can only be used in a text channel.');
    }
    const game = getGamesManagerInstance().getGame(interaction.channel);
    const { minutes, seconds } = game.remainingTime;
    await interaction.reply({
      content: `Time remaining: ${minutes} minutes and ${seconds} seconds`,
      flags: MessageFlags.Ephemeral,
    });
  },
};

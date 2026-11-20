import {
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { getConfig } from '../Config';
import { MAXIMUM_PLAYERS, MINIMUM_PLAYERS } from '../Constants';
import type { Command } from '../types/Command';
import { createVirtualPlayers } from '../VirtualPlayer';
import { openLobby } from './Start';

const VIRTUAL_THINK_TIME = 2_000;

/**
 * Developer-only: opens a normal lobby that already contains virtual players,
 * so a single person can play through a full game. Only registered and usable
 * in the DEV_GUILD_ID test server.
 */
export const playtest: Command = {
  data: new SlashCommandBuilder()
    .setName('playtest')
    .setDescription('Test server only: start a lobby filled with bot players.')
    .setContexts(InteractionContextType.Guild)
    .addIntegerOption((option) =>
      option
        .setName('bots')
        .setDescription('Number of virtual players to add.')
        .setMinValue(1)
        .setMaxValue(MAXIMUM_PLAYERS - 1)
    )
    .addBooleanOption((option) =>
      option
        .setName('silent_night')
        .setDescription('Mute the ambient night noises.')
    )
    .addBooleanOption((option) =>
      option.setName('silent').setDescription('Mute all sound effects.')
    ),
  async execute(interaction) {
    const { DEV_GUILD_ID } = getConfig();
    if (!DEV_GUILD_ID || interaction.guildId !== DEV_GUILD_ID) {
      await interaction.reply({
        content: '`/playtest` is only available in the test server.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const bots = interaction.options.getInteger('bots') ?? MINIMUM_PLAYERS - 1;
    await openLobby(
      interaction,
      createVirtualPlayers(bots, { thinkTime: VIRTUAL_THINK_TIME })
    );
  },
};

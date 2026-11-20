import {
  EmbedBuilder,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import packageJson from '../../package.json' with { type: 'json' };
import { REPOSITORY_URL } from '../Constants';
import type { Command } from '../types/Command';

export const version: Command = {
  data: new SlashCommandBuilder()
    .setName('version')
    .setDescription('Get the current bot version.')
    .setContexts(InteractionContextType.Guild),
  async execute(interaction) {
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle('One Night Ultimate Discord')
          .setURL(REPOSITORY_URL)
          .setDescription(`Visit ${REPOSITORY_URL} for the source code`)
          .addFields({ name: 'Version', value: `v${packageJson.version}` })
          .setFooter({ text: 'Made with ❤️ by Sebastiaan Jansen / DrSkunk' }),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};

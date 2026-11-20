import {
  EmbedBuilder,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { REPOSITORY_URL } from '../Constants';
import type { Command } from '../types/Command';
import { commands } from './index';

export const help: Command = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Display help information.')
    .setContexts(InteractionContextType.Guild),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('One Night Ultimate Discord')
      .setURL(REPOSITORY_URL)
      .setDescription(`Visit ${REPOSITORY_URL} for the source code`)
      .setFooter({ text: 'Made with ❤️ by Sebastiaan Jansen / DrSkunk' });

    for (const command of commands) {
      const { options = [] } = command.data.toJSON();
      const optionText = options
        .map((option) => `\n• \`${option.name}\`: ${option.description}`)
        .join('');
      embed.addFields({
        name: `/${command.data.name}`,
        value: `${command.data.description}${optionText}`,
      });
    }
    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};

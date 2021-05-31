import { Message, MessageEmbed } from 'discord.js';
import { Command } from '../types/Command';
import packageJson from '../../package.json';

const command: Command = {
  names: ['version', 'v'],
  description: 'Get current bot version.',
  params: [],
  execute,
  adminOnly: false,
};

async function execute(msg: Message): Promise<void> {
  const embed = new MessageEmbed();

  embed.setTitle('One night ultimate Discord');
  embed.setDescription(
    'Visit https://github.com/DrSkunk/one-night-ultimate-discord for source code'
  );
  embed.setURL('https://github.com/DrSkunk/one-night-ultimate-discord');

  embed.addField('Version', `v${packageJson.version}`);

  embed.setFooter(
    'Made with ❤️ by Sebastiaan Jansen / DrSkunk',
    'https://i.imgur.com/RPKkHMf.png'
  );

  await msg.channel.send(embed);
}
export = command;

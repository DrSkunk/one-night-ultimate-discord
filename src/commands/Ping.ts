import { Message } from 'discord.js';
import { Command } from '../types/Command';

const command: Command = {
  names: ['ping'],
  description: 'Send a ping to the bot to see how responsive it is.',
  params: [],
  execute,
  adminOnly: false,
};

async function execute(msg: Message): Promise<void> {
  msg.reply(`Pong! ${Date.now() - msg.createdTimestamp}`);
}
export = command;

import { Message } from 'discord.js';
import { RULES_URL } from '../Constants';
import { Command } from '../types/Command';

const command: Command = {
  names: ['rules', 'r'],
  description: 'Send a DM with a link to the official rules.',
  params: [],
  execute,
  adminOnly: false,
};

async function execute(msg: Message): Promise<void> {
  try {
    await msg.author.send(`You can read the rules here: ${RULES_URL}`);
  } catch (error) {
    msg.reply(
      `I cannot send you a DM with the rules because of your privacy settings. This is needed to be able to play the game.`
    );
  }
}
export = command;

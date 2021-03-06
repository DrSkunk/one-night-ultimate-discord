import { Message, TextChannel } from 'discord.js';
import { getGamesManagerInstance } from '../GamesManager';
import { Command } from '../types/Command';

const command: Command = {
  names: ['time', 't'],
  description: 'Display the remaining decision time.',
  params: [],
  execute,
  adminOnly: false,
};

async function execute(msg: Message): Promise<void> {
  const textChannel = msg.channel as TextChannel;

  try {
    const game = getGamesManagerInstance().getGame(textChannel);
    const { minutes, seconds } = game.remainingTime;
    textChannel.send(
      `Time remaining: ${minutes} minutes and ${seconds} seconds`
    );
  } catch (error) {
    textChannel.send(error.message);
  }
}
export = command;

import { Message, TextChannel } from 'discord.js';
import { getDiscordInstance } from '../DiscordClient';
import { getGamesManagerInstance } from '../GamesManager';
import { Command } from '../types/Command';

const command: Command = {
  names: ['start'],
  description: 'Start a new game',
  execute,
  adminOnly: false,
};

async function execute(msg: Message, args: string[]): Promise<void> {
  const client = getDiscordInstance();
  if (!client) {
    throw new Error('Discord did not initialize');
  }

  const gamesManager = getGamesManagerInstance();

  let voiceChannel;
  if (args.length === 0) {
    voiceChannel = msg.member?.voice.channel;
    if (!voiceChannel) {
      client.sendMessage(
        'Please supply a voice channel ID with players, or join a voice channel.'
      );
      return;
    }
  } else {
    voiceChannel = msg.guild?.channels.cache.find(
      ({ type, name }) =>
        type === 'voice' && name.toLowerCase().includes(args[0].toLowerCase())
    );
  }
  ///////////////////////////
  // const players = voiceChannel?.members;
  const players = await client.getDummyPlayers();
  //////////////////////////

  if (!players) {
    client.sendMessage(`Empty voice channel`);
    return;
  }
  try {
    gamesManager.startNewGame(players, msg.channel as TextChannel);
  } catch (error) {
    client.sendMessage(error.message);
    return;
  }

  const playerNames = players.reduce(
    (acc, member) => `${acc}, <@${member.id}>`,
    ''
  );

  client.sendMessage(`Starting new game with players: ${playerNames}`);
}
export = command;

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

function execute(_msg: Message, args: string[]): void {
  const client = getDiscordInstance();
  if (!client) {
    throw new Error('Discord did not initialize');
  }

  const gamesManager = getGamesManagerInstance();

  if (args.length === 0) {
    client.sendMessage('Please supply a voice channel ID with players');
    return;
  }

  // TODO: Currently the bot only listens to messages sent to one specific channel, which is
  // set in the .env and used in DiscordClient.ts, essentially making the game manager obsolete.
  // In order to enable multiplae games, remove the check in the this._client.on('message',...) method
  // in DiscordClient.ts (currently line 69).
  const voiceChannel = _msg.guild?.channels.cache.find(
    ({ type, name }) =>
      type === 'voice' && name.toLowerCase().includes(args[0].toLowerCase())
  );

  const players = voiceChannel?.members;

  if (!players) {
    client.sendMessage(`Empty voice channel`);
    return;
  }
  try {
    gamesManager.startNewGame(players, _msg.channel as TextChannel);
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

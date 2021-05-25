import { Message, TextChannel } from 'discord.js';
import {
  CARDS_ON_TABLE,
  MAXIMUM_PLAYERS,
  MAX_ROLES_COUNT,
  MINIMUM_PLAYERS,
} from '../Constants';
import { ChooseRoles } from '../ConversationHelper';
import { getDiscordInstance } from '../DiscordClient';
import { RoleName } from '../enums/RoleName';
import { getGamesManagerInstance } from '../GamesManager';
import { Log } from '../Log';
import { Command } from '../types/Command';

const command: Command = {
  names: ['start'],
  description:
    "Start a new game. Supply the _'quick'_ option to reuse previous settings.",
  params: [
    {
      optional: true,
      name: 'quick',
    },
    {
      optional: true,
      name: 'voice channel name',
    },
  ],
  execute,
  adminOnly: false,
};

async function execute(msg: Message, args: string[]): Promise<void> {
  const client = getDiscordInstance();
  if (!client) {
    throw new Error('Discord did not initialize');
  }
  const textChannel = msg.channel as TextChannel;
  const gamesManager = getGamesManagerInstance();

  let quickStart = false;
  if (args[0] === 'quick') {
    quickStart = true;
  }

  const voiceChannel = msg.member?.voice.channel;
  if (!voiceChannel) {
    textChannel.send('Please join a voice channel.');
    return;
  }
  // TODO don't forget to change this
  ///////////////////////////
  const members = voiceChannel?.members;
  // const players = await client.getDummyPlayers();
  //////////////////////////

  if (!members) {
    textChannel.send(`Empty voice channel`);
    return;
  }
  const players = members.filter((m) => !m.user.bot).array();

  const author = msg.author;
  const amountToPick =
    players.length - MAX_ROLES_COUNT[RoleName.werewolf] + CARDS_ON_TABLE;
  const werewolves = Array.from(
    { length: MAX_ROLES_COUNT[RoleName.werewolf] },
    () => RoleName.werewolf
  );

  try {
    if (players.length < MINIMUM_PLAYERS || players.length > MAXIMUM_PLAYERS) {
      throw new Error(
        `Not enough players. Game must be played with ${MINIMUM_PLAYERS} to ${MAXIMUM_PLAYERS} players.`
      );
    }
    if (quickStart) {
      await gamesManager.quickStartGame(
        players,
        msg.channel as TextChannel,
        voiceChannel
      );
    } else {
      const roles = [
        ...werewolves,
        ...(await ChooseRoles(author, textChannel, amountToPick)),
      ];
      await gamesManager.startNewGame(
        players,
        msg.channel as TextChannel,
        voiceChannel,
        roles
      );
    }
  } catch (error) {
    Log.error(error.message);
    await textChannel.send(error.message);
  }
}
export = command;

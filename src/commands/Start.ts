import { GuildMember, Message, TextChannel } from 'discord.js';
import {
  CARDS_ON_TABLE,
  MAXIMUM_PLAYERS,
  MAX_ROLES_COUNT,
  MINIMUM_PLAYERS,
} from '../Constants';
import { ChooseRoles, getPlayerList } from '../ConversationHelper';
import { RoleName } from '../enums/RoleName';
import { getGamesManagerInstance } from '../GamesManager';
import { Log } from '../Log';
import { Command } from '../types/Command';

enum Optional {
  quick = 'quick',
  silentnight = 'silentnight',
  silent = 'silent',
}

const command: Command = {
  names: ['start'],
  description: `Start a new game. Supply the _'quick'_ option to reuse previous settings.
Supply the _'silentnight'_  option to mute the ambient night noises.
Supply the _'silent'_ option to mute all sound effects.`,
  params: [
    {
      optional: true,
      name: Optional.quick,
    },
    {
      optional: true,
      name: Optional.silentnight,
    },
    {
      optional: true,
      name: Optional.silent,
    },
  ],
  execute,
  adminOnly: false,
};

async function execute(msg: Message, args: string[]): Promise<void> {
  const textChannel = msg.channel as TextChannel;
  const gamesManager = getGamesManagerInstance();

  const lowerArgs = args.map((arg) => arg.toLowerCase());
  const quickStart = lowerArgs.includes(Optional.quick);
  const silentNight = lowerArgs.includes(Optional.silentnight);
  const silent = lowerArgs.includes(Optional.silent);

  const voiceChannel = msg.member?.voice.channel;
  if (!voiceChannel) {
    textChannel.send('Please join a voice channel.');
    return;
  }

  const members = voiceChannel?.members;

  if (!members) {
    textChannel.send(`Empty voice channel`);
    return;
  }
  const potentialPlayers = members.filter((m) => !m.user.bot).array();
  let players: GuildMember[];
  try {
    const playerTags = potentialPlayers.map((p) => `<@${p.id}>`).join(', ');
    const text = `${playerTags}\nClick on ✅ to join the game.`;
    players = (await getPlayerList(textChannel, potentialPlayers, text)).map(
      ({ id }) => {
        const member = members.get(id);
        if (!member) {
          throw new Error('A playing player left the voice channel.');
        }
        return member;
      }
    );
  } catch (error) {
    textChannel.send(error.message);
    return;
  }

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
        voiceChannel,
        silentNight,
        silent
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
        silentNight,
        silent,
        roles
      );
    }
  } catch (error) {
    Log.error(error.message);
    await textChannel.send(error.message);
  }
}
export = command;

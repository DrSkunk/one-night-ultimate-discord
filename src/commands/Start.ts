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

const command: Command = {
  names: ['start'],
  description:
    "Start a new game. Supply the _'quick'_ option to reuse previous settings.",
  params: [
    {
      optional: true,
      name: 'quick',
    },
  ],
  execute,
  adminOnly: false,
};

async function execute(msg: Message, args: string[]): Promise<void> {
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
        msg.author,
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
        msg.author,
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

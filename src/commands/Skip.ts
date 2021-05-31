import { Message, TextChannel } from 'discord.js';
import { getPlayerList } from '../ConversationHelper';
import { getGamesManagerInstance } from '../GamesManager';
import { Command } from '../types/Command';
import { Phase } from '../enums/Phase';

const command: Command = {
  names: ['skip'],
  description: 'End the voting round earlier and skip to the voting part.',
  params: [],
  execute,
  adminOnly: false,
};

async function execute(msg: Message): Promise<void> {
  try {
    const textChannel = msg.channel as TextChannel;
    const gamesManager = getGamesManagerInstance();

    const game = gamesManager.getGame(textChannel);
    const gamePlayer = game.players.find(({ id }) => msg.author.id === id);
    if (!gamePlayer) {
      throw new Error("Cannot skip, you're not a player in this game.");
    }
    if (game.phase !== Phase.discussion) {
      throw new Error('Cannot skip, game is not in the discussion phase');
    }
    const potentialPlayers = game.players.map(({ user }) => user);
    const playerTags = game.players.map(({ tag }) => tag).join(', ');
    const text = `<@${msg.author.id}> wants to skip to the voting phase. Does everyone agree?\n${playerTags}`;
    const agreeingPlayers = await getPlayerList(
      textChannel,
      potentialPlayers,
      text
    );
    if (agreeingPlayers.length !== game.players.length) {
      throw new Error('Not everyone wants to skip to the voting phase.');
    }
    textChannel.send('Skipping to voting phase');
    game.endGame();
  } catch (error) {
    msg.reply(error.message);
  }
}
export = command;

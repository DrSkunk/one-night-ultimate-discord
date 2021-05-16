import { Collection, GuildMember, TextChannel } from 'discord.js';
import { Game } from './Game';
import { Log } from './Log';

class GamesManager {
  private _games: Collection<string, Game>;

  constructor() {
    this._games = new Collection();
  }

  public startNewGame(
    players: Collection<string, GuildMember>,
    textChannel: TextChannel
  ) {
    if (this._games.has(textChannel.id)) {
      throw new Error(
        `There's already a game being played in channel <#${textChannel.id}>`
      );
    }

    const game = new Game(players, textChannel);

    this._games.set(textChannel.id, game);
    Log.info(
      `Created a new game for channel "#${textChannel.name}" with ${players.size} players`
    );
    game.start();
  }
}

const instance = new GamesManager();
export function getGamesManagerInstance(): GamesManager {
  return instance;
}

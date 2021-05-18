import { Collection, User, TextChannel } from 'discord.js';
import { Game } from './Game';
import { Log } from './Log';

class GamesManager {
  private _games: Collection<string, Game>;

  constructor() {
    this._games = new Collection();
  }

  public startNewGame(
    players: Collection<string, User>,
    textChannel: TextChannel
  ): void {
    if (this._games.has(textChannel.id)) {
      throw new Error(
        `There's already a game being played in channel <#${textChannel.id}>`
      );
    }

    const game = new Game(players.array(), textChannel);

    this._games.set(textChannel.id, game);
    Log.info(
      `Created a new game for channel "#${textChannel.name}" with ${players.size} players`
    );
    game.start();
  }

  public stopGame(textChannel: TextChannel): void {
    if (this._games.has(textChannel.id)) {
      Log.info(`Stopping game in channel "#${textChannel.name}"`);

      this._games.delete(textChannel.id);
    } else {
      Log.error(
        `Unable to stop game in channel "#${textChannel.name}": Game was not registered`
      );
    }
  }

  public getGame(textChannel: TextChannel): Game {
    const game = this._games.get(textChannel.id);
    if (!game) {
      throw new Error(`No game running in channel #${textChannel.name}`);
    }
    return game;
  }
}

const instance = new GamesManager();
export function getGamesManagerInstance(): GamesManager {
  return instance;
}

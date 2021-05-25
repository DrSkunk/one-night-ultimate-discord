import { Collection, TextChannel, VoiceChannel, GuildMember } from 'discord.js';
import { CARDS_ON_TABLE } from './Constants';
import { RoleName } from './enums/RoleName';
import { Game } from './Game';
import { Log } from './Log';

class GamesManager {
  private _games: Collection<string, Game>;
  private _quickStart: Collection<string, RoleName[]>;

  constructor() {
    this._games = new Collection();
    this._quickStart = new Collection();
  }

  public quickStartGame(
    players: GuildMember[],
    textChannel: TextChannel,
    voiceChannel: VoiceChannel
  ): void {
    const quickStartRoles = this._quickStart.get(textChannel.id);
    if (quickStartRoles === undefined) {
      throw new Error(
        `Can't quickstart, a game hasn't been played before in <#${textChannel.id}>.`
      );
    } else if (quickStartRoles.length - CARDS_ON_TABLE !== players.length) {
      throw new Error(
        `Can't quickstart, there are now a different amount of players.`
      );
    }
    this.startNewGame(players, textChannel, voiceChannel, quickStartRoles);
  }

  public startNewGame(
    players: GuildMember[],
    textChannel: TextChannel,
    voiceChannel: VoiceChannel,
    roleNames: RoleName[]
  ): void {
    if (this._games.has(textChannel.id)) {
      throw new Error(
        `There's already a game being played in channel <#${textChannel.id}>.`
      );
    }

    const game = new Game(players, textChannel, voiceChannel, roleNames);

    this._games.set(textChannel.id, game);
    Log.info(
      `Created a new game for channel "#${textChannel.name}" with ${
        players.length
      } players and with these roles: ${roleNames.join(', ')}`
    );
    this._quickStart.set(textChannel.id, roleNames);
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

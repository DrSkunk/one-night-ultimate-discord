import {
  Collection,
  type GuildTextBasedChannel,
  type VoiceBasedChannel,
} from 'discord.js';
import { CARDS_ON_TABLE } from './Constants';
import type { RoleName } from './enums/RoleName';
import { Game } from './Game';
import { Log } from './Log';
import type { Player } from './Player';
import { UserError, userMessage } from './UserError';

export interface NewGameOptions {
  players: Player[];
  textChannel: GuildTextBasedChannel;
  voiceChannel: VoiceBasedChannel | null;
  silentNight: boolean;
  silent: boolean;
}

class GamesManager {
  private readonly _games = new Collection<string, Game>();
  private readonly _lobbies = new Set<string>();
  private readonly _quickStart = new Collection<string, RoleName[]>();

  /** Claim a channel for a lobby. Returns false if a lobby or game is already active. */
  public reserveChannel(channelId: string): boolean {
    if (this._lobbies.has(channelId) || this._games.has(channelId)) {
      return false;
    }
    this._lobbies.add(channelId);
    return true;
  }

  public releaseChannel(channelId: string): void {
    this._lobbies.delete(channelId);
  }

  public getQuickStartRoles(
    channel: GuildTextBasedChannel,
    playerCount: number
  ): RoleName[] {
    const quickStartRoles = this._quickStart.get(channel.id);
    if (quickStartRoles === undefined) {
      throw new UserError(
        `Can't quickstart, a game hasn't been played before in <#${channel.id}>.`
      );
    }
    if (quickStartRoles.length - CARDS_ON_TABLE !== playerCount) {
      throw new UserError(
        `Can't quickstart, there are now a different amount of players.`
      );
    }
    return quickStartRoles;
  }

  public startNewGame(options: NewGameOptions, roleNames: RoleName[]): Game {
    const { textChannel, players } = options;
    if (this._games.has(textChannel.id)) {
      throw new UserError(
        `There's already a game being played in channel <#${textChannel.id}>.`
      );
    }

    const game = new Game({ ...options, chosenRoles: roleNames });
    this._lobbies.delete(textChannel.id);
    this._games.set(textChannel.id, game);
    this._quickStart.set(textChannel.id, roleNames);
    Log.info(
      `Created a new game for channel "#${textChannel.name}" with ${players.length} players and with these roles: ${roleNames.join(', ')}`
    );
    game.start().catch((error: unknown) => {
      Log.error(error);
      void game.abort(userMessage(error));
    });
    return game;
  }

  public stopGame(textChannel: GuildTextBasedChannel): void {
    if (this._games.delete(textChannel.id)) {
      Log.info(`Stopped game in channel "#${textChannel.name}"`);
    }
  }

  public getGame(textChannel: GuildTextBasedChannel): Game {
    const game = this._games.get(textChannel.id);
    if (!game) {
      throw new UserError(`No game running in channel <#${textChannel.id}>.`);
    }
    return game;
  }
}

const instance = new GamesManager();
export function getGamesManagerInstance(): GamesManager {
  return instance;
}

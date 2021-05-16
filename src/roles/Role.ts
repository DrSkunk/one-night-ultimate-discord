import { GuildMember } from 'discord.js';
import { RoleName } from '../enums/RoleName';
import { GameState } from '../types/GameState';

export abstract class Role {
  abstract name: RoleName;
  protected _player: GuildMember | null;

  constructor() {
    this._player = null;
  }

  abstract doTurn(gameState: GameState, player: GuildMember): void;

  getPlayer(): GuildMember | null {
    return this._player;
  }

  setPlayer(player: GuildMember): void {
    this._player = player;
  }

  public toString = (): string => {
    return this.name;
  };
}

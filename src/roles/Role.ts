import { GuildMember } from 'discord.js';
import { RoleName } from '../enums/RoleName';

export abstract class Role {
  abstract name: RoleName;
  protected _player: GuildMember | null;

  constructor() {
    this._player = null;
  }

  abstract doTurn(): void;

  setPlayer(player: GuildMember): void {
    this._player = player;
  }
  public toString = (): string => {
    return this.name;
  };
}

import { GuildMember } from 'discord.js';
import { RoleName } from '../enums/RoleName';
import { Log } from '../Log';
import { Role } from './Role';

export class Mason extends Role {
  name = RoleName.mason;

  doTurn(): void {
    Log.info('Mason played his turn.');
  }

  setPlayer(player: GuildMember): void {
    this._player = player;
  }
}

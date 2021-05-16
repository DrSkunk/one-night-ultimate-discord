import { GuildMember } from 'discord.js';
import { RoleName } from '../enums/RoleName';
import { Log } from '../Log';
import { Role } from './Role';

export class Minion extends Role {
  name = RoleName.minion;

  doTurn(): void {
    Log.info('Minion played his turn.');
  }

  setPlayer(player: GuildMember): void {
    this._player = player;
  }
}

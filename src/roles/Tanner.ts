import { GuildMember } from 'discord.js';
import { RoleName } from '../enums/RoleName';
import { Log } from '../Log';
import { Role } from './Role';

export class Tanner extends Role {
  name = RoleName.tanner;

  doTurn(): void {
    Log.info('Tanner played his turn.');
  }

  setPlayer(player: GuildMember): void {
    this._player = player;
  }
}

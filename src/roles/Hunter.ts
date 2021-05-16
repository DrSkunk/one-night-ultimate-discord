import { GuildMember } from 'discord.js';
import { RoleName } from '../enums/RoleName';
import { Log } from '../Log';
import { Role } from './Role';

export class Hunter extends Role {
  name = RoleName.hunter;

  doTurn(): void {
    Log.info('Hunter played his turn.');
  }

  setPlayer(player: GuildMember): void {
    this._player = player;
  }
}

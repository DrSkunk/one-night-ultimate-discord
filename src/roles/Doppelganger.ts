import { GuildMember } from 'discord.js';
import { RoleName } from '../enums/RoleName';
import { Log } from '../Log';
import { Role } from './Role';

export class Doppelganger extends Role {
  name = RoleName.doppelganger;

  doTurn(): void {
    Log.info('Doppelganger played his turn.');
  }

  setPlayer(player: GuildMember): void {
    this._player = player;
  }
}

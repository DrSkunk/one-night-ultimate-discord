import { GuildMember } from 'discord.js';
import { RoleName } from '../enums/RoleName';
import { Log } from '../Log';
import { Role } from './Role';

export class Seer extends Role {
  name = RoleName.seer;

  doTurn(): void {
    Log.info('Seer played his turn.');
  }

  setPlayer(player: GuildMember): void {
    this._player = player;
  }
}

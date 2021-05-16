import { GuildMember } from 'discord.js';
import { RoleName } from '../enums/RoleName';
import { Log } from '../Log';
import { Role } from './Role';

export class Troublemaker extends Role {
  name = RoleName.troublemaker;

  doTurn(): void {
    Log.info('Troublemaker played his turn.');
  }

  setPlayer(player: GuildMember): void {
    this._player = player;
  }
}

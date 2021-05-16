import { GuildMember } from 'discord.js';
import { RoleName } from '../enums/RoleName';
import { Log } from '../Log';
import { Role } from './Role';

export class Robber extends Role {
  name = RoleName.robber;

  doTurn(): void {
    Log.info('Robber played his turn.');
  }

  setPlayer(player: GuildMember): void {
    this._player = player;
  }
}

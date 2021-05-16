import { GuildMember } from 'discord.js';
import { RoleName } from '../enums/RoleName';
import { Log } from '../Log';
import { Role } from './Role';

export class Insomniac extends Role {
  name = RoleName.insomniac;

  doTurn(): void {
    Log.info('Insomniac played his turn.');
  }

  setPlayer(player: GuildMember): void {
    this._player = player;
  }
}

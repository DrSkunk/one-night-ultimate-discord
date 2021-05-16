import { GuildMember } from 'discord.js';
import { RoleName } from '../enums/RoleName';
import { Log } from '../Log';
import { Role } from './Role';

export class Villager extends Role {
  name = RoleName.villager;

  doTurn(): void {
    Log.info('Villager played his turn.');
  }

  setPlayer(player: GuildMember): void {
    this._player = player;
  }
}

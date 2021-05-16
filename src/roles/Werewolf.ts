import { GuildMember } from 'discord.js';
import { RoleName } from '../enums/RoleName';
import { Log } from '../Log';
import { Role } from './Role';

export class Werewolf extends Role {
  name = RoleName.werewolf;

  async doTurn(): Promise<void> {
    Log.info('Werewolf played his turn.');
  }

  setPlayer(player: GuildMember): void {
    this._player = player;
  }
}

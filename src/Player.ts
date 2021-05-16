import { GuildMember } from 'discord.js';
import { Role } from './roles/Role';

export class Player {
  private _guildMember: GuildMember;
  public role: Role | undefined;

  constructor(player: GuildMember) {
    this._guildMember = player;
  }

  // public setRole(role: Role): void {
  //   this._role = role;
  // }

  public getGuildMember(): GuildMember {
    return this._guildMember;
  }
}

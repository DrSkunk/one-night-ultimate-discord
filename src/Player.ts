import { GuildMember } from 'discord.js';
import { Role } from './roles/Role';

export class Player {
  private _guildMember: GuildMember;
  public role: Role | undefined;

  constructor(player: GuildMember) {
    this._guildMember = player;
  }

  public getGuildMember(): GuildMember {
    return this._guildMember;
  }

  get name(): string {
    const member = this.getGuildMember();
    if (member.nickname !== null) {
      return member.nickname;
    }
    return member.displayName;
  }
}

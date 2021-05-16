import { GuildMember, Message } from 'discord.js';
import { Role } from './roles/Role';

export class Player {
  private _guildMember: GuildMember;
  public role: Role | undefined;

  constructor(player: GuildMember) {
    this._guildMember = player;
  }

  public async send(message: string): Promise<Message> {
    return await this._guildMember.send(message);
  }

  get id(): string {
    return this._guildMember.id;
  }

  get name(): string {
    if (this._guildMember.nickname !== null) {
      return this._guildMember.nickname;
    }
    return this._guildMember.displayName;
  }
}

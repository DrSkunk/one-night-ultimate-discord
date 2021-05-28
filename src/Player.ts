import {
  APIMessageContentResolvable,
  GuildMember,
  Message,
  MessageOptions,
} from 'discord.js';

// TODO replace Player by just GuildMember
export class Player {
  private _guildMember: GuildMember;

  constructor(guildMember: GuildMember) {
    this._guildMember = guildMember;
  }

  public async send(
    content:
      | APIMessageContentResolvable
      | (MessageOptions & {
          split?: false | undefined;
        })
  ): Promise<Message> {
    return await this._guildMember.send(content);
  }

  get id(): string {
    return this._guildMember.id;
  }

  get name(): string {
    return this._guildMember.displayName;
  }

  get tag(): string {
    return `<@${this._guildMember.user.id}>`;
  }

  get user(): GuildMember {
    return this._guildMember;
  }
}

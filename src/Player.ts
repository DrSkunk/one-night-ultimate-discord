import { User, Message } from 'discord.js';

export class Player {
  private _user: User;

  constructor(player: User) {
    this._user = player;
  }

  public async send(message: string): Promise<Message> {
    return await this._user.send(message);
  }

  get id(): string {
    return this._user.id;
  }

  get tag(): string {
    return `<@${this._user.id}>`;
  }

  get user(): User {
    return this._user;
  }
}

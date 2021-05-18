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

  get name(): string {
    if (this._user.nickname !== null) {
      return this._user.nickname;
    }
    return this._user.displayName;
  }

  get user(): User {
    return this._user;
  }

  public clone(): Player {
    // TODO check if needed
    const newPlayer = new Player(this._user);
    // if (this.role) {
    //   newPlayer.role = this.role.clone();
    // }
    return newPlayer;
  }
}

import { Collection, GuildMember, TextChannel } from 'discord.js';
import { MAXIMUM_PLAYERS, MINIMUM_PLAYERS } from './Constants';
import { RoleName } from './enums/RoleName';
import { Log } from './Log';
import { Doppelganger } from './roles/Doppelganger';
import { Drunk } from './roles/Drunk';
import { Insomniac } from './roles/Insomniac';
import { Mason } from './roles/Mason';
import { Minion } from './roles/Minion';
import { Robber } from './roles/Robber';
import { Role } from './roles/Role';
import { Seer } from './roles/Seer';
import { Troublemaker } from './roles/Troublemaker';
import { Villager } from './roles/Villager';
import { Werewolf } from './roles/Werewolf';

export class Game {
  private _players: Collection<string, GuildMember>;
  private _textChannel: TextChannel;
  private _playerRoles: {
    [key in RoleName]?: Role[];
  };

  constructor(
    players: Collection<string, GuildMember>,
    textChannel: TextChannel
  ) {
    if (players.size < MINIMUM_PLAYERS || players.size > MAXIMUM_PLAYERS) {
      throw new Error('Invalid amount of players');
    }
    this._players = players;
    this._textChannel = textChannel;
    this._playerRoles = {
      [RoleName.doppelganger]: [],
      [RoleName.werewolf]: [],
      [RoleName.minion]: [],
      [RoleName.mason]: [],
      [RoleName.seer]: [],
      [RoleName.robber]: [],
      [RoleName.troublemaker]: [],
      [RoleName.drunk]: [],
      [RoleName.insomniac]: [],
    };
  }

  public get textChannel(): TextChannel {
    return this._textChannel;
  }

  public start(): void {
    // TODO make roles configurable;
    // three cards on table, two players to test
    // = 5 roles

    const players = this._players.array();
    const randomRoles: Role[] = shuffle([
      new Werewolf(),
      new Werewolf(),
      new Villager(),
      new Villager(),
      new Villager(),
    ]) as Role[];
    const roles = randomRoles.map((role, i) => {
      if (i < players.length) {
        (role as Role).setPlayer(players[i]);
      }
      return role;
    });
    Log.info('roles order: ', roles.join(', '));

    const callOrder = [
      RoleName.doppelganger,
      RoleName.werewolf,
      RoleName.minion,
      RoleName.mason,
      RoleName.seer,
      RoleName.robber,
      RoleName.troublemaker,
      RoleName.drunk,
      RoleName.insomniac,
    ];

    for (const role of roles) {
      if (callOrder.includes(role.name)) {
        if (this._playerRoles[role.name]) {
          this._playerRoles[role.name]?.push(role);
        } else {
          this._playerRoles[role.name] = [role];
        }
      }
    }
    Log.log('callOrderRole', this._playerRoles);
  }
}

// Source: https://stackoverflow.com/a/2450976/2174255
function shuffle(array: unknown[]) {
  const copy = [];
  let n = array.length;
  let i;

  // While there remain elements to shuffle…
  while (n) {
    // Pick a remaining element…
    i = Math.floor(Math.random() * array.length);

    // If not already shuffled, move it to the new array.
    if (i in array) {
      copy.push(array[i]);
      delete array[i];
      n--;
    }
  }

  return copy;
}

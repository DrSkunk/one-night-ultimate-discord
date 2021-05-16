import { GuildMember, TextChannel } from 'discord.js';
import { CARDS_ON_TABLE, MAXIMUM_PLAYERS, MINIMUM_PLAYERS } from './Constants';
import { RoleName } from './enums/RoleName';
import { getGamesManagerInstance } from './GamesManager';
import { Log } from './Log';
import { Player } from './Player';
import { GameState } from './types/GameState';
import { Role } from './roles/Role';
import { Doppelganger } from './roles/Doppelganger';
import { Werewolf } from './roles/Werewolf';
import { Minion } from './roles/Minion';
import { Mason } from './roles/Mason';
import { Seer } from './roles/Seer';
import { Robber } from './roles/Robber';
import { Troublemaker } from './roles/Troublemaker';
import { Drunk } from './roles/Drunk';
import { Insomniac } from './roles/Insomniac';
import { Villager } from './roles/Villager';

export class Game {
  private _players: Player[];
  private _textChannel: TextChannel;
  private _gamestate: GameState;

  constructor(players: GuildMember[], textChannel: TextChannel) {
    if (players.length < MINIMUM_PLAYERS || players.length > MAXIMUM_PLAYERS) {
      throw new Error('Invalid amount of players');
    }
    this._players = players.map((player) => new Player(player));

    this._textChannel = textChannel;
    this._gamestate = {
      playerRoles: {
        [RoleName.doppelganger]: [],
        [RoleName.werewolf]: [],
        [RoleName.minion]: [],
        [RoleName.mason]: [],
        [RoleName.seer]: [],
        [RoleName.robber]: [],
        [RoleName.troublemaker]: [],
        [RoleName.drunk]: [],
        [RoleName.insomniac]: [],
      },
      tableRoles: [],
    };
  }

  public get textChannel(): TextChannel {
    return this._textChannel;
  }

  public async start(): Promise<void> {
    // TODO make roles configurable;
    // three cards on table, two players to test
    // = 5 roles

    // const randomRoles: Role[] = shuffle([
    //   new Werewolf(),
    //   new Werewolf(),
    //   new Villager(),
    //   new Villager(),
    //   new Villager(),
    // ]) as Role[];

    const randomRoles: Role[] = [
      new Werewolf(),
      new Seer(),
      new Villager(),
      new Villager(),
      new Werewolf(),
    ];

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

    for (let index = 0; index < randomRoles.length; index++) {
      const role = randomRoles[index];
      if (index >= randomRoles.length - CARDS_ON_TABLE) {
        this._gamestate.tableRoles.push(role);
      } else {
        const player = this._players[index];
        player.role = role;
        if (callOrder.includes(role.name)) {
          this._gamestate.playerRoles[role.name]?.push(player);
        }
      }
    }

    const invalidPlayerIDs: string[] = [];
    for (const player of this._players) {
      try {
        if (player.role) {
          await player.send('Your role is: ' + player?.role.name);
        } else {
          Log.error('There was a player without a role');
        }
      } catch (error) {
        invalidPlayerIDs.push(player.id);
      }
    }

    if (invalidPlayerIDs.length !== 0) {
      Log.warn(
        'Unable to start game due to privacy settings for some player(s)'
      );
      const playerNames = invalidPlayerIDs.reduce(
        (acc, id) => `${acc}- <@${id}>\n`,
        ''
      );
      this._textChannel.send(
        `Unable to start game because I cannot send a DM to the following player(s):
${playerNames}
Please check your privacy settings.`
      );
      this.stopGame();
    } else {
      // start game
      try {
        for (const role of callOrder) {
          const players = this._gamestate.playerRoles[role];
          if (players) {
            const roles = players.map((player) =>
              player.role?.doTurn(this._gamestate, player)
            );
            await Promise.all(roles);
          }
        }
      } catch (error) {
        Log.error(error.message);
        this._textChannel.send(error.message);
        this.stopGame();
      }
    }
  }

  private stopGame() {
    getGamesManagerInstance().stopGame(this._textChannel);
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

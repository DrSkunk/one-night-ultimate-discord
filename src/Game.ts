import { User, TextChannel } from 'discord.js';
import {
  CARDS_ON_TABLE,
  MAXIMUM_PLAYERS,
  MINIMUM_PLAYERS,
  ROUND_TIME_MILLISECONDS,
  ROUND_TIME_MINUTES,
} from './Constants';
import { RoleName } from './enums/RoleName';
import { getGamesManagerInstance } from './GamesManager';
import { Log } from './Log';
import { Player } from './Player';
import { GameState } from './GameState';
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
import { Hunter } from './roles/Hunter';
import { Tanner } from './roles/Tanner';
import { ChoosePlayer } from './ConversationHelper';
import { Time } from './types/Time';

export class Game {
  private _players: Player[];
  private _textChannel: TextChannel;
  private _startGameState: GameState;
  private _gamestate: GameState;
  private _startTime: Date | null;

  constructor(players: User[], textChannel: TextChannel) {
    if (players.length < MINIMUM_PLAYERS || players.length > MAXIMUM_PLAYERS) {
      throw new Error('Invalid amount of players');
    }
    this._players = players.map((player) => new Player(player));

    this._textChannel = textChannel;
    this._startGameState = new GameState();
    this._gamestate = new GameState();
    this._startTime = null;
  }

  public get remainingTime(): Time {
    if (!this._startTime) {
      throw new Error('Countdown has not started yet.');
    }
    const now = new Date().getTime();
    const finish = this._startTime.getTime() + ROUND_TIME_MILLISECONDS;
    return millisToTime(finish - now);
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
      // new Werewolf(),
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
        if (callOrder.includes(role.name)) {
          this._gamestate.playerRoles[role.name]?.push(player);
        }
      }
    }

    this._startGameState = this._gamestate.copy();

    const invalidPlayerIDs: string[] = [];
    for (const player of this._players) {
      try {
        const roleName = this._gamestate.getRoleName(player);
        await player.send('Your role is: ' + roleName);
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
      return;
    }
    // start game
    try {
      for (const role of callOrder) {
        const players = this._startGameState.playerRoles[role];
        if (players) {
          const roles = players.map((player) =>
            this._gamestate.getRoleByName(role).doTurn(this._gamestate, player)
          );
          await Promise.all(roles);
        }
      }
    } catch (error) {
      Log.error(error);
      this._textChannel.send(error.message);
      this.stopGame();
    }

    const playerNames = this._players.reduce(
      (acc, member) => `${acc}, <@${member.id}>`,
      ''
    );

    this._startTime = new Date();

    this._textChannel.send(
      `${playerNames}The night is over! You now have ${ROUND_TIME_MINUTES} minutes to figure out what has happened!`
    );

    // TODO add '30 seconds remaining' text
    setTimeout(async () => {
      await this._textChannel.send(
        `Everybody stop talking! That means you ${playerNames}
Reply to the DM you just received to vote for who to kill.`
      );

      const choosePromises = this._players.map((player) =>
        ChoosePlayer(this._gamestate, player)
      );
      const chosenPlayers = (await Promise.all(choosePromises)).flat();
      const playerMap: { [key: string]: { count: number; player: Player } } =
        {};
      for (const player of chosenPlayers) {
        if (playerMap[player.id]) {
          playerMap[player.id].count++;
        } else {
          playerMap[player.id] = { player, count: 1 };
        }
      }
      const maxCount = Object.values(playerMap).reduce(
        (acc, { count }) => Math.max(acc, count),
        0
      );

      // If no player receives more than one vote, no one dies.
      if (maxCount === 1) {
        // Nobody died!
      } else {
        const playerNamesWhoDie = Object.values(playerMap)
          .filter(({ count }) => count === maxCount)
          .map(({ player }) => `<@${player.id}>`);

        const multipleText =
          playerNamesWhoDie.length === 1 ? 'player dies' : 'players die';

        const playerNamesWhoDieString = new Intl.ListFormat().format(
          playerNamesWhoDie
        );
        const text = `The following ${multipleText}: ${playerNamesWhoDieString}`;
        await this._textChannel.send(text);
      }
      // The player with the most votes dies and reveals his card.
      // In case of a tie, all players tied with the most votes die and reveal their cards.

      Log.info('Game has ended');
      await this._textChannel.send('Game has ended');
      this.stopGame();
    }, ROUND_TIME_MILLISECONDS);
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

function millisToTime(millis: number): Time {
  const minutes = Math.floor(millis / 60000);
  const seconds = Math.ceil((millis % 60000) / 1000);
  return { minutes, seconds };
}

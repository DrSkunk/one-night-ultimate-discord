import { User, TextChannel } from 'discord.js';
import {
  CARDS_ON_TABLE,
  FAKE_USER_TIME,
  MAXIMUM_PLAYERS,
  MAX_ROLES_COUNT,
  MINIMUM_PLAYERS,
  ROUND_TIME_MILLISECONDS,
  ROUND_TIME_MINUTES,
} from './Constants';
import { RoleName } from './enums/RoleName';
import { getGamesManagerInstance } from './GamesManager';
import { Log } from './Log';
import { Player } from './Player';
import { GameState } from './GameState';
import { isMimicRole, Role } from './roles/Role';
import { ChoosePlayer } from './ConversationHelper';
import { Time } from './types/Time';
import { ChoosePlayerType } from './enums/ChoosePlayer';

export class Game {
  public readonly players: Player[];
  private readonly _textChannel: TextChannel;
  private readonly _chosenRoles: RoleName[];
  private _startGameState: GameState;
  public readonly gameState: GameState;
  private _started: boolean;
  private _startTime: Date | null;
  public doppelgangerPlayer: Player | null;
  public newDoppelgangerRole: RoleName | null;

  constructor(
    players: User[],
    textChannel: TextChannel,
    chosenRoles: RoleName[]
  ) {
    if (players.length < MINIMUM_PLAYERS || players.length > MAXIMUM_PLAYERS) {
      throw new Error('Invalid amount of players');
    }
    this.players = players.map((player) => new Player(player));
    this._textChannel = textChannel;
    this._chosenRoles = chosenRoles;
    this._startGameState = new GameState();
    this.gameState = new GameState();
    this._started = false;
    this._startTime = null;
    this.doppelgangerPlayer = null;
    this.newDoppelgangerRole = null;
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

  public get tagPlayersText(): string {
    return this.players.map(({ tag }) => tag).join(', ');
  }

  public moveDoppelGanger(name: RoleName): void {
    this.doppelgangerPlayer = (
      this.gameState.playerRoles.doppelganger?.slice() as Player[]
    )[0];
    this.gameState.playerRoles[name]?.push(this.doppelgangerPlayer);
    this.gameState.playerRoles.doppelganger = [];
    this.newDoppelgangerRole = name;
  }

  public async start(): Promise<void> {
    if (this._started) {
      throw new Error('Game has already started');
    }

    this._textChannel.send(
      `Starting new game with players: ${this.tagPlayersText}
And with these roles: ${this._chosenRoles.join(', ')}`
    );
    this._started = true;

    const chosenRoles = shuffle(
      this._chosenRoles.map((roleName) =>
        this.gameState.getRoleByName(roleName)
      )
    ) as Role[];

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

    for (let index = 0; index < chosenRoles.length; index++) {
      const role = chosenRoles[index];
      if (index >= chosenRoles.length - CARDS_ON_TABLE) {
        this.gameState.tableRoles.push(role);
      } else {
        const player = this.players[index];
        // if (callOrder.includes(role.name)) {
        this.gameState.playerRoles[role.name]?.push(player);
        // }
      }
    }
    for (const roleName of Object.values(RoleName)) {
      const roles = this.gameState.playerRoles[roleName];
      if (roles) {
        const tableRolesLength = this.gameState.tableRoles.filter(
          (role) => role.name === roleName
        ).length;
        const roleCount = roles.length + tableRolesLength;
        if (roleCount > MAX_ROLES_COUNT[roleName]) {
          throw new Error(
            `Invalid role distribution, There are ${roleCount} with role ${roleName} when there is a maximum of ${MAX_ROLES_COUNT[roleName]}`
          );
        }
      }
    }

    this._startGameState = this.gameState.copy();

    const invalidPlayerIDs: string[] = [];
    for (const player of this.players) {
      const roleName = this.gameState.getRoleName(player);
      try {
        await player.send(`Welcome to a new game of One Night Ultimate Discord!
=========================================
A new game has started where you have the role **${roleName}**.
You fall deeply asleep.`);
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
      for (const roleName of callOrder) {
        const players = this._startGameState.playerRoles[roleName];
        if (players && players?.length > 0) {
          const role = this.gameState.getRoleByName(roleName);
          let roles = players.map((player) => role.doTurn(this, player));
          if (
            this.newDoppelgangerRole === roleName &&
            isMimicRole(roleName) &&
            this._startGameState.playerRoles.doppelganger &&
            this._startGameState.playerRoles.doppelganger?.length > 0
          ) {
            const doppelGangers =
              this._startGameState.playerRoles.doppelganger.map((dplgnr) =>
                role.doTurn(this, dplgnr)
              );
            roles = roles.concat(doppelGangers);
          }
          await Promise.all(roles);
        } else if (this._chosenRoles.includes(roleName)) {
          // TODO fix
          Log.info(`Faking ${roleName} because it's a table role.`);
          await new Promise((resolve) => setTimeout(resolve, FAKE_USER_TIME));
        }
      }
    } catch (error) {
      Log.error(error);
      this._textChannel.send(error.message);
      this.stopGame();
    }

    this._startTime = new Date();

    this._textChannel.send(
      `${this.tagPlayersText}The night is over! You now have ${ROUND_TIME_MINUTES} minutes to figure out what has happened!`
    );

    // TODO add '30 seconds remaining' text
    setTimeout(() => this.endGame(), ROUND_TIME_MILLISECONDS);
  }

  private async endGame() {
    await this._textChannel.send(
      `Everybody stop talking! That means you ${this.tagPlayersText}
Reply to the DM you just received to vote for who to kill.`
    );

    const choosePromises = this.players.map((player) =>
      ChoosePlayer(this.players, player, ChoosePlayerType.kill)
    );
    const chosenPlayers = (await Promise.all(choosePromises)).flat();
    const playerMap: { [key: string]: { count: number; player: Player } } = {};
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
    let whoWon = '';
    if (maxCount === 1) {
      await this._textChannel.send('Nobody died!');
      if (this.gameState.playerRoles.werewolf?.length === 0) {
        whoWon = 'Villagers';
      } else {
        whoWon = 'Werewolf';
      }
    } else {
      // TODO fix hunter
      const playersWhoDie = Object.values(playerMap)
        .filter(({ count }) => count === maxCount)
        .map((p) => p.player);

      const playerNamesWhoDie = playersWhoDie.map((player) => player.tag);

      const multipleText =
        playerNamesWhoDie.length === 1 ? 'player dies' : 'players die';

      // TODO Replace when Intl.ListFormat is supported
      // https://stackoverflow.com/questions/57964557/how-can-i-add-types-to-use-intl-listformat-in-node-v12
      // const playerNamesWhoDieString = new Intl.ListFormat().format(
      //   playerNamesWhoDie
      // );
      const playerNamesWhoDieString = playerNamesWhoDie.join(', ');
      const dieText = `The following ${multipleText}: ${playerNamesWhoDieString}`;
      await this._textChannel.send(dieText);
      const dyingRoles = playersWhoDie.map((p) =>
        this.gameState.getRoleName(p)
      );
      if (dyingRoles.includes(RoleName.tanner)) {
        whoWon = 'Tanner';
      } else if (
        dyingRoles.includes(RoleName.werewolf) ||
        dyingRoles.length === 0
      ) {
        whoWon = 'Villagers';
      } else {
        whoWon = 'Werewolf';
      }
    }
    // The player with the most votes dies and reveals his card.
    // In case of a tie, all players tied with the most votes die and reveal their cards.
    const winText = `This means that **team ${whoWon}** has won!`;
    const winMessage = await this._textChannel.send(winText);
    await winMessage.react('🥳');

    const stateText = `Results\n**Roles before the night**:
${this._startGameState.toString()}

**Roles after the night**:
${this.gameState.toString()}`;
    await this._textChannel.send(stateText);
    Log.info('Game has ended');
    this.stopGame();
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

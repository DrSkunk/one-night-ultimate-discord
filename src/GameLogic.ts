import { Collection } from 'discord.js';
import { CARDS_ON_TABLE, FAKE_USER_TIME, MAX_ROLES_COUNT } from './Constants';
import { AcknowledgeMessage } from './ConversationHelper';
import { RoleName } from './enums/RoleName';
import { Team } from './enums/Team';
import { Game } from './Game';
import { GameState } from './GameState';
import { Log } from './Log';
import { Player } from './Player';
import { isMimicRole, Role } from './roles/Role';
import { Time } from './types/Time';

export const callOrder = [
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

// Source: https://stackoverflow.com/a/2450976/2174255
export function shuffle<T>(array: T[]): T[] {
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

export function distributeRoles(
  gameState: GameState,
  players: Player[],
  chosenRoles: Role[]
): void {
  for (let index = 0; index < chosenRoles.length; index++) {
    const role = chosenRoles[index];
    if (index >= chosenRoles.length - CARDS_ON_TABLE) {
      gameState.tableRoles.push(role);
    } else {
      const player = players[index];
      gameState.playerRoles[role.name]?.push(player);
    }
  }
  for (const roleName of Object.values(RoleName)) {
    const roles = gameState.playerRoles[roleName];
    if (roles) {
      const tableRolesLength = gameState.tableRoles.filter(
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
}

export async function sendRoleMessages(
  gameState: GameState,
  players: Player[]
): Promise<string[]> {
  const roleMessages = players.map((player) => {
    const roleName = gameState.getRoleName(player);
    const text = `Welcome to a new game of One Night Ultimate Discord!
=========================================
A new game has started where you have the role **${roleName}**.
You fall deeply asleep.`;
    return AcknowledgeMessage(player, text);
  });

  const invalidPlayerIDs = (await Promise.allSettled(roleMessages))
    .map((item, i) => ({ ...item, i }))
    .filter((result) => result.status === 'rejected')
    .map(({ i }) => {
      return players[i].id;
    });
  return invalidPlayerIDs;
}

export function millisToTime(millis: number): Time {
  const minutes = Math.max(0, Math.floor(millis / 60000));
  const seconds = Math.max(Math.ceil((millis % 60000) / 1000));
  return { minutes, seconds };
}

export async function playAllTurns(game: Game): Promise<void> {
  const { startGameState, gameState } = game;
  for (const roleName of callOrder) {
    const players = startGameState.playerRoles[roleName];
    if (players && players?.length > 0) {
      const role = gameState.getRoleByName(roleName);
      let roles = players.map((player) => role.doTurn(game, player));
      if (
        game.newDoppelgangerRole === roleName &&
        isMimicRole(roleName) &&
        startGameState.playerRoles.doppelganger &&
        startGameState.playerRoles.doppelganger?.length > 0
      ) {
        const doppelGangers = startGameState.playerRoles.doppelganger.map(
          (dplgnr) => role.doTurn(game, dplgnr)
        );
        roles = roles.concat(doppelGangers);
      }
      await Promise.all(roles);
    } else if (game.chosenRoles.includes(roleName)) {
      Log.info(`Faking ${roleName} because it's a table role`);
      await new Promise((resolve) => setTimeout(resolve, FAKE_USER_TIME));
    }
  }
}

export function getWinner(
  chosenPlayers: { target: Player; chosenBy: Player }[],
  gameState: GameState
): {
  winner: Team;
  votingOverview: string;
  playersWhoDie: Player[];
  dyingHunters: Player[];
  hunterKillList: Player[];
} {
  const votedForPlayers: Collection<string, { count: number; player: Player }> =
    new Collection();
  for (const player of chosenPlayers) {
    const oldPlayer = votedForPlayers.get(player.target.id);
    let count = 1;
    if (oldPlayer) {
      count = oldPlayer.count + 1;
    }
    votedForPlayers.set(player.target.id, { count, player: player.target });
  }

  const highestVoteCount = votedForPlayers.reduce(
    (acc, { count }) => Math.max(acc, count),
    1
  );

  const votingOverview = votedForPlayers
    .map(({ player, count }) => `${player.name}: ${count}`)
    .join('\n');

  let winner: Team = Team.werewolves;
  let playersWhoDie: Player[] = [];
  let dyingHunters: Player[] = [];
  let hunterKillList: Player[] = [];
  // If no player receives more than one vote, no one dies.
  if (highestVoteCount === 1) {
    // If a werewolf is among the players, team werewolf wins
    if (gameState.playerRoles.werewolf) {
      winner = Team.werewolves;
    }
  } else {
    const playersWhoDieWithCount = votedForPlayers.filter(
      ({ count }) => count === highestVoteCount
    );
    playersWhoDie = playersWhoDieWithCount.map(({ player }) => player);

    let hunterIds: string[];
    if (gameState.playerRoles.hunter) {
      hunterIds = gameState.playerRoles.hunter.map(({ id }) => id);
    }
    dyingHunters = playersWhoDie.filter(({ id }) => hunterIds.includes(id));

    let tannerIds: string[];
    if (gameState.playerRoles.tanner) {
      tannerIds = gameState.playerRoles.tanner.map(({ id }) => id);
    }

    let werewolfIds: string[];
    if (gameState.playerRoles.werewolf) {
      werewolfIds = gameState.playerRoles.werewolf.map(({ id }) => id);
    }

    // If a hunter dies, its target also dies
    if (dyingHunters.length > 0) {
      hunterKillList = dyingHunters.map((dyingHunter) => {
        const hunterChoice = chosenPlayers.find(
          ({ chosenBy }) => chosenBy.id === dyingHunter.id
        );
        if (!hunterChoice) {
          throw new Error('');
        }
        return hunterChoice.target;
      });
      const hunterKillListRoles = hunterKillList.map((p) =>
        gameState.getRoleName(p)
      );
      console.log(hunterKillListRoles);
      if (hunterKillListRoles.includes(RoleName.werewolf)) {
        winner = Team.villagers;
      }
      playersWhoDie = playersWhoDie.concat(hunterKillList);
    }

    // Tanner wins if he dies
    if (playersWhoDie.find(({ id }) => tannerIds.includes(id))) {
      winner = Team.tanner;
    } else if (playersWhoDie.find(({ id }) => werewolfIds.includes(id))) {
      winner = Team.villagers;
    } else {
      winner = Team.werewolves;
    }
  }

  return {
    winner,
    votingOverview,
    playersWhoDie,
    dyingHunters,
    hunterKillList,
  };
}

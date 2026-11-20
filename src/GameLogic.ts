import { randomInt } from 'node:crypto';
import { Collection } from 'discord.js';
import { CARDS_ON_TABLE, FAKE_USER_TIME, MAX_ROLES_COUNT } from './Constants';
import { RoleName } from './enums/RoleName';
import { Team } from './enums/Team';
import type { Game } from './Game';
import type { GameState } from './GameState';
import { Log } from './Log';
import type { Player } from './Player';
import { Doppelganger } from './roles/Doppelganger';
import { Drunk } from './roles/Drunk';
import { Hunter } from './roles/Hunter';
import { Insomniac } from './roles/Insomniac';
import { Mason } from './roles/Mason';
import { Minion } from './roles/Minion';
import { Robber } from './roles/Robber';
import { isMimicRole, type Role } from './roles/Role';
import { Seer } from './roles/Seer';
import { Tanner } from './roles/Tanner';
import { Troublemaker } from './roles/Troublemaker';
import { Villager } from './roles/Villager';
import { Werewolf } from './roles/Werewolf';
import type { Time } from './types/Time';

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

/** Unbiased Fisher-Yates shuffle using a CSPRNG. Does not mutate the input. */
export function shuffle<T>(array: readonly T[]): T[] {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
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
      gameState.playerRoles[role.name].set(player.id, player);
    }
  }
  for (const roleName of Object.values(RoleName)) {
    const roles = gameState.playerRoles[roleName];
    if (roles) {
      const tableRolesLength = gameState.tableRoles.filter(
        (role) => role.name === roleName
      ).length;
      const roleCount = roles.size + tableRolesLength;
      if (roleCount > MAX_ROLES_COUNT[roleName]) {
        throw new Error(
          `Invalid role distribution, There are ${roleCount} with role ${roleName} when there is a maximum of ${MAX_ROLES_COUNT[roleName]}`
        );
      }
    }
  }
}

export function millisToTime(millis: number): Time {
  const minutes = Math.max(0, Math.floor(millis / 60000));
  const seconds = Math.max(Math.ceil((millis % 60000) / 1000));
  return { minutes, seconds };
}

export async function playAllTurns(game: Game): Promise<void> {
  const { startGameState } = game;
  for (const roleName of callOrder) {
    const players = startGameState.playerRoles[roleName];
    if (players && players.size > 0) {
      const role = getRoleByName(roleName);
      let roles = players.map((player) => role.doTurn(game, player));
      if (
        game.newDoppelgangerRole === roleName &&
        isMimicRole(roleName) &&
        startGameState.playerRoles.doppelganger.size > 0
      ) {
        const doppelGangers = startGameState.playerRoles.doppelganger.map(
          (dplgnr) => role.doTurn(game, dplgnr)
        );
        roles = roles.concat(doppelGangers);
      }
      Log.info(`Now executing ${role.name}`);
      await Promise.all(roles);
    } else if (game.chosenRoles.includes(roleName)) {
      const fakeTime = FAKE_USER_TIME + Math.floor(Math.random() * 5000);
      Log.info(
        `Faking ${roleName} because it's a table role for ${
          fakeTime / 1000
        } seconds.`
      );
      await new Promise((resolve) => setTimeout(resolve, fakeTime));
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

    const hunterIds = gameState.playerRoles.hunter.map(({ id }) => id);
    dyingHunters = playersWhoDie.filter(({ id }) => hunterIds.includes(id));

    const tannerIds = gameState.playerRoles.tanner.map(({ id }) => id);

    const werewolfIds = gameState.playerRoles.werewolf.map(({ id }) => id);

    // If a hunter dies, its target also dies
    if (dyingHunters.length > 0) {
      // A hunter who did not vote takes nobody with them.
      hunterKillList = dyingHunters.flatMap((dyingHunter) => {
        const hunterChoice = chosenPlayers.find(
          ({ chosenBy }) => chosenBy.id === dyingHunter.id
        );
        return hunterChoice ? [hunterChoice.target] : [];
      });
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

export function getRoleByName(roleName: RoleName): Role {
  switch (roleName) {
    case RoleName.doppelganger:
      return new Doppelganger();
    case RoleName.drunk:
      return new Drunk();
    case RoleName.hunter:
      return new Hunter();
    case RoleName.insomniac:
      return new Insomniac();
    case RoleName.mason:
      return new Mason();
    case RoleName.minion:
      return new Minion();
    case RoleName.robber:
      return new Robber();
    case RoleName.seer:
      return new Seer();
    case RoleName.tanner:
      return new Tanner();
    case RoleName.troublemaker:
      return new Troublemaker();
    case RoleName.villager:
      return new Villager();
    case RoleName.werewolf:
      return new Werewolf();
    default:
      throw new Error('invalid gamestate');
  }
}

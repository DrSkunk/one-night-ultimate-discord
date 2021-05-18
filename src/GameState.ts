import { RoleName } from './enums/RoleName';
import { Player } from './Player';
import { Doppelganger } from './roles/Doppelganger';
import { Drunk } from './roles/Drunk';
import { Hunter } from './roles/Hunter';
import { Insomniac } from './roles/Insomniac';
import { Mason } from './roles/Mason';
import { Minion } from './roles/Minion';
import { Robber } from './roles/Robber';
import { Role } from './roles/Role';
import { Seer } from './roles/Seer';
import { Tanner } from './roles/Tanner';
import { Troublemaker } from './roles/Troublemaker';
import { Villager } from './roles/Villager';
import { Werewolf } from './roles/Werewolf';

type PlayerRoles = { [key in RoleName]?: Player[] };

export class GameState {
  playerRoles: PlayerRoles;
  tableRoles: Role[];

  constructor(
    playerRoles: PlayerRoles = {
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
    tableRoles: Role[] = []
  ) {
    this.playerRoles = playerRoles;
    this.tableRoles = tableRoles;
  }

  public toString(): string {
    // TODO implement tostring
    return 'GAMESTATE TOSTRING';
  }

  public clone(): GameState {
    const newPlayerRoles: PlayerRoles = {};
    for (const role of Object.keys(this.playerRoles)) {
      const roleName = role as RoleName;

      if (!newPlayerRoles[roleName]) {
        newPlayerRoles[roleName] = [];
      }

      const players = this.playerRoles[roleName];
      if (players) {
        for (const player of players) {
          const toPush = newPlayerRoles[roleName];
          if (newPlayerRoles[roleName] && Array.isArray(toPush)) {
            toPush.push(player.clone());
          }
        }
      }
    }

    const newTableRoles = [];
    for (const role of Object.values(this.tableRoles)) {
      newTableRoles.push(role.clone());
    }
    return new GameState(newPlayerRoles, newTableRoles);
  }

  public getRole(player: Player): Role {
    const roleName = this.getRoleName(player);
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

  public getRoleName(player: Player): RoleName {
    for (const roleName of Object.keys(this.playerRoles) as RoleName[]) {
      const players = this.playerRoles[roleName];
      const foundPlayer = players?.find((p) => player.id === p.id);
      if (foundPlayer) {
        return roleName;
      }
    }
    throw new Error('Player does not have a role');
  }
}

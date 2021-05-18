import { RoleName } from './enums/RoleName';
import { Player } from './Player';
import { Role } from './roles/Role';

type PlayerRoles = { [key in RoleName]?: Player[] };

export class GameState {
  playerRoles: PlayerRoles;
  tableRoles: Role[];

  constructor(playerRoles: PlayerRoles, tableRoles: Role[]) {
    this.playerRoles = playerRoles;
    this.tableRoles = tableRoles;
  }

  public toString(): string {
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
}

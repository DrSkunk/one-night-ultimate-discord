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
    // from _gamestate naar _startGameState
    const newPlayerRoles: PlayerRoles = {};
    for (const role of Object.keys(this.playerRoles)) {
      const roleName = role as RoleName;
      const players = this.playerRoles[roleName];
      if (players) {
        for (const player of players) {
          let toPush = newPlayerRoles[roleName];
          if (toPush && Array.isArray(toPush)) {
            toPush.push(player.clone());
          } else {
            toPush = [player.clone()];
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

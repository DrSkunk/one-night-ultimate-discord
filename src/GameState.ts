import { RoleName } from './enums/RoleName';
import { getRoleByName } from './GameLogic';
import { Player } from './Player';
import { Role } from './roles/Role';

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
      [RoleName.villager]: [],
      [RoleName.tanner]: [],
      [RoleName.hunter]: [],
    },
    tableRoles: Role[] = []
  ) {
    this.playerRoles = playerRoles;
    this.tableRoles = tableRoles;
  }

  public toString(): string {
    let playerRoles = '';
    for (const roleName of Object.keys(this.playerRoles) as RoleName[]) {
      const players = this.playerRoles[roleName];
      if (players?.length) {
        const playerTags = players.map(({ name: tag }) => tag).join(', ');
        playerRoles += `\n${roleName}: ${playerTags}`;
      }
    }
    const tableRoles = this.tableRoles.map((role) => role.name).join(', ');
    return `Player roles:\n${playerRoles}\n\nTable roles: ${tableRoles}`;
  }

  public copy(): GameState {
    const newPlayerRoles: PlayerRoles = Object.assign({}, this.playerRoles);
    for (const roleName of Object.keys(this.playerRoles) as RoleName[]) {
      newPlayerRoles[roleName] = this.playerRoles[roleName]?.slice();
    }

    const newTableRoles = this.tableRoles.slice();
    return new GameState(newPlayerRoles, newTableRoles);
  }

  public getRole(player: Player): Role {
    return getRoleByName(this.getRoleName(player));
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

  public switchTableCard(player: Player, tableCardIndex: number): void {
    const newRole = this.tableRoles[tableCardIndex].name;
    const newTableCard = this.getRole(player);
    // move Drunk to table
    this.tableRoles[tableCardIndex] = newTableCard;
    // Remove player from drunk rol
    this.playerRoles.drunk = this.playerRoles.drunk?.filter(
      (p) => p.id !== player.id
    );
    // Add player to new role
    this.playerRoles[newRole]?.push(player);
  }

  public switchPlayerRoles(player1: Player, player2: Player): void {
    const roleName1 = this.getRoleName(player1);
    const role1Index = this.playerRoles[roleName1]?.findIndex(
      (p) => p.id === player1.id
    );
    if (role1Index === undefined) {
      throw new Error('invalid player');
    }
    (this.playerRoles[roleName1] as Player[])[role1Index] = player2;

    const roleName2 = this.getRoleName(player2);
    const role2Index = this.playerRoles[roleName2]?.findIndex(
      (p) => p.id === player2.id
    );
    if (role2Index === undefined) {
      throw new Error('invalid player');
    }
    (this.playerRoles[roleName2] as Player[])[role2Index] = player1;
  }
}

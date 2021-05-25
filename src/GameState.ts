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
    return this.getRoleByName(this.getRoleName(player));
  }

  //TODO: This shouldn't be here, but when this is added as a function to Role it introduces a circular dependency
  public getRoleByName(roleName: RoleName): Role {
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

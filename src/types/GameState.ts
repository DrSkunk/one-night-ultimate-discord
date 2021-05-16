import { RoleName } from '../enums/RoleName';
import { Player } from '../Player';
import { Role } from '../roles/Role';

export type GameState = {
  playerRoles: { [key in RoleName]?: Player[] };
  tableRoles: Role[];
};

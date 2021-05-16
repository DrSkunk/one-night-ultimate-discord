import { RoleName } from '../enums/RoleName';
import { Player } from '../Player';

export type GameState = {
  [key in RoleName]?: Player[];
};

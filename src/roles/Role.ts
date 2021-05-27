import { RoleName } from '../enums/RoleName';
import { Game } from '../Game';
import { Player } from '../Player';

export abstract class Role {
  abstract readonly name: RoleName;

  abstract doTurn(game: Game, player: Player): void;
}
export function isMimicRole(roleName: RoleName): boolean {
  return [
    RoleName.werewolf,
    RoleName.minion,
    RoleName.mason,
    RoleName.insomniac,
  ].includes(roleName);
}

export function isInstantRole(roleName: RoleName): boolean {
  return [
    RoleName.seer,
    RoleName.robber,
    RoleName.troublemaker,
    RoleName.drunk,
  ].includes(roleName);
}

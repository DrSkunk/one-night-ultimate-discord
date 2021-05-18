import { RoleName } from '../enums/RoleName';
import { GameState } from '../GameState';
import { Player } from '../Player';

export abstract class Role {
  abstract name: RoleName;

  abstract doTurn(gameState: GameState, player: Player): void;

  public toString(): string {
    return this.name;
  }

  abstract clone(): Role;
}

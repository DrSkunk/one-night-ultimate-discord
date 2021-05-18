import { RoleName } from '../enums/RoleName';
import { Player } from '../Player';
import { GameState } from '../types/GameState';

export abstract class Role {
  abstract name: RoleName;
  protected _player: Player | null;

  constructor() {
    this._player = null;
  }

  abstract doTurn(gameState: GameState, player: Player): void;

  getPlayer(): Player | null {
    return this._player;
  }

  setPlayer(player: Player): void {
    this._player = player;
  }

  public toString(): string {
    return this.name;
  }

  abstract clone(): Role;
}

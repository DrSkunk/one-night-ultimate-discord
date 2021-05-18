import { RoleName } from '../enums/RoleName';
import { Log } from '../Log';
import { Player } from '../Player';
import { GameState } from '../types/GameState';
import { Role } from './Role';

export class Insomniac extends Role {
  name = RoleName.insomniac;

  async doTurn(_gameState: GameState, player: Player): Promise<void> {
    player.send(
      `You see that your current role is ${player.role?.name}\nYou go back to sleep.`
    );
    Log.info('Insomniac turn played.');
  }

  clone(): Role {
    return new Insomniac();
  }
}

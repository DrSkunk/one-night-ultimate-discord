import { RoleName } from '../enums/RoleName';
import { Game } from '../Game';
import { Log } from '../Log';
import { Player } from '../Player';
import { Role } from './Role';

export class Insomniac extends Role {
  readonly name = RoleName.insomniac;

  async doTurn(game: Game, player: Player): Promise<void> {
    const gameState = game.gameState;
    const role = gameState.getRoleName(player);
    player.send(
      `You see that your current role is ${role}\nYou go back to sleep.`
    );
    Log.info('Insomniac turn played.');
  }
}

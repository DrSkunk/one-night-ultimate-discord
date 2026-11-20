import { AcknowledgeMessage } from '../ConversationHelper';
import { RoleName } from '../enums/RoleName';
import type { Game } from '../Game';
import { Log } from '../Log';
import type { Player } from '../Player';
import { Role } from './Role';

export class Insomniac extends Role {
  readonly name = RoleName.insomniac;

  async doTurn(game: Game, player: Player): Promise<void> {
    const gameState = game.gameState;
    const role = gameState.getRoleName(player);

    await AcknowledgeMessage(
      player,
      `You see that your current role is ${role}.`
    );
    await player.send('You go back to sleep.');
    Log.info('Insomniac turn played.');
  }
}

import { ChooseTableCard } from '../ConversationHelper';
import { RoleName } from '../enums/RoleName';
import { Game } from '../Game';
import { Log } from '../Log';
import { Player } from '../Player';
import { Role } from './Role';

export class Drunk extends Role {
  readonly name = RoleName.drunk;

  async doTurn(game: Game, player: Player): Promise<void> {
    const gameState = game.gameState;
    await player.send('You wake up.');
    const tableCardIndex = (
      await ChooseTableCard(gameState, player, 1, true)
    )[0];
    game.gameState.switchTableCard(player, tableCardIndex);

    Log.info('Drunk turn played.');
  }
}

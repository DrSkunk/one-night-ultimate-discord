import { AcknowledgeMessage, ChooseTableCard } from '../ConversationHelper';
import { RoleName } from '../enums/RoleName';
import type { Game } from '../Game';
import { Log } from '../Log';
import type { Player } from '../Player';
import { Role } from './Role';

export class Drunk extends Role {
  readonly name = RoleName.drunk;

  async doTurn(game: Game, player: Player): Promise<void> {
    const [tableCardIndex] = await ChooseTableCard(
      player,
      1,
      'You wake up. You must take a card from the table.'
    );
    game.gameState.switchTableCard(player, tableCardIndex);
    await AcknowledgeMessage(
      player,
      'You are now the role of the card you took from the table'
    );
    await player.send('You go back to sleep.');

    Log.info('Drunk turn played.');
  }
}

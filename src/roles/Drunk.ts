import { AcknowledgeMessage, ChooseTableCard } from '../ConversationHelper';
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
    const tableCard = (
      await ChooseTableCard(
        gameState,
        player,
        1,
        'You must take a card from the table.'
      )
    )[0];
    const tableCardIndex = Object.values(tableCard)[0];
    game.gameState.switchTableCard(player, tableCardIndex);
    await AcknowledgeMessage(
      player,
      'You are now the role of the card you took from the table'
    );
    await player.send('You go back to sleep.');

    Log.info('Drunk turn played.');
  }
}

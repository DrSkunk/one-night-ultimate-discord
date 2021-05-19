import {
  ChooseTableCard,
  ChoosePlayer,
  ChoosePlayerOrTable,
} from '../ConversationHelper';
import { RoleName } from '../enums/RoleName';
import { Game } from '../Game';
import { Log } from '../Log';
import { Player } from '../Player';
import { Role } from './Role';

export class Seer extends Role {
  readonly name = RoleName.seer;

  async doTurn(game: Game, player: Player): Promise<void> {
    const gameState = game.gameState;
    const lookAtPlayerCards = await ChoosePlayerOrTable(gameState, player);
    if (lookAtPlayerCards) {
      await ChoosePlayer(gameState, player);
    } else {
      await ChooseTableCard(gameState, player, 2);
    }
    await player.send('You go back to sleep.');
    Log.info('Seer turn played.');
  }

  clone(): Role {
    return new Seer();
  }
}

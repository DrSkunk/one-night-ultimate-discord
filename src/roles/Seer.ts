import {
  ChooseTableCard,
  ChoosePlayer,
  ChoosePlayerOrTable,
} from '../ConversationHelper';
import { RoleName } from '../enums/RoleName';
import { Log } from '../Log';
import { Player } from '../Player';
import { GameState } from '../types/GameState';
import { Role } from './Role';

export class Seer extends Role {
  name = RoleName.seer;

  async doTurn(gameState: GameState, player: Player): Promise<void> {
    const lookAtPlayerCards = await ChoosePlayerOrTable(gameState, player);
    if (lookAtPlayerCards) {
      await ChoosePlayer(gameState, player);
    } else {
      await ChooseTableCard(gameState, player, 2);
    }
    Log.info('Seer turn played.');
  }

  clone(): Role {
    return new Seer();
  }
}

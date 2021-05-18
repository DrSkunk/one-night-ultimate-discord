import { ChooseTableCard } from '../ConversationHelper';
import { RoleName } from '../enums/RoleName';
import { GameState } from '../GameState';
import { Log } from '../Log';
import { Player } from '../Player';
import { Role } from './Role';

export class Drunk extends Role {
  name = RoleName.drunk;

  async doTurn(gameState: GameState, player: Player): Promise<void> {
    await player.send('You wake up.');
    await ChooseTableCard(gameState, player, 1, false);
    Log.info('Drunk turn played.');
  }

  clone(): Role {
    return new Drunk();
  }
}

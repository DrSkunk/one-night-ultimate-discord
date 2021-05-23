import { ChoosePlayer, ChooseToDoAction } from '../ConversationHelper';
import { RoleName } from '../enums/RoleName';
import { Game } from '../Game';
import { Log } from '../Log';
import { Player } from '../Player';
import { Role } from './Role';

export class Robber extends Role {
  readonly name = RoleName.robber;

  async doTurn(game: Game, player: Player): Promise<void> {
    const text =
      'You wake up. You can now steal the role of another player. Do you want to do this?';
    const stealRole = await ChooseToDoAction(player, text);
    if (stealRole) {
      const chosenPlayer = (await ChoosePlayer(game.players, player))[0];
      game.gameState.switchPlayerRoles(player, chosenPlayer);
    } else {
      await player.send('You don\t steal a role and go back to sleep.');
    }
    Log.info('Robber turn played.');
  }
}

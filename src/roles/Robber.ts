import {
  AcknowledgeMessage,
  ChoosePlayer,
  ChooseToDoAction,
} from '../ConversationHelper';
import { ChoosePlayerType } from '../enums/ChoosePlayer';
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
      const chosenPlayer = (
        await ChoosePlayer(
          game.players,
          player,
          ChoosePlayerType.rob,
          'Choose a player to steal their role.'
        )
      )[0];
      const roleName = game.gameState.getRoleName(chosenPlayer);
      game.gameState.switchPlayerRoles(player, chosenPlayer);
      await AcknowledgeMessage(
        player,
        `You see that ${chosenPlayer.name} has the role ${roleName}, which you now take`
      );
      await player.send('You go back to sleep.');
    } else {
      await player.send("You don't steal a role and go back to sleep.");
    }
    Log.info('Robber turn played.');
  }
}

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

export class Troublemaker extends Role {
  readonly name = RoleName.troublemaker;

  async doTurn(game: Game, player: Player): Promise<void> {
    const text =
      'You wake up. You can now switch the roles of two players. Do you want to do this?';
    const switchRoles = await ChooseToDoAction(player, text);
    if (switchRoles) {
      const chosenPlayers = await ChoosePlayer(
        game.players,
        player,
        ChoosePlayerType.switch,
        'Chose two players to switch their roles'
      );
      game.gameState.switchPlayerRoles(chosenPlayers[0], chosenPlayers[1]);
      await AcknowledgeMessage(
        player,
        `You switch the roles of ${chosenPlayers[0].name} and ${chosenPlayers[1].name}`
      );
      await player.send('You go back to sleep.');
    } else {
      await player.send("You don't switch roles and go back to sleep.");
    }
    Log.info('Troublemaker turn played.');
  }

  clone(): Role {
    return new Troublemaker();
  }
}

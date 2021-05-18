import { ChoosePlayer, ChooseToDoAction } from '../ConversationHelper';
import { RoleName } from '../enums/RoleName';
import { GameState } from '../GameState';
import { Log } from '../Log';
import { Player } from '../Player';
import { Role } from './Role';

export class Troublemaker extends Role {
  name = RoleName.troublemaker;

  async doTurn(gameState: GameState, player: Player): Promise<void> {
    const text =
      'You wake up. You can now the roles of two players. Do you want to do this?';
    const switchRoles = await ChooseToDoAction(player, text);
    if (switchRoles) {
      // TODO make compatible for multiple troublemakers. This is needed for a correct endgame state
      // To accomodate for the Doppelganger role
      const chosenPlayers = await ChoosePlayer(gameState, player, true);
      const chosenPlayerRoleNames = chosenPlayers.map((p) =>
        gameState.getRoleName(p)
      );
      gameState.playerRoles[chosenPlayerRoleNames[0]] = [chosenPlayers[1]];
      gameState.playerRoles[chosenPlayerRoleNames[1]] = [chosenPlayers[0]];
    } else {
      await player.send("You don't switch roles and go back to sleep.");
    }
    Log.info('Troublemaker turn played.');
  }

  clone(): Role {
    return new Troublemaker();
  }
}

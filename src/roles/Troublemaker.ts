import { ChoosePlayer, ChooseToDoAction } from '../ConversationHelper';
import { RoleName } from '../enums/RoleName';
import { Log } from '../Log';
import { Player } from '../Player';
import { GameState } from '../types/GameState';
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
      if (chosenPlayers[0].role?.name && chosenPlayers[1].role?.name) {
        gameState.playerRoles[chosenPlayers[0].role?.name] = [chosenPlayers[1]];
        gameState.playerRoles[chosenPlayers[1].role?.name] = [chosenPlayers[0]];
      } else {
        throw new Error('No two players returned from troublemaker choice.');
      }
    } else {
      await player.send("You don't switch roles and go back to sleep.");
    }
    Log.info('Troublemaker turn played.');
  }

  clone(): Role {
    return new Troublemaker();
  }
}

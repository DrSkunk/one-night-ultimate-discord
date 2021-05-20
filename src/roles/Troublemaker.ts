import { ChoosePlayer, ChooseToDoAction } from '../ConversationHelper';
import { ChoosePlayerType } from '../enums/ChoosePlayer';
import { RoleName } from '../enums/RoleName';
import { Game } from '../Game';
import { Log } from '../Log';
import { Player } from '../Player';
import { Role } from './Role';

export class Troublemaker extends Role {
  readonly name = RoleName.troublemaker;

  async doTurn(game: Game, player: Player): Promise<void> {
    const gameState = game.gameState;
    const text =
      'You wake up. You can now switch the roles of two players. Do you want to do this?';
    const switchRoles = await ChooseToDoAction(player, text);
    if (switchRoles) {
      // TODO make compatible for multiple troublemakers. This is needed for a correct endgame state
      // To accomodate for the Doppelganger role
      const chosenPlayers = await ChoosePlayer(
        game.players,
        player,
        ChoosePlayerType.switch
      );
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

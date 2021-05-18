import { ChoosePlayer, ChooseToDoAction } from '../ConversationHelper';
import { RoleName } from '../enums/RoleName';
import { GameState } from '../GameState';
import { Log } from '../Log';
import { Player } from '../Player';
import { Role } from './Role';

export class Robber extends Role {
  name = RoleName.robber;

  async doTurn(gameState: GameState, player: Player): Promise<void> {
    const text =
      'You wake up. You can now steal the role of another player. Do you want to do this?';
    const stealRole = await ChooseToDoAction(player, text);
    if (stealRole) {
      // TODO make compatible for multiple robbers. This is needed for a correct endgame state
      // To accomodate for the Doppelganger role
      const chosenPlayer = (await ChoosePlayer(gameState, player))[0];
      const chosenPlayerRoleName = gameState.getRoleName(chosenPlayer);

      gameState.playerRoles.robber = [chosenPlayer];
      gameState.playerRoles[chosenPlayerRoleName] = [player];
    } else {
      await player.send('You don\t steal a role and go back to sleep.');
    }
    Log.info('Robber turn played.');
  }
}

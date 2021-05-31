import { AcknowledgeMessage, ChoosePlayer } from '../ConversationHelper';
import { ChoosePlayerType } from '../enums/ChoosePlayer';
import { RoleName } from '../enums/RoleName';
import { Game } from '../Game';
import { Log } from '../Log';
import { Player } from '../Player';
import { isInstantRole, isMimicRole, Role } from './Role';

export class Doppelganger extends Role {
  readonly name = RoleName.doppelganger;

  async doTurn(game: Game, player: Player): Promise<void> {
    const gameState = game.gameState;
    const chosenPlayer = (
      await ChoosePlayer(
        game.players,
        player,
        ChoosePlayerType.clone,
        'Choose a player to clone their role.'
      )
    )[0];
    const chosenPlayerRole = gameState.getRole(chosenPlayer);

    if (isMimicRole(chosenPlayerRole.name)) {
      gameState.moveDoppelGanger(chosenPlayerRole.name);
      await player.send(
        `You see that ${chosenPlayer.name} has the role ${chosenPlayerRole.name}
You now also have the role ${chosenPlayerRole.name}.
You go back to sleep.`
      );
      game.newDoppelgangerRole = chosenPlayerRole.name;
      return;
    } else if (isInstantRole(chosenPlayerRole.name)) {
      await player.send(
        `You see that ${chosenPlayer.name} has the role ${chosenPlayerRole.name}.
You now also have the role ${chosenPlayerRole.name} and immediately execute it.`
      );
      await chosenPlayerRole.doTurn(game, player);
      game.newDoppelgangerRole = chosenPlayerRole.name;
      return;

      // Only roles are left that do not wake up, Villager, Hunter and Tanner
    } else {
      await AcknowledgeMessage(
        player,
        `You see that ${chosenPlayer.name} has the role ${chosenPlayerRole.name}.
  You now also have the role ${chosenPlayerRole.name}.`
      );
      await player.send('You go back to sleep.');
    }

    Log.info('Doppelganger turn played.');
  }
}

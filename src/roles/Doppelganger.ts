import { ChoosePlayer } from '../ConversationHelper';
import { ChoosePlayerType } from '../enums/ChoosePlayer';
import { RoleName } from '../enums/RoleName';
import { Game } from '../Game';
import { Log } from '../Log';
import { Player } from '../Player';
import { isInstantRole, isMimicRole, Role } from './Role';

export class Doppelganger extends Role {
  readonly name = RoleName.doppelganger;
  retryCounter = 0;

  async doTurn(game: Game, player: Player): Promise<void> {
    const gameState = game.gameState;
    const chosenPlayer = (
      await ChoosePlayer(game.players, player, ChoosePlayerType.clone)
    )[0];
    const chosenPlayerRole = gameState.getRole(chosenPlayer);

    if (isMimicRole(chosenPlayerRole.name)) {
      game.moveDoppelGanger(chosenPlayerRole.name);
      await player.send(
        `You see that ${chosenPlayer.name} has the role ${chosenPlayerRole.name}
You now also have the role ${chosenPlayerRole.name}.
You go back to sleep.`
      );
      return;
    }

    if (isInstantRole(chosenPlayerRole.name)) {
      await player.send(
        `You see that ${chosenPlayer.name} has the role ${chosenPlayerRole.name}.
You now also have the role ${chosenPlayerRole.name} and immediately execute it.`
      );
      await chosenPlayerRole.doTurn(game, player);
      game.newDoppelgangerRole = chosenPlayerRole.name;
      return;

      // Only roles are left that do not wake up, Villager, Hunter and Tanner
    }
    await player.send(
      `You see that ${chosenPlayer.name} has the role ${chosenPlayerRole.name}.
You now also have the role ${chosenPlayerRole.name} and go back to sleep.`
    );

    Log.info('Doppelganger turn played.');
  }
}

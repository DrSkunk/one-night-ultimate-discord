import { ChoosePlayer } from '../ConversationHelper';
import { RoleName } from '../enums/RoleName';
import { GameState } from '../GameState';
import { Log } from '../Log';
import { Player } from '../Player';
import { Role } from './Role';

export class Doppelganger extends Role {
  name = RoleName.doppelganger;
  retryCounter = 0;

  async doTurn(gameState: GameState, player: Player): Promise<void> {
    const chosenPlayer = (await ChoosePlayer(gameState, player))[0];
    const chosenPlayerRole = gameState.getRole(chosenPlayer);

    const mimicRoles = [
      RoleName.doppelganger,
      RoleName.werewolf,
      RoleName.minion,
      RoleName.mason,
      RoleName.insomniac,
    ];
    if (mimicRoles.includes(chosenPlayerRole.name)) {
      gameState.playerRoles[chosenPlayerRole.name]?.push(player);
      await player.send(
        `You see that ${chosenPlayer.name} has the role ${chosenPlayerRole.name}
You now also have the role ${chosenPlayerRole.name}.
You go back to sleep.`
      );
    }
    const instantRoles = [
      RoleName.seer,
      RoleName.robber,
      RoleName.troublemaker,
      RoleName.drunk,
    ];
    if (instantRoles.includes(chosenPlayerRole.name)) {
      await player.send(
        `You see that ${chosenPlayer.name} has the role ${chosenPlayerRole.name}.
You now also have the role ${chosenPlayerRole.name} and immediately execute it.`
      );
      chosenPlayerRole.doTurn(gameState, player);
    } else {
      await player.send(
        `You see that ${chosenPlayer.name} has the role ${chosenPlayerRole.name}.
You now also have the role ${chosenPlayerRole.name} and go back to sleep.`
      );
    }
    Log.info('Doppelganger turn played.');
  }

  clone(): Role {
    return new Doppelganger();
  }
}

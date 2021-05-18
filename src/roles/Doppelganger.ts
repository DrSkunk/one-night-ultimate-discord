import { ChoosePlayer } from '../ConversationHelper';
import { RoleName } from '../enums/RoleName';
import { Log } from '../Log';
import { Player } from '../Player';
import { GameState } from '../types/GameState';
import { Drunk } from './Drunk';
import { Robber } from './Robber';
import { Role } from './Role';
import { Seer } from './Seer';
import { Troublemaker } from './Troublemaker';

export class Doppelganger extends Role {
  name = RoleName.doppelganger;
  retryCounter = 0;

  async doTurn(gameState: GameState, player: Player): Promise<void> {
    const chosenPlayer = (await ChoosePlayer(gameState, player))[0];
    if (!chosenPlayer.role) {
      throw new Error('Invalid gamestate');
    }
    const mimicRoles = [
      RoleName.doppelganger,
      RoleName.werewolf,
      RoleName.minion,
      RoleName.mason,
      RoleName.insomniac,
    ];
    const cardRole = chosenPlayer.role.name;
    if (mimicRoles.includes(cardRole)) {
      gameState.playerRoles[cardRole]?.push(player);
      await player.send(
        `You see that ${chosenPlayer.name} has the role ${cardRole}
You now also have the role ${cardRole}.
You go back to sleep.`
      );
    }
    // TODO: Can be done without a switch statement
    const instantRoles = [
      RoleName.seer,
      RoleName.robber,
      RoleName.troublemaker,
      RoleName.drunk,
    ];
    if (instantRoles.includes(cardRole)) {
      await player.send(
        `You see that ${chosenPlayer.name} has the role ${cardRole}.
You now also have the role ${cardRole} and immediately execute it.`
      );
      switch (cardRole) {
        case RoleName.seer:
          player.role = new Seer();
          break;
        case RoleName.robber:
          player.role = new Robber();
          break;
        case RoleName.troublemaker:
          player.role = new Troublemaker();
          break;
        case RoleName.drunk:
          player.role = new Drunk();
          break;
        default:
          throw new Error('invalid gamestate');
      }
      player.role.doTurn(gameState, player);
    } else {
      await player.send(
        `You see that ${chosenPlayer.name} has the role ${cardRole}.
You now also have the role ${cardRole} and go back to sleep.`
      );
    }
    Log.info('Doppelganger turn played.');
  }

  clone(): Role {
    return new Doppelganger();
  }
}

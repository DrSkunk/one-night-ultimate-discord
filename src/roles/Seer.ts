import {
  ChooseTableCard,
  ChoosePlayer,
  ChoosePlayerOrTable,
  AcknowledgeMessage,
  tableCardLabel,
} from '../ConversationHelper';
import { ChoosePlayerType } from '../enums/ChoosePlayer';
import { RoleName } from '../enums/RoleName';
import type { Game } from '../Game';
import { Log } from '../Log';
import type { Player } from '../Player';
import { Role } from './Role';

export class Seer extends Role {
  readonly name = RoleName.seer;

  async doTurn(game: Game, player: Player): Promise<void> {
    const gameState = game.gameState;
    const lookAtPlayerCards = await ChoosePlayerOrTable(
      player,
      "You wake up. Do you want to look at another player's card or at two cards in the middle?"
    );
    if (lookAtPlayerCards) {
      const chosenPlayer = (
        await ChoosePlayer(
          game.players,
          player,
          ChoosePlayerType.view,
          'Choose a player to see their role.'
        )
      )[0];
      const roleName = game.gameState.getRoleName(chosenPlayer);
      await AcknowledgeMessage(
        player,
        `You see that ${chosenPlayer.name} has the role ${roleName}`
      );
    } else {
      const chosenCards = await ChooseTableCard(
        player,
        2,
        'You can take a look at two cards on the table.'
      );
      const selectedRoles = chosenCards
        .map(
          (index) =>
            `\n${tableCardLabel(index)}: ${gameState.tableRoles[index].name}`
        )
        .join('');

      await AcknowledgeMessage(
        player,
        `You view the following cards:${selectedRoles}`
      );
    }
    await player.send('You go back to sleep.');

    Log.info('Seer turn played.');
  }

  clone(): Role {
    return new Seer();
  }
}

import {
  ChooseTableCard,
  ChoosePlayer,
  ChoosePlayerOrTable,
} from '../ConversationHelper';
import { ChoosePlayerType } from '../enums/ChoosePlayer';
import { RoleName } from '../enums/RoleName';
import { Game } from '../Game';
import { Log } from '../Log';
import { Player } from '../Player';
import { Role } from './Role';

export class Seer extends Role {
  readonly name = RoleName.seer;

  async doTurn(game: Game, player: Player): Promise<void> {
    const gameState = game.gameState;
    const lookAtPlayerCards = await ChoosePlayerOrTable(
      gameState,
      player,
      `Do you either:
- 1️⃣: Look at another player's card
- 2️⃣: Look at two cards in the middle?`
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
      player.send(`You see that ${chosenPlayer.name} has the role ${roleName}
You go back to sleep.`);
    } else {
      const chosenCards = await ChooseTableCard(
        gameState,
        player,
        2,
        'You can take a look at two cards on the table.'
      );
      let selectedRoles = '';
      for (const chosenCard of chosenCards) {
        const emoji = Object.keys(chosenCard)[0];
        const roleName = gameState.tableRoles[chosenCard[emoji]].name;

        selectedRoles += `\n${emoji}: ${roleName}`;
      }

      await player.send(
        `You view the following cards:${selectedRoles}\nYou go back to sleep.`
      );
    }
    // await player.send('You go back to sleep.');
    Log.info('Seer turn played.');
  }

  clone(): Role {
    return new Seer();
  }
}

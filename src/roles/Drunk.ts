import { ChooseTableCard } from '../ConversationHelper';
import { RoleName } from '../enums/RoleName';
import { Game } from '../Game';
import { Log } from '../Log';
import { Player } from '../Player';
import { Role } from './Role';

export class Drunk extends Role {
  readonly name = RoleName.drunk;

  async doTurn(game: Game, player: Player): Promise<void> {
    const gameState = game.gameState;
    await player.send('You wake up.');
    const cardIndex = (await ChooseTableCard(gameState, player, 1, true))[0];
    // TODO make compatible with doppelganger
    const newRole = game.gameState.tableRoles[cardIndex].name;
    const newTableCard = game.gameState.getRole(player);
    game.gameState.tableRoles[cardIndex] = newTableCard;

    game.gameState.playerRoles.drunk = [];
    game.gameState.playerRoles[newRole]?.push(player);

    Log.info('Drunk turn played.');
  }
}

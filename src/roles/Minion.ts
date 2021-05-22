import { RoleName } from '../enums/RoleName';
import { Game } from '../Game';
import { Log } from '../Log';
import { Player } from '../Player';
import { Role } from './Role';

export class Minion extends Role {
  readonly name = RoleName.minion;

  async doTurn(game: Game, player: Player): Promise<void> {
    const gameState = game.gameState;
    if (
      !gameState.playerRoles.werewolf ||
      gameState.playerRoles.werewolf?.length === 0
    ) {
      await player.send(
        'You wake up and see no werewolves among the players.\nYou go back to sleep.'
      );
    } else {
      const names = gameState.playerRoles.werewolf
        .map((otherWerewolf) => otherWerewolf.tag)
        .join(' and ');
      const werewolfSentence =
        gameState.playerRoles.werewolf.length === 1
          ? 'player is a werewolf'
          : 'players are werewolves';
      await player.send(
        `You wake up and see that the following ${werewolfSentence}: ${names}\nYou go back to sleep.`
      );
    }
    Log.info('Minion turn played.');
  }
}

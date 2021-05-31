import { AcknowledgeMessage } from '../ConversationHelper';
import { RoleName } from '../enums/RoleName';
import { Game } from '../Game';
import { Log } from '../Log';
import { Player } from '../Player';
import { Role } from './Role';

export class Minion extends Role {
  readonly name = RoleName.minion;

  async doTurn(game: Game, player: Player): Promise<void> {
    const gameState = game.gameState;
    if (gameState.playerRoles.werewolf.size === 0) {
      const prompt = 'You wake up and see no werewolves among the players.';
      await AcknowledgeMessage(player, prompt);
    } else {
      const names = gameState.playerRoles.werewolf
        .map((otherWerewolf) => otherWerewolf.name)
        .join(' and ');
      const werewolfSentence =
        gameState.playerRoles.werewolf.size === 1
          ? 'player is a werewolf'
          : 'players are werewolves';
      const prompt = `You wake up and see that the following ${werewolfSentence}: ${names}`;
      await AcknowledgeMessage(player, prompt);
    }
    await player.send('You go back to sleep.');

    Log.info('Minion turn played.');
  }
}

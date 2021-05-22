import { AcknowledgeMessage } from '../ConversationHelper';
import { RoleName } from '../enums/RoleName';
import { Game } from '../Game';
import { Log } from '../Log';
import { Player } from '../Player';
import { Role } from './Role';

export class Mason extends Role {
  readonly name = RoleName.mason;

  async doTurn(game: Game, player: Player): Promise<void> {
    const gameState = game.gameState;
    if (gameState.playerRoles.mason?.length !== 1) {
      const masons = gameState.playerRoles.mason;
      // Assert that there are masons
      if (masons === undefined) {
        throw new Error('Invalid gamestate, no masons in the game.');
      }
      const otherMasons = masons.filter(
        (otherPlayer) => otherPlayer.id !== player.id
      );

      const otherNames = otherMasons
        .map((otherMason) => otherMason.tag)
        .join(' and ');

      const masonSentence =
        otherMasons.length === 1 ? 'mason is' : 'masons are';
      const prompt = `You wake up and see that the other ${masonSentence} ${otherNames}.
      Click on the reaction to acknowledge and go back to sleep.`;
      await AcknowledgeMessage(player, prompt);
      await player.send("You look in each other's eyes and go back to sleep.");
    } else {
      const prompt = `You wake and you see that you are the only mason.
      Click on the reaction to acknowledge and go back to sleep.`;
      await AcknowledgeMessage(player, prompt);
      await player.send('You go back to sleep.');
    }
    Log.info('Mason turn played.');
  }
}

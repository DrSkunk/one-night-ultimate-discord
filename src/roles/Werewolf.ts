import { AcknowledgeMessage, ChooseTableCard } from '../ConversationHelper';
import { RoleName } from '../enums/RoleName';
import { GameState } from '../GameState';
import { Log } from '../Log';
import { Player } from '../Player';
import { Role } from './Role';

export class Werewolf extends Role {
  name = RoleName.werewolf;

  async doTurn(gameState: GameState, player: Player): Promise<void> {
    if (gameState.playerRoles.werewolf?.length !== 1) {
      const werewolves = gameState.playerRoles.werewolf;
      // Assert that there are werewolves
      if (werewolves === undefined) {
        throw new Error('Invalid gamestate, no werewolves in the game.');
      }
      const otherWerewolves = werewolves.filter(
        (otherPlayer) => otherPlayer.id !== player.id
      );

      const otherNames = otherWerewolves
        .map((otherWerewolf) => otherWerewolf.name)
        .join(' and ');

      const werewolfSentence =
        otherWerewolves.length === 1 ? 'werewolf is' : 'werewolves are';
      const prompt = `You wake up and see that the other ${werewolfSentence} ${otherNames}.
Click on the reaction to acknowledge and go back to sleep.`;
      await AcknowledgeMessage(player, prompt);

      player.send("You look in each other's eyes and go back to sleep.");
    } else {
      player.send('You wake and you see that you are the only werewolf.');

      await ChooseTableCard(gameState, player, 1);
    }
    Log.info('Werewolf turn played.');
  }

  clone(): Role {
    return new Werewolf();
  }
}

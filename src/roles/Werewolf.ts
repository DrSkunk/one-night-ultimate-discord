import { AcknowledgeMessage, ChooseTableCard } from '../ConversationHelper';
import { RoleName } from '../enums/RoleName';
import { Game } from '../Game';
import { Log } from '../Log';
import { Player } from '../Player';
import { Role } from './Role';

export class Werewolf extends Role {
  readonly name = RoleName.werewolf;

  async doTurn(game: Game, player: Player): Promise<void> {
    const { tableRoles, playerRoles } = game.gameState;
    if (playerRoles.werewolf.size !== 1) {
      const werewolves = playerRoles.werewolf;
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
        otherWerewolves.size === 1 ? 'werewolf is' : 'werewolves are';
      const prompt = `You wake up and see that the other ${werewolfSentence} ${otherNames}.`;
      await AcknowledgeMessage(player, prompt);

      player.send("You look in each other's eyes and go back to sleep.");
    } else {
      player.send('You wake and you see that you are the only werewolf.');

      const chosenCard = (
        await ChooseTableCard(
          game.gameState,
          player,
          1,
          'You can take a look at a card on the table'
        )
      )[0];
      const emoji = Object.keys(chosenCard)[0];
      const roleName = tableRoles[chosenCard[emoji]].name;
      await AcknowledgeMessage(
        player,
        `You see that the card ${emoji} has the role ${roleName}`
      );
      await player.send('You go back to sleep.');
    }
    Log.info('Werewolf turn played.');
  }

  clone(): Role {
    return new Werewolf();
  }
}

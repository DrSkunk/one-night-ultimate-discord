import { GuildMember } from 'discord.js';
import { RoleName } from '../enums/RoleName';
import { Log } from '../Log';
import { GameState } from '../types/GameState';
import { Role } from './Role';

export class Mason extends Role {
  name = RoleName.mason;

  async doTurn(gameState: GameState, player: GuildMember): Promise<void> {
    if (gameState.playerRoles.mason?.length !== 1) {
      const masons = gameState.playerRoles.mason;
      // Assert that there are masons
      if (masons === undefined) {
        throw new Error('Invalid gamestate, no masons in the game.');
      }
      const otherMasons = masons.filter(
        (otherPlayer) => otherPlayer.getGuildMember().id !== player.id
      );

      const otherNames = otherMasons
        .map((otherMason) => {
          if (otherMason.getGuildMember().nickname) {
            return otherMason?.getGuildMember().nickname;
          }
          return otherMason?.getGuildMember().displayName;
        })
        .join(' and ');

      const masonSentence =
        otherMasons.length === 1 ? 'mason is' : 'masons are';
      await player.send(
        `You wake up and see that the other ${masonSentence} ${otherNames}.`
      );
      player.send("You look in each other's eyes and go back to sleep.");
    } else {
      await player.send(
        `You wake and you see that you are the only mason.
You go back to sleep.`
      );
    }
    Log.info('Mason turn played.');
  }
}

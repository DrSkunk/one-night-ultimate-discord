import { GuildMember, MessageReaction } from 'discord.js';
import { MAX_RETRIES, REACTION_WAIT_TIME } from '../Constants';
import { RoleName } from '../enums/RoleName';
import { Log } from '../Log';
import { GameState } from '../types/GameState';
import { Role } from './Role';

export class Werewolf extends Role {
  name = RoleName.werewolf;

  private retryCounter = 0;

  async doTurn(gameState: GameState, player: GuildMember): Promise<void> {
    if (gameState.playerRoles.werewolf?.length !== 1) {
      const werewolves = gameState.playerRoles.werewolf;
      // Assert that there are werewolves
      if (werewolves === undefined) {
        throw new Error('Invalid gamestate, no werewolves in the game.');
      }
      const otherWerewolves = werewolves.filter(
        (otherPlayer) => otherPlayer.getGuildMember().id !== player.id
      );

      const otherNames = otherWerewolves
        .map((otherWerewolf) => {
          if (otherWerewolf.getGuildMember().nickname) {
            return otherWerewolf?.getGuildMember().nickname;
          }
          return otherWerewolf?.getGuildMember().displayName;
        })
        .join(' and ');

      const werewolfSentence =
        otherWerewolves.length === 1 ? 'werewolf is' : 'werewolves are';
      const message = await player.send(
        `You wake up and see that the other ${werewolfSentence} ${otherNames}.
Click on the reaction to acknowledge and go back to sleep.`
      );

      await message.react('👍');
      const filter = (reaction: MessageReaction) => {
        return reaction.emoji.name === '👍';
      };

      try {
        const collected = await message.awaitReactions(filter, {
          max: 1,
          time: REACTION_WAIT_TIME,
          errors: ['time'],
        });
        Log.log('Collected a reaction', collected);
      } catch (error) {
        await player.send('Reaction timed out. ');
      }
      player.send("You look in each other's eyes and go back to sleep.");
    } else {
      await this.sendChooseCardMessage(gameState, player);
    }
    Log.info('Werewolf turn played.');
  }

  setPlayer(player: GuildMember): void {
    this._player = player;
  }

  async sendChooseCardMessage(
    gameState: GameState,
    player: GuildMember
  ): Promise<void> {
    const message = await player.send(
      `You wake and you see that you are the only werewolf.
You can take a look at one of the cards on the table.
Which one do you choose?`
    );
    const reactions: string[] = ['1️⃣', '2️⃣', '3️⃣'];
    for (const reaction of reactions) {
      await message.react(reaction);
    }
    const filter = (reaction: MessageReaction) => {
      return reactions.includes(reaction.emoji.name);
    };
    try {
      const collected = await message.awaitReactions(filter, {
        max: 1,
        time: REACTION_WAIT_TIME,
        errors: ['time'],
      });
      Log.log('Collected a reaction', collected);
      const emoji = Object.values(collected.array())[0].emoji.name;
      const cardIndex = reactions.indexOf(emoji);
      const cardRole = gameState.tableRoles[cardIndex].name;
      player.send(
        `You see that the card has the role ${cardRole} and you go back to sleep.`
      );
    } catch (error) {
      Log.error(error.message);
      await player.send('Reaction timed out. Please select a card.');
      if (this.retryCounter + 1 < MAX_RETRIES) {
        this.retryCounter++;
        await this.sendChooseCardMessage(gameState, player);
      } else {
        throw new Error(
          'Waited to long for a response from one of the players. Aborting game.'
        );
      }
    }
  }
}

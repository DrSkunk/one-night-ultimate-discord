import { GuildMember, MessageReaction, User } from 'discord.js';
import { RoleName } from '../enums/RoleName';
import { Log } from '../Log';
import { GameState } from '../types/GameState';
import { Role } from './Role';

export class Werewolf extends Role {
  name = RoleName.werewolf;

  async doTurn(gameState: GameState, player: GuildMember): Promise<void> {
    await player.send('You wake up!');

    if (gameState.werewolf?.length === 2) {
      const otherWerewolf = gameState.werewolf.find(
        (otherPlayer) => otherPlayer.getGuildMember().id !== player.id
      );
      await player.send(
        'You see that the other werewolf is ' +
          otherWerewolf?.getGuildMember().nickname
      );
    } else {
      const message = await player.send(
        'You are the only werewolf. You can take a look at one of the cards in the middle. Which one do you choose?'
      );
      await message.react('1️⃣');
      await message.react('2️⃣');
      await message.react('3️⃣');
      const filter = (reaction: MessageReaction, user: User) => {
        return (
          reaction.emoji.name === '1️⃣' ||
          reaction.emoji.name === '2️⃣' ||
          reaction.emoji.name === '3️⃣'
        );
      };
      try {
        const collected = await message.awaitReactions(filter, {
          max: 1,
          time: 30000,
          errors: ['time'],
        });
        console.log(collected.size);
      } catch (error) {
        console.log(error);

        // console.log(`After a minute, only ${collected.size} out of 4 reacted.`);
      }
    }
    await player.send('You go back to sleep');
    Log.info('Werewolf played his turn.');
  }

  setPlayer(player: GuildMember): void {
    this._player = player;
  }
}

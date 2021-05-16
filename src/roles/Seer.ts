import { MessageReaction } from 'discord.js';
import { MAX_RETRIES, REACTION_WAIT_TIME } from '../Constants';
import { RoleName } from '../enums/RoleName';
import { Log } from '../Log';
import { Player } from '../Player';
import { GameState } from '../types/GameState';
import { Role } from './Role';

export class Seer extends Role {
  name = RoleName.seer;
  private retryCounter = 0;

  async doTurn(gameState: GameState, player: Player): Promise<void> {
    const lookAtPlayerCards = await this.sendChooseGroupMessage(
      gameState,
      player
    );
    this.retryCounter = 0;
    if (lookAtPlayerCards) {
      await this.sendChoosePlayerMessage(gameState, player);
    } else {
      await this.sendChooseCardMessage(gameState, player);
    }
    Log.info('Seer turn played.');
  }

  async sendChooseGroupMessage(
    gameState: GameState,
    player: Player
  ): Promise<boolean> {
    const message = await player.send(`Do you either:
- 1️⃣: Look at another player's card
- 2️⃣: Look at two cards in the middle?`);
    const reactions: string[] = ['1️⃣', '2️⃣'];
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
      const reactionIndex = reactions.indexOf(emoji);
      return reactionIndex === 0;
    } catch (error) {
      Log.error(error.message);
      await player.send('Reaction timed out. Please select a card.');
      if (this.retryCounter + 1 < MAX_RETRIES) {
        this.retryCounter++;
        return await this.sendChooseGroupMessage(gameState, player);
      } else {
        throw new Error(
          'Waited to long for a response from one of the players. Aborting game.'
        );
      }
    }
  }

  async sendChooseCardMessage(
    gameState: GameState,
    player: Player
  ): Promise<void> {
    const message = await player.send(`Which two cards do you choose?`);
    const reactions: string[] = ['1️⃣', '2️⃣', '3️⃣'];
    for (const reaction of reactions) {
      await message.react(reaction);
    }
    const filter = (reaction: MessageReaction) => {
      return reactions.includes(reaction.emoji.name);
    };
    try {
      const collected = await message.awaitReactions(filter, {
        max: 2,
        time: REACTION_WAIT_TIME,
        errors: ['time'],
      });
      Log.log('Collected reactions', collected);
      let selectedRoles = '';
      for (const reaction of Object.values(collected.array())) {
        const reactionIndex = reactions.indexOf(reaction.emoji.name);
        const cardRole = gameState.tableRoles[reactionIndex].name;
        selectedRoles += `\n${reaction.emoji.name}: ${cardRole}`;
      }

      player.send(
        `You view the following cards:${selectedRoles}\nYou go back to sleep.`
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

  async sendChoosePlayerMessage(
    gameState: GameState,
    player: Player
  ): Promise<void> {
    const allPlayers: Player[] = Object.values(
      gameState.playerRoles
    ).flat() as Player[];
    const otherPlayers = allPlayers.filter(
      (playerFromList) => playerFromList.id !== player.id
    );

    const reactions: string[] = [
      '1️⃣',
      '2️⃣',
      '3️⃣',
      '4️⃣',
      '5️⃣',
      '6️⃣',
      '7️⃣',
      '8️⃣',
      '9️⃣',
      '🔟',
    ].slice(0, otherPlayers.length);
    const playerList = otherPlayers.reduce(
      (acc, player, i) => acc + `\n- ${reactions[i]}: ${player.name}`,
      ''
    );
    const message = await player.send(
      `Choose a player to view the role:${playerList}`
    );
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
      const cardRole = otherPlayers[cardIndex].role?.name;
      player.send(
        `You see that ${otherPlayers[cardIndex].name} has the role ${cardRole} and you go back to sleep.`
      );
    } catch (error) {
      Log.error(error.message);
      await player.send('Reaction timed out. Please select a card.');
      if (this.retryCounter + 1 < MAX_RETRIES) {
        this.retryCounter++;
        await this.sendChoosePlayerMessage(gameState, player);
      } else {
        throw new Error(
          'Waited to long for a response from one of the players. Aborting game.'
        );
      }
    }
  }
}

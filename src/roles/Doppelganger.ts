import { MessageReaction } from 'discord.js';
import { MAX_RETRIES, REACTION_WAIT_TIME } from '../Constants';
import { RoleName } from '../enums/RoleName';
import { Log } from '../Log';
import { Player } from '../Player';
import { GameState } from '../types/GameState';
import { Role } from './Role';

export class Doppelganger extends Role {
  name = RoleName.doppelganger;
  retryCounter = 0;

  async doTurn(gameState: GameState, player: Player): Promise<void> {
    await this.sendChoosePlayerMessage(gameState, player);
    Log.info('Doppelganger turn played.');
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
      `Choose a player to become that role:${playerList}`
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
      if (!cardRole) {
        throw new Error('Invalid gamestate');
      }

      const mimicRoles = [
        RoleName.doppelganger,
        RoleName.werewolf,
        RoleName.minion,
        RoleName.mason,
        RoleName.insomniac,
      ];
      if (mimicRoles.includes(cardRole)) {
        gameState.playerRoles[cardRole]?.push(player);
        player.send(
          `You see that ${otherPlayers[cardIndex].name} has the role ${cardRole}
You now also have the role ${cardRole}.
You go back to sleep.`
        );
      }
      const instantRoles = [
        RoleName.seer,
        RoleName.robber,
        RoleName.troublemaker,
        RoleName.drunk,
      ];
      if (instantRoles.includes(cardRole)) {
        player.send(
          `You see that ${otherPlayers[cardIndex].name} has the role ${cardRole}
You now also have the role ${cardRole} and immediately execute it.`
        );
      }
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

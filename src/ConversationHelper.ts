import { MessageReaction } from 'discord.js';
import { REACTION_WAIT_TIME, MAX_RETRIES } from './Constants';
import { Log } from './Log';
import { Player } from './Player';
import { GameState } from './types/GameState';

export async function ChooseTableCard(
  gameState: GameState,
  player: Player,
  amountOfCardstoPick: number,
  retryCounter = 0
): Promise<void> {
  const cardsText = amountOfCardstoPick
    ? 'a card'
    : `${amountOfCardstoPick} cards`;
  const message =
    await player.send(`You can take a look at ${cardsText} on the table.
Which do you choose?`);
  const reactions: string[] = ['1️⃣', '2️⃣', '3️⃣'];
  for (const reaction of reactions) {
    await message.react(reaction);
  }
  const filter = (reaction: MessageReaction) => {
    return reactions.includes(reaction.emoji.name);
  };
  try {
    const collected = await message.awaitReactions(filter, {
      max: amountOfCardstoPick,
      time: REACTION_WAIT_TIME,
      errors: ['time'],
    });
    Log.log('Collected reaction(s)', collected.array());

    if (amountOfCardstoPick === 1) {
      const reaction = Object.values(collected.array())[0];
      const reactionIndex = reactions.indexOf(reaction.emoji.name);
      const cardRole = gameState.tableRoles[reactionIndex].name;

      player.send(
        `You see that the card ${reaction.emoji.name} has the role ${cardRole} and you go back to sleep.`
      );
    } else {
      let selectedRoles = '';
      for (const reaction of Object.values(collected.array())) {
        const reactionIndex = reactions.indexOf(reaction.emoji.name);
        const cardRole = gameState.tableRoles[reactionIndex].name;
        selectedRoles += `\n${reaction.emoji.name}: ${cardRole}`;
      }
      player.send(
        `You view the following cards:${selectedRoles}\nYou go back to sleep.`
      );
    }
  } catch (error) {
    Log.error(error.message);

    await player.send(`Reaction timed out. Please select ${cardsText}.`);
    if (retryCounter + 1 < MAX_RETRIES) {
      await ChooseTableCard(
        gameState,
        player,
        amountOfCardstoPick,
        retryCounter + 1
      );
    } else {
      throw new Error(
        'Waited to long for a response from one of the players. Aborting game.'
      );
    }
  }
}

export async function AcknowledgeMessage(
  player: Player,
  text: string
): Promise<void> {
  const message = await player.send(text);
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
    Log.log('Collected a reaction', collected.array());
  } catch (error) {
    await player.send('Reaction timed out. ');
  }
}

export async function ChoosePlayer(
  gameState: GameState,
  player: Player,
  retryCounter = 0,
  switchCards = false
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
  const text = switchCards
    ? 'Choose two players to switch their roles'
    : 'Choose a player to view the role';
  const message = await player.send(`${text}:${playerList}`);
  for (const reaction of reactions) {
    await message.react(reaction);
  }
  const filter = (reaction: MessageReaction) => {
    return reactions.includes(reaction.emoji.name);
  };
  try {
    const max = switchCards ? 2 : 1;
    const collected = await message.awaitReactions(filter, {
      max,
      time: REACTION_WAIT_TIME,
      errors: ['time'],
    });
    Log.log('Collected reaction(s)', collected.array());

    if (switchCards) {
      const emoji1 = Object.values(collected.array())[0].emoji.name;
      const emoji2 = Object.values(collected.array())[1].emoji.name;
      const cardIndex1 = reactions.indexOf(emoji1);
      const cardIndex2 = reactions.indexOf(emoji2);
      player.send(
        `You switch the roles of ${otherPlayers[cardIndex1].name} and ${otherPlayers[cardIndex2].name}, and you go back to sleep.`
      );
    } else {
      const emoji = Object.values(collected.array())[0].emoji.name;
      const cardIndex = reactions.indexOf(emoji);
      const cardRole = otherPlayers[cardIndex].role?.name;
      player.send(
        `You see that ${otherPlayers[cardIndex].name} has the role ${cardRole} and you go back to sleep.`
      );
    }
  } catch (error) {
    Log.error(error.message);
    await player.send('Reaction timed out. Please select a card.');
    if (retryCounter + 1 < MAX_RETRIES) {
      await ChoosePlayer(gameState, player, retryCounter + 1, switchCards);
    } else {
      throw new Error(
        'Waited to long for a response from one of the players. Aborting game.'
      );
    }
  }
}

export async function ChoosePlayerOrTable(
  gameState: GameState,
  player: Player,
  retryCounter = 0
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
    if (retryCounter + 1 < MAX_RETRIES) {
      return await ChoosePlayerOrTable(gameState, player, retryCounter + 1);
    } else {
      throw new Error(
        'Waited to long for a response from one of the players. Aborting game.'
      );
    }
  }
}

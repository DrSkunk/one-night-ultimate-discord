import { MessageReaction, TextChannel, User } from 'discord.js';
import { REACTION_WAIT_TIME, MAX_RETRIES, SETUP_WAIT_TIME } from './Constants';
import { ChoosePlayerType } from './enums/ChoosePlayer';
import { ReactionChoice } from './enums/ReactionChoice';
import { RoleName } from './enums/RoleName';
import { GameState } from './GameState';
import { Log } from './Log';
import { Player } from './Player';

export async function ChooseRoles(
  author: User,
  textChannel: TextChannel,
  amountToPick: number
): Promise<RoleName[]> {
  const specialRoles = {
    [ReactionChoice['0️⃣']]: RoleName.doppelganger,
    [ReactionChoice['1️⃣']]: RoleName.drunk,
    [ReactionChoice['2️⃣']]: RoleName.hunter,
    [ReactionChoice['3️⃣']]: RoleName.insomniac,
    [ReactionChoice['4️⃣']]: RoleName.mason,
    [ReactionChoice['5️⃣']]: RoleName.mason,
    [ReactionChoice['6️⃣']]: RoleName.minion,
    [ReactionChoice['7️⃣']]: RoleName.robber,
    [ReactionChoice['8️⃣']]: RoleName.seer,
    [ReactionChoice['9️⃣']]: RoleName.tanner,
    [ReactionChoice['🔟']]: RoleName.troublemaker,
  };
  const rolesText = Object.keys(specialRoles).reduce(
    (acc, emoji) =>
      acc + `\n${emoji}: ${specialRoles[emoji as ReactionChoice]}`,
    ''
  );
  const message = await textChannel.send(
    `You must pick ${amountToPick} roles, which do you want to add?${rolesText}`
  );
  for (const reaction of Object.keys(specialRoles)) {
    await message.react(reaction);
  }

  const filter = (reaction: MessageReaction, user: User) => {
    return (
      Object.keys(specialRoles).includes(reaction.emoji.name) &&
      user.id === author.id
    );
  };
  try {
    const collected = await message.awaitReactions(filter, {
      max: amountToPick,
      time: SETUP_WAIT_TIME,
      errors: ['time'],
    });
    Log.log('Collected reaction(s)');

    const roleNames = Object.values(collected.array()).map((reaction) => {
      const reactionChoice = reaction.emoji.name as ReactionChoice;
      return specialRoles[reactionChoice];
    });

    return roleNames;
  } catch (error) {
    throw new Error('Waited too long for a response. Aborting...');
  }
}

export async function ChooseTableCard(
  gameState: GameState,
  player: Player,
  amountOfCardstoPick: number,
  isDrunk = false,
  retryCounter = 0
): Promise<number[]> {
  const cardsText = amountOfCardstoPick
    ? 'a card'
    : `${amountOfCardstoPick} cards`;
  const lookText = isDrunk
    ? 'You must take a card from the table.'
    : `You can take a look at ${cardsText} on the table.`;
  const message = await player.send(`${lookText}\nWhich do you choose?`);
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
    Log.log('Collected reaction(s)');

    if (amountOfCardstoPick === 1) {
      const reaction = Object.values(collected.array())[0];
      const reactionIndex = reactions.indexOf(reaction.emoji.name);
      const cardRole = gameState.tableRoles[reactionIndex].name;
      if (isDrunk) {
        player.send(
          `You take card ${reaction.emoji.name} and go back to sleep.`
        );
      } else {
        player.send(
          `You see that the card ${reaction.emoji.name} has the role ${cardRole} and you go back to sleep.`
        );
      }
      return [reactionIndex];
    } else {
      let selectedRoles = '';
      const cardIndexes = [];
      for (const reaction of Object.values(collected.array())) {
        const reactionIndex = reactions.indexOf(reaction.emoji.name);
        const cardRole = gameState.tableRoles[reactionIndex].name;
        selectedRoles += `\n${reaction.emoji.name}: ${cardRole}`;
        cardIndexes.push(reactionIndex);
      }
      player.send(
        `You view the following cards:${selectedRoles}\nYou go back to sleep.`
      );
      return cardIndexes;
    }
  } catch (error) {
    Log.error(error);

    await player.send(`Reaction timed out. Please select ${cardsText}.`);
    if (retryCounter + 1 < MAX_RETRIES) {
      return await ChooseTableCard(
        gameState,
        player,
        amountOfCardstoPick,
        isDrunk,
        retryCounter + 1
      );
    } else {
      throw new Error(
        'Waited to long for a response from one of the players. Aborting game.'
      );
    }
  }
}

export async function ChooseToDoAction(
  player: Player,
  text: string
): Promise<boolean> {
  const message = await player.send(text);
  const reactions: string[] = ['✔️', '❌'];
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
    Log.log('Collected a reaction');
    return Object.values(collected.array())[0].emoji.name === reactions[0];
  } catch (error) {
    await player.send('Reaction timed out. ');
    return false;
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
    await message.awaitReactions(filter, {
      max: 1,
      time: REACTION_WAIT_TIME,
      errors: ['time'],
    });
    Log.log('Collected a reaction');
  } catch (error) {
    await player.send('Reaction timed out. ');
  }
}

export async function ChoosePlayer(
  allPlayers: Player[],
  player: Player,
  choosePlayerType: ChoosePlayerType = ChoosePlayerType.view,
  retryCounter = 0
): Promise<Player[]> {
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
    (acc, player, i) => acc + `\n- ${reactions[i]}: ${player.tag}`,
    ''
  );
  let text = '';
  switch (choosePlayerType) {
    case ChoosePlayerType.kill:
      text = 'Choose a player to kill';
      break;
    case ChoosePlayerType.switch:
      text = 'Choose two players to switch their roles';
      break;
    case ChoosePlayerType.clone:
      text = 'Choose a player to clone their role';
      break;
    case ChoosePlayerType.view:
      text = 'Choose a player to view their role';
      break;
  }

  const message = await player.send(`${text}:${playerList}`);
  for (const reaction of reactions) {
    await message.react(reaction);
  }
  const filter = (reaction: MessageReaction) => {
    return reactions.includes(reaction.emoji.name);
  };
  try {
    const max = choosePlayerType === ChoosePlayerType.switch ? 2 : 1;
    const collected = await message.awaitReactions(filter, {
      max,
      time: REACTION_WAIT_TIME,
      errors: ['time'],
    });
    Log.log('Collected a reaction');

    if (choosePlayerType === ChoosePlayerType.switch) {
      const emoji1 = Object.values(collected.array())[0].emoji.name;
      const emoji2 = Object.values(collected.array())[1].emoji.name;
      const cardIndex1 = reactions.indexOf(emoji1);
      const cardIndex2 = reactions.indexOf(emoji2);
      player.send(
        `You switch the roles of ${otherPlayers[cardIndex1].tag} and ${otherPlayers[cardIndex2].tag}, and you go back to sleep.`
      );
      return [otherPlayers[cardIndex1], otherPlayers[cardIndex2]];
    }

    const emoji = Object.values(collected.array())[0].emoji.name;
    const cardIndex = reactions.indexOf(emoji);
    const votedPlayer = otherPlayers[cardIndex];

    if (choosePlayerType === ChoosePlayerType.kill) {
      player.send(`You vote to kill ${votedPlayer.tag}.`);
    }

    return [votedPlayer];
  } catch (error) {
    Log.error(error);
    await player.send('Reaction timed out. Please make a selection.');
    if (retryCounter + 1 < MAX_RETRIES) {
      await ChoosePlayer(
        allPlayers,
        player,
        choosePlayerType,
        retryCounter + 1
      );
    } else {
      throw new Error(
        'Waited to long for a response from one of the players. Aborting game.'
      );
    }
    return [];
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
    Log.log('Collected a reaction');
    const emoji = Object.values(collected.array())[0].emoji.name;
    const reactionIndex = reactions.indexOf(emoji);
    return reactionIndex === 0;
  } catch (error) {
    Log.error(error);
    await player.send('Reaction timed out. Please make a selection.');
    if (retryCounter + 1 < MAX_RETRIES) {
      return await ChoosePlayerOrTable(gameState, player, retryCounter + 1);
    } else {
      throw new Error(
        'Waited to long for a response from one of the players. Aborting game.'
      );
    }
  }
}

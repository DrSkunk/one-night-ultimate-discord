import { randomUUID } from 'node:crypto';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  type MessageActionRowComponentBuilder,
  type MessageComponentInteraction,
} from 'discord.js';
import { MAX_RETRIES, PROMPT_WAIT_TIME, CARDS_ON_TABLE } from './Constants';
import { ChoosePlayerType } from './enums/ChoosePlayer';
import { Log } from './Log';
import type { Player } from './Player';
import { UserError } from './UserError';

const responseError = new UserError(
  'Waited too long for a response from one of the players. Aborting game.'
);

type Row = ActionRowBuilder<MessageActionRowComponentBuilder>;

export function newCustomId(scope: string, value: string): string {
  return `${scope}:${randomUUID()}:${value}`;
}

export function customIdValue(customId: string): string {
  return customId.split(':').slice(2).join(':');
}

export function tableCardLabel(index: number): string {
  return `Card ${index + 1}`;
}

function buttonRow(
  buttons: { label: string; value: string; style?: ButtonStyle }[]
): Row {
  return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    buttons.map(({ label, value, style }) =>
      new ButtonBuilder()
        .setCustomId(newCustomId('prompt', value))
        .setLabel(label)
        .setStyle(style ?? ButtonStyle.Secondary)
    )
  );
}

function selectRow(
  placeholder: string,
  options: { label: string; value: string }[],
  amount: number
): Row {
  return new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(newCustomId('prompt', 'select'))
      .setPlaceholder(placeholder)
      .setMinValues(amount)
      .setMaxValues(amount)
      .addOptions(
        options.map(({ label, value }) => ({
          label: label.slice(0, 100),
          value,
        }))
      )
  );
}

/**
 * Send an ephemeral prompt to the player and wait for them to use one of its
 * components. Returns the selected values, or null on timeout.
 */
async function ask(
  player: Player,
  content: string,
  components: Row[],
  describe: (values: string[]) => string
): Promise<string[] | null> {
  const message = await player.send({ content, components });
  let interaction: MessageComponentInteraction;
  try {
    interaction = await message.awaitMessageComponent({
      filter: (i) => i.user.id === player.id,
      time: PROMPT_WAIT_TIME,
    });
  } catch {
    Log.warn(`Prompt for ${player.name} timed out`);
    await player
      .edit(message, {
        content: `${content}\n> ⏰ Time is up.`,
        components: [],
      })
      .catch((error) => Log.debug('Unable to edit timed out prompt', error));
    return null;
  }

  const values = interaction.isStringSelectMenu()
    ? interaction.values
    : [customIdValue(interaction.customId)];
  await interaction.update({
    content: `${content}\n> ✅ ${describe(values)}`,
    components: [],
  });
  player.bind(interaction);
  return values;
}

async function withRetries<T>(
  player: Player,
  attempt: () => Promise<T | null>
): Promise<T> {
  for (let retry = 0; retry < MAX_RETRIES; retry++) {
    const result = await attempt();
    if (result !== null) {
      return result;
    }
    if (retry + 1 < MAX_RETRIES) {
      await player.send('Time is up. Please make a selection.');
    }
  }
  throw responseError;
}

export async function ChooseTableCard(
  player: Player,
  amountOfCardsToPick: 1 | 2,
  text: string
): Promise<number[]> {
  const cards = Array.from({ length: CARDS_ON_TABLE }, (_, index) => ({
    label: tableCardLabel(index),
    value: String(index),
  }));
  const describeCards = (values: string[]) =>
    `You chose ${values.map((v) => tableCardLabel(Number(v))).join(' and ')}.`;

  const values = await withRetries(player, () =>
    ask(
      player,
      text,
      amountOfCardsToPick === 1
        ? [buttonRow(cards)]
        : [selectRow('Pick two cards', cards, amountOfCardsToPick)],
      describeCards
    )
  );
  return values.map(Number);
}

export async function ChooseToDoAction(
  player: Player,
  text: string
): Promise<boolean> {
  const values = await ask(
    player,
    text,
    [
      buttonRow([
        { label: 'Yes', value: 'yes', style: ButtonStyle.Success },
        { label: 'No', value: 'no', style: ButtonStyle.Danger },
      ]),
    ],
    ([value]) => (value === 'yes' ? 'Yes' : 'No')
  );
  if (values === null) {
    await player.send('Time is up, not doing the action.');
    return false;
  }
  return values[0] === 'yes';
}

export async function AcknowledgeMessage(
  player: Player,
  text: string
): Promise<void> {
  const values = await ask(
    player,
    text,
    [buttonRow([{ label: 'OK', value: 'ok', style: ButtonStyle.Primary }])],
    () => 'Acknowledged.'
  );
  if (values === null) {
    Log.info(`${player.name} did not acknowledge in time, continuing.`);
  }
}

export async function ChoosePlayer(
  allPlayers: Player[],
  player: Player,
  choosePlayerType: ChoosePlayerType,
  text: string
): Promise<Player[]> {
  const otherPlayers = allPlayers.filter(({ id }) => id !== player.id);
  const amount = choosePlayerType === ChoosePlayerType.switch ? 2 : 1;
  const byId = (id: string) => {
    const found = otherPlayers.find((p) => p.id === id);
    if (!found) {
      throw new UserError('Selected an unknown player.');
    }
    return found;
  };

  const values = await withRetries(player, () =>
    ask(
      player,
      text,
      [
        selectRow(
          amount === 1 ? 'Choose a player' : 'Choose two players',
          otherPlayers.map(({ id, name }) => ({ label: name, value: id })),
          amount
        ),
      ],
      (ids) => `You chose ${ids.map((id) => byId(id).name).join(' and ')}.`
    )
  );
  return values.map(byId);
}

/** Returns true when the player picks another player's card, false for table cards. */
export async function ChoosePlayerOrTable(
  player: Player,
  text: string
): Promise<boolean> {
  const values = await withRetries(player, () =>
    ask(
      player,
      text,
      [
        buttonRow([
          { label: "Another player's card", value: 'player' },
          { label: 'Two cards in the middle', value: 'table' },
        ]),
      ],
      ([value]) =>
        value === 'player'
          ? "You look at another player's card."
          : 'You look at two cards in the middle.'
    )
  );
  return values[0] === 'player';
}

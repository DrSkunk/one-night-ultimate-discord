import { describe, expect, it } from 'bun:test';
import { ActionRowBuilder } from 'discord.js';
import type { Message, MessageComponentInteraction } from 'discord.js';
import {
  ChoosePlayer,
  ChooseTableCard,
  ChooseToDoAction,
} from '../src/ConversationHelper';
import { ChoosePlayerType } from '../src/enums/ChoosePlayer';
import { Player, type PlayerMessage } from '../src/Player';

type ScriptedInteraction = Error | { customId: string; values?: string[] };

class PromptPlayer extends Player {
  public readonly sent: PlayerMessage[] = [];
  public readonly edited: unknown[] = [];
  public readonly updates: unknown[] = [];
  public bindCount = 0;
  private readonly scripts: ScriptedInteraction[];

  constructor(scripts: ScriptedInteraction[]) {
    super('100000000000000001', 'Ada');
    this.scripts = scripts;
  }

  override async send(content: PlayerMessage): Promise<Message> {
    this.sent.push(content);
    if (typeof content === 'string') {
      return {} as Message;
    }

    return {
      awaitMessageComponent: async () => {
        const script = this.scripts.shift();
        if (!script) {
          throw new Error('No interaction was scripted.');
        }
        if (script instanceof Error) {
          throw script;
        }

        return {
          user: { id: this.id },
          customId: script.customId,
          isStringSelectMenu: () => script.values !== undefined,
          values: script.values,
          update: async (options: unknown) => this.updates.push(options),
        } as unknown as MessageComponentInteraction;
      },
    } as unknown as Message;
  }

  override async edit(_message: Message, options: unknown): Promise<void> {
    this.edited.push(options);
  }

  override bind(interaction: MessageComponentInteraction): void {
    expect(interaction.user.id).toBe(this.id);
    this.bindCount++;
  }
}

describe('ConversationHelper', function () {
  it('uses a button selection and acknowledges the interaction', async function () {
    const player = new PromptPlayer([{ customId: 'prompt:nonce:2' }]);

    await expect(ChooseTableCard(player, 1, 'Pick a card')).resolves.toEqual([
      2,
    ]);

    const prompt = player.sent[0];
    expect(typeof prompt).not.toBe('string');
    if (typeof prompt === 'string') {
      throw new Error('Expected an interaction prompt.');
    }
    const row = prompt.components?.[0];
    if (!(row instanceof ActionRowBuilder)) {
      throw new Error('Expected a button row.');
    }
    expect(row.components).toHaveLength(3);
    expect(player.updates).toHaveLength(1);
    expect(player.bindCount).toBe(1);
  });

  it('retries a timed-out selection and supports selecting two players', async function () {
    const player = new PromptPlayer([
      new Error('Timed out'),
      {
        customId: 'prompt:nonce:select',
        values: ['100000000000000002', '100000000000000003'],
      },
    ]);
    const first = new Player('100000000000000002', 'Grace');
    const second = new Player('100000000000000003', 'Linus');

    await expect(
      ChoosePlayer(
        [player, first, second],
        player,
        ChoosePlayerType.switch,
        'Choose players'
      )
    ).resolves.toEqual([first, second]);

    expect(player.sent).toHaveLength(3);
    expect(player.edited).toHaveLength(1);
    expect(player.bindCount).toBe(1);
  });

  it('treats a timed-out yes/no action as declined', async function () {
    const player = new PromptPlayer([new Error('Timed out')]);

    await expect(ChooseToDoAction(player, 'Do the action?')).resolves.toBe(
      false
    );

    expect(player.edited).toHaveLength(1);
    expect(player.sent).toContain('Time is up, not doing the action.');
    expect(player.bindCount).toBe(0);
  });
});

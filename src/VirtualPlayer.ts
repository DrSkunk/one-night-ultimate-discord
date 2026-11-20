import type { Message } from 'discord.js';
import { Log } from './Log';
import { Player, type PlayerMessage } from './Player';

/** Picks `amount` values out of `choices` for a prompt. */
export type VirtualStrategy = (
  choices: readonly string[],
  amount: number,
  prompt: string
) => string[];

export const randomStrategy: VirtualStrategy = (choices, amount) => {
  const pool = [...choices];
  const picked: string[] = [];
  while (picked.length < amount && pool.length > 0) {
    picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return picked;
};

export interface VirtualPlayerOptions {
  strategy?: VirtualStrategy;
  /** Delay before answering a prompt, so playtests feel less instant. */
  thinkTime?: number;
}

/**
 * A computer-controlled player for playtesting without other people. It never
 * touches Discord: messages are logged and prompts are answered by a strategy.
 */
export class VirtualPlayer extends Player {
  private readonly _strategy: VirtualStrategy;
  private readonly _thinkTime: number;

  constructor(id: string, name: string, options: VirtualPlayerOptions = {}) {
    super(id, name);
    this._strategy = options.strategy ?? randomStrategy;
    this._thinkTime = options.thinkTime ?? 0;
  }

  override get isVirtual(): boolean {
    return true;
  }

  override get tag(): string {
    return `🤖 **${this.name}**`;
  }

  override get canReceiveMessages(): boolean {
    return true;
  }

  override bind(): void {}

  override async send(content: PlayerMessage): Promise<Message> {
    const text = typeof content === 'string' ? content : content.content;
    Log.debug(`[virtual ${this.name}] received: ${text ?? '(embed)'}`);
    // Callers that need the returned message (prompts) never reach a virtual
    // player, see ConversationHelper.ask.
    return {} as Message;
  }

  override async edit(): Promise<void> {}

  public async choose(
    choices: readonly string[],
    amount: number,
    prompt: string
  ): Promise<string[]> {
    if (this._thinkTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, this._thinkTime));
    }
    const picked = this._strategy(choices, amount, prompt);
    if (
      picked.length !== amount ||
      new Set(picked).size !== amount ||
      picked.some((value) => !choices.includes(value))
    ) {
      throw new Error(
        `Virtual player ${this.name} made an invalid choice: ${picked.join(', ')}`
      );
    }
    return picked;
  }
}

export function createVirtualPlayers(
  amount: number,
  options: VirtualPlayerOptions = {}
): VirtualPlayer[] {
  return Array.from(
    { length: amount },
    (_, index) =>
      new VirtualPlayer(`virtual-${index + 1}`, `Bot ${index + 1}`, options)
  );
}

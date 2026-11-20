import {
  MessageFlags,
  type InteractionReplyOptions,
  type Message,
  type MessageComponentInteraction,
  type RepliableInteraction,
  type WebhookMessageEditOptions,
} from 'discord.js';
import { INTERACTION_TOKEN_LIFETIME } from './Constants';

type BindableInteraction = RepliableInteraction | MessageComponentInteraction;

export type PlayerMessage = string | Omit<InteractionReplyOptions, 'flags'>;

/**
 * A game participant. All secret information is delivered as ephemeral
 * follow-ups on the player's most recent acknowledged interaction.
 */
export class Player {
  public readonly id: string;
  public readonly name: string;
  private _interaction: BindableInteraction | null = null;
  private _boundAt = 0;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  get tag(): string {
    return `<@${this.id}>`;
  }

  get canReceiveMessages(): boolean {
    return (
      this._interaction !== null &&
      Date.now() - this._boundAt < INTERACTION_TOKEN_LIFETIME
    );
  }

  /** Bind an interaction that has already been replied to, deferred or updated. */
  public bind(interaction: BindableInteraction): void {
    if (interaction.user.id !== this.id) {
      throw new Error('Cannot bind an interaction of another user.');
    }
    this._interaction = interaction;
    this._boundAt = Date.now();
  }

  public async send(content: PlayerMessage): Promise<Message> {
    if (!this._interaction || !this.canReceiveMessages) {
      throw new Error(`Lost connection with ${this.name}.`);
    }
    const options = typeof content === 'string' ? { content } : content;
    return this._interaction.followUp({
      ...options,
      flags: MessageFlags.Ephemeral,
    });
  }

  /** Edit one of the ephemeral messages previously sent to this player. */
  public async edit(
    message: Message,
    options: WebhookMessageEditOptions
  ): Promise<void> {
    if (!this._interaction || !this.canReceiveMessages) {
      return;
    }
    await this._interaction.webhook.editMessage(message, options);
  }
}

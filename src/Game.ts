import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  MessageFlags,
  StringSelectMenuBuilder,
  type ButtonInteraction,
  type GuildTextBasedChannel,
  type InteractionCollector,
  type MessageActionRowComponentBuilder,
  type VoiceBasedChannel,
} from 'discord.js';
import {
  ASSETS_DIR,
  MAXIMUM_PLAYERS,
  MINIMUM_PLAYERS,
  NIGHT_ALMOST_OVER_REMINDER,
  REVEAL_WAIT_TIME,
  ROUND_TIME_MILLISECONDS,
  ROUND_TIME_MINUTES,
  VOTE_WAIT_TIME,
} from './Constants';
import { newCustomId } from './ConversationHelper';
import { Phase } from './enums/Phase';
import type { RoleName } from './enums/RoleName';
import {
  callOrder,
  distributeRoles,
  getRoleByName,
  getWinner,
  millisToTime,
  playAllTurns,
  shuffle,
} from './GameLogic';
import { getGamesManagerInstance } from './GamesManager';
import { GameState } from './GameState';
import { Log } from './Log';
import type { Player } from './Player';
import { SoundManager } from './SoundManager';
import type { Time } from './types/Time';
import { UserError } from './UserError';
import { VirtualPlayer } from './VirtualPlayer';

export interface GameOptions {
  players: Player[];
  textChannel: GuildTextBasedChannel;
  voiceChannel: VoiceBasedChannel | null;
  chosenRoles: RoleName[];
  silentNight: boolean;
  silent: boolean;
}

const NOT_A_PLAYER = "You're not a player in this game.";

export class Game {
  public readonly players: Player[];
  public readonly gameState: GameState;
  public newDoppelgangerRole: RoleName | null = null;
  private readonly _textChannel: GuildTextBasedChannel;
  private readonly _voiceChannel: VoiceBasedChannel | null;
  private readonly _chosenRoles: RoleName[];
  private readonly _silentNight: boolean;
  private readonly _silent: boolean;
  private _startGameState: GameState;
  private _started = false;
  private _stopped = false;
  private _startTime: Date | null = null;
  private _phase: Phase = Phase.night;
  private _soundManager: SoundManager | null = null;
  private _revealCollector: InteractionCollector<
    ButtonInteraction<'cached'>
  > | null = null;
  private readonly _timers = new Set<ReturnType<typeof setTimeout>>();

  constructor(options: GameOptions) {
    const { players } = options;
    if (players.length < MINIMUM_PLAYERS || players.length > MAXIMUM_PLAYERS) {
      throw new Error('Invalid amount of players');
    }
    this.players = players;
    this._textChannel = options.textChannel;
    this._voiceChannel = options.voiceChannel;
    this._chosenRoles = options.chosenRoles;
    this._silentNight = options.silentNight;
    this._silent = options.silent;
    this._startGameState = new GameState();
    this.gameState = new GameState();
  }

  public get startGameState(): GameState {
    return this._startGameState;
  }

  public get chosenRoles(): RoleName[] {
    return this._chosenRoles;
  }

  public get remainingTime(): Time {
    if (!this._startTime) {
      throw new UserError('Countdown has not started yet.');
    }
    const finish = this._startTime.getTime() + ROUND_TIME_MILLISECONDS;
    return millisToTime(finish - Date.now());
  }

  public get textChannel(): GuildTextBasedChannel {
    return this._textChannel;
  }

  public get tagPlayersText(): string {
    return this.players.map(({ tag }) => tag).join(', ');
  }

  public get phase(): Phase {
    return this._phase;
  }

  public getPlayer(id: string): Player | undefined {
    return this.players.find((player) => player.id === id);
  }

  public async start(): Promise<void> {
    if (this._started) {
      throw new Error('Game has already started');
    }
    this._started = true;

    const roles = shuffle(this._chosenRoles.map(getRoleByName));
    distributeRoles(this.gameState, this.players, roles);
    this._startGameState = this.gameState.copy();

    await this.sendChannelMessage(
      `Starting new game with players: ${this.tagPlayersText}\nAnd with these roles: ${this._chosenRoles.join(', ')}`
    );

    const missingPlayers = await this.revealRoles();
    if (missingPlayers.length !== 0) {
      const names = missingPlayers.map(({ tag }) => `- ${tag}`).join('\n');
      await this.abort(
        `The game was cancelled because these players did not reveal their role in time:\n${names}`
      );
      return;
    }

    await this.setupVoice();
    this._soundManager?.startNightLoop();

    await playAllTurns(this);
    if (this._stopped) {
      return;
    }
    this._revealCollector?.stop('night-over');
    await Promise.allSettled(
      this.players.map((p) =>
        p.send('You wake up! The discussion starts in the channel.')
      )
    );
    this._phase = Phase.discussion;
    Log.info('Night over');
    await this._soundManager?.stopNightLoop();

    this._startTime = new Date();
    const wakeUpOrder = callOrder
      .filter((roleName) => this._chosenRoles.includes(roleName))
      .map((roleName, i) => `${i + 1}. ${roleName}`)
      .join('\n');
    await this._textChannel.send({
      content: this.tagPlayersText,
      embeds: [
        new EmbedBuilder()
          .setTitle('☀️ The night is over!')
          .setDescription(
            `You now have ${ROUND_TIME_MINUTES} minutes to figure out what has happened. Use \`/time\` to see the remaining time or \`/skip\` to vote early.`
          )
          .addFields({ name: 'Wake-up order', value: wakeUpOrder || '-' }),
      ],
    });

    this.schedule(async () => {
      if (this._phase !== Phase.discussion) {
        return;
      }
      this._soundManager?.playGong();
      await this.sendChannelMessage(
        `${this.tagPlayersText} ${NIGHT_ALMOST_OVER_REMINDER / 1000} seconds remaining!`
      );
    }, ROUND_TIME_MILLISECONDS - NIGHT_ALMOST_OVER_REMINDER);
    this.schedule(() => this.endGame(), ROUND_TIME_MILLISECONDS);
  }

  public async endGame(): Promise<void> {
    if (this._phase !== Phase.discussion || this._stopped) {
      return;
    }
    this._phase = Phase.ending;
    this.clearTimers();
    this._soundManager?.playGong();

    const votes = await this.collectVotes();
    const chosenPlayers = this.players.flatMap((chosenBy) => {
      const target = votes.get(chosenBy.id);
      return target ? [{ chosenBy, target }] : [];
    });
    const abstained = this.players.filter(({ id }) => !votes.has(id));

    const winState = getWinner(chosenPlayers, this.gameState);
    let outcome: string;
    if (winState.playersWhoDie.length === 0) {
      outcome = 'Nobody dies!';
    } else {
      const playersWhoDieNames = winState.playersWhoDie
        .map(({ name }) => name)
        .join(', ');
      outcome = `The following player(s) die: ${playersWhoDieNames}`;
      if (winState.hunterKillList.length > 0) {
        const hunters = winState.dyingHunters.map(({ name }) => name);
        const victims = winState.hunterKillList.map(({ name }) => name);
        outcome +=
          hunters.length === 1
            ? `\nSince ${hunters[0]} was a hunter, ${victims[0]} also dies.`
            : `\nSince ${hunters.join(' and ')} were hunters, ${victims.join(' and ')} also die.`;
      }
    }

    const results = new EmbedBuilder()
      .setTitle(`🥳 Team ${winState.winner} has won!`)
      .setDescription(outcome)
      .addFields(
        {
          name: 'Voting overview',
          value: winState.votingOverview || 'No votes were cast.',
        },
        {
          name: 'Roles before the night',
          value: this._startGameState.print(),
        },
        {
          name: 'Roles after the night',
          value: this.gameState.print(this.newDoppelgangerRole),
        }
      );
    if (abstained.length > 0) {
      results.addFields({
        name: 'Did not vote',
        value: abstained.map(({ name }) => name).join(', '),
      });
    }
    await this._textChannel.send({ embeds: [results] });
    Log.info('Game has ended');
    this.stopGame();
  }

  public async abort(reason: string): Promise<void> {
    if (this._stopped) {
      return;
    }
    Log.warn(`Aborting game: ${reason}`);
    this.stopGame();
    await this.sendChannelMessage(reason).catch((error) =>
      Log.error('Unable to send abort message', error)
    );
  }

  private async setupVoice(): Promise<void> {
    if (!this._voiceChannel) {
      return;
    }
    try {
      this._soundManager = new SoundManager(
        this._voiceChannel,
        this._silentNight,
        this._silent
      );
      Log.info('Joining voice channel.');
      await this._soundManager.connect();
    } catch (error) {
      this._soundManager = null;
      Log.info('Playing without sound:', (error as Error).message);
    }
  }

  /**
   * Posts the public "reveal role" button. Each click answers with an
   * ephemeral role card and binds the interaction to the player so night
   * prompts can follow. The button stays usable during the whole night so
   * players can recover a dismissed message.
   */
  private async revealRoles(): Promise<Player[]> {
    const revealed = new Set(
      this.players.filter((p) => p.isVirtual).map(({ id }) => id)
    );
    const message = await this._textChannel.send({
      content: `${this.tagPlayersText}\n🌙 **Night falls.** Press the button to secretly see your role. Your night actions will appear right here, visible only to you.`,
      components: [
        new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(newCustomId('night', 'reveal'))
            .setLabel('Reveal my role')
            .setEmoji('🌙')
            .setStyle(ButtonStyle.Primary)
        ),
      ],
    });

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
    });
    this._revealCollector = collector;
    collector.on('end', () => {
      message.edit({ components: [] }).catch(() => undefined);
    });

    await new Promise<void>((resolve) => {
      const timeout = setTimeout(resolve, REVEAL_WAIT_TIME);
      collector.on('end', () => {
        clearTimeout(timeout);
        resolve();
      });
      collector.on('collect', (interaction) => {
        this.handleReveal(interaction, revealed)
          .then(() => {
            if (revealed.size === this.players.length) {
              clearTimeout(timeout);
              resolve();
            }
          })
          .catch((error) => Log.error('Failed to reveal role', error));
      });
      if (revealed.size === this.players.length) {
        clearTimeout(timeout);
        resolve();
      }
    });

    const missing = this.players.filter(({ id }) => !revealed.has(id));
    if (missing.length > 0) {
      collector.stop('timeout');
    }
    return missing;
  }

  private async handleReveal(
    interaction: ButtonInteraction,
    revealed: Set<string>
  ): Promise<void> {
    const player = this.getPlayer(interaction.user.id);
    if (!player) {
      await interaction.reply({
        content: NOT_A_PLAYER,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const roleName = this._startGameState.getRoleName(player);
    const image = new AttachmentBuilder(`${ASSETS_DIR}imgs/${roleName}.png`, {
      name: `${roleName}.png`,
    });
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`Your role: ${roleName}`)
          .setDescription(
            'You fall deeply asleep. Keep this channel open, your night actions will appear below.'
          )
          .setImage(`attachment://${roleName}.png`),
      ],
      files: [image],
      flags: MessageFlags.Ephemeral,
    });
    player.bind(interaction);
    revealed.add(player.id);
  }

  private async collectVotes(): Promise<Map<string, Player>> {
    const votes = new Map<string, Player>();
    const message = await this._textChannel.send({
      content: `🛑 Everybody stop talking! That means you ${this.tagPlayersText}\nPress the button to secretly vote for who to kill.`,
      components: [
        new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(newCustomId('vote', 'open'))
            .setLabel('Vote')
            .setEmoji('🗳️')
            .setStyle(ButtonStyle.Danger)
        ),
      ],
    });

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: VOTE_WAIT_TIME,
    });
    collector.on('collect', (interaction) => {
      this.handleVote(interaction, votes, () => collector.ended)
        .then(() => {
          if (votes.size === this.players.length) {
            collector.stop('all-voted');
          }
        })
        .catch((error) => Log.error('Failed to handle vote', error));
    });
    const ended = new Promise<void>((resolve) =>
      collector.once('end', () => resolve())
    );
    await this.castVirtualVotes(votes);
    if (votes.size === this.players.length) {
      collector.stop('all-voted');
    }
    await ended;
    await message
      .edit({ content: '🗳️ Voting is closed.', components: [] })
      .catch(() => undefined);
    return votes;
  }

  private async castVirtualVotes(votes: Map<string, Player>): Promise<void> {
    await Promise.all(
      this.players.map(async (player) => {
        if (!(player instanceof VirtualPlayer)) {
          return;
        }
        const candidates = this.players.filter(({ id }) => id !== player.id);
        const [targetId] = await player.choose(
          candidates.map(({ id }) => id),
          1,
          'Choose a player to kill.'
        );
        const target = candidates.find(({ id }) => id === targetId);
        if (target) {
          votes.set(player.id, target);
          Log.info(`[virtual ${player.name}] votes for ${target.name}`);
        }
      })
    );
  }

  private async handleVote(
    interaction: ButtonInteraction,
    votes: Map<string, Player>,
    isClosed: () => boolean
  ): Promise<void> {
    const player = this.getPlayer(interaction.user.id);
    if (!player) {
      await interaction.reply({
        content: NOT_A_PLAYER,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const candidates = this.players.filter(({ id }) => id !== player.id);
    const response = await interaction.reply({
      content: 'Choose a player to kill.',
      components: [
        new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(newCustomId('vote', 'select'))
            .setPlaceholder('Choose a player')
            .addOptions(
              candidates.map(({ id, name }) => ({
                label: name.slice(0, 100),
                value: id,
              }))
            )
        ),
      ],
      flags: MessageFlags.Ephemeral,
      withResponse: true,
    });
    const reply = response.resource?.message;
    if (!reply) {
      return;
    }
    const selection = await reply
      .awaitMessageComponent({
        componentType: ComponentType.StringSelect,
        filter: (i) => i.user.id === player.id,
        time: VOTE_WAIT_TIME,
      })
      .catch(() => null);
    if (!selection) {
      return;
    }
    const target = candidates.find(({ id }) => id === selection.values[0]);
    if (isClosed() || !target) {
      await selection.update({
        content: 'Voting is already closed.',
        components: [],
      });
      return;
    }
    votes.set(player.id, target);
    await selection.update({
      content: `You voted to kill **${target.name}**.`,
      components: [],
    });
  }

  private schedule(callback: () => unknown, delay: number): void {
    const timer = setTimeout(() => {
      this._timers.delete(timer);
      Promise.resolve()
        .then(callback)
        .catch((error) => {
          Log.error(error);
          return this.abort('Something went wrong, the game was stopped.');
        });
    }, delay);
    this._timers.add(timer);
  }

  private clearTimers(): void {
    for (const timer of this._timers) {
      clearTimeout(timer);
    }
    this._timers.clear();
  }

  private sendChannelMessage(text: string) {
    return this._textChannel.send(text);
  }

  private stopGame(): void {
    if (this._stopped) {
      return;
    }
    this._stopped = true;
    this._phase = Phase.ending;
    this.clearTimers();
    this._revealCollector?.stop('game-stopped');
    this._soundManager?.stop();
    getGamesManagerInstance().stopGame(this._textChannel);
  }
}

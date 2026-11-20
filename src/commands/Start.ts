import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  type GuildTextBasedChannel,
  type MessageActionRowComponentBuilder,
  type VoiceBasedChannel,
} from 'discord.js';
import {
  CARDS_ON_TABLE,
  LOBBY_WAIT_TIME,
  MAXIMUM_PLAYERS,
  MINIMUM_PLAYERS,
  SETUP_WAIT_TIME,
} from '../Constants';
import { customIdValue, newCustomId } from '../ConversationHelper';
import { getGamesManagerInstance } from '../GamesManager';
import { Log } from '../Log';
import { Player } from '../Player';
import {
  amountOfRolesToPick,
  FIXED_ROLES,
  ROLE_CHOICES,
  rolesFromSelection,
} from '../RoleSelection';
import type { Command } from '../types/Command';
import { UserError, userMessage } from '../UserError';
import type { VirtualPlayer } from '../VirtualPlayer';

interface LobbySettings {
  quick: boolean;
  silentNight: boolean;
  silent: boolean;
}

interface LobbyResult {
  interaction: ButtonInteraction<'cached'>;
  players: Player[];
}

export const start: Command = {
  data: new SlashCommandBuilder()
    .setName('start')
    .setDescription('Open a lobby for a new game in this channel.')
    .setContexts(InteractionContextType.Guild)
    .addBooleanOption((option) =>
      option
        .setName('quick')
        .setDescription('Reuse the roles of the previous game in this channel.')
    )
    .addBooleanOption((option) =>
      option
        .setName('silent_night')
        .setDescription('Mute the ambient night noises.')
    )
    .addBooleanOption((option) =>
      option.setName('silent').setDescription('Mute all sound effects.')
    ),
  execute: (interaction) => openLobby(interaction),
};

/**
 * Opens a lobby and runs the game. Virtual players are pre-seated and are
 * exempt from the voice channel checks.
 */
export async function openLobby(
  interaction: ChatInputCommandInteraction<'cached'>,
  virtualPlayers: VirtualPlayer[] = []
): Promise<void> {
  const textChannel = interaction.channel;
  if (!textChannel) {
    throw new UserError('This command can only be used in a text channel.');
  }
  const voiceChannel = interaction.member.voice.channel;
  if (!voiceChannel) {
    await interaction.reply({
      content: 'Please join a voice channel first.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  const gamesManager = getGamesManagerInstance();
  if (!gamesManager.reserveChannel(textChannel.id)) {
    await interaction.reply({
      content: 'There is already a lobby or game running in this channel.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const settings: LobbySettings = {
    quick: interaction.options.getBoolean('quick') ?? false,
    silentNight: interaction.options.getBoolean('silent_night') ?? false,
    silent: interaction.options.getBoolean('silent') ?? false,
  };

  try {
    const result = await runLobby(
      interaction,
      voiceChannel,
      settings,
      virtualPlayers
    );
    if (!result) {
      return;
    }
    await startGame(result, textChannel, voiceChannel, settings);
  } finally {
    gamesManager.releaseChannel(textChannel.id);
  }
}

function renderLobby(
  host: Player,
  players: Map<string, Player>,
  voiceChannel: VoiceBasedChannel,
  settings: LobbySettings
) {
  const options = [
    settings.quick && 'quick start',
    settings.silentNight && 'silent night',
    settings.silent && 'silent',
  ].filter(Boolean);
  const embed = new EmbedBuilder()
    .setTitle('🐺 One Night Ultimate Werewolf')
    .setDescription(
      `${host.tag} is starting a game! Join <#${voiceChannel.id}> and press **Join**.\n` +
        `${MINIMUM_PLAYERS}-${MAXIMUM_PLAYERS} players. The host presses **Start** when everyone is in.`
    )
    .addFields({
      name: `Players (${players.size}/${MAXIMUM_PLAYERS})`,
      value: [...players.values()].map(({ tag }) => `- ${tag}`).join('\n'),
    });
  if (options.length > 0) {
    embed.addFields({ name: 'Options', value: options.join(', ') });
  }
  const button = (action: string, label: string, style: ButtonStyle) =>
    new ButtonBuilder()
      .setCustomId(newCustomId('lobby', action))
      .setLabel(label)
      .setStyle(style);
  return {
    embeds: [embed],
    components: [
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        button('join', 'Join', ButtonStyle.Success),
        button('leave', 'Leave', ButtonStyle.Secondary),
        button('start', 'Start', ButtonStyle.Primary),
        button('cancel', 'Cancel', ButtonStyle.Danger)
      ),
    ],
  };
}

async function runLobby(
  interaction: ChatInputCommandInteraction<'cached'>,
  voiceChannel: VoiceBasedChannel,
  settings: LobbySettings,
  virtualPlayers: VirtualPlayer[]
): Promise<LobbyResult | null> {
  const host = new Player(interaction.user.id, interaction.member.displayName);
  const players = new Map<string, Player>(
    [host, ...virtualPlayers].map((player) => [player.id, player])
  );
  const render = () => renderLobby(host, players, voiceChannel, settings);

  const response = await interaction.reply({ ...render(), withResponse: true });
  const message = response.resource?.message;
  if (!message) {
    throw new UserError('Unable to create the lobby.');
  }

  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: LOBBY_WAIT_TIME,
  });

  return new Promise<LobbyResult | null>((resolve) => {
    const ephemeral = (i: ButtonInteraction, content: string) =>
      i.reply({ content, flags: MessageFlags.Ephemeral });

    const handle = async (i: ButtonInteraction<'cached'>) => {
      const isHost = i.user.id === host.id;
      switch (customIdValue(i.customId)) {
        case 'join': {
          if (players.has(i.user.id)) {
            return ephemeral(i, 'You already joined.');
          }
          if (i.member.voice.channelId !== voiceChannel.id) {
            return ephemeral(i, `Join <#${voiceChannel.id}> first.`);
          }
          if (players.size >= MAXIMUM_PLAYERS) {
            return ephemeral(i, 'The lobby is full.');
          }
          players.set(i.user.id, new Player(i.user.id, i.member.displayName));
          return i.update(render());
        }
        case 'leave': {
          if (isHost) {
            return ephemeral(i, 'The host cannot leave, use Cancel instead.');
          }
          if (!players.delete(i.user.id)) {
            return ephemeral(i, "You're not in this lobby.");
          }
          return i.update(render());
        }
        case 'start': {
          if (!isHost) {
            return ephemeral(i, 'Only the host can start the game.');
          }
          if (players.size < MINIMUM_PLAYERS) {
            return ephemeral(
              i,
              `Not enough players. The game needs ${MINIMUM_PLAYERS} to ${MAXIMUM_PLAYERS} players.`
            );
          }
          const absent = [...players.values()].filter(
            (player) =>
              !player.isVirtual && !voiceChannel.members.has(player.id)
          );
          if (absent.length > 0) {
            return ephemeral(
              i,
              `These players are not in <#${voiceChannel.id}>: ${absent.map(({ tag }) => tag).join(', ')}`
            );
          }
          collector.stop('start');
          return resolve({ interaction: i, players: [...players.values()] });
        }
        case 'cancel': {
          if (!isHost) {
            return ephemeral(i, 'Only the host can cancel the lobby.');
          }
          await i.update({
            content: 'Lobby cancelled.',
            embeds: [],
            components: [],
          });
          return collector.stop('cancel');
        }
      }
    };

    collector.on('collect', (i) => {
      if (!i.inCachedGuild()) {
        return;
      }
      handle(i).catch((error) => Log.error('Lobby interaction failed', error));
    });
    collector.on('end', (_collected, reason) => {
      if (reason === 'start') {
        return;
      }
      if (reason !== 'cancel') {
        message
          .edit({ content: 'Lobby expired.', embeds: [], components: [] })
          .catch(() => undefined);
      }
      resolve(null);
    });
  });
}

async function startGame(
  { interaction, players }: LobbyResult,
  textChannel: GuildTextBasedChannel,
  voiceChannel: VoiceBasedChannel,
  settings: LobbySettings
): Promise<void> {
  const gamesManager = getGamesManagerInstance();
  const playerList = players.map(({ tag }) => tag).join(', ');
  await interaction.update({
    content: `Game is starting with ${playerList}`,
    embeds: [],
    components: [],
  });

  let roles;
  try {
    roles = settings.quick
      ? gamesManager.getQuickStartRoles(textChannel, players.length)
      : [...FIXED_ROLES, ...(await chooseRoles(interaction, players.length))];
  } catch (error) {
    await interaction.followUp({ content: userMessage(error) });
    return;
  }

  gamesManager.startNewGame(
    {
      players,
      textChannel,
      voiceChannel,
      silentNight: settings.silentNight,
      silent: settings.silent,
    },
    roles
  );
}

async function chooseRoles(
  interaction: ButtonInteraction<'cached'>,
  playerCount: number
) {
  const amountToPick = amountOfRolesToPick(playerCount, CARDS_ON_TABLE);
  const prompt = await interaction.followUp({
    content: `Two werewolves are always included. Pick **${amountToPick}** more cards.`,
    components: [
      new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(newCustomId('setup', 'roles'))
          .setPlaceholder(`Pick ${amountToPick} roles`)
          .setMinValues(amountToPick)
          .setMaxValues(amountToPick)
          .addOptions(
            ROLE_CHOICES.map(({ label, value }) => ({ label, value }))
          )
      ),
    ],
    flags: MessageFlags.Ephemeral,
  });

  const selection = await prompt
    .awaitMessageComponent({
      componentType: ComponentType.StringSelect,
      filter: (i) => i.user.id === interaction.user.id,
      time: SETUP_WAIT_TIME,
    })
    .catch(() => null);
  if (!selection) {
    await interaction
      .editReply({
        message: prompt,
        content: 'Role selection timed out.',
        components: [],
      })
      .catch(() => undefined);
    throw new UserError(
      'Waited too long for a response. Aborting game creation.'
    );
  }
  const roles = rolesFromSelection(selection.values);
  await selection.update({
    content: `Roles chosen: ${roles.join(', ')}`,
    components: [],
  });
  return roles;
}

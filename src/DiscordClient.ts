import {
  ActivityType,
  Client,
  Events,
  GatewayIntentBits,
  MessageFlags,
  type ChatInputCommandInteraction,
  type Interaction,
  type MessageComponentInteraction,
} from 'discord.js';
import { findCommand } from './commands';
import { Log } from './Log';
import { UserError, userMessage } from './UserError';

// Components are handled by collectors attached to their message. When no
// collector answers (e.g. after a restart), tell the user the button expired.
const UNHANDLED_COMPONENT_GRACE = 2_500;

export function createClient(): Client {
  const client = new Client({
    // No privileged intents needed: all input arrives through interactions.
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
    allowedMentions: { parse: ['users'] },
  });

  client.once(Events.ClientReady, (readyClient) => {
    Log.info(`Logged in as ${readyClient.user.tag}`);
    readyClient.user.setActivity('/help', { type: ActivityType.Listening });
  });

  client.on(Events.InteractionCreate, (interaction) => {
    routeInteraction(interaction).catch((error) =>
      Log.error('Failed to handle interaction', error)
    );
  });

  client.on(Events.Error, (error) => Log.error('Discord client error', error));
  client.on(Events.Warn, (message) => Log.warn(message));

  return client;
}

export async function routeInteraction(
  interaction: Interaction
): Promise<void> {
  if (interaction.isChatInputCommand()) {
    await handleCommand(interaction);
  } else if (interaction.isMessageComponent()) {
    handleUnclaimedComponent(interaction);
  }
}

async function handleCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  const command = findCommand(interaction.commandName);
  if (!command) {
    await replyError(interaction, 'Unknown command.');
    return;
  }
  if (!interaction.inCachedGuild()) {
    await replyError(interaction, 'This command can only be used in a server.');
    return;
  }
  Log.debug(`/${interaction.commandName} used by ${interaction.user.id}`);
  try {
    await command.execute(interaction);
  } catch (error) {
    if (error instanceof UserError) {
      Log.debug(`/${interaction.commandName} rejected: ${error.message}`);
    } else {
      Log.error(`/${interaction.commandName} failed`, error);
    }
    await replyError(interaction, userMessage(error));
  }
}

function handleUnclaimedComponent(
  interaction: MessageComponentInteraction
): void {
  setTimeout(() => {
    if (interaction.replied || interaction.deferred) {
      return;
    }
    interaction
      .reply({
        content: 'This interaction has expired.',
        flags: MessageFlags.Ephemeral,
      })
      .catch(() => undefined);
  }, UNHANDLED_COMPONENT_GRACE);
}

async function replyError(
  interaction: ChatInputCommandInteraction,
  content: string
): Promise<void> {
  const options = { content, flags: MessageFlags.Ephemeral } as const;
  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(options);
    } else {
      await interaction.reply(options);
    }
  } catch (error) {
    Log.error('Unable to send error reply', error);
  }
}

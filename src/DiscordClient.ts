import Discord, {
  Collection,
  MessageAttachment,
  MessageEmbed,
  TextChannel,
  User,
} from 'discord.js';
import glob from 'glob';
import { promisify } from 'util';
import { DiscordChannelId, Prefix } from './Config';
import { Log } from './Log';
import { Command } from './types/Command';

const globPromise = promisify(glob);

class DiscordClient {
  ////////////////////////////
  // dummy players, remove after testing
  async getDummyPlayers(): Promise<Collection<string, User>> {
    const userIds = ['185089816218697729', '649694899095994378'];
    const users: Collection<string, User> = new Collection();
    for (const id of userIds) {
      const user = await this._channel.members.get(id);
      if (user) {
        users.set(user.id, user);
      }
    }
    return users;
  }
  ///////////////////////////

  private _token: string;
  private _client: Discord.Client;
  private _channel: Discord.TextChannel;
  private _commands: Command[];
  public sendingMessage: boolean;
  public failedAttempts: number;

  get commands() {
    return this._commands;
  }

  constructor(token: string) {
    this._token = token;
    this._client = new Discord.Client();
    this._channel = this._client.channels.cache.get(
      DiscordChannelId
    ) as TextChannel;
    this._commands = [];
    this.sendingMessage = false;
    this.failedAttempts = 0;
  }

  start() {
    this._client.on('ready', async () => {
      Log.info(`Logged in!`);
      this._channel = this._client.channels.cache.get(
        DiscordChannelId
      ) as TextChannel;
      if (this._client.user) {
        this._client.user
          .setActivity(`${Prefix}help`, { type: 'LISTENING' })
          .then((presence) =>
            Log.info(`Activity set to ${presence.activities[0].name}`)
          )
          .catch(Log.error);
      }
      const commandFiles = await globPromise(`${__dirname}/commands/*.{js,ts}`);

      for (const file of commandFiles) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const command = require(file) as Command;
        Log.info('Added command', command.names[0]);
        this._commands.push(command);
      }
    });

    // TODO: Currently the bot only listens to messages sent to one specific channel, which is
    // set in the .env and used in DiscordClient.ts, essentially making the game manager obsolete.
    // In order to enable multiplae games, remove the check "message.channel.id !== DiscordChannelId"
    this._client.on('message', async (message) => {
      if (
        !message.guild ||
        message.channel.id !== DiscordChannelId ||
        !message.content.startsWith(Prefix)
      ) {
        return;
      }

      const [commandName, ...args] = message.content
        .slice(Prefix.length)
        .split(/ +/);

      const command = this._commands.find((c) => c.names.includes(commandName));

      if (command) {
        const isAdmin = message.member?.hasPermission('ADMINISTRATOR');
        if (command.adminOnly && !isAdmin) {
          this.sendMessage('This command is for admins only');
        } else {
          command.execute(message, args);
        }
      } else {
        this.sendMessage(
          `Unrecognized command. Type \`${Prefix}help\` for the list of commands.`
        );
      }
    });
    this._client.login(this._token);
  }

  async sendMessage(
    text: string | MessageEmbed,
    attachment?: MessageAttachment
  ) {
    if (!this._channel) {
      throw new Error(
        'Could not send message, text channel was not initialised yet.'
      );
    }
    if (attachment) {
      return this._channel.send(text, attachment);
    } else {
      return this._channel.send(text);
    }
  }
}

let instance: DiscordClient | null = null;

export function initDiscord(token: string): void {
  instance = new DiscordClient(token);
}

export function getDiscordInstance(): DiscordClient | null {
  return instance;
}

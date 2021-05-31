import Discord, { User, VoiceChannel } from 'discord.js';
import glob from 'glob';
import { promisify } from 'util';
import { Prefix } from './Config';
import { Log } from './Log';
import { Command } from './types/Command';

const globPromise = promisify(glob);

class DiscordClient {
  private _token: string;
  private _client: Discord.Client;
  private _commands: Command[];
  public sendingMessage: boolean;
  public failedAttempts: number;

  get user(): User {
    const { user } = this._client;
    if (!user) {
      throw new Error('No user yet.');
    }
    return user;
  }

  get commands() {
    return this._commands;
  }

  public isUsingVoice(guildId: string, voiceChannel: VoiceChannel): boolean {
    if (!this._client.voice) {
      return false;
    } else {
      for (const connection of this._client.voice.connections.array()) {
        // If connected to same channel, voice is available
        if (connection.channel.id === voiceChannel.id) {
          return false;
        }
      }
      // Return true if there's a different voice channel used in the same guild
      return this._client.voice.connections
        .map((voiceCon) => voiceCon.channel.guild.id)
        .includes(guildId);
    }
  }

  constructor(token: string) {
    this._token = token;
    this._client = new Discord.Client();
    this._commands = [];
    this.sendingMessage = false;
    this.failedAttempts = 0;
  }

  start() {
    this._client.on('ready', async () => {
      Log.info(`Logged in!`);
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

    this._client.on('message', async (message) => {
      if (!message.guild || !message.content.startsWith(Prefix)) {
        return;
      }

      const [commandName, ...args] = message.content
        .slice(Prefix.length)
        .split(/ +/);

      const command = this._commands.find((c) => c.names.includes(commandName));

      if (command) {
        const isAdmin = message.member?.hasPermission('ADMINISTRATOR');
        if (command.adminOnly && !isAdmin) {
          message.reply('This command is for admins only');
        } else {
          command.execute(message, args);
        }
      } else {
        message.reply(
          `Unrecognized command. Type \`${Prefix}help\` for the list of commands.`
        );
      }
    });
    this._client.login(this._token);
  }
}

let instance: DiscordClient | null = null;

export function initDiscord(token: string): void {
  instance = new DiscordClient(token);
}

export function getDiscordInstance(): DiscordClient {
  if (!instance) {
    throw new Error('Discord client not started.');
  }
  return instance;
}

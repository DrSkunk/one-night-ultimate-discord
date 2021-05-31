import { StreamDispatcher, VoiceChannel, VoiceConnection } from 'discord.js';
import { EMPTY_VOICE_CHECK_TIME } from './Constants';
import { getDiscordInstance } from './DiscordClient';
import { Sound } from './enums/Sound';
import { Log } from './Log';

export class SoundManager {
  private _voiceChannel: VoiceChannel | null;
  private _connection: VoiceConnection | null;
  private _dispatcher: StreamDispatcher | null;
  private _guildId: string;

  constructor(guildId: string) {
    this._voiceChannel = null;
    this._connection = null;
    this._dispatcher = null;
    this._guildId = guildId;
    this.disconnectWhenEmpty();
  }

  set voiceChannel(voiceChannel: VoiceChannel) {
    const client = getDiscordInstance();
    if (!client) {
      throw new Error('No Discord Client');
    }

    if (client.isUsingVoice(this._guildId, voiceChannel)) {
      throw new Error('Already connected to a voice channel of this guild.');
    }
    this._voiceChannel = voiceChannel;
  }

  public async startNightLoop(): Promise<void> {
    Log.info('Starting night loop');

    if (!this._voiceChannel) {
      return;
    }
    this._connection = await this._voiceChannel.join();
    this._dispatcher = this.play(Sound.nightloop);
  }

  public async stopNightLoop(): Promise<void> {
    Log.info('Stopping night loop');
    if (!this._voiceChannel) {
      return;
    }
    await this.fadeOut(1);
    this._dispatcher = this.play(Sound.rooster);
  }

  public playGong(): void {
    Log.info('Playing "time almost up" sample');
    this.play(Sound.gong);
  }

  private play(sound: Sound): StreamDispatcher {
    if (this._connection) {
      return this._connection.play(
        `${process.cwd()}/assets/sound/${sound}.ogg`
      );
    } else {
      throw new Error('not connected to voice');
    }
  }

  private async fadeOut(volume: number): Promise<void> {
    if (!this._dispatcher) {
      return;
    }
    if (volume <= 0) {
      this._dispatcher.destroy();
      return;
    }
    this._dispatcher.setVolume(volume);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await this.fadeOut(volume - 0.025);
  }

  public stop(): void {
    if (this._dispatcher) {
      this._dispatcher.destroy();
    }
  }

  private disconnectWhenEmpty() {
    const intervalId = setInterval(() => {
      if (this._voiceChannel && this._voiceChannel.members.size === 1) {
        this._connection?.disconnect();
        clearInterval(intervalId);
        this._voiceChannel = null;
      }
    }, EMPTY_VOICE_CHECK_TIME);
  }
}

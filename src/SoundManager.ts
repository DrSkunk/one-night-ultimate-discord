import { createReadStream } from 'node:fs';
import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  getVoiceConnection,
  joinVoiceChannel,
  NoSubscriberBehavior,
  StreamType,
  VoiceConnectionStatus,
  type AudioPlayer,
  type VoiceConnection,
} from '@discordjs/voice';
import type { VoiceBasedChannel } from 'discord.js';
import { ASSETS_DIR, EMPTY_VOICE_CHECK_TIME } from './Constants';
import { Sound } from './enums/Sound';
import { Log } from './Log';

const CONNECT_TIMEOUT = 20_000;

export class SoundManager {
  private readonly _voiceChannel: VoiceBasedChannel;
  private readonly _silentNight: boolean;
  private _connection: VoiceConnection | null = null;
  private _player: AudioPlayer | null = null;
  private _emptyCheck: ReturnType<typeof setInterval> | null = null;

  /** Throws when voice can't be used for this game. */
  constructor(
    voiceChannel: VoiceBasedChannel,
    silentNight: boolean,
    silent: boolean
  ) {
    if (silent) {
      throw new Error('Running in silent mode.');
    }
    if (getVoiceConnection(voiceChannel.guild.id)) {
      throw new Error('Already connected to a voice channel of this guild.');
    }
    this._voiceChannel = voiceChannel;
    this._silentNight = silentNight;
  }

  public async connect(): Promise<void> {
    const connection = joinVoiceChannel({
      channelId: this._voiceChannel.id,
      guildId: this._voiceChannel.guild.id,
      adapterCreator: this._voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: true,
    });
    this._connection = connection;
    try {
      await entersState(
        connection,
        VoiceConnectionStatus.Ready,
        CONNECT_TIMEOUT
      );
    } catch (error) {
      this.stop();
      throw error;
    }
    const player = createAudioPlayer({
      behaviors: { noSubscriber: NoSubscriberBehavior.Pause },
    });
    player.on('error', (error) => Log.error('Audio player error', error));
    connection.subscribe(player);
    this._player = player;
    this._emptyCheck = setInterval(() => {
      const humans = this._voiceChannel.members.filter((m) => !m.user.bot);
      if (humans.size === 0) {
        Log.info('Voice channel is empty, disconnecting.');
        this.stop();
      }
    }, EMPTY_VOICE_CHECK_TIME);
  }

  public startNightLoop(): void {
    if (this._silentNight) {
      Log.info('Silent night mode, not playing night loop');
      return;
    }
    Log.info('Starting night loop');
    this.play(Sound.nightloop);
  }

  public async stopNightLoop(): Promise<void> {
    Log.info('Stopping night loop');
    this._player?.stop();
    if (this._player) {
      await entersState(this._player, AudioPlayerStatus.Idle, 5_000).catch(
        () => undefined
      );
    }
    this.play(Sound.rooster);
  }

  public playGong(): void {
    Log.info('Playing "time almost up" sample');
    this.play(Sound.gong);
  }

  private play(sound: Sound): void {
    if (!this._player) {
      return;
    }
    const resource = createAudioResource(
      createReadStream(`${ASSETS_DIR}sound/${sound}.ogg`),
      { inputType: StreamType.OggOpus }
    );
    this._player.play(resource);
  }

  public stop(): void {
    if (this._emptyCheck) {
      clearInterval(this._emptyCheck);
      this._emptyCheck = null;
    }
    this._player?.stop(true);
    this._player = null;
    if (
      this._connection &&
      this._connection.state.status !== VoiceConnectionStatus.Destroyed
    ) {
      this._connection.destroy();
    }
    this._connection = null;
  }
}

import dotenv from 'dotenv';
dotenv.config();
import {
  Prefix,
  DiscordToken,
  DiscordGuildId,
  DiscordChannelId,
} from './Config';
import { initDiscord, getDiscordInstance } from './DiscordClient';
import { Log } from './Log';

Log.info('Starting One Night Ultimate Discord');

if (!Prefix || !DiscordToken || !DiscordGuildId || !DiscordChannelId) {
  Log.error(
    'Not all values are set in your .env file. See .env.example for all values'
  );
  process.exit(1);
}

initDiscord(DiscordToken);
const discordClient = getDiscordInstance();
if (!discordClient) {
  throw new Error('Discord did not initialize');
}
discordClient.start();

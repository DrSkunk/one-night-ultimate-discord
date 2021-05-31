import dotenv from 'dotenv';
dotenv.config();
import * as config from './Config';
import { getMissingConfigKeys } from './Config';
import { initDiscord, getDiscordInstance } from './DiscordClient';
import { Log } from './Log';

Log.info('Starting One Night Ultimate Discord');

const missingConfigKeys = getMissingConfigKeys();
if (missingConfigKeys.length !== 0) {
  Log.error(
    'Not all values are set in your .env file. The following are missing:',
    missingConfigKeys.join(', ')
  );
  process.exit(1);
}

initDiscord(config.DiscordToken);
const discordClient = getDiscordInstance();
discordClient.start();

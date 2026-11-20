import { getConfig } from './Config';
import { createClient } from './DiscordClient';
import { Log } from './Log';

let config;
try {
  config = getConfig();
} catch (error) {
  Log.error((error as Error).message);
  process.exit(1);
}
Log.setLevel(config.LOG_LEVEL);
Log.info('Starting One Night Ultimate Discord');

process.on('unhandledRejection', (reason) => {
  Log.error('Unhandled promise rejection', reason);
});
process.on('uncaughtException', (error) => {
  Log.error('Uncaught exception', error);
  process.exit(1);
});

const client = createClient();

const shutdown = (signal: string) => {
  Log.info(`Received ${signal}, shutting down.`);
  client
    .destroy()
    .catch((error) => Log.error('Error during shutdown', error))
    .finally(() => process.exit(0));
};
process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

try {
  await client.login(config.DISCORD_TOKEN);
} catch (error) {
  Log.error(`Failed to log in to Discord: ${(error as Error).message}`);
  await client.destroy();
  process.exit(1);
}

import { getConfig } from './Config';
import { createClient } from './DiscordClient';
import { Log } from './Log';
import { registerCommands } from './RegisterCommands';
import { selfCheck } from './SelfCheck';

async function startBot(): Promise<void> {
  const config = getConfig();
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
    await client.destroy();
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to log in to Discord: ${message}`, {
      cause: error,
    });
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length > 1) {
    throw new Error('Expected at most one option. Use --help for usage.');
  }

  switch (args[0]) {
    case undefined:
      await startBot();
      break;
    case '--help':
    case '-h':
      Log.log(
        'Usage: <executable> [--help | --check | --register]\n' +
          '  No option    Start the bot using .env in the current directory\n' +
          '  --register   Register slash commands using .env\n' +
          '  --check      Check bundled images, audio, and voice encryption offline\n' +
          '  --help       Show this help'
      );
      break;
    case '--register':
      await registerCommands(getConfig());
      break;
    case '--check':
      await selfCheck();
      Log.info('Self-check passed: images, audio, and voice encryption.');
      break;
    default:
      throw new Error(`Unknown option: ${args[0]}. Use --help for usage.`);
  }
}

try {
  await main();
} catch (error) {
  Log.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

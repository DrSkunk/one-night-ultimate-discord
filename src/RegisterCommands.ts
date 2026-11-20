import { REST, Routes } from 'discord.js';
import { commands, devCommands } from './commands';
import type { Config } from './Config';
import { Log } from './Log';

export async function registerCommands(
  config: Config,
  rest: Pick<REST, 'put'> = new REST().setToken(config.DISCORD_TOKEN)
): Promise<void> {
  const { DISCORD_CLIENT_ID, DEV_GUILD_ID } = config;
  const body = [...commands, ...(DEV_GUILD_ID ? devCommands : [])].map(
    (command) => command.data.toJSON()
  );
  const route = DEV_GUILD_ID
    ? Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DEV_GUILD_ID)
    : Routes.applicationCommands(DISCORD_CLIENT_ID);

  await rest.put(route, { body });
  Log.info(
    `Registered ${body.length} commands ${DEV_GUILD_ID ? `in guild ${DEV_GUILD_ID}` : 'globally'}.`
  );
}

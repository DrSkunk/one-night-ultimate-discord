import { REST, Routes } from 'discord.js';
import { commands } from '../src/commands';
import { getConfig } from '../src/Config';

const { DISCORD_TOKEN, DISCORD_CLIENT_ID, DEV_GUILD_ID } = getConfig();
const body = commands.map((command) => command.data.toJSON());
const rest = new REST().setToken(DISCORD_TOKEN);

const route = DEV_GUILD_ID
  ? Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DEV_GUILD_ID)
  : Routes.applicationCommands(DISCORD_CLIENT_ID);

await rest.put(route, { body });
console.info(
  `Registered ${body.length} commands ${DEV_GUILD_ID ? `in guild ${DEV_GUILD_ID}` : 'globally'}.`
);

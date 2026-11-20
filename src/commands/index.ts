import type { Command } from '../types/Command';
import { help } from './Help';
import { ping } from './Ping';
import { playtest } from './Playtest';
import { rules } from './Rules';
import { skip } from './Skip';
import { start } from './Start';
import { time } from './Time';
import { version } from './Version';

export const commands: Command[] = [
  start,
  skip,
  time,
  rules,
  help,
  version,
  ping,
];

/** Commands that are only registered in the DEV_GUILD_ID test server. */
export const devCommands: Command[] = [playtest];

export function findCommand(name: string): Command | undefined {
  return [...commands, ...devCommands].find(
    (command) => command.data.name === name
  );
}

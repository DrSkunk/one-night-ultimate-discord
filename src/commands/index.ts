import type { Command } from '../types/Command';
import { help } from './Help';
import { ping } from './Ping';
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

export function findCommand(name: string): Command | undefined {
  return commands.find((command) => command.data.name === name);
}

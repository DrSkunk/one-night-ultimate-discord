import { Message } from 'discord.js';
import { CommandParameter } from './CommandParameter';

export interface Command {
  names: string[];
  params: CommandParameter[];
  description: string;
  execute(message: Message, args?: string[]): void;
  adminOnly: boolean;
}

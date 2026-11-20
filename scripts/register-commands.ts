import { getConfig } from '../src/Config';
import { registerCommands } from '../src/RegisterCommands';

await registerCommands(getConfig());

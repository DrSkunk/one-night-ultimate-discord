import { fileURLToPath } from 'node:url';
import { describe, expect, it, mock } from 'bun:test';
import { Routes, type REST } from 'discord.js';
import type { Config } from '../src/Config';
import { registerCommands } from '../src/RegisterCommands';
import { selfCheck } from '../src/SelfCheck';

const config: Config = {
  DISCORD_TOKEN: 'test-token',
  DISCORD_CLIENT_ID: '123456789012345678',
  LOG_LEVEL: 'info',
};

describe('standalone executable', function () {
  it('can read the role images, play the sound formats and initialize voice encryption', async function () {
    await expect(selfCheck()).resolves.toBeUndefined();
  });

  it('registers only public commands globally', async function () {
    const put = mock<REST['put']>(async () => undefined);
    await registerCommands(config, { put });

    expect(put).toHaveBeenCalledTimes(1);
    const [route, options] = put.mock.calls[0];
    expect(route).toBe(Routes.applicationCommands(config.DISCORD_CLIENT_ID));
    expect(options?.body).toContainEqual(
      expect.objectContaining({ name: 'start' })
    );
    expect(options?.body).not.toContainEqual(
      expect.objectContaining({ name: 'playtest' })
    );
  });

  it('registers development commands only in the configured server', async function () {
    const put = mock<REST['put']>(async () => undefined);
    const guildId = '234567890123456789';
    await registerCommands({ ...config, DEV_GUILD_ID: guildId }, { put });

    const [route, options] = put.mock.calls[0];
    expect(route).toBe(
      Routes.applicationGuildCommands(config.DISCORD_CLIENT_ID, guildId)
    );
    expect(options?.body).toContainEqual(
      expect.objectContaining({ name: 'playtest' })
    );
  });

  it('propagates command registration failures', async function () {
    const put = mock<REST['put']>(async () => {
      throw new Error('registration failed');
    });
    await expect(registerCommands(config, { put })).rejects.toThrow(
      'registration failed'
    );
  });

  it('shows help without credentials and rejects unknown options', function () {
    const entry = fileURLToPath(new URL('../src/index.ts', import.meta.url));
    const env = {
      ...process.env,
      DISCORD_TOKEN: '',
      DISCORD_CLIENT_ID: '',
      DEV_GUILD_ID: '',
    };
    const help = Bun.spawnSync({
      cmd: [process.execPath, entry, '--help'],
      env,
    });
    expect(help.exitCode).toBe(0);
    expect(help.stdout.toString()).toContain('--register');

    const invalid = Bun.spawnSync({
      cmd: [process.execPath, entry, '--unknown'],
      env,
    });
    expect(invalid.exitCode).toBe(1);
    expect(invalid.stderr.toString()).toContain('Unknown option');
  });

  it('includes bundled dependency licenses and the missing upstream notices', function () {
    const script = fileURLToPath(
      new URL('../scripts/collect-licenses.ts', import.meta.url)
    );
    const result = Bun.spawnSync({ cmd: [process.execPath, script] });
    expect(result.exitCode).toBe(0);
    const notices = result.stdout.toString();
    expect(notices).toMatch(/@discordjs\/voice@[^\s]+ \(Apache-2\.0\)/);
    expect(notices).toMatch(/@snazzah\/davey@[^\s]+ \(MIT\)/);
    expect(notices).toContain('Copyright (c) 2025-present Snazzah');
    expect(notices).toContain('The Sapphire Community and its contributors');
  });
});

import {
  existsSync,
  mkdtempSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'bun:test';
import { parseConfig } from '../src/Config';

const valid = {
  DISCORD_TOKEN: 'token',
  DISCORD_CLIENT_ID: '123456789012345678',
};

describe('Config', function () {
  it('applies defaults and treats an empty DEV_GUILD_ID as unset', function () {
    const config = parseConfig({ ...valid, DEV_GUILD_ID: '' });
    expect(config.DEV_GUILD_ID).toBeUndefined();
    expect(config.LOG_LEVEL).toBe('info');
  });

  it('reports every invalid key without echoing secret values', function () {
    let message = '';
    try {
      parseConfig({
        DISCORD_CLIENT_ID: 'abc',
        DEV_GUILD_ID: 'xyz',
        DISCORD_TOKEN: '',
      });
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain('DISCORD_TOKEN');
    expect(message).toContain('DISCORD_CLIENT_ID');
    expect(message).toContain('DEV_GUILD_ID');
    expect(message).not.toContain('abc');
  });

  it('loads the working-directory .env without overriding process variables', function () {
    const directory = mkdtempSync(join(tmpdir(), 'werecord-config-'));
    const envFile = join(directory, '.env');
    const configModule = fileURLToPath(
      new URL('../src/Config.ts', import.meta.url)
    );
    const script = `import { getConfig } from ${JSON.stringify(configModule)}; console.log(JSON.stringify(getConfig()));`;
    const env: Record<string, string | undefined> = {
      ...process.env,
      DISCORD_TOKEN: 'from-process',
    };
    delete env.DISCORD_CLIENT_ID;
    delete env.DEV_GUILD_ID;
    delete env.LOG_LEVEL;

    try {
      writeFileSync(
        envFile,
        'DISCORD_TOKEN=from-file\nDISCORD_CLIENT_ID=123456789012345678\n'
      );
      const withFile = Bun.spawnSync({
        cmd: [process.execPath, '--no-env-file', '-e', script],
        cwd: directory,
        env,
      });
      expect(withFile.exitCode).toBe(0);
      expect(JSON.parse(withFile.stdout.toString())).toMatchObject({
        DISCORD_TOKEN: 'from-process',
        DISCORD_CLIENT_ID: '123456789012345678',
      });

      unlinkSync(envFile);
      const withoutFile = Bun.spawnSync({
        cmd: [process.execPath, '--no-env-file', '-e', script],
        cwd: directory,
        env: { ...env, DISCORD_CLIENT_ID: '123456789012345678' },
      });
      expect(withoutFile.exitCode).toBe(0);
    } finally {
      if (existsSync(envFile)) unlinkSync(envFile);
      rmdirSync(directory);
    }
  });
});

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
});

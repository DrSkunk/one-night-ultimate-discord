import { describe, expect, it } from 'bun:test';
import {
  createReportSanitizer,
  readReportLines,
} from '../scripts/test-discord';

describe('Discord test report redaction', () => {
  it('removes secrets, local paths and webhook interaction tokens', () => {
    const sanitize = createReportSanitizer(
      ['example-bot-secret'],
      ['/home/example']
    );
    const report = sanitize(
      'example-bot-secret /home/example/project\n' +
        'Authorization: Bot another-secret\n' +
        'https://discord.com/api/v10/webhooks/123456789012345678/webhook-secret\n' +
        '/interactions/123456789012345679/interaction-secret/callback'
    );

    expect(report).not.toContain('example-bot-secret');
    expect(report).not.toContain('/home/example');
    expect(report).not.toContain('another-secret');
    expect(report).not.toContain('webhook-secret');
    expect(report).not.toContain('interaction-secret');
    expect(report).toContain('[secret]');
  });

  it('keeps consistent pseudonyms without exposing Discord identities', () => {
    const sanitize = createReportSanitizer([]);
    const first = sanitize(
      '\x1b[36mLogged in as PrivateBot\nchannel "#private-server"\n' +
        'Prompt for PrivatePlayer timed out\n<@123456789012345678>'
    );
    const second = sanitize('123456789012345678 123456789012345679');

    expect(first).not.toContain('PrivateBot');
    expect(first).not.toContain('private-server');
    expect(first).not.toContain('PrivatePlayer');
    expect(first).not.toContain('123456789012345678');
    expect(first).toContain('[id-1]');
    expect(second).toBe('[id-1] [id-2]');
  });

  it('buffers split output chunks before redacting secrets', async () => {
    const sanitize = createReportSanitizer(['example-secret']);
    const encoder = new TextEncoder();
    const output = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('token: example-'));
        controller.enqueue(encoder.encode('secret\nlast line'));
        controller.close();
      },
    });
    const lines: string[] = [];
    await readReportLines(output, (line) => lines.push(sanitize(line)));
    expect(lines).toEqual(['token: [secret]', 'last line']);
  });
});

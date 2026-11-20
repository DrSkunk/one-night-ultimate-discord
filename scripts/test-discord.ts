import { appendFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripVTControlCharacters } from 'node:util';
import { generateDependencyReport } from '@discordjs/voice';
import { REST, Routes } from 'discord.js';
import { z } from 'zod';
import { commands, devCommands } from '../src/commands';
import { parseConfig } from '../src/Config';
import packageJson from '../package.json' with { type: 'json' };

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const reportPath = join(root, 'discord-test-report.txt');

export function createReportSanitizer(
  secrets: readonly string[],
  privatePaths: readonly string[] = []
): (text: string) => string {
  const ids = new Map<string, string>();
  const replacements = [...secrets]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  return (text) => {
    let safe = stripVTControlCharacters(text);
    for (const secret of replacements) {
      safe = safe.split(secret).join('[secret]');
    }
    for (const path of privatePaths) {
      if (path) {
        safe = safe.split(path).join('[local-path]');
      }
    }
    safe = safe
      .replace(
        /((?:webhooks|interactions)\/\d{17,20}\/)[^/\s?"']+/gi,
        '$1[secret]'
      )
      .replace(
        /(authorization["']?\s*[:=]\s*["']?(?:Bot|Bearer)\s+)[^\s"',}]+/gi,
        '$1[secret]'
      )
      .replace(/Logged in as .*/, 'Logged in as [bot]')
      .replace(/channel "#[^"]*"/g, 'channel "[channel]"')
      .replace(/Prompt for .* timed out/g, 'Prompt for [player] timed out')
      .replace(
        /.* did not acknowledge in time, continuing\./g,
        '[player] did not acknowledge in time, continuing.'
      )
      .replace(
        /Lost connection with [^.\n]*\./g,
        'Lost connection with [player].'
      )
      .replace(/\b\d{17,20}\b/g, (id) => {
        let label = ids.get(id);
        if (!label) {
          label = `[id-${ids.size + 1}]`;
          ids.set(id, label);
        }
        return label;
      });
    return safe;
  };
}

export async function readReportLines(
  stream: ReadableStream<Uint8Array>,
  emit: (line: string) => void
): Promise<void> {
  const decoder = new TextDecoder();
  const reader = stream.getReader();
  let pending = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }
      pending += decoder.decode(value, { stream: true });
      const lines = pending.split('\n');
      pending = lines.pop() ?? '';
      for (const line of lines) {
        emit(line.replace(/\r$/, ''));
      }
    }
    pending += decoder.decode();
    if (pending) {
      emit(pending);
    }
  } finally {
    reader.releaseLock();
  }
}

async function main(): Promise<void> {
  const secretValues = Object.entries(process.env)
    .filter(([key]) => /token|secret|password|api_?key/i.test(key))
    .flatMap(([, value]) => (value ? [value] : []));
  const sanitize = createReportSanitizer(secretValues, [root, homedir()]);
  writeFileSync(reportPath, '', { mode: 0o600 });
  const report = (text: string) => {
    const line = sanitize(text);
    appendFileSync(reportPath, `${line}\n`);
    console.info(line);
  };

  async function run(
    name: string,
    args: string[],
    live = false
  ): Promise<{ code: number; interrupted: boolean }> {
    report(`\n=== ${name} ===`);
    const child = Bun.spawn([process.execPath, ...args], {
      cwd: root,
      env: { ...process.env, LOG_LEVEL: 'debug' },
      stdin: 'ignore',
      stdout: 'pipe',
      stderr: 'pipe',
    });
    let interrupted = false;
    let ready = false;
    let startupFailed = false;
    let forceStop: ReturnType<typeof setTimeout> | undefined;
    const stop = () => {
      if (interrupted) {
        return;
      }
      interrupted = true;
      report('Stopping the child process...');
      child.kill('SIGINT');
      forceStop = setTimeout(() => {
        report('Child did not stop within 10 seconds; terminating it.');
        child.kill('SIGKILL');
      }, 10_000);
    };
    const startup = live
      ? setTimeout(() => {
          startupFailed = true;
          report(
            'FAIL: bot did not report Gateway readiness within 30 seconds.'
          );
          stop();
        }, 30_000)
      : undefined;
    const emit = (line: string) => {
      if (live && line.includes('Logged in as ')) {
        ready = true;
        clearTimeout(startup);
        report('PASS: bot connected to the Discord Gateway.');
      }
      report(line);
    };
    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);
    try {
      const [, , code] = await Promise.all([
        readReportLines(child.stdout, emit),
        readReportLines(child.stderr, emit),
        child.exited,
      ]);
      report(`Exit code: ${code}`);
      if (live && (!ready || startupFailed)) {
        throw new Error('The bot did not become ready for the playtest.');
      }
      return { code, interrupted };
    } finally {
      clearTimeout(startup);
      clearTimeout(forceStop);
      process.removeListener('SIGINT', stop);
      process.removeListener('SIGTERM', stop);
      if (child.exitCode === null) {
        report(
          'Terminating the remaining child process after a capture failure.'
        );
        child.kill('SIGKILL');
        await child.exited;
      }
    }
  }

  try {
    const flags = process.argv.slice(2);
    for (const flag of flags) {
      if (flag !== '--register' && flag !== '--check-only') {
        throw new Error(`Unknown option: ${flag}`);
      }
    }
    report('Discord manual test report');
    report(`Bot version: ${packageJson.version}`);
    report(
      `Bun: ${Bun.version}; platform: ${process.platform}/${process.arch}`
    );
    report('Tokens and Discord IDs are redacted. Review before sharing.');
    const config = parseConfig(process.env);
    if (!config.DEV_GUILD_ID) {
      throw new Error(
        'Set DEV_GUILD_ID to a dedicated test server. This script never registers global commands.'
      );
    }
    report('PASS: environment configuration is valid.');
    report(generateDependencyReport());
    for (const [name, args] of [
      ['Lint', ['run', 'lint']],
      ['Typecheck', ['run', 'typecheck']],
      ['Unit tests', ['test']],
      ['Dependency audit', ['audit']],
    ] as const) {
      const result = await run(name, [...args]);
      if (result.interrupted || result.code !== 0) {
        throw new Error(`${name} did not complete successfully.`);
      }
    }
    if (flags.includes('--check-only')) {
      report('PASS: local checks complete. No Discord API requests were made.');
      return;
    }

    report('\n=== Discord API preflight ===');
    const rest = new REST({ timeout: 15_000, retries: 0 }).setToken(
      config.DISCORD_TOKEN
    );
    const bot = z
      .object({ id: z.string(), bot: z.literal(true) })
      .parse(await rest.get(Routes.user('@me')));
    if (bot.id !== config.DISCORD_CLIENT_ID) {
      throw new Error(
        'DISCORD_CLIENT_ID does not match the authenticated bot.'
      );
    }
    report('PASS: bot authentication and application ID match.');
    await rest.get(Routes.guild(config.DEV_GUILD_ID));
    report('PASS: the bot can access the test server.');
    const testServerCommands = [...commands, ...devCommands];
    const route = Routes.applicationGuildCommands(
      config.DISCORD_CLIENT_ID,
      config.DEV_GUILD_ID
    );
    if (flags.includes('--register')) {
      await rest.put(route, {
        body: testServerCommands.map((command) => command.data.toJSON()),
      });
      report('PASS: commands registered to the test server only.');
    }
    const registered = z
      .array(z.object({ name: z.string() }))
      .parse(await rest.get(route));
    const missing = testServerCommands
      .filter(
        (command) => !registered.some(({ name }) => name === command.data.name)
      )
      .map((command) => command.data.name);
    if (missing.length) {
      throw new Error(
        `Missing test-server commands: ${missing.join(', ')}. Run again with --register.`
      );
    }
    report('PASS: all expected test-server slash commands are registered.');
    report('\n=== Manual playtest ===');
    report(
      'Play in Discord with at least three people in the same voice channel,'
    );
    report(
      'or alone: join a voice channel and use /playtest bots:2 (bots answer randomly).'
    );
    report(
      'Test /start, host-only buttons, private roles/actions, /skip and voting.'
    );
    report(
      'Try an expired prompt and verify voice playback and disconnection.'
    );
    report(
      'When finished, press Ctrl+C here. Manual test outcomes are not inferred.'
    );
    const result = await run('Live bot logs', ['src/index.ts'], true);
    if (result.code !== 0 && !result.interrupted) {
      throw new Error(`Bot exited unexpectedly with code ${result.code}.`);
    }
    report(
      'Playtest capture finished. Add your steps and observed failures when sharing.'
    );
  } catch (error) {
    report(
      `FAIL: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`
    );
    process.exitCode = 1;
  } finally {
    console.info(
      '\nReport saved to discord-test-report.txt in the project directory.'
    );
    console.info(
      'Review it for names or other private details before sharing.'
    );
  }
}

if (import.meta.main) {
  await main();
}

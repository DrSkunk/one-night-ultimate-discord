import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const reportSchema = z.record(
  z.string(),
  z.array(z.object({ name: z.string(), paths: z.array(z.string()).min(1) }))
);
const packageSchema = z.object({
  name: z.string(),
  version: z.string(),
});
const licensesDir = fileURLToPath(new URL('../licenses/', import.meta.url));

// These npm packages omit license files; the pinned upstream notices are kept locally.
function missingLicense(name: string, version: string): string | undefined {
  if (
    (name === '@sapphire/async-queue' && version === '1.5.5') ||
    (name === '@sapphire/snowflake' && version === '3.5.5')
  ) {
    return join(licensesDir, 'sapphire.txt');
  }
  if (
    (name === '@snazzah/davey' || name.startsWith('@snazzah/davey-')) &&
    version === '0.1.12'
  ) {
    return join(licensesDir, 'davey.txt');
  }
  return undefined;
}

const report = Bun.spawnSync({
  cmd: [process.execPath, 'pm', 'licenses', '--prod', '--json'],
  stdout: 'pipe',
  stderr: 'pipe',
});
if (report.exitCode !== 0) {
  throw new Error(`Could not list production licenses: ${report.stderr}`);
}

const groups = reportSchema.parse(JSON.parse(report.stdout.toString()));
const sections = ['Licenses for bundled npm dependencies'];
const seen = new Set<string>();

for (const [license, packages] of Object.entries(groups)) {
  for (const entry of packages) {
    for (const directory of entry.paths) {
      const pkg = packageSchema.parse(
        JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'))
      );
      if (pkg.name !== entry.name) {
        throw new Error(`Unexpected package at ${directory}: ${pkg.name}.`);
      }
      const id = `${pkg.name}@${pkg.version}`;
      if (seen.has(id)) continue;
      seen.add(id);

      const files = (await readdir(directory, { withFileTypes: true }))
        .filter(
          (file) =>
            file.isFile() &&
            /^(licen[cs]e|notice|copying)([._-].*)?$/i.test(file.name)
        )
        .map((file) => join(directory, file.name))
        .sort();
      if (files.length === 0) {
        const fallback = missingLicense(pkg.name, pkg.version);
        if (!fallback) {
          throw new Error(`No license notice found for ${id}.`);
        }
        files.push(fallback);
      }

      const notices = await Promise.all(
        files.map((file) => readFile(file, 'utf8'))
      );
      sections.push(`${id} (${license})\n\n${notices.join('\n\n').trim()}`);
    }
  }
}

if (seen.size === 0) {
  throw new Error('No production dependency licenses found.');
}
console.log(sections.join('\n\n' + '='.repeat(72) + '\n\n'));

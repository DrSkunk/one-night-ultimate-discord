import { z } from 'zod';

const snowflake = z
  .string()
  .regex(/^\d{17,20}$/, 'must be a Discord snowflake (17-20 digits)');

const ConfigSchema = z.object({
  DISCORD_TOKEN: z.string().trim().min(1, 'is required'),
  DISCORD_CLIENT_ID: snowflake,
  DEV_GUILD_ID: z.preprocess(
    (value) => (value === '' ? undefined : value),
    snowflake.optional()
  ),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type Config = z.infer<typeof ConfigSchema>;

export function parseConfig(env: Record<string, string | undefined>): Config {
  const result = ConfigSchema.safeParse(env);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `- ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${problems}`);
  }
  return result.data;
}

let cached: Config | null = null;

export function getConfig(): Config {
  if (!cached) {
    try {
      process.loadEnvFile();
    } catch (error) {
      if (!(
        error instanceof Error &&
        'code' in error &&
        error.code === 'ENOENT'
      )) {
        throw error;
      }
    }
    cached = parseConfig(process.env);
  }
  return cached;
}

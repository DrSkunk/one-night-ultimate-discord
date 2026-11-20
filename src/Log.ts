/* oxlint-disable no-console */
type Level = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<Level, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

class Logger {
  private threshold = LEVELS.info;

  public setLevel(level: Level): void {
    this.threshold = LEVELS[level];
  }

  public debug(...message: unknown[]): void {
    if (this.enabled('debug'))
      console.debug('\x1b[35m%s', this.prefix('DEBUG'), ...message, '\x1b[0m');
  }

  public info(...message: unknown[]): void {
    if (this.enabled('info'))
      console.info('\x1b[36m%s', this.prefix('INFO'), ...message, '\x1b[0m');
  }

  public log(...message: unknown[]): void {
    if (this.enabled('info')) console.log(this.prefix('LOG'), ...message);
  }

  public warn(...message: unknown[]): void {
    if (this.enabled('warn'))
      console.warn('\x1b[33m%s', this.prefix('WARN'), ...message, '\x1b[0m');
  }

  public error(...message: unknown[]): void {
    if (this.enabled('error'))
      console.error('\x1b[31m%s', this.prefix('ERROR'), ...message, '\x1b[0m');
  }

  private enabled(level: Level): boolean {
    return LEVELS[level] >= this.threshold;
  }

  private prefix(level: string): string {
    return `${new Date().toISOString()} - ${level} -`;
  }
}

export const Log = new Logger();

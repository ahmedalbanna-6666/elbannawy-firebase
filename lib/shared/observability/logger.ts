export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  readonly timestamp: string;
  readonly level: LogLevel;
  readonly message: string;
  readonly requestId?: string;
  readonly userId?: string;
  readonly module?: string;
  readonly durationMs?: number;
  readonly error?: string;
  readonly metadata?: Record<string, unknown>;
}

const LOG_LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const CURRENT_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[CURRENT_LEVEL];
}

function createEntry(level: LogLevel, message: string, meta?: Partial<LogEntry>): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
}

function write(entry: LogEntry): void {
  if (!shouldLog(entry.level)) return;
  const line = JSON.stringify(entry);
  switch (entry.level) {
    case 'error': console.error(line); break;
    case 'warn': console.warn(line); break;
    case 'info': console.log(line); break;
    case 'debug': console.debug(line); break;
  }
}

export const logger = {
  debug(message: string, meta?: Partial<LogEntry>): void {
    write(createEntry('debug', message, meta));
  },
  info(message: string, meta?: Partial<LogEntry>): void {
    write(createEntry('info', message, meta));
  },
  warn(message: string, meta?: Partial<LogEntry>): void {
    write(createEntry('warn', message, meta));
  },
  error(message: string, error?: unknown, meta?: Partial<LogEntry>): void {
    write(createEntry('error', message, {
      ...meta,
      error: error instanceof Error ? error.message : String(error),
    }));
  },
};

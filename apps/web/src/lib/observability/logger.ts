const IS_DEV = process.env.NODE_ENV === "development";

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

const LEVEL_NUM: Record<LogLevel, number> = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
const MIN_LEVEL: number = IS_DEV ? 0 : 2;

const COLORS: Record<LogLevel, string> = {
  DEBUG: "\x1b[36m",
  INFO: "\x1b[32m",
  WARN: "\x1b[33m",
  ERROR: "\x1b[31m",
};
const RESET = "\x1b[0m";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  metadata?: unknown;
}

const sessionLogs: LogEntry[] = [];

function formatTimestamp(): string {
  return new Date().toISOString();
}

function formatMessage(entry: LogEntry): string {
  const color = COLORS[entry.level] ?? "";
  const prefix = `${entry.timestamp} [${entry.level}] [${entry.module}]`;
  if (IS_DEV) {
    const msg = `${color}${prefix}${RESET} ${entry.message}`;
    if (entry.metadata !== undefined) {
      return `${msg}\n  ${JSON.stringify(entry.metadata, null, 2)}`;
    }
    return msg;
  }
  return `${prefix} ${entry.message}`;
}

function log(level: LogLevel, module: string, message: string, metadata?: unknown): void {
  if (LEVEL_NUM[level] < MIN_LEVEL) return;
  const entry: LogEntry = { timestamp: formatTimestamp(), level, module, message, metadata };
  sessionLogs.push(entry);
  switch (level) {
    case "DEBUG":
      if (IS_DEV) console.debug(formatMessage(entry));
      break;
    case "INFO":
      if (IS_DEV) console.info(formatMessage(entry));
      break;
    case "WARN":
      console.warn(formatMessage(entry));
      break;
    case "ERROR":
      console.error(formatMessage(entry));
      break;
  }
}

export const logger = {
  debug: (module: string, message: string, metadata?: unknown) => log("DEBUG", module, message, metadata),
  info: (module: string, message: string, metadata?: unknown) => log("INFO", module, message, metadata),
  warn: (module: string, message: string, metadata?: unknown) => log("WARN", module, message, metadata),
  error: (module: string, message: string, metadata?: unknown) => log("ERROR", module, message, metadata),
};

export function getSessionLogs(): readonly LogEntry[] {
  return sessionLogs;
}

export function printSessionSummary(): void {
  const apiCalls = sessionLogs.filter((e) => e.module === "api" && e.level === "INFO");
  const errors = sessionLogs.filter((e) => e.level === "ERROR");
  const warnings = sessionLogs.filter((e) => e.level === "WARN");
  const durations = apiCalls
    .map((e) => (e.metadata as { durationMs?: number })?.durationMs)
    .filter((d): d is number => d !== undefined);
  const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
  const slow = durations.filter((d) => d > 1000);
  const cacheSummary = sessionLogs.find((e) => e.module === "metrics" && e.message === "cache-summary");

  if (!IS_DEV) {
    if (errors.length === 0 && warnings.length === 0) return;
    console.info(`[Session] ${errors.length} errors, ${warnings.length} warnings`);
    return;
  }

  console.group("[Observability] Application Health Summary");
  console.info(`API Calls:        ${apiCalls.length}`);
  console.info(`Avg Duration:     ${avgDuration.toFixed(0)}ms`);
  console.info(`Slow Requests:    ${slow.length} (>1s)`);
  if (cacheSummary?.metadata) {
    const meta = cacheSummary.metadata as { hits: number; misses: number; rate: string };
    console.info(`Cache Hit Rate:   ${meta.rate}`);
  }
  console.info(`Errors:           ${errors.length}`);
  console.info(`Warnings:         ${warnings.length}`);
  console.groupEnd();
}

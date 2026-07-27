const IS_DEV = process.env.NODE_ENV === "development";

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

const LEVEL_NUM: Record<LogLevel, number> = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
const MIN_LEVEL: number = IS_DEV ? 0 : 2;

const SLOW_THRESHOLD_WARN = 800;
const SLOW_THRESHOLD_ERROR = 1500;

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
  requestId?: string;
  sessionId?: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

let _requestIdCounter = 0;
let _sessionId: string | null = null;

function generateShortId(): string {
  const hex = Math.random().toString(16).slice(2, 8).toUpperCase();
  return hex;
}

export function generateRequestId(): string {
  _requestIdCounter++;
  const id = `REQ-${generateShortId()}`;
  return id;
}

function getOrCreateSessionId(): string {
  if (_sessionId) return _sessionId;
  if (typeof sessionStorage !== "undefined") {
    const stored = sessionStorage.getItem("elb_session_id");
    if (stored) {
      _sessionId = stored;
      return stored;
    }
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const id = `SESSION-${today}-${generateShortId()}`;
    try { sessionStorage.setItem("elb_session_id", id); } catch { /* ignore */ }
    _sessionId = id;
    return id;
  }
  const id = `SESSION-${generateShortId()}`;
  _sessionId = id;
  return id;
}

export function getSessionId(): string {
  return getOrCreateSessionId();
}

const sessionLogs: LogEntry[] = [];

function formatTimestamp(): string {
  return new Date().toISOString();
}

function formatStructuredConsole(entry: LogEntry): string {
  const color = COLORS[entry.level] ?? "";
  const tag = entry.module === "api" && entry.durationMs !== undefined
    ? `${entry.durationMs}ms`
    : "";
  const prefix = `${color}[${entry.level}]${RESET} [${entry.module}]${tag ? ` ${color}${tag}${RESET}` : ""}`;
  const sid = entry.sessionId ? entry.sessionId.slice(-6) : "";
  const rid = entry.requestId ? entry.requestId.slice(-6) : "";
  const ids = `(${sid} ${rid})`;
  return `${prefix} ${ids} ${entry.message}`;
}

function log(level: LogLevel, module: string, message: string, metadata?: Record<string, unknown>): void {
  if (LEVEL_NUM[level] < MIN_LEVEL) return;
  const entry: LogEntry = {
    timestamp: formatTimestamp(),
    level,
    module,
    message,
    requestId: undefined,
    sessionId: getOrCreateSessionId(),
    durationMs: (metadata?.durationMs as number) ?? undefined,
    metadata,
  };
  sessionLogs.push(entry);
  if (IS_DEV && level === "INFO" && module === "api" && entry.durationMs !== undefined) {
    if (entry.durationMs > SLOW_THRESHOLD_ERROR) {
      const slowEntry = { ...entry, level: "ERROR" as const, message: `SLOW >${SLOW_THRESHOLD_ERROR}ms: ${message}` };
      sessionLogs.push(slowEntry);
      console.error(formatStructuredConsole(slowEntry), metadata ?? "");
      return;
    }
    if (entry.durationMs > SLOW_THRESHOLD_WARN) {
      const slowEntry = { ...entry, level: "WARN" as const, message: `SLOW >${SLOW_THRESHOLD_WARN}ms: ${message}` };
      sessionLogs.push(slowEntry);
      console.warn(formatStructuredConsole(slowEntry), metadata ?? "");
      return;
    }
  }
  switch (level) {
    case "DEBUG":
      if (IS_DEV) console.debug(formatStructuredConsole(entry), metadata ?? "");
      break;
    case "INFO":
      if (IS_DEV) console.info(formatStructuredConsole(entry), metadata ?? "");
      break;
    case "WARN":
      console.warn(formatStructuredConsole(entry), metadata ?? "");
      break;
    case "ERROR":
      console.error(formatStructuredConsole(entry), metadata ?? "");
      break;
  }
}

export const logger = {
  debug: (module: string, message: string, metadata?: Record<string, unknown>) => log("DEBUG", module, message, metadata),
  info: (module: string, message: string, metadata?: Record<string, unknown>) => log("INFO", module, message, metadata),
  warn: (module: string, message: string, metadata?: Record<string, unknown>) => log("WARN", module, message, metadata),
  error: (module: string, message: string, metadata?: Record<string, unknown>) => log("ERROR", module, message, metadata),
};

export function getSessionLogs(): readonly LogEntry[] {
  return sessionLogs;
}

export function printSessionSummary(): void {
  const apiCalls = sessionLogs.filter((e) => e.module === "api" && e.level === "INFO");
  const errors = sessionLogs.filter((e) => e.level === "ERROR");
  const warnings = sessionLogs.filter((e) => e.level === "WARN");
  const durations = apiCalls
    .map((e) => e.durationMs)
    .filter((d): d is number => d !== undefined);
  const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
  const slow = durations.filter((d) => d > 1000);
  const cacheSummary = sessionLogs.find((e) => e.module === "metrics" && e.message === "cache-summary");

  if (!IS_DEV) {
    if (errors.length === 0 && warnings.length === 0) return;
    console.info(`[Session] ${errors.length} errors, ${warnings.length} warnings`);
    return;
  }

  console.group(`[Observability] Session ${getSessionId()} — Health Summary`);
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

import { logger } from './logger';

const timers = new Map<string, number>();

export function startTimer(operationId: string): void {
  timers.set(operationId, performance.now());
}

export function endTimer(operationId: string, module: string, metadata?: Record<string, unknown>): number {
  const start = timers.get(operationId);
  if (start === undefined) return 0;
  const durationMs = Math.round(performance.now() - start);
  timers.delete(operationId);
  if (durationMs > 1000) {
    logger.warn(`Slow operation: ${operationId}`, {
      module,
      durationMs,
      metadata: { ...metadata, threshold: 1000 },
    });
  }
  logger.debug(`Operation timing`, {
    module, durationMs, metadata,
  });
  return durationMs;
}

export async function monitor<T>(
  operationId: string,
  module: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>,
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const durationMs = Math.round(performance.now() - start);
    logger.debug(`Operation success`, { module, durationMs, metadata: { ...metadata, operationId } });
    if (durationMs > 1000) {
      logger.warn(`Slow operation`, { module, durationMs, metadata: { ...metadata, operationId, threshold: 1000 } });
    }
    return result;
  } catch (error) {
    const durationMs = Math.round(performance.now() - start);
    logger.error(`Operation failed: ${operationId}`, error, { module, durationMs, metadata });
    throw error;
  }
}

export function trackRepositoryCall(
  repoName: string,
  method: string,
  durationMs: number,
  success: boolean,
): void {
  logger.debug('Repository call', {
    module: repoName,
    metadata: { method, durationMs, success },
  });
}

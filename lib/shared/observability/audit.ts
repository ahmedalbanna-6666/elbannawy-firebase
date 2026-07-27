import { logger } from './logger';

export type AuditAction =
  | 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE'
  | 'PUBLISH' | 'UNPUBLISH'
  | 'VIEW' | 'LIST'
  | 'ATTEMPT_START' | 'ATTEMPT_SUBMIT'
  | 'PROGRESS_UPDATE';

export interface AuditEntry {
  readonly timestamp: string;
  readonly action: AuditAction;
  readonly actorId: string;
  readonly actorRole: string;
  readonly resourceType: string;
  readonly resourceId: string;
  readonly requestId: string;
  readonly changes?: Record<string, { from: unknown; to: unknown }>;
  readonly metadata?: Record<string, unknown>;
}

export function createAuditEntry(
  action: AuditAction,
  actorId: string,
  actorRole: string,
  resourceType: string,
  resourceId: string,
  requestId: string,
  changes?: Record<string, { from: unknown; to: unknown }>,
  metadata?: Record<string, unknown>,
): AuditEntry {
  return {
    timestamp: new Date().toISOString(),
    action,
    actorId,
    actorRole,
    resourceType,
    resourceId,
    requestId,
    changes,
    metadata,
  };
}

export function logAudit(entry: AuditEntry): void {
  logger.info(`[AUDIT] ${entry.action} ${entry.resourceType}:${entry.resourceId}`, {
    module: 'audit',
    userId: entry.actorId,
    requestId: entry.requestId,
    metadata: entry as unknown as Record<string, unknown>,
  });
}

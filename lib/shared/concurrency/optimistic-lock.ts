import type { RepositoryResult } from '../types/repository.types';

export interface VersionedEntity {
  readonly id: string;
  readonly contentVersion: number;
  readonly updatedAt: string;
}

export interface ConcurrencyError {
  readonly code: 'CONFLICT';
  readonly message: string;
  readonly retryable: true;
  readonly requestId: string;
  readonly currentVersion: number;
  readonly expectedVersion: number;
}

export function checkVersion(
  entity: VersionedEntity | null | undefined,
  expectedVersion: number,
  entityName: string,
  requestId: string,
): RepositoryResult<void> {
  if (!entity) {
    return {
      ok: false,
      error: { code: 'NOT_FOUND', message: `${entityName} not found`, retryable: false, requestId },
    };
  }
  if (expectedVersion > 0 && entity.contentVersion !== expectedVersion) {
    return {
      ok: false,
      error: {
        code: 'CONFLICT',
        message: `${entityName} version mismatch: expected ${expectedVersion}, current ${entity.contentVersion}`,
        retryable: true,
        requestId,
      } as ConcurrencyError,
    };
  }
  return { ok: true, value: undefined };
}

export function incrementVersion(currentVersion: number): number {
  return currentVersion + 1;
}

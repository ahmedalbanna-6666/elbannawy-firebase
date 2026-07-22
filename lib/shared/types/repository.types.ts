// lib/shared/types/repository.types.ts

export type RepositoryResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: RepositoryError };

export interface RepositoryError {
  readonly code:
    | "NOT_FOUND"
    | "ALREADY_EXISTS"
    | "CONFLICT"
    | "INVALID_INPUT"
    | "FORBIDDEN"
    | "PRECONDITION_FAILED"
    | "RATE_LIMITED"
    | "UNAVAILABLE"
    | "INTERNAL";
  readonly message: string;
  readonly retryable: boolean;
  readonly requestId: string;
}

export interface IBaseEntity {
  readonly id: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly schemaVersion: number;
  readonly deletedAt?: string | null;
}

export interface IQueryFilter {
  readonly [key: string]: unknown;
}

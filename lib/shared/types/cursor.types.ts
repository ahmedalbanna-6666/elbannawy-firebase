// lib/shared/types/cursor.types.ts

export interface ICursor {
  readonly key: string;
  readonly value: unknown;
}

export interface ICursorPagination {
  readonly cursor?: ICursor;
  readonly limit: number;
  readonly reverse?: boolean;
}

export interface ICursorBuilder {
  buildCursor(item: unknown): ICursor;
  getCursorValue(item: unknown): unknown;
}

export interface IQueryOptions {
  readonly limit?: number;
  readonly offset?: number;
  readonly cursor?: ICursor;
  readonly reverse?: boolean;
  readonly orderBy?: string | string[];
  readonly projections?: string[];
}

export function isCursor(value: unknown): value is ICursor {
  return typeof value === 'object' && value !== null && 'key' in value && 'value' in value;
}

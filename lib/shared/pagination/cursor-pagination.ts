import type { RepositoryResult } from '../types/repository.types';

export interface CursorPage<T> {
  readonly items: readonly T[];
  readonly nextCursor: string | null;
  readonly hasMore: boolean;
}

export interface CursorPaginationParams {
  readonly limit: number;
  readonly cursor?: string;
  readonly orderField?: string;
  readonly orderDirection?: 'asc' | 'desc';
}

export function encodeCursor(value: string | number, field: string): string {
  const payload = JSON.stringify({ v: value, f: field });
  return Buffer.from(payload).toString('base64url');
}

export function decodeCursor(cursor: string): { value: string | number; field: string } | null {
  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
    const parsed = JSON.parse(decoded) as { v: string | number; f: string };
    return { value: parsed.v, field: parsed.f };
  } catch {
    return null;
  }
}

export function createCursorPage<T>(
  items: readonly T[],
  limit: number,
  getCursorValue: (item: T) => string | number,
  cursorField = 'id',
): CursorPage<T> {
  const hasMore = items.length > limit;
  const pageItems = hasMore ? items.slice(0, limit) : items;
  const lastItem = pageItems[pageItems.length - 1];
  const nextCursor = hasMore && lastItem
    ? encodeCursor(getCursorValue(lastItem), cursorField)
    : null;
  return { items: pageItems, nextCursor, hasMore };
}

export function parsePaginationParams(searchParams: URLSearchParams): CursorPaginationParams {
  const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 20, 1), 100);
  const cursor = searchParams.get('cursor') ?? undefined;
  const orderField = searchParams.get('orderField') ?? 'displayOrder';
  const orderDirection = (searchParams.get('orderDirection') as 'asc' | 'desc') ?? 'asc';
  return { limit, cursor, orderField, orderDirection };
}

export type { RepositoryResult };
